# Doh Panic — bank-transfer ticketing

Guests pay by bank transfer, upload the screenshot, and get a signed QR code per
ticket. Staff confirm each payment by hand, then send the codes on WhatsApp. At
the door, a phone scans the QR and the code burns on first use.

**Stack:** Next.js 15 · Drizzle ORM on Neon Postgres · Cloudflare R2 for
screenshots · Clerk for staff auth · Server Actions · Tailwind v4 + shadcn.

---

## Getting it running

```bash
npm install
```

Fill in `.env.local` (see `.env.example` for the shape) — it needs a Neon
connection string, Clerk keys and R2 credentials. Then create the tables:

```bash
npm run db:migrate
```

```bash
npm run dev
```

> **Only ever run one dev server at a time.** Two of them sharing `.next`
> corrupt each other's chunks, which shows up as routes randomly 404ing and
> `__webpack_modules__[moduleId] is not a function`. If the app starts behaving
> strangely, kill every node process, delete `.next`, and start again.
>
> For the same reason, stop the dev server before `npm run build` — they share
> `.next`, and running both at once fails with missing generated type files.

### Neon

Use the **pooled** connection string — the host contains `-pooler`. The app
talks to it over WebSockets (`drizzle-orm/neon-serverless`) rather than the HTTP
driver, because issuing a batch of tickets has to run inside a real transaction.

### Clerk

Only staff and door workers sign in; buyers never do. Create the Clerk app and
put the publishable/secret keys in `.env.local`. Sign-in is served in-app at
`/sign-in`, not Clerk's hosted portal.

**Being signed in is not the same as being staff.** Clerk sign-up is public by
default, so "has an account" would let anyone on the internet approve payments
and burn tickets. Access needs an explicit grant, by either:

- `STAFF_EMAILS` — comma-separated allowlist in the environment, or
- `publicMetadata.role = "staff"` on the user in the Clerk dashboard

With neither set, nobody is staff — it fails closed. Someone signed in without a
grant sees a "Not on the door list" screen naming the address they used, so
adding them is obvious. Setting Clerk sign-ups to invitation-only is worth doing
too, but this check is what actually holds the door.

Middleware protects `/admin` and `/v`, and **every Server Action re-checks auth
itself** — a route-matcher mistake shouldn't be the only thing between a
stranger and issuing tickets.

### Cloudflare R2

Create a **private** bucket and an API token with object read/write on it. The
app never serves a public R2 URL: the admin UI gets a presigned link that
expires in ten minutes, so a screenshot of someone's banking app can't leak by
guessing an object key.

### Database changes

Edit `lib/schema.ts`, then:

```bash
npm run db:generate && npm run db:migrate
```

`npm run db:studio` opens Drizzle Studio if you want to poke at rows.

---

## Configure before real use

| Where | What |
| --- | --- |
| `lib/config.ts` | Event details, `ticketPriceCents`, currency, `countryCode`, the cause, the line-up |
| `lib/config.ts` | `BANK` — the account details shown on the home page |
| `.env.local` | `TICKET_SECRET` — long random string. **Rotating it invalidates every QR already issued.** |
| `.env.local` | `NEXT_PUBLIC_BASE_URL` — baked into every QR code. Set it *before* issuing tickets. |

Money is stored and compared in **cents**, never floats.

---

## The flow

1. **Guest** — home page shows the bank details with copy buttons. They transfer,
   then upload a screenshot with their name, WhatsApp number and the amount.
   The form previews how many tickets that buys.
2. **Staff** — `/admin` lists pending payments. Opening one runs OCR on the
   screenshot and pre-fills the amount.
3. **A person confirms against the real account**, adjusts the amount if needed,
   and clicks issue. Tickets = `floor(amount / ticket price)`.
4. **The app** generates the message and a `wa.me` deep link. Copy it, or open
   WhatsApp with it already written.
5. **Guest** opens the link in the message and sees one QR per ticket.
6. **Door** — `/admin/scan` uses the phone camera. Valid → green. Second scan of
   the same code → amber "already scanned" with the time. Anything unsigned →
   red.

### Why approval is manual

A screenshot proves nothing — anyone can edit an amount in a couple of minutes.
OCR is a convenience for filling in the box, and the UI says so. Nothing is
issued until a person confirms the money actually arrived.

OCR runs **in the admin's browser**, not on the server: Tesseract's wasm and
language model are far too heavy for a serverless function. The parsed number is
advisory only, so nothing security-relevant rests on the client being honest.

### Why the codes are signed

Each code is random (`DP-XXXX-XXXX`, 32^8 possibilities) and carries a truncated
HMAC of itself. A made-up code fails signature checking before any database
lookup, and no guest can derive a neighbour's code from their own. Redemption is
a guarded `UPDATE ... WHERE status = 'valid' RETURNING`, so two doors scanning
the same code at the same instant still admit exactly one person.

QR codes encode a full URL (`/v/<code>.<signature>`), so an ordinary camera app
can read them — but that URL only forwards into the Clerk-protected scanner. A
guest scanning their own ticket gets a sign-in screen, not an admission.

---

## Tests

```bash
npm run test:integration
```

Drives the real service layer against your Neon database — issuing, the
approval transaction, signature forgery, double-scan, undo, underpayment,
rejection and the WhatsApp message. It creates its own rows and deletes them
again, so it is safe to run against a live database (it will not touch orders it
did not create).

It does not cover the browser: camera scanning and Clerk sign-in need a real
device and a real person.

## Testing without moving money

`/dev/receipt` (development only) draws a realistic bank-transfer screenshot on
a canvas and downloads it as a PNG. Change the amount, sender and reference. The
"available balance" is deliberately larger than the payment so you can check the
OCR parser doesn't grab the wrong number.

`samples/transfer-500.png` is one already generated.

---

## Layout

```
app/
  page.tsx                     public — poster, bank details, upload form
  actions.ts                   Server Actions: approve, reject, OCR, scan, undo
  o/[token]/                   the guest's tickets and QR codes
  v/[payload]/                 QR landing, forwards into the gated scanner
  admin/                       queue, order review, door scanner
  api/orders/                  public submission (multipart, so REST not an action)
  api/admin/screenshot/[id]/   presigned R2 redirect, staff only
  api/qr/[token]/              PNG per ticket, addressed by order token
  dev/receipt/                 test screenshot generator
lib/
  schema.ts                    Drizzle tables
  db.ts                        Neon pool, drizzle client, queries
  service.ts                   order creation, approval, redemption
  codes.ts                     code generation and HMAC signing
  storage.ts                   Cloudflare R2
  ocr.ts                       the amount-guessing heuristic (isomorphic)
  whatsapp.ts                  message text and wa.me links
  config.ts                    event, cause, bank, prices
drizzle/                       generated SQL migrations
```

## Design

Palette and component shapes follow the printed ticket — black and gold with a
flame-red accent. Components are [shadcn](https://ui.shadcn.com/)-structured, so
`npx shadcn@latest add ...` works, including Rare UI's own components:

```bash
npx shadcn@latest add swamimalode07/rare-ui/fluid-orb
```

Motion uses the [transitions.dev](https://transitions.dev/) token scale —
durations `40/80/150/250/350/400/500ms`, `--ease-smooth-out` and `--ease-bounce`
— with the rule that opening is slower and bouncier than closing. All of it is
defined at the bottom of `app/globals.css` and disabled under
`prefers-reduced-motion`.

---

## Deploying to Vercel

`vercel.json` pins the framework preset, which is what the first deploy tripped
over. Set every variable from `.env.example` in the Vercel project, and point
`NEXT_PUBLIC_BASE_URL` at the real domain **before** issuing any tickets.

Serve over HTTPS — browsers only allow camera access on secure origins, so the
door scanner will not work over plain HTTP.
