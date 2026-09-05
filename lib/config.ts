/**
 * Everything you'd want to change for a given party lives here.
 * Money is stored and compared in cents — never floats.
 */

export const EVENT = {
  name: "Mummy",
  tagline: "One night. Strictly by ticket.",
  date: "Saturday 20 December",
  doorsOpen: "21:00",
  venue: "Address sent with your ticket",
  currency: "R",
  ticketPriceCents: 100_00,
  /** Dialling code prepended when a buyer types a local number like 082…  */
  countryCode: "27",
};

export const BANK = {
  accountName: "J. Persaud",
  bank: "Standard Bank",
  accountNumber: "10 1234 5678",
  branchCode: "051001",
  accountType: "Cheque / Current",
  reference: "Your name + WhatsApp number",
};

/** Format cents for display: 50000 -> "R500.00" (drops .00 when whole). */
export function money(cents: number): string {
  const whole = cents / 100;
  const body =
    Number.isInteger(whole) ? whole.toLocaleString() : whole.toFixed(2);
  return `${EVENT.currency}${body}`;
}

/** How many whole tickets a payment buys, plus the leftover. */
export function ticketsFor(amountCents: number) {
  const price = EVENT.ticketPriceCents;
  const count = Math.floor(amountCents / price);
  return { count, remainderCents: amountCents - count * price };
}

export function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}
