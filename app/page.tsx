import Link from "next/link";
import { Headphones, Landmark, MapPin, Mic2, ShieldCheck } from "lucide-react";
import { BANK, CAUSE, EVENT, money } from "@/lib/config";
import {
  Embers,
  GivingIcon,
  HoopIcon,
  Perforation,
  RibbonIcon,
  ThemeTag,
  Wordmark,
} from "@/components/brand";
import { CopyButton } from "@/components/copy-button";
import { PaymentForm } from "@/components/payment-form";

const BANK_ROWS: { label: string; value: string; copy?: boolean }[] = [
  { label: "Account name", value: BANK.accountName, copy: true },
  { label: "Bank", value: BANK.bank },
  { label: "Account number", value: BANK.accountNumber, copy: true },
  { label: "Branch / transit", value: BANK.branchCode, copy: true },
  { label: "Account type", value: BANK.accountType },
  { label: "Reference", value: BANK.reference },
];

const STEPS = [
  {
    n: "01",
    title: "Transfer the amount",
    body: `Any multiple of ${money(EVENT.ticketPriceCents)}. Send ${money(
      EVENT.ticketPriceCents * 5
    )} and you get five tickets.`,
  },
  {
    n: "02",
    title: "Upload the screenshot",
    body: "We check it against the account by hand — usually within the hour.",
  },
  {
    n: "03",
    title: "Get your codes",
    body: "A WhatsApp with one QR per ticket. Show any of them at the door.",
  },
];

/** The four programme columns, each with the icon that stands for it. */
const PROGRAMME = [
  { role: "Venue", name: EVENT.venue, note: null, Icon: MapPin },
  { role: "Entertainment", name: "Chris Garcia", note: "The one and only", Icon: Mic2 },
  { role: "DJ", name: "Rene", note: null, Icon: Headphones },
  {
    role: "Hoola Hoop Competition",
    name: "Maggie",
    note: "Hosted by · The Dancing Queen",
    Icon: HoopIcon,
  },
];

export default function Home() {
  return (
    <div className="relative overflow-x-hidden">
      {/* --------------------------------------------------- stage lighting */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[1100px]">
        <div className="t-stage-glow absolute inset-0" />
        <Embers />
      </div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="t-fact t-gold text-lg font-semibold">{EVENT.theme}</span>
        <Link
          href="/admin"
          className="t-fact rounded-full px-4 py-2 text-xs text-[var(--muted-foreground)] transition-colors duration-[var(--duration-quick)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]"
        >
          Admin
        </Link>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-24">
        {/* ------------------------------------------------------------ hero */}
        <section className="pt-8 text-center sm:pt-12">
          <p
            className="t-rise t-fact text-xs text-[var(--foreground)]/80 sm:text-sm"
            style={{ ["--i" as string]: 0 }}
          >
            {EVENT.tagline}
          </p>

          {/* the cause, carried the way the printed ticket carries it */}
          <div className="t-rise mt-6" style={{ ["--i" as string]: 1 }}>
            <span className="t-banner px-5 py-1.5">
              <span className="t-fact block text-[11px] text-white sm:text-xs">
                {CAUSE.kicker}
              </span>
            </span>
          </div>

          <div
            className="t-rise mt-5 flex items-center justify-center gap-3"
            style={{ ["--i" as string]: 2 }}
          >
            <RibbonIcon className="size-8 text-[var(--gold)] sm:size-10" />
            <h1 className="t-gold t-fact text-[clamp(2.5rem,9vw,5.5rem)] font-bold leading-[0.95]">
              {CAUSE.beneficiary}
            </h1>
            <RibbonIcon className="size-8 text-[var(--gold)] sm:size-10" />
          </div>

          <div className="t-rise mt-4" style={{ ["--i" as string]: 3 }}>
            <span className="t-banner px-6 py-2">
              <span className="t-fact block text-sm text-white sm:text-base">
                {CAUSE.descriptor}
              </span>
            </span>
          </div>

          <p
            className="t-rise mx-auto mt-8 max-w-md text-[15px] leading-relaxed text-[var(--muted-foreground)]"
            style={{ ["--i" as string]: 4 }}
          >
            {CAUSE.blurb}
          </p>

          {/* live performance credit */}
          <div className="t-rise mt-14" style={{ ["--i" as string]: 5 }}>
            <p className="t-fact text-[11px] text-[var(--muted-foreground)]">
              Live performance by
            </p>
            <p className="t-fact mt-1 text-xs italic text-white">The one and only</p>
            <p className="t-brush t-flame-text mx-auto mt-2 w-fit text-[clamp(2.5rem,9vw,5rem)]">
              Chris Garcia
            </p>
          </div>

          {/* theme wordmark */}
          <div className="t-rise mt-16" style={{ ["--i" as string]: 6 }}>
            <ThemeTag className="mb-1 block" />
            <Wordmark className="mx-auto w-fit text-center" />
          </div>

          {/* date, in the gold circle badge from the ticket */}
          <div
            className="t-rise mt-14 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10"
            style={{ ["--i" as string]: 7 }}
          >
            <div className="grid size-44 shrink-0 place-items-center rounded-full border-2 border-[var(--gold)]/60 text-center">
              <div>
                <p className="t-fact text-sm text-white">Sunday</p>
                <p className="t-gold t-fact text-6xl font-bold leading-none">20th</p>
                <p className="t-fact mt-1 text-sm text-white">September</p>
                <p className="t-fact text-xs tracking-[0.35em] text-[var(--gold)]">2026</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 sm:items-start">
              <span className="t-banner px-5 py-2">
                <span className="t-fact block text-sm text-white">{EVENT.timeRange}</span>
              </span>
              <p className="t-fact flex items-center gap-2 text-lg text-white">
                <MapPin className="size-5 text-[var(--gold)]" />
                {EVENT.venue}
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- programme */}
        <section className="mt-20">
          <div className="t-frame t-dotted-x grid grid-cols-2 gap-y-8 rounded-2xl px-4 py-8 sm:px-6 lg:grid-cols-4">
            {PROGRAMME.map(({ role, name, note, Icon }, i) => (
              <div
                key={role}
                className="t-enter flex flex-col items-center px-3 text-center"
                style={{ ["--i" as string]: i + 1 }}
              >
                <p className="t-fact text-[10px] leading-tight text-[var(--muted-foreground)]">
                  {role}
                </p>
                {note && <p className="t-fact mt-2 text-[10px] text-white/70">{note}</p>}
                <p className="t-gold t-fact mt-2 text-2xl font-bold leading-tight">{name}</p>
                <Icon className="mt-3 size-6 text-[var(--gold)]/70" />
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------------- price */}
        <section className="mt-14 text-center">
          <div className="flex items-center justify-center gap-5">
            <GivingIcon className="hidden size-12 text-[var(--gold)] sm:block" />
            <span className="t-banner px-8 py-3 sm:px-14">
              <span className="t-fact block text-2xl text-white sm:text-4xl">
                Tickets:{" "}
                <span className="text-[var(--gold-bright)]">
                  {money(EVENT.ticketPriceCents)}
                </span>
              </span>
            </span>
            <GivingIcon className="hidden size-12 text-[var(--gold)] sm:block" />
          </div>

          <p className="t-fact mt-6 text-xs text-[var(--gold)] sm:text-sm">
            {EVENT.strapline}
          </p>
          <p className="t-script mt-3 text-2xl text-white/80">{EVENT.signoff}</p>
        </section>

        <Perforation className="mx-6 mt-16" />

        {/* --------------------------------------------------------- payment */}
        <section
          id="buy"
          className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-start"
        >
          {/* bank details */}
          <div
            className="t-enter t-frame t-frame-double rounded-2xl p-6 sm:p-8 lg:sticky lg:top-6"
            style={{ ["--i" as string]: 1 }}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full border border-[var(--gold)]/40 bg-black/50">
                <Landmark className="size-4 text-[var(--gold)]" />
              </span>
              <div>
                <h2 className="t-gold text-xl">Transfer to</h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Then upload your proof
                </p>
              </div>
            </div>

            <dl className="mt-7 divide-y divide-[var(--border)]">
              {BANK_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <div className="min-w-0">
                    <dt className="t-fact text-[10px] text-[var(--muted-foreground)]">
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

            <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-[var(--gold)]/25 bg-black/40 px-4 py-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
              Put your name and WhatsApp number in the reference so we can match the
              payment to you quickly. Every dollar goes towards {CAUSE.beneficiary}
              &apos;s medical expenses.
            </p>
          </div>

          {/* upload form */}
          <div className="t-enter" style={{ ["--i" as string]: 2 }}>
            <PaymentForm currency={EVENT.currency} priceCents={EVENT.ticketPriceCents} />
          </div>
        </section>

        {/* ----------------------------------------------------------- steps */}
        <section className="mt-24">
          <h2 className="t-gold text-center text-3xl">How it works</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="t-enter t-lift t-frame rounded-2xl p-6 hover:border-[var(--gold)]/70"
                style={{ ["--i" as string]: i + 1 }}
              >
                <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--flame-bright)]">
                  {s.n}
                </span>
                <h3 className="mt-3 text-lg text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
          <span className="t-fact">
            {EVENT.theme} · {EVENT.dateShort} · {EVENT.venue}
          </span>
          <span>Tickets are non-transferable once scanned.</span>
        </div>
      </footer>
    </div>
  );
}
