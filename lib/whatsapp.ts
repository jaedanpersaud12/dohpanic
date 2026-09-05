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

/**
 * The "here are your N tickets" message.
 *
 * For a single ticket we send the ticket itself. For several we deliberately
 * do NOT list every code: that invites forwarding the whole set to everybody,
 * which is how people end up at the door unsure which QR is theirs. Instead we
 * point at the order page, where each ticket has its own link and send button.
 */
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

  if (n === 1 && tickets[0].shareToken) {
    lines.push("Here's your ticket:");
    lines.push(`${baseUrl()}/t/${tickets[0].shareToken}`);
    lines.push("");
    lines.push(`Code: ${tickets[0].code}`);
  } else {
    lines.push("Open your tickets here:");
    lines.push(`${baseUrl()}/o/${order.token}`);
    lines.push("");
    lines.push(
      "Each ticket has its own Send button on that page — tap it to pass a ticket straight to whoever it's for, so nobody has to work out which QR is theirs."
    );
  }

  if (remainderCents > 0) {
    lines.push("");
    lines.push(
      `(${money(remainderCents)} left over — not enough for another ticket.)`
    );
  }

  lines.push("");
  lines.push(`📅 ${EVENT.date} · ${EVENT.timeRange}`);
  lines.push(`📍 ${EVENT.venue}`);
  lines.push(
    n === 1
      ? "Show the QR at the door. It admits one person and works once."
      : "Each code admits one person and works once — don't forward them around."
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
