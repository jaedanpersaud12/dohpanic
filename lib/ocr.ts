/**
 * Reads a bank-transfer screenshot and *suggests* an amount.
 *
 * This is a convenience for whoever is approving orders — never a source of
 * truth. A screenshot can be edited in thirty seconds, so the suggestion is
 * always shown as "OCR thinks…" and an admin has to confirm against the real
 * account before any ticket is issued.
 */

export type OcrResult = {
  ok: boolean;
  cents: number | null;
  text: string;
  error?: string;
};

const BOOST = /\b(amount|paid|sent|transfer|transferred|payment|total|debit)\b/i;
const PENALTY = /\b(balance|available|remaining|fee|charge|limit|ref|account)\b/i;

/** Pull every money-shaped number out of a line of OCR text. */
function candidatesIn(line: string): number[] {
  const out: number[] = [];
  const re = /(?:R|ZAR|\$|£|€)?\s?(\d{1,3}(?:[ ,]\d{3})+|\d+)(?:[.,](\d{2}))?/g;
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
    if (/(R|ZAR|\$|£|€)\s?\d/.test(line)) score += 2;
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

export async function readScreenshot(filePath: string): Promise<OcrResult> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    try {
      const {
        data: { text },
      } = await worker.recognize(filePath);
      return { ok: true, cents: guessAmountCents(text), text: text.trim() };
    } finally {
      await worker.terminate();
    }
  } catch (err) {
    return {
      ok: false,
      cents: null,
      text: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
