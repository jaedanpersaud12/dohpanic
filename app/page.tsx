import Link from "next/link";
import { CalendarDays, Clock, Landmark, MapPin, ShieldCheck } from "lucide-react";
import { BANK, EVENT, money } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { PaymentForm } from "@/components/payment-form";

const BANK_ROWS: { label: string; value: string; copy?: boolean }[] = [
  { label: "Account name", value: BANK.accountName, copy: true },
  { label: "Bank", value: BANK.bank },
  { label: "Account number", value: BANK.accountNumber, copy: true },
  { label: "Branch code", value: BANK.branchCode, copy: true },
  { label: "Account type", value: BANK.accountType },
  { label: "Reference", value: BANK.reference },
];

const STEPS = [
  { n: "01", title: "Transfer the amount", body: `Any multiple of ${money(EVENT.ticketPriceCents)}. Send ${money(EVENT.ticketPriceCents * 5)} and you get five tickets.` },
  { n: "02", title: "Upload the screenshot", body: "We check it against the account by hand — usually within the hour." },
  { n: "03", title: "Get your codes", body: "A WhatsApp with one QR per ticket. Show any of them at the door." },
];

export default function Home() {
  return (
    <div className="relative overflow-x-hidden">
      {/* ambient accent glow */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[620px] overflow-hidden">
        <div className="t-drift absolute left-1/2 top-[-320px] size-[720px] -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-[0.13] blur-[130px]" />
      </div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.02em]">
          {EVENT.name}
        </span>
        <Link
          href="/admin"
          className="rounded-full px-4 py-2 text-sm text-[var(--muted-foreground)] transition-colors duration-[var(--duration-quick)] hover:bg-white/5 hover:text-white"
        >
          Admin
        </Link>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-24">
        {/* ------------------------------------------------------------ hero */}
        <section className="pt-14 pb-16 text-center sm:pt-20">
          <div className="t-rise" style={{ ["--i" as string]: 0 }}>
            <Badge variant="accent">
              <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              {EVENT.date}
            </Badge>
          </div>

          <h1
            className="t-rise mx-auto mt-6 max-w-3xl text-[clamp(2.75rem,8vw,5rem)] leading-[0.95]"
            style={{ ["--i" as string]: 1 }}
          >
            {EVENT.tagline}
          </h1>

          <p
            className="t-rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted-foreground)]"
            style={{ ["--i" as string]: 2 }}
          >
            Pay by bank transfer, send us the screenshot, and get a scannable QR
            code for every ticket you bought.
          </p>

          <div
            className="t-rise mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[var(--muted-foreground)]"
            style={{ ["--i" as string]: 3 }}
          >
            <span className="inline-flex items-center gap-2"><CalendarDays className="size-4" />{EVENT.date}</span>
            <span className="inline-flex items-center gap-2"><Clock className="size-4" />Doors {EVENT.doorsOpen}</span>
            <span className="inline-flex items-center gap-2"><MapPin className="size-4" />{EVENT.venue}</span>
          </div>

          <div
            className="t-rise mt-10 inline-flex items-baseline gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-6 py-3"
            style={{ ["--i" as string]: 4 }}
          >
            <span className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.03em]">
              {money(EVENT.ticketPriceCents)}
            </span>
            <span className="text-sm text-[var(--muted-foreground)]">per ticket</span>
          </div>
        </section>

        {/* --------------------------------------------------------- payment */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-start">
          {/* bank details */}
          <div
            className="t-enter rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 lg:sticky lg:top-6"
            style={{ ["--i" as string]: 1 }}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full border border-[var(--border)] bg-black/40">
                <Landmark className="size-4 text-[var(--accent)]" />
              </span>
              <div>
                <h2 className="text-xl">Transfer to</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Then upload your proof</p>
              </div>
            </div>

            <dl className="mt-7 divide-y divide-[var(--border)]">
              {BANK_ROWS.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <dt className="text-xs uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                      {row.label}
                    </dt>
                    <dd className="mt-1 truncate font-[family-name:var(--font-mono)] text-[15px] text-white">
                      {row.value}
                    </dd>
                  </div>
                  {row.copy && <CopyButton value={row.value} label={row.label} />}
                </div>
              ))}
            </dl>

            <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
              Put your name and WhatsApp number in the reference so we can match
              the payment to you quickly.
            </p>
          </div>

          {/* upload form */}
          <div className="t-enter" style={{ ["--i" as string]: 2 }}>
            <PaymentForm currency={EVENT.currency} priceCents={EVENT.ticketPriceCents} />
          </div>
        </section>

        {/* ----------------------------------------------------------- steps */}
        <section className="mt-24">
          <h2 className="text-center text-3xl">How it works</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="t-enter t-lift rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 hover:border-white/20"
                style={{ ["--i" as string]: i + 1 }}
              >
                <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--accent)]">
                  {s.n}
                </span>
                <h3 className="mt-3 text-lg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
          <span>{EVENT.name} · {EVENT.date}</span>
          <span>Tickets are non-transferable once scanned.</span>
        </div>
      </footer>
    </div>
  );
}
