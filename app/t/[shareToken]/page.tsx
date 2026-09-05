import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { CAUSE, EVENT } from "@/lib/config";
import { getTicketByShareToken } from "@/lib/service";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { SaveTicketImage } from "@/components/save-ticket-image";
import { clockTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * One ticket, on its own page. This is what a guest receives when the buyer
 * forwards them their ticket — no sign-in, and no sight of anybody else's QR.
 */
export default async function TicketPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const found = await getTicketByShareToken(shareToken);
  if (!found || found.order.status !== "approved") notFound();

  const { ticket, order } = found;
  const used = ticket.status === "used";
  const voided = ticket.status === "void";

  return (
    <div className="relative min-h-dvh">
      <main className="relative mx-auto max-w-md px-5 py-10">
        <Link href="/" className="t-fact t-gold block text-center text-lg font-semibold">
          {EVENT.theme}
        </Link>

        <div className="t-pop-in t-frame t-frame-double mt-8 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="t-fact text-[10px] text-[var(--muted-foreground)]">
              {ticket.assignedName ? ticket.assignedName : "Admits one"}
            </span>
            {voided ? (
              <Badge variant="rejected">Cancelled</Badge>
            ) : used ? (
              <Badge>Scanned in</Badge>
            ) : (
              <Badge variant="approved">Valid</Badge>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="relative mx-auto w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr/t/${ticket.shareToken}`}
                alt={`QR code for ticket ${ticket.code}`}
                width={260}
                height={260}
                className="size-64 rounded-xl bg-white p-3"
              />
              {(used || voided) && (
                <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/75">
                  <span className="t-fact rotate-[-8deg] rounded-lg border-2 border-white/70 px-4 py-1.5 text-base font-bold text-white/85">
                    {voided ? "Cancelled" : "Used"}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 text-center">
              <p className="t-fact text-[10px] text-[var(--muted-foreground)]">Code</p>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-xl text-white">
                {ticket.code}
              </p>
              {used && ticket.usedAt && (
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Scanned in at {clockTime(ticket.usedAt.getTime())}
                </p>
              )}
            </div>

            {!used && !voided && (
              <div className="mt-6">
                <SaveTicketImage
                  src={`/api/qr/t/${ticket.shareToken}`}
                  filename={`${EVENT.theme.replace(/\s+/g, "-")}-${ticket.code}.png`}
                />
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-[var(--gold)]/30 px-6 py-5">
            <div className="grid gap-2.5 text-sm">
              <span className="t-fact flex items-center gap-2.5 text-xs text-white">
                <CalendarDays className="size-4 shrink-0 text-[var(--gold)]" />
                {EVENT.date}
              </span>
              <span className="t-fact flex items-center gap-2.5 text-xs text-white">
                <Clock className="size-4 shrink-0 text-[var(--gold)]" />
                {EVENT.timeRange}
              </span>
              <span className="t-fact flex items-center gap-2.5 text-xs text-white">
                <MapPin className="size-4 shrink-0 text-[var(--gold)]" />
                {EVENT.venue}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-[var(--muted-foreground)]">
          This ticket admits one person and stops working the moment it&apos;s
          scanned. Screenshot it for the door — signal is never guaranteed.
        </p>

        <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
          {CAUSE.kicker} {CAUSE.beneficiary}. Bought by {order.buyerName.split(" ")[0]}.
        </p>
      </main>
    </div>
  );
}
