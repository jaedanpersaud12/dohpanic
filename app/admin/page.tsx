import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { counts, listOrders, ms, type OrderStatus } from "@/lib/db";
import { money, ticketsFor } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";

const FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;

export const dynamic = "force-dynamic";

export default async function AdminQueue({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = (FILTERS.find((f) => f.key === status)?.key ?? "pending") as
    | OrderStatus
    | "all";

  const [orders, c] = await Promise.all([
    listOrders(filter === "all" ? undefined : filter),
    counts(),
  ]);

  const stats = [
    { label: "Awaiting review", value: c.pending, tone: "warning" },
    { label: "Tickets issued", value: c.valid + c.used, tone: "default" },
    { label: "Scanned in", value: c.used, tone: "success" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="t-enter t-gold text-3xl">Payment queue</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="t-enter t-frame rounded-2xl p-5"
            style={{ ["--i" as string]: i + 1 }}
          >
            <p className="t-fact text-[10px] text-[var(--muted-foreground)]">
              {s.label}
            </p>
            <p
              className={cn(
                "t-number-pop t-fact mt-2 text-4xl font-bold",
                s.tone === "warning" && s.value > 0
                  ? "text-[var(--gold)]"
                  : s.tone === "success"
                    ? "text-[var(--success)]"
                    : "text-white"
              )}
              style={{ animationDelay: `${(i + 1) * 60}ms` }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <nav className="mt-8 flex gap-1 overflow-x-auto rounded-full border border-[var(--border)] bg-[var(--card)] p-1">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          const n =
            f.key === "all" ? c.pending + c.approved + c.rejected : c[f.key];
          return (
            <Link
              key={f.key}
              href={`/admin?status=${f.key}`}
              className={cn(
                "t-fact inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs",
                "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]",
                active
                  ? "bg-[var(--gold)] text-[var(--accent-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--gold)]"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px]",
                  active ? "bg-black/15" : "bg-white/5"
                )}
              >
                {n}
              </span>
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <div className="t-pop-in mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--border)] px-6 py-20 text-center">
          <Inbox className="size-7 text-[var(--muted-foreground)]" />
          <p className="mt-4 text-lg text-white">Nothing here</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {filter === "pending"
              ? "Every payment has been dealt with."
              : `No ${filter} orders yet.`}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {orders.map((o, i) => {
            const shown = o.approvedCents ?? o.claimedCents;
            const n = ticketsFor(shown).count;
            return (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="t-enter t-lift t-frame group flex items-center gap-4 rounded-2xl p-4 sm:p-5"
                  style={{ ["--i" as string]: Math.min(i + 1, 8) }}
                >
                  {o.screenshotKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/admin/screenshot/${o.id}`}
                      alt=""
                      loading="lazy"
                      className="size-14 shrink-0 rounded-xl border border-[var(--border)] bg-black object-cover"
                    />
                  ) : (
                    <div className="size-14 shrink-0 rounded-xl border border-dashed border-[var(--border)]" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="t-fact truncate text-white">{o.buyerName}</p>
                      <Badge variant={o.status as "pending" | "approved" | "rejected"}>
                        {o.status}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-[var(--muted-foreground)]">
                      {o.buyerWhatsapp} · {timeAgo(ms(o.createdAt))}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-[family-name:var(--font-mono)] text-lg text-[var(--gold)]">
                      {money(shown)}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {n} ticket{n === 1 ? "" : "s"}
                      {o.status === "pending" && " claimed"}
                    </p>
                  </div>

                  <ChevronRight className="size-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] group-hover:translate-x-0.5 group-hover:text-[var(--gold)]" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
