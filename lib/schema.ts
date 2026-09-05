import { relations } from "drizzle-orm";
import {
  bigserial,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type OrderStatus = "pending" | "approved" | "rejected";
export type TicketStatus = "valid" | "used" | "void";

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    /** Unguessable handle the buyer uses to reach their own tickets. */
    token: text("token").notNull().unique(),
    buyerName: text("buyer_name").notNull(),
    buyerWhatsapp: text("buyer_whatsapp").notNull(),
    buyerNote: text("buyer_note"),
    /** What the buyer says they sent, in cents. */
    claimedCents: integer("claimed_cents").notNull().default(0),
    /** What OCR read off the screenshot. Advisory only. */
    ocrCents: integer("ocr_cents"),
    ocrText: text("ocr_text"),
    ocrRanAt: timestamp("ocr_ran_at", { withTimezone: true }),
    /** What a human confirmed actually landed. The only figure tickets follow. */
    approvedCents: integer("approved_cents"),
    /** Object key in R2. The bucket is private. */
    screenshotKey: text("screenshot_key"),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    rejectReason: text("reject_reason"),
    /** Clerk user id of whoever approved or rejected it. */
    decidedBy: text("decided_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (t) => [index("idx_orders_status").on(t.status, t.createdAt)]
);

export const tickets = pgTable(
  "tickets",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(),
    seq: integer("seq").notNull(),
    status: text("status").$type<TicketStatus>().notNull().default("valid"),
    usedAt: timestamp("used_at", { withTimezone: true }),
    /** Clerk user id of the door person who scanned it in. */
    usedBy: text("used_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_tickets_order").on(t.orderId, t.seq)]
);

/** Every scan attempt, including forged ones — useful the morning after. */
export const scans = pgTable(
  "scans",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    code: text("code").notNull(),
    result: text("result").notNull(),
    scannedBy: text("scanned_by"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_scans_at").on(t.at)]
);

export const ordersRelations = relations(orders, ({ many }) => ({
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  order: one(orders, { fields: [tickets.orderId], references: [orders.id] }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
