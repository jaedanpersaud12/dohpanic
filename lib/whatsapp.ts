import { EVENT, baseUrl, money, ticketsFor } from "./config";
import type { Order, Ticket } from "./db";

/** 082 123 4567 -> 27821234567 ; +27 82 … -> 2782… ; already-intl left alone. */
export function normalizeNumber(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = EVENT.countryCode + d.slice(1);
  return d;
}

export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${normalizeNumber(number)}?text=${encodeURIComponent(
    message
  )}`;
}

/** The "here are your N tickets" message, ready to paste or deep-link. */
export function approvalMessage(order: Order, tickets: Ticket[]): string {
  const paid = order.approved_cents ?? 0;
  const { remainderCents } = ticketsFor(paid);
  const n = tickets.length;
  const firstName = order.buyer_name.trim().split(/\s+/)[0] || "there";

  const lines: string[] = [];
  lines.push(`*${EVENT.name}* — payment confirmed ✅`);
  lines.push("");
  lines.push(
    `Hi ${firstName}, we received ${money(paid)} — that's *${n} ticket${
      n === 1 ? "" : "s"
    }*.`
  );
  lines.push("");
  lines.push(n === 1 ? "Your code:" : "Your codes:");
  for (const t of tickets) lines.push(`${t.seq}. ${t.code}`);

  if (remainderCents > 0) {
    lines.push("");
    lines.push(
      `(${money(remainderCents)} left over — not enough for another ticket.)`
    );
  }

  lines.push("");
  lines.push("Open your QR codes here:");
  lines.push(`${baseUrl()}/o/${order.token}`);
  lines.push("");
  lines.push(`📅 ${EVENT.date} · doors ${EVENT.doorsOpen}`);
  lines.push(
    "Show a QR at the door. Each code admits one person and works once — don't forward them around."
  );

  return lines.join("\n");
}

export function rejectionMessage(order: Order): string {
  const firstName = order.buyer_name.trim().split(/\s+/)[0] || "there";
  const reason = order.reject_reason?.trim();
  return [
    `*${EVENT.name}* — about your payment`,
    "",
    `Hi ${firstName}, we couldn't confirm the transfer you sent through.`,
    reason ? `\nReason: ${reason}` : "",
    "\nReply here and we'll sort it out.",
  ]
    .filter(Boolean)
    .join("\n");
}
