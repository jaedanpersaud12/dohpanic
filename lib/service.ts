import { db, getTicketByCode, ticketsForOrder, type Order, type Ticket } from "./db";
import { newTicketCode, randomId, randomToken, verifyPayload } from "./codes";
import { ticketsFor } from "./config";

/* ------------------------------------------------------------ new orders */

export function createOrder(input: {
  name: string;
  whatsapp: string;
  note?: string;
  claimedCents: number;
  screenshot: string | null;
}): Order {
  const id = randomId("ord");
  const token = randomToken();
  db()
    .prepare(
      `INSERT INTO orders
         (id, token, buyer_name, buyer_whatsapp, buyer_note,
          claimed_cents, screenshot, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    )
    .run(
      id,
      token,
      input.name.trim(),
      input.whatsapp.trim(),
      input.note?.trim() || null,
      input.claimedCents,
      input.screenshot,
      Date.now()
    );
  return db().prepare("SELECT * FROM orders WHERE id = ?").get(id) as Order;
}

/* -------------------------------------------------------------- approval */

export class ApprovalError extends Error {}

/**
 * Issues tickets for a confirmed amount. Runs in a transaction so a crash
 * halfway through can never leave an order approved with no codes attached.
 * Approving an already-approved order returns its existing tickets rather
 * than minting a second batch.
 */
export function approveOrder(orderId: string, approvedCents: number): Ticket[] {
  const conn = db();

  const run = conn.transaction((): Ticket[] => {
    const order = conn
      .prepare("SELECT * FROM orders WHERE id = ?")
      .get(orderId) as Order | undefined;
    if (!order) throw new ApprovalError("That order no longer exists.");
    if (order.status === "approved") return ticketsForOrder(orderId);

    const { count } = ticketsFor(approvedCents);
    if (count < 1) {
      throw new ApprovalError(
        "That amount doesn't cover a single ticket. Reject the order instead, or enter the correct amount."
      );
    }

    const now = Date.now();
    const insert = conn.prepare(
      `INSERT INTO tickets (id, order_id, code, seq, status, created_at)
       VALUES (?, ?, ?, ?, 'valid', ?)`
    );

    for (let seq = 1; seq <= count; seq++) {
      // Astronomically unlikely to collide, but a UNIQUE index plus a retry
      // costs nothing and removes the failure mode entirely.
      let inserted = false;
      for (let attempt = 0; attempt < 8 && !inserted; attempt++) {
        try {
          insert.run(randomId("tkt"), orderId, newTicketCode(), seq, now);
          inserted = true;
        } catch (err) {
          if (attempt === 7) throw err;
        }
      }
    }

    conn
      .prepare(
        `UPDATE orders
            SET status = 'approved', approved_cents = ?, decided_at = ?,
                reject_reason = NULL
          WHERE id = ?`
      )
      .run(approvedCents, now, orderId);

    return ticketsForOrder(orderId);
  });

  return run();
}

export function rejectOrder(orderId: string, reason: string): void {
  db()
    .prepare(
      `UPDATE orders
          SET status = 'rejected', reject_reason = ?, decided_at = ?
        WHERE id = ? AND status != 'approved'`
    )
    .run(reason.trim() || null, Date.now(), orderId);
}

export function saveOcr(
  orderId: string,
  cents: number | null,
  text: string
): void {
  db()
    .prepare(
      "UPDATE orders SET ocr_cents = ?, ocr_text = ?, ocr_ran_at = ? WHERE id = ?"
    )
    .run(cents, text.slice(0, 4000), Date.now(), orderId);
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
 * The UPDATE is guarded on status='valid', so two doors scanning the same
 * code at the same moment can only produce one admission.
 */
export function redeem(rawPayload: string): ScanOutcome {
  const code = verifyPayload(rawPayload);
  const conn = db();
  const log = conn.prepare(
    "INSERT INTO scans (code, result, at) VALUES (?, ?, ?)"
  );

  if (!code) {
    log.run(rawPayload.slice(0, 120), "forged", Date.now());
    return { result: "forged" };
  }

  const outcome = conn.transaction((): ScanOutcome => {
    const ticket = getTicketByCode(code);
    if (!ticket) return { result: "unknown", code };

    const order = conn
      .prepare("SELECT * FROM orders WHERE id = ?")
      .get(ticket.order_id) as Order;

    if (ticket.status === "void") return { result: "void", code, ticket, order };
    if (ticket.status === "used") return { result: "used", code, ticket, order };

    const now = Date.now();
    const res = conn
      .prepare(
        "UPDATE tickets SET status = 'used', used_at = ? WHERE code = ? AND status = 'valid'"
      )
      .run(now, code);

    if (res.changes === 0) {
      const fresh = getTicketByCode(code)!;
      return { result: "used", code, ticket: fresh, order };
    }

    return {
      result: "valid",
      code,
      ticket: { ...ticket, status: "used", used_at: now },
      order,
    };
  })();

  log.run(code, outcome.result, Date.now());
  return outcome;
}

/** Puts a used ticket back — for the inevitable "I scanned it twice" moment. */
export function unredeem(code: string): boolean {
  const res = db()
    .prepare("UPDATE tickets SET status = 'valid', used_at = NULL WHERE code = ?")
    .run(code);
  return res.changes > 0;
}
