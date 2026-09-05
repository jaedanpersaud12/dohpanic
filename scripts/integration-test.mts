/**
 * Integration test against the real Neon database, driving the actual service
 * layer (no HTTP, no Clerk). Cleans up every row it creates.
 *
 *   npm run test:integration
 */
import fs from "node:fs";
import path from "node:path";

process.chdir(path.resolve(import.meta.dirname, ".."));

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && m[2]) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const { db, schema, counts, getOrderByToken, ticketsForOrder } = await import("../lib/db");
const {
  createOrder,
  approveOrder,
  rejectOrder,
  redeem,
  unredeem,
  ApprovalError,
  getTicketByShareToken,
  nameTicket,
  markTicketShared,
} = await import("../lib/service");
const { payloadFor, qrUrlFor, verifyPayload, sign } = await import("../lib/codes");
const { approvalMessage, whatsappLink, normalizeNumber } = await import("../lib/whatsapp");
const { EVENT, ticketsFor } = await import("../lib/config");
const { eq, inArray } = await import("drizzle-orm");

let pass = 0;
let fail = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${extra}`); }
};

const created: string[] = [];

console.log(`\nticket price: ${EVENT.ticketPriceCents} cents (${EVENT.currency}${EVENT.ticketPriceCents / 100})`);

try {
  /* ------------------------------------------------------------ 1. create */
  console.log("\n1. Create an order");
  const order = await createOrder({
    name: "Test Buyer",
    whatsapp: "868 555 0101",
    note: "integration test",
    claimedCents: 100_000,
    screenshotKey: null,
  });
  created.push(order.id);
  ok("order created", Boolean(order.id && order.token));
  ok("status starts pending", order.status === "pending");
  ok("camelCase mapping works", order.buyerName === "Test Buyer", JSON.stringify(order.buyerName));

  /* ----------------------------------------------------------- 2. approve */
  console.log("\n2. Approve issues floor(amount / price) tickets");
  const tickets = await approveOrder(order.id, 100_000, "user_test");
  ok("5 tickets issued", tickets.length === 5, `got ${tickets.length}`);
  ok("codes use the DP prefix", tickets.every((t) => /^DP-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(t.code)), tickets[0]?.code);
  ok("codes are unique", new Set(tickets.map((t) => t.code)).size === 5);
  ok("seq runs 1..5", tickets.map((t) => t.seq).join(",") === "1,2,3,4,5");
  ok("decidedBy recorded", (await db().select().from(schema.orders).where(eq(schema.orders.id, order.id)))[0].decidedBy === "user_test");

  console.log("\n3. Idempotent re-approval");
  const again = await approveOrder(order.id, 100_000, "user_test");
  ok("no second batch minted", again.length === 5, `got ${again.length}`);

  /* ----------------------------------------------------------- 4. message */
  console.log("\n4. WhatsApp message and deep link");
  const fresh = (await db().select().from(schema.orders).where(eq(schema.orders.id, order.id)))[0];
  const msg = approvalMessage(fresh, tickets);
  ok("names 5 tickets", /\*5 tickets\*/.test(msg));
  ok("does NOT dump every code into one message", (msg.match(/DP-/g) ?? []).length === 0);
  ok("carries the order link", msg.includes(`/o/${order.token}`));
  ok("mentions the cause", /Parris Persaud/.test(msg));
  const link = whatsappLink(fresh.buyerWhatsapp, msg);
  ok("TT number normalised", link.startsWith("https://wa.me/18685550101?text="), link.slice(0, 45));
  ok("7-digit local normalises", normalizeNumber("555-0102") === "18685550102", normalizeNumber("555-0102"));
  ok("already-international untouched", normalizeNumber("+1 868 555 0103") === "18685550103", normalizeNumber("+1 868 555 0103"));

  console.log("\n--- generated message ---");
  console.log(msg.split("\n").map((l) => "  | " + l).join("\n"));

  /* -------------------------------------------------------------- 5. scan */
  console.log("\n5. Door scanning");
  const payload = payloadFor(tickets[0].code);
  ok("qr url points at /v/", qrUrlFor(tickets[0].code).includes(`/v/${payload}`));
  ok("payload verifies", verifyPayload(payload) === tickets[0].code);

  const s1 = await redeem(payload, "user_door");
  ok("first scan valid", s1.result === "valid", s1.result);
  const s2 = await redeem(payload, "user_door");
  ok("second scan refused as used", s2.result === "used", s2.result);
  ok("usedBy recorded", (await ticketsForOrder(order.id)).find((t) => t.code === tickets[0].code)?.usedBy === "user_door");

  const asUrl = await redeem(`https://example.com/v/${payloadFor(tickets[1].code)}`, "user_door");
  ok("accepts a full scanned URL", asUrl.result === "valid", asUrl.result);

  /* ----------------------------------------------------------- 6. forgery */
  console.log("\n6. Forgery is rejected");
  ok("made-up code rejected", (await redeem("DP-AAAA-BBBB.0000000000000000", "user_door")).result === "forged");
  ok("bare code rejected", (await redeem(tickets[2].code, "user_door")).result === "forged");
  ok("swapped signature rejected", (await redeem(`${tickets[2].code}.${sign(tickets[3].code)}`, "user_door")).result === "forged");
  ok("ticket 3 still unused after forgery attempts", (await ticketsForOrder(order.id)).find((t) => t.code === tickets[2].code)?.status === "valid");

  /* -------------------------------------------------------------- 7. undo */
  console.log("\n7. Undo");
  ok("undo returns true", (await unredeem(tickets[0].code)) === true);
  ok("ticket usable again", (await redeem(payload, "user_door")).result === "valid");

  /* ------------------------------------------------------ 8. underpayment */
  console.log("\n8. Underpayment cannot be approved");
  const small = await createOrder({
    name: "Small Payer",
    whatsapp: "8685550104",
    claimedCents: 5_000,
    screenshotKey: null,
  });
  created.push(small.id);
  let threw = false;
  try {
    await approveOrder(small.id, 5_000, "user_test");
  } catch (err) {
    threw = err instanceof ApprovalError;
  }
  ok("under one ticket refused", threw);
  ok("ticketsFor maths", ticketsFor(50_000).count === 2 && ticketsFor(50_000).remainderCents === 10_000);

  /* ---------------------------------------------------------- 9. rejection */
  console.log("\n9. Rejection");
  await rejectOrder(small.id, "Nothing arrived", "user_test");
  const rejected = (await db().select().from(schema.orders).where(eq(schema.orders.id, small.id)))[0];
  ok("marked rejected", rejected.status === "rejected");
  ok("reason stored", rejected.rejectReason === "Nothing arrived");

  console.log("\n10. Per-ticket sharing");
  ok("every ticket has a share token", tickets.every((t) => Boolean(t.shareToken)));
  ok("share tokens are unique", new Set(tickets.map((t) => t.shareToken)).size === 5);
  ok("share token is not the code", tickets.every((t) => t.shareToken !== t.code));

  const shared = await getTicketByShareToken(tickets[1].shareToken!);
  ok("share token resolves to one ticket", shared?.ticket.id === tickets[1].id);
  ok("and carries its order", shared?.order.id === order.id);
  ok("unknown share token resolves to nothing", (await getTicketByShareToken("nope")) === undefined);

  ok("naming a ticket works", await nameTicket(order.token, tickets[1].id, "Kavir"));
  ok("name is stored", (await getTicketByShareToken(tickets[1].shareToken!))?.ticket.assignedName === "Kavir");
  ok("marking shared works", await markTicketShared(order.token, tickets[1].id));
  ok("sharedAt is set", Boolean((await getTicketByShareToken(tickets[1].shareToken!))?.ticket.sharedAt));

  // One buyer's token must not reach into another buyer's order.
  const otherOrder = await createOrder({
    name: "Someone Else", whatsapp: "8685550199", claimedCents: 20_000, screenshotKey: null,
  });
  created.push(otherOrder.id);
  const otherTickets = await approveOrder(otherOrder.id, 20_000, "user_test");
  ok("cannot rename a ticket in another order", !(await nameTicket(order.token, otherTickets[0].id, "hijack")));
  ok("cannot mark another order's ticket shared", !(await markTicketShared(order.token, otherTickets[0].id)));
  ok("that ticket is untouched", (await getTicketByShareToken(otherTickets[0].shareToken!))?.ticket.assignedName === null);

  console.log("\n11. Message points at per-ticket sending");
  ok("multi-ticket message links the order page", msg.includes("/o/" + order.token));
  const singleRow = (await db().select().from(schema.orders).where(eq(schema.orders.id, otherOrder.id)))[0];
  const single = approvalMessage(singleRow, otherTickets);
  ok("single-ticket message links that ticket", single.includes("/t/" + otherTickets[0].shareToken));
  ok("single-ticket message shows its code", single.includes(otherTickets[0].code));

  console.log("\n--- single-ticket message ---");
  console.log(single.split("\n").map((l) => "  | " + l).join("\n"));

  console.log("\n12. Buyer lookup by token");
  const byToken = await getOrderByToken(order.token);
  ok("token lookup works", byToken?.id === order.id);
  ok("counts() returns numbers", typeof (await counts()).valid === "number");
} finally {
  /* ----------------------------------------------------------- cleanup */
  if (created.length) {
    await db().delete(schema.tickets).where(inArray(schema.tickets.orderId, created));
    await db().delete(schema.orders).where(inArray(schema.orders.id, created));
    console.log(`\ncleaned up ${created.length} test order(s) and their tickets`);
  }
  await db().delete(schema.scans).where(eq(schema.scans.scannedBy, "user_door"));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
