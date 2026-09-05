"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { money, ticketsFor } from "@/lib/config";
import { getOrder, ms, ticketsForOrder } from "@/lib/db";
import {
  ApprovalError,
  approveOrder,
  markTicketShared,
  nameTicket,
  redeem,
  rejectOrder,
  saveOcr,
  unredeem,
} from "@/lib/service";
import { approvalMessage, whatsappLink } from "@/lib/whatsapp";

/**
 * Every action re-checks staff auth itself rather than trusting middleware,
 * and every one returns a plain serialisable result instead of throwing, so
 * the client can render the message without a try/catch dance.
 */

export type ActionResult<T> = ({ ok: true } & T) | { ok: false; error: string };

function failed(err: unknown): { ok: false; error: string } {
  if (err instanceof ApprovalError) return { ok: false, error: err.message };
  console.error("[action]", err);
  return { ok: false, error: "Something went wrong. Try that again." };
}

/* -------------------------------------------------------------- approval */

export async function approveOrderAction(
  orderId: string,
  amountCents: number
): Promise<ActionResult<{ tickets: number; message: string; whatsapp: string }>> {
  try {
    const staff = await requireStaff();

    const cents = Math.round(Number(amountCents));
    if (!Number.isFinite(cents) || cents <= 0) {
      return { ok: false, error: "Enter the amount that actually landed." };
    }

    const tickets = await approveOrder(orderId, cents, staff);
    const order = await getOrder(orderId);
    if (!order) return { ok: false, error: "That order no longer exists." };

    const message = approvalMessage(order, tickets);

    revalidatePath("/admin");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/o/${order.token}`);

    return {
      ok: true,
      tickets: tickets.length,
      message,
      whatsapp: whatsappLink(order.buyerWhatsapp, message),
    };
  } catch (err) {
    return failed(err);
  }
}

export async function rejectOrderAction(
  orderId: string,
  reason: string
): Promise<ActionResult<object>> {
  try {
    const staff = await requireStaff();
    const order = await getOrder(orderId);
    if (!order) return { ok: false, error: "That order no longer exists." };
    if (order.status === "approved") {
      return { ok: false, error: "This order already has tickets issued." };
    }

    await rejectOrder(orderId, reason, staff);
    revalidatePath("/admin");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  } catch (err) {
    return failed(err);
  }
}

/**
 * Records what OCR read. Recognition runs in the admin's browser, because
 * Tesseract's wasm and language model are far too heavy for a serverless
 * function. It is advisory data only — a person still confirms the amount, so
 * nothing security-relevant rests on the client being honest here.
 */
export async function recordOcrAction(
  orderId: string,
  cents: number | null,
  text: string
): Promise<ActionResult<{ cents: number | null }>> {
  try {
    await requireStaff();
    const parsed =
      typeof cents === "number" && Number.isFinite(cents)
        ? Math.round(cents)
        : null;
    await saveOcr(orderId, parsed, text ?? "");
    return { ok: true, cents: parsed };
  } catch (err) {
    return failed(err);
  }
}

/* ------------------------------------------------------------- door scan */

export type ScanResult = {
  result: "valid" | "used" | "void" | "unknown" | "forged";
  title: string;
  detail: string;
  code?: string;
  name?: string;
  seq?: number;
  total?: number;
  paid?: string;
  tickets?: number;
  note?: string | null;
  usedAt?: number | null;
};

export async function scanAction(
  payload: string
): Promise<ActionResult<{ scan: ScanResult }>> {
  try {
    const staff = await requireStaff();

    const text = (payload ?? "").trim();
    if (!text) return { ok: false, error: "Nothing scanned." };

    const outcome = await redeem(text, staff);

    if (outcome.result === "forged") {
      return {
        ok: true,
        scan: {
          result: "forged",
          title: "Not one of ours",
          detail: "That code isn't signed by this event. It wasn't issued here.",
        },
      };
    }

    if (outcome.result === "unknown") {
      return {
        ok: true,
        scan: {
          result: "unknown",
          code: outcome.code,
          title: "Unknown code",
          detail: "Signed correctly but no longer in the database.",
        },
      };
    }

    const { ticket, order, code } = outcome;
    const total = (await ticketsForOrder(order.id)).length;
    const holder = {
      code,
      name: order.buyerName,
      seq: ticket.seq,
      total,
      paid: money(order.approvedCents ?? 0),
      tickets: ticketsFor(order.approvedCents ?? 0).count,
      note: order.buyerNote,
      usedAt: ms(ticket.usedAt),
    };

    if (outcome.result === "void") {
      return {
        ok: true,
        scan: {
          ...holder,
          result: "void",
          title: "Cancelled ticket",
          detail: "This ticket was voided after it was issued.",
        },
      };
    }

    if (outcome.result === "used") {
      return {
        ok: true,
        scan: {
          ...holder,
          result: "used",
          title: "Already scanned",
          detail: "Someone came in on this code already.",
        },
      };
    }

    return {
      ok: true,
      scan: {
        ...holder,
        result: "valid",
        title: "Let them in",
        detail: `Ticket ${ticket.seq} of ${total} · ${order.buyerName}`,
      },
    };
  } catch (err) {
    return failed(err);
  }
}

export async function undoScanAction(
  code: string
): Promise<ActionResult<object>> {
  try {
    await requireStaff();
    const done = await unredeem(code);
    if (!done) return { ok: false, error: "That code isn't in the system." };
    revalidatePath("/admin/scan");
    return { ok: true };
  } catch (err) {
    return failed(err);
  }
}


/* -------------------------------------------------- buyer: sharing tickets */

/**
 * These two are reached with the buyer's own order token rather than a staff
 * login — that token is their secret, and the service layer re-checks that the
 * ticket really belongs to it. Neither can change anything that affects
 * whether a ticket is valid, so the blast radius is a label and a timestamp.
 */

export async function nameTicketAction(
  orderToken: string,
  ticketId: string,
  name: string
): Promise<ActionResult<object>> {
  try {
    const done = await nameTicket(orderToken, ticketId, name);
    if (!done) return { ok: false, error: "We couldn't find that ticket." };
    revalidatePath(`/o/${orderToken}`);
    return { ok: true };
  } catch (err) {
    return failed(err);
  }
}

export async function markTicketSharedAction(
  orderToken: string,
  ticketId: string
): Promise<ActionResult<object>> {
  try {
    const done = await markTicketShared(orderToken, ticketId);
    if (!done) return { ok: false, error: "We couldn't find that ticket." };
    revalidatePath(`/o/${orderToken}`);
    return { ok: true };
  } catch (err) {
    return failed(err);
  }
}
