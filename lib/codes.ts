import crypto from "node:crypto";
import { baseUrl } from "./config";

/**
 * Ticket codes are random, not sequential, and every code is paired with an
 * HMAC signature. A door scanner can therefore reject a made-up code without
 * a database round trip, and nobody can derive a neighbour's code from theirs.
 *
 * QR payload  ->  DP-7K2F-9QX4.a1b2c3d4e5f6g7h8
 * QR content  ->  {baseUrl}/v/DP-7K2F-9QX4.a1b2c3d4e5f6g7h8
 */

/** Crockford-ish base32: no I, L, O, U — unambiguous when read aloud. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const SIG_LEN = 16;

function secret(): string {
  const s = process.env.TICKET_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "TICKET_SECRET is missing or too short. Set a long random value in .env.local."
    );
  }
  return s;
}

export function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(9).toString("base64url")}`;
}

export function randomToken(): string {
  return crypto.randomBytes(16).toString("base64url");
}

function randomChars(n: number): string {
  const bytes = crypto.randomBytes(n);
  let out = "";
  for (let i = 0; i < n; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function newTicketCode(): string {
  return `DP-${randomChars(4)}-${randomChars(4)}`;
}

export function sign(code: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(code)
    .digest("base64url")
    .slice(0, SIG_LEN);
}

export function payloadFor(code: string): string {
  return `${code}.${sign(code)}`;
}

export function qrUrlFor(code: string): string {
  return `${baseUrl()}/v/${payloadFor(code)}`;
}

/**
 * Pulls a code out of anything a scanner might hand us: a bare payload, a
 * full verify URL, or a code the door staff typed in by hand.
 * Returns null when the signature does not check out.
 */
export function verifyPayload(raw: string): string | null {
  if (!raw) return null;
  let text = raw.trim();

  // Full URL from a phone camera app.
  const urlMatch = text.match(/\/v\/([^/?#\s]+)/);
  if (urlMatch) text = decodeURIComponent(urlMatch[1]);

  const dot = text.lastIndexOf(".");
  if (dot < 0) return null;

  const code = text.slice(0, dot).toUpperCase();
  const givenSig = text.slice(dot + 1);
  if (!/^DP-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(code)) return null;

  const expected = sign(code);
  const a = Buffer.from(givenSig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return crypto.timingSafeEqual(a, b) ? code : null;
}
