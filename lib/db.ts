import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { and, desc, eq, sql } from "drizzle-orm";
import * as schema from "./schema";

/**
 * Neon over WebSockets rather than the HTTP driver, because issuing a batch of
 * tickets has to happen inside a real transaction.
 */

declare global {
  // eslint-disable-next-line no-var
  var __mummyPool: Pool | undefined;
}

function pool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local."
    );
  }
  // Reused across hot reloads in dev so we don't leak a pool per edit.
  globalThis.__mummyPool ??= new Pool({ connectionString });
  return globalThis.__mummyPool;
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function db() {
  _db ??= drizzle(pool(), { schema });
  return _db;
}

export { schema };
export type { Order, Ticket, OrderStatus } from "./schema";

const { orders, tickets } = schema;

/* --------------------------------------------------------------- queries */

export async function getOrder(id: string) {
  const [row] = await db().select().from(orders).where(eq(orders.id, id)).limit(1);
  return row;
}

export async function getOrderByToken(token: string) {
  const [row] = await db()
    .select()
    .from(orders)
    .where(eq(orders.token, token))
    .limit(1);
  return row;
}

export function listOrders(status?: schema.OrderStatus) {
  const q = db().select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
  return status ? q.where(eq(orders.status, status)) : q;
}

export function ticketsForOrder(orderId: string) {
  return db()
    .select()
    .from(tickets)
    .where(eq(tickets.orderId, orderId))
    .orderBy(tickets.seq);
}

export async function getTicketByCode(code: string) {
  const [row] = await db()
    .select()
    .from(tickets)
    .where(eq(tickets.code, code))
    .limit(1);
  return row;
}

export async function counts() {
  const [row] = await db()
    .select({
      pending: sql<number>`(SELECT COUNT(*) FROM ${orders} WHERE ${orders.status} = 'pending')::int`,
      approved: sql<number>`(SELECT COUNT(*) FROM ${orders} WHERE ${orders.status} = 'approved')::int`,
      rejected: sql<number>`(SELECT COUNT(*) FROM ${orders} WHERE ${orders.status} = 'rejected')::int`,
      valid: sql<number>`(SELECT COUNT(*) FROM ${tickets} WHERE ${tickets.status} = 'valid')::int`,
      used: sql<number>`(SELECT COUNT(*) FROM ${tickets} WHERE ${tickets.status} = 'used')::int`,
    })
    .from(sql`(SELECT 1) AS _`);

  return (
    row ?? { pending: 0, approved: 0, rejected: 0, valid: 0, used: 0 }
  );
}

export { and, eq };

/** Drizzle hands back Date objects; the client components want millis. */
export function ms(ts: Date | null | undefined): number {
  return ts ? ts.getTime() : 0;
}
