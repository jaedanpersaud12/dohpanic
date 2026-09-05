import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { counts, listOrders, type OrderStatus } from "@/lib/db";
import { money, ticketsFor } from "@/lib/config";
import { timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  await requireAdmin("/admin");

  const { status } = await searchParams;
  const filter = (FILTERS.find((f) => f.key === status)?.key ?? "pending") as
    | OrderStatus
    | "all";

  const orders = listOrders(filter === "all" ? undefined : filter);
  const c = counts();

  const stats = [
    { label: "Awaiting review", value: c.pending, tone: "warning" },
    { label: "Tickets issued", value: c.valid + c.used, tone: "default" },
    { label: "Scanned in", value: c.used, tone: "success" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="t-enter text-3xl">Payment queue</h1>

      {/* ------------------------------------------------------------ stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="t-enter rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            style={{ ["--i" as string]: i + 1 }}
          >
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
              {s.label}
            </p>
            <p
              className={cn(
                "t-number-pop mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.03em]",
                s.tone === "warning" && s.value > 0 && "text-[var(--warning)]",
                s.tone === "success" && "text-[var(--success)]"
              )}
              style={{ animationDelay: `${(i + 1) * 60}ms` }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ----------------------------------------------------------- filter */}
      <nav className="mt-8 flex gap-1 overflow-x-auto rounded-full border border-[var(--border)] bg-[var(--card)] p-1">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          const n =
            f.key === "all"
              ? c.pending + c.approved + c.rejected
              : (c[f.key] ?? 0);
          return (
            <Link
              key={f.key}
              href={`/admin?status=${f.key}`}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm",
                "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]",
                active
                  ? "bg-white text-black"
                  : "text-[var(--muted-foreground)] hover:text-white"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                  active ? "bg-black/10" : "bg-white/5"
                )}
              >
                {n}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ----------------------------------------------------------- orders */}
      {orders.length === 0 ? (
        <div className="t-pop-in mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--border)] px-6 py-20 text-center">
          <Inbox className="size-7 text-[var(--muted-foreground)]" />
          <p className="mt-4 text-lg">Nothing here</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {filter === "pending"
              ? "Every payment has been dealt with."
              : `No ${filter} orders yet.`}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {orders.map((o, i) => {
            const shown = o.approved_cents ?? o.claimed_cents;
            return (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="t-enter t-lift group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-white/20 sm:p-5"
                  style={{ ["--i" as string]: Math.min(i + 1, 8) }}
                >
                  {o.screenshot ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/admin/uploads/${o.screenshot}`}
                      alt=""
                      className="size-14 shrink-0 rounded-xl border border-[var(--border)] bg-black object-cover"
                    />
                  ) : (
                    <div className="size-14 shrink-0 rounded-xl border border-dashed border-[var(--border)]" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-white">{o.buyer_name}</p>
                      <Badge variant={o.status as "pending" | "approved" | "rejected"}>
                        {o.status}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-[var(--muted-foreground)]">
                      {o.buyer_whatsapp} · {timeAgo(o.created_at)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-[family-name:var(--font-mono)] text-lg text-white">
                      {money(shown)}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {ticketsFor(shown).count} ticket
                      {ticketsFor(shown).count === 1 ? "" : "s"}
                      {o.status === "pending" && " claimed"}
                    </p>
                  </div>

                  <ChevronRight className="size-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] group-hover:translate-x-0.5 group-hover:text-white" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
