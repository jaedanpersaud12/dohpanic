import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { newTicketCode, randomId, randomToken, verifyPayload } from "./codes";
import { ticketsFor } from "./config";
import type { Order, Ticket } from "./schema";

const { orders, tickets, scans } = schema;

/* ------------------------------------------------------------ new orders */

export async function createOrder(input: {
  name: string;
  whatsapp: string;
  note?: string;
  claimedCents: number;
  screenshotKey: string | null;
}): Promise<Order> {
  const [row] = await db()
    .insert(orders)
    .values({
      id: randomId("ord"),
      token: randomToken(),
      buyerName: input.name.trim(),
      buyerWhatsapp: input.whatsapp.trim(),
      buyerNote: input.note?.trim() || null,
      claimedCents: input.claimedCents,
      screenshotKey: input.screenshotKey,
      status: "pending",
    })
    .returning();
  return row;
}

/* -------------------------------------------------------------- approval */

export class ApprovalError extends Error {}

/**
 * Issues tickets for a confirmed amount, inside a transaction so a failure
 * halfway through can never leave an order approved with no codes attached.
 * The order row is locked FOR UPDATE, so two admins clicking approve at the
 * same moment cannot both mint a batch.
 */
export async function approveOrder(
  orderId: string,
  approvedCents: number,
  decidedBy: string
): Promise<Ticket[]> {
  return db().transaction(async (tx) => {
    const locked = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update")
      .limit(1);

    const order = locked[0];
    if (!order) throw new ApprovalError("That order no longer exists.");

    if (order.status === "approved") {
      return tx
        .select()
        .from(tickets)
        .where(eq(tickets.orderId, orderId))
        .orderBy(tickets.seq);
    }

    const { count } = ticketsFor(approvedCents);
    if (count < 1) {
      throw new ApprovalError(
        "That amount doesn't cover a single ticket. Reject the order instead, or enter the correct amount."
      );
    }

    for (let seq = 1; seq <= count; seq++) {
      // A code collision is astronomically unlikely, but the UNIQUE index plus
      // a retry costs nothing and removes the failure mode entirely.
      let inserted = false;
      for (let attempt = 0; attempt < 8 && !inserted; attempt++) {
        try {
          await tx.insert(tickets).values({
            id: randomId("tkt"),
            orderId,
            code: newTicketCode(),
            seq,
            status: "valid",
          });
          inserted = true;
        } catch (err) {
          if (attempt === 7) throw err;
        }
      }
    }

    await tx
      .update(orders)
      .set({
        status: "approved",
        approvedCents,
        decidedBy,
        decidedAt: new Date(),
        rejectReason: null,
      })
      .where(eq(orders.id, orderId));

    return tx
      .select()
      .from(tickets)
      .where(eq(tickets.orderId, orderId))
      .orderBy(tickets.seq);
  });
}

export async function rejectOrder(
  orderId: string,
  reason: string,
  decidedBy: string
) {
  await db()
    .update(orders)
    .set({
      status: "rejected",
      rejectReason: reason.trim() || null,
      decidedBy,
      decidedAt: new Date(),
    })
    .where(and(eq(orders.id, orderId), sql`${orders.status} <> 'approved'`));
}

export async function saveOcr(
  orderId: string,
  cents: number | null,
  text: string
) {
  await db()
    .update(orders)
    .set({ ocrCents: cents, ocrText: text.slice(0, 4000), ocrRanAt: new Date() })
    .where(eq(orders.id, orderId));
}

/* ------------------------------------------------------------- door scan */

export type ScanOutcome =
  | { result: "valid"; code: string; ticket: Ticket; order: Order }
  | { result: "used"; code: string; ticket: Ticket; order: Order }
  | { result: "void"; code: string; ticket: Ticket; order: Order }
  | { result: "unknown"; code: string }
  | { result: "forged" };

/**
 * Verifies a scanned payload and, if it is good, burns the ticket.
 *
 * The UPDATE is guarded on status = 'valid' and returns the rows it changed,
 * so two doors scanning the same code at the same instant can only ever
 * produce one admission — no explicit transaction needed.
 */
export async function redeem(
  rawPayload: string,
  scannedBy: string
): Promise<ScanOutcome> {
  const code = verifyPayload(rawPayload);

  const log = (c: string, result: string) =>
    db()
      .insert(scans)
      .values({ code: c.slice(0, 120), result, scannedBy })
      .catch(() => {});

  if (!code) {
    await log(rawPayload, "forged");
    return { result: "forged" };
  }

  const claimed = await db()
    .update(tickets)
    .set({ status: "used", usedAt: new Date(), usedBy: scannedBy })
    .where(and(eq(tickets.code, code), eq(tickets.status, "valid")))
    .returning();

  if (claimed.length === 1) {
    const ticket = claimed[0];
    const [order] = await db()
      .select()
      .from(orders)
      .where(eq(orders.id, ticket.orderId))
      .limit(1);
    await log(code, "valid");
    return { result: "valid", code, ticket, order };
  }

  // Nothing was claimed: the code is either unknown or already spent.
  const [ticket] = await db()
    .select()
    .from(tickets)
    .where(eq(tickets.code, code))
    .limit(1);

  if (!ticket) {
    await log(code, "unknown");
    return { result: "unknown", code };
  }

  const [order] = await db()
    .select()
    .from(orders)
    .where(eq(orders.id, ticket.orderId))
    .limit(1);

  const result = ticket.status === "void" ? "void" : "used";
  await log(code, result);
  return { result, code, ticket, order } as ScanOutcome;
}

/** Puts a used ticket back — for the inevitable "I scanned it twice" moment. */
export async function unredeem(code: string): Promise<boolean> {
  const rows = await db()
    .update(tickets)
    .set({ status: "valid", usedAt: null, usedBy: null })
    .where(eq(tickets.code, code))
    .returning({ id: tickets.id });
  return rows.length > 0;
}
