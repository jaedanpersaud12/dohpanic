import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "tickets.db");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const d = new Database(DB_PATH);
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  d.exec(SCHEMA);
  _db = d;
  return d;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  token           TEXT NOT NULL UNIQUE,
  buyer_name      TEXT NOT NULL,
  buyer_whatsapp  TEXT NOT NULL,
  buyer_note      TEXT,
  claimed_cents   INTEGER NOT NULL DEFAULT 0,
  ocr_cents       INTEGER,
  ocr_text        TEXT,
  ocr_ran_at      INTEGER,
  approved_cents  INTEGER,
  screenshot      TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  reject_reason   TEXT,
  created_at      INTEGER NOT NULL,
  decided_at      INTEGER
);

CREATE TABLE IF NOT EXISTS tickets (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  seq         INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'valid',
  used_at     INTEGER,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS scans (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  code    TEXT NOT NULL,
  result  TEXT NOT NULL,
  at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_order  ON tickets(order_id, seq);
CREATE INDEX IF NOT EXISTS idx_scans_at       ON scans(at DESC);
`;

export type OrderStatus = "pending" | "approved" | "rejected";

export type Order = {
  id: string;
  token: string;
  buyer_name: string;
  buyer_whatsapp: string;
  buyer_note: string | null;
  claimed_cents: number;
  ocr_cents: number | null;
  ocr_text: string | null;
  ocr_ran_at: number | null;
  approved_cents: number | null;
  screenshot: string | null;
  status: OrderStatus;
  reject_reason: string | null;
  created_at: number;
  decided_at: number | null;
};

export type Ticket = {
  id: string;
  order_id: string;
  code: string;
  seq: number;
  status: "valid" | "used" | "void";
  used_at: number | null;
  created_at: number;
};

/* ---------------------------------------------------------------- queries */

export function getOrder(id: string): Order | undefined {
  return db().prepare("SELECT * FROM orders WHERE id = ?").get(id) as
    | Order
    | undefined;
}

export function getOrderByToken(token: string): Order | undefined {
  return db().prepare("SELECT * FROM orders WHERE token = ?").get(token) as
    | Order
    | undefined;
}

export function listOrders(status?: OrderStatus): Order[] {
  return status
    ? (db()
        .prepare(
          "SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC"
        )
        .all(status) as Order[])
    : (db()
        .prepare("SELECT * FROM orders ORDER BY created_at DESC")
        .all() as Order[]);
}

export function ticketsForOrder(orderId: string): Ticket[] {
  return db()
    .prepare("SELECT * FROM tickets WHERE order_id = ? ORDER BY seq")
    .all(orderId) as Ticket[];
}

export function getTicketByCode(code: string): Ticket | undefined {
  return db().prepare("SELECT * FROM tickets WHERE code = ?").get(code) as
    | Ticket
    | undefined;
}

export function counts() {
  const row = db()
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM orders  WHERE status = 'pending')  AS pending,
         (SELECT COUNT(*) FROM orders  WHERE status = 'approved') AS approved,
         (SELECT COUNT(*) FROM orders  WHERE status = 'rejected') AS rejected,
         (SELECT COUNT(*) FROM tickets WHERE status = 'valid')    AS valid,
         (SELECT COUNT(*) FROM tickets WHERE status = 'used')     AS used`
    )
    .get() as Record<string, number>;
  return row;
}
