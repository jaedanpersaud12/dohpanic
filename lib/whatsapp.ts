import { CAUSE, EVENT, baseUrl, money, ticketsFor } from "./config";
import type { Order, Ticket } from "./db";

/**
 * Trinidad & Tobago numbers, in every shape people actually type them.
 *   123-4567        -> 18681234567   (7-digit local)
 *   868 123 4567    -> 18681234567
 *   1 868 123 4567  -> 18681234567
 * Anything already in international form is left alone.
 */
export function normalizeNumber(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  // No trunk prefix in the NANP, but people carry the habit over from elsewhere.
  if (d.startsWith("0")) d = d.slice(1);

  const cc = EVENT.countryCode; // "1868"
  const area = cc.slice(1); // "868"

  if (d.length === 7) return cc + d;
  if (d.length === 10 && d.startsWith(area)) return "1" + d;
  if (d.length === 11 && d.startsWith(cc)) return d;
  return d;
}

export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${normalizeNumber(number)}?text=${encodeURIComponent(
    message
  )}`;
}

/** The "here are your N tickets" message, ready to paste or deep-link. */
export function approvalMessage(order: Order, tickets: Ticket[]): string {
  const paid = order.approvedCents ?? 0;
  const { remainderCents } = ticketsFor(paid);
  const n = tickets.length;
  const firstName = order.buyerName.trim().split(/\s+/)[0] || "there";

  const lines: string[] = [];
  lines.push(`*${EVENT.theme}* — payment confirmed ✅`);
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
  lines.push(`📅 ${EVENT.date} · ${EVENT.timeRange}`);
  lines.push(`📍 ${EVENT.venue}`);
  lines.push(
    "Show a QR at the door. Each code admits one person and works once — don't forward them around."
  );
  lines.push("");
  lines.push(`Thank you for supporting ${CAUSE.beneficiary}. 🎗️`);

  return lines.join("\n");
}

export function rejectionMessage(order: Order): string {
  const firstName = order.buyerName.trim().split(/\s+/)[0] || "there";
  const reason = order.rejectReason?.trim();
  return [
    `*${EVENT.theme}* — about your payment`,
    "",
    `Hi ${firstName}, we couldn't confirm the transfer you sent through.`,
    reason ? `\nReason: ${reason}` : "",
    "\nReply here and we'll sort it out.",
  ]
    .filter(Boolean)
    .join("\n");
}
