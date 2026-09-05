import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Hourglass, MapPin, XCircle } from "lucide-react";
import { getOrderByToken, ticketsForOrder } from "@/lib/db";
import { CAUSE, EVENT, baseUrl, money } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { TicketDistributor } from "@/components/ticket-distributor";
import {
  Embers,
  Perforation,
  RibbonIcon,
  ThemeTag,
  Wordmark,
} from "@/components/brand";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Stub numbering runs 0001, 0002, … the way the printed book does. */
function stubNo(seq: number): string {
  return String(seq).padStart(4, "0");
}

export default async function OrderStatus({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  const tickets = await ticketsForOrder(order.id);

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px]">
        <div className="t-stage-glow absolute inset-0" />
        <Embers />
      </div>

      <main className="relative mx-auto max-w-2xl px-5 py-10">
        <Link href="/" className="t-fact t-gold text-lg font-semibold">
          {EVENT.theme}
        </Link>

        {/* --------------------------------------------------------- pending */}
        {order.status === "pending" && (
          <div className="t-pop-in t-frame t-frame-double mt-10 flex flex-col items-center rounded-2xl px-6 py-16 text-center">
            <span className="grid size-16 place-items-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10">
              <Hourglass className="size-7 text-[var(--gold)]" />
            </span>
            <h1 className="t-gold mt-6 text-3xl">Checking your transfer</h1>
            <p className="t-shimmer mt-3 text-sm font-medium">
              Matching {money(order.claimedCents)} against the account…
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
              Every payment is confirmed by a person, so this can take a little
              while. Your codes will arrive on WhatsApp at {order.buyerWhatsapp},
              and appear on this page.
            </p>
          </div>
        )}

        {/* -------------------------------------------------------- rejected */}
        {order.status === "rejected" && (
          <div className="t-pop-in t-frame t-frame-double mt-10 flex flex-col items-center rounded-2xl px-6 py-16 text-center">
            <span className="grid size-16 place-items-center rounded-full border border-[var(--destructive)]/40 bg-[var(--destructive)]/10">
              <XCircle className="size-7 text-[var(--destructive)]" />
            </span>
            <h1 className="mt-6 text-3xl text-white">We couldn&apos;t confirm this</h1>
            {order.rejectReason && (
              <p className="mt-3 text-sm text-[var(--destructive)]">
                {order.rejectReason}
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
              <Badge variant="approved">Paid · {money(order.approvedCents ?? 0)}</Badge>

              <div className="mt-6">
                <ThemeTag />
                <Wordmark
                  className="mx-auto w-fit"
                  size="clamp(2.75rem,11vw,4.5rem)"
                />
              </div>

              <h1 className="t-fact t-gold mt-8 text-[clamp(1.75rem,6vw,2.5rem)] font-bold leading-none">
                {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
              </h1>
              <p className="t-fact mt-2 text-sm text-white">{order.buyerName}</p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--muted-foreground)]">
                <span className="t-fact inline-flex items-center gap-2 text-xs">
                  <CalendarDays className="size-4 text-[var(--gold)]" />
                  {EVENT.date}
                </span>
                <span className="t-fact inline-flex items-center gap-2 text-xs">
                  <Clock className="size-4 text-[var(--gold)]" />
                  {EVENT.timeRange}
                </span>
                <span className="t-fact inline-flex items-center gap-2 text-xs">
                  <MapPin className="size-4 text-[var(--gold)]" />
                  {EVENT.venue}
                </span>
              </div>
            </header>

            <div className="mt-10">
              <TicketDistributor
                orderToken={order.token}
                baseUrl={baseUrl()}
                eventName={EVENT.theme}
                eventDate={EVENT.date}
                eventTime={EVENT.timeRange}
                venue={EVENT.venue}
                tickets={tickets.map((t) => ({
                  id: t.id,
                  code: t.code,
                  seq: t.seq,
                  shareToken: t.shareToken ?? "",
                  assignedName: t.assignedName,
                  status: t.status,
                  shared: Boolean(t.sharedAt),
                }))}
              />
            </div>

            <p className="t-script mt-10 text-center text-2xl text-white/80">
              {EVENT.signoff}
            </p>
            <p className="mt-4 text-center text-xs leading-relaxed text-[var(--muted-foreground)]">
              Each code admits one person and stops working the moment it&apos;s
              scanned. Screenshot them for the door — signal is never guaranteed.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
