import { guardApi } from "@/lib/auth";
import { money, ticketsFor } from "@/lib/config";
import { ticketsForOrder } from "@/lib/db";
import { redeem, unredeem } from "@/lib/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await guardApi();
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    payload?: string;
    action?: string;
    code?: string;
  };

  if (body.action === "undo" && body.code) {
    return Response.json({ ok: unredeem(body.code) });
  }

  const payload = (body.payload ?? "").trim();
  if (!payload) return Response.json({ error: "Nothing scanned." }, { status: 400 });

  const outcome = redeem(payload);

  if (outcome.result === "forged") {
    return Response.json({
      result: "forged",
      title: "Not one of ours",
      detail: "That code isn't signed by this event. It wasn't issued here.",
    });
  }

  if (outcome.result === "unknown") {
    return Response.json({
      result: "unknown",
      code: outcome.code,
      title: "Unknown code",
      detail: "Signed correctly but no longer in the database.",
    });
  }

  const { ticket, order, code } = outcome;
  const total = ticketsForOrder(order.id).length;
  const holder = {
    code,
    name: order.buyer_name,
    seq: ticket.seq,
    total,
    paid: money(order.approved_cents ?? 0),
    tickets: ticketsFor(order.approved_cents ?? 0).count,
    note: order.buyer_note,
  };

  if (outcome.result === "void") {
    return Response.json({
      result: "void",
      ...holder,
      title: "Cancelled ticket",
      detail: "This ticket was voided after it was issued.",
    });
  }

  if (outcome.result === "used") {
    return Response.json({
      result: "used",
      ...holder,
      usedAt: ticket.used_at,
      title: "Already scanned",
      detail: "Someone came in on this code already.",
    });
  }

  return Response.json({
    result: "valid",
    ...holder,
    usedAt: ticket.used_at,
    title: "Let them in",
    detail: `Ticket ${ticket.seq} of ${total} · ${order.buyer_name}`,
  });
}
