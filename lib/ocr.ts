/**
 * Turns OCR text from a bank-transfer screenshot into a *suggested* amount.
 *
 * Pure and isomorphic: the recognition itself now runs in the admin's browser
 * (see components/review-panel.tsx), because Tesseract's wasm and language
 * model are far too heavy for a serverless function. The parsed number is only
 * ever a suggestion — a person confirms the real amount before tickets issue,
 * so nothing security-relevant depends on it.
 */

const BOOST = /\b(amount|paid|sent|transfer|transferred|payment|total|debit|debited|successful)\b/i;
const PENALTY = /\b(balance|available|remaining|fee|charge|limit|ref|account)\b/i;

/** Pull every money-shaped number out of a line of OCR text. */
function candidatesIn(line: string): number[] {
  const out: number[] = [];
  const re = /(?:TT\$|TTD|USD|US\$|\$)?\s?(\d{1,3}(?:[ ,]\d{3})+|\d+)(?:[.,](\d{2}))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const whole = Number(m[1].replace(/[ ,]/g, ""));
    if (!Number.isFinite(whole)) continue;
    const decimals = m[2] ? Number(m[2]) : 0;
    const cents = whole * 100 + decimals;
    // Ignore dates, times, card digits and other noise.
    if (cents < 100 || cents > 10_000_000) continue;
    out.push(cents);
  }
  return out;
}

export function guessAmountCents(text: string): number | null {
  let best: { cents: number; score: number } | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/\b\d{1,2}[:/]\d{2}\b/.test(line) && !BOOST.test(line)) continue;

    let score = 0;
    if (BOOST.test(line)) score += 3;
    if (PENALTY.test(line)) score -= 3;
    if (/(TT\$|TTD|\$)\s?\d/.test(line)) score += 2;
    if (/\d[.,]\d{2}\b/.test(line)) score += 1;

    for (const cents of candidatesIn(line)) {
      if (
        !best ||
        score > best.score ||
        (score === best.score && cents > best.cents)
      ) {
        best = { cents, score };
      }
    }
  }

  return best?.cents ?? null;
}
