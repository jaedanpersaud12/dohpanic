import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Hourglass, XCircle } from "lucide-react";
import { getOrderByToken, ticketsForOrder } from "@/lib/db";
import { EVENT, money } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderStatus({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = getOrderByToken(token);
  if (!order) notFound();

  const tickets = ticketsForOrder(order.id);

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        <div className="t-drift absolute left-1/2 top-[-260px] size-[560px] -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-[0.12] blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-2xl px-5 py-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.02em]"
        >
          {EVENT.name}
        </Link>

        {/* --------------------------------------------------------- pending */}
        {order.status === "pending" && (
          <div className="t-pop-in mt-10 flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center">
            <span className="grid size-16 place-items-center rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10">
              <Hourglass className="size-7 text-[var(--warning)]" />
            </span>
            <h1 className="mt-6 text-3xl">Checking your transfer</h1>
            <p className="t-shimmer mt-3 text-sm font-medium">
              Matching {money(order.claimed_cents)} against the account…
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
              Every payment is confirmed by a person, so this can take a little
              while. Your codes will arrive on WhatsApp at {order.buyer_whatsapp},
              and appear on this page.
            </p>
          </div>
        )}

        {/* -------------------------------------------------------- rejected */}
        {order.status === "rejected" && (
          <div className="t-pop-in mt-10 flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center">
            <span className="grid size-16 place-items-center rounded-full border border-[var(--destructive)]/30 bg-[var(--destructive)]/10">
              <XCircle className="size-7 text-[var(--destructive)]" />
            </span>
            <h1 className="mt-6 text-3xl">We couldn&apos;t confirm this</h1>
            {order.reject_reason && (
              <p className="mt-3 text-sm text-[var(--destructive)]">
                {order.reject_reason}
              </p>
            )}
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
              Message us on WhatsApp and we&apos;ll sort it out.
            </p>
          </div>
        )}

        {/* -------------------------------------------------------- approved */}
        {order.status === "approved" && (
          <>
            <header className="mt-10 text-center">
              <Badge variant="approved">Paid · {money(order.approved_cents ?? 0)}</Badge>
              <h1 className="mt-5 text-[clamp(2rem,7vw,3rem)] leading-[1]">
                {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
              </h1>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                {order.buyer_name}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--muted-foreground)]">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {EVENT.date}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4" />
                  Doors {EVENT.doorsOpen}
                </span>
              </div>
            </header>

            <ul className="mt-10 grid gap-5">
              {tickets.map((t, i) => {
                const used = t.status === "used";
                return (
                  <li
                    key={t.id}
                    className={cn(
                      "t-enter overflow-hidden rounded-2xl border bg-[var(--card)]",
                      used
                        ? "border-[var(--border)] opacity-60"
                        : "border-[var(--border)]"
                    )}
                    style={{ ["--i" as string]: i }}
                  >
                    <div className="flex items-center justify-between border-b border-dashed border-[var(--border)] px-5 py-3">
                      <span className="text-xs uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                        Ticket {t.seq} of {tickets.length}
                      </span>
                      {used ? (
                        <Badge>Scanned in</Badge>
                      ) : (
                        <Badge variant="approved">Valid</Badge>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center">
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/qr/${order.token}?n=${t.seq}`}
                          alt={`QR code for ticket ${t.code}`}
                          width={176}
                          height={176}
                          className="size-44 rounded-xl bg-white p-2.5"
                        />
                        {used && (
                          <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/70">
                            <span className="rotate-[-8deg] rounded-lg border-2 border-white/70 px-3 py-1 text-sm font-bold uppercase tracking-wider text-white/80">
                              Used
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                          Code
                        </p>
                        <p className="mt-1.5 font-[family-name:var(--font-mono)] text-xl tracking-tight text-white">
                          {t.code}
                        </p>
                        <div className="mt-4 flex justify-center sm:justify-start">
                          <CopyButton value={t.code} label="code" variant="wide" />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-10 text-center text-xs leading-relaxed text-[var(--muted-foreground)]">
              Each code admits one person and stops working the moment it&apos;s
              scanned. Screenshot them for the door — signal is never guaranteed.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
