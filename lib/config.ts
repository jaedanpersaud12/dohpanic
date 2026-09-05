/**
 * Everything you'd want to change for a given party lives here.
 * Money is stored and compared in cents — never floats.
 */

export const EVENT = {
  tagline: "A night of music, fun & giving hope",
  theme: "Doh Panic",
  date: "Sunday 20th September 2026",
  dateShort: "Sun 20 Sep 2026",
  doorsOpen: "6:00pm",
  endsAt: "midnight",
  timeRange: "6pm till midnight",
  venue: "Rock Back",
  currency: "TT$",
  /** ISO code, for anywhere a formal currency label reads better than the symbol. */
  currencyCode: "TTD",
  ticketPriceCents: 200_00,
  /** Dialling code prepended when a buyer types a local number like 123-4567. */
  countryCode: "1868",
  /** The strapline that runs under the price on the physical ticket. */
  strapline: "Good vibes · Great music · Big hearts · Stronger together",
  signoff: "Let's come together to support, uplift and make a difference.",
};

/** Who the night is for. */
export const CAUSE = {
  kicker: "In aid of medical expenses for",
  beneficiary: "Parris Persaud",
  descriptor: "Stage 4 Cancer Warrior",
  blurb:
    "Let's come together to support, uplift and make a difference in Parris Persaud's fight.",
};

/** The programme, in the order it appears on the ticket. */
export const LINEUP = [
  { role: "Venue", name: "Rock Back", note: null },
  { role: "Entertainment", name: "Chris Garcia", note: "The one and only" },
  { role: "DJ", name: "Rene", note: null },
  {
    role: "Hoola Hoop Competition",
    name: "Maggie",
    note: "Hosted by · The Dancing Queen",
  },
] as const;

export const BANK = {
  accountName: "J. Persaud",
  bank: "Republic Bank",
  accountNumber: "000 000 000 000",
  branchCode: "Transit 000",
  accountType: "Chequing",
  reference: "Your name + WhatsApp number",
};

/** Format cents for display: 20000 -> "TT$200". */
export function money(cents: number): string {
  const whole = cents / 100;
  const body =
    Number.isInteger(whole) ? whole.toLocaleString("en-TT") : whole.toFixed(2);
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
