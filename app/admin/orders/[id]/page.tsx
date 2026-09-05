import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrder, ms, ticketsForOrder } from "@/lib/db";
import { approvalMessage, whatsappLink } from "@/lib/whatsapp";
import { EVENT } from "@/lib/config";
import { ReviewPanel } from "@/components/review-panel";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await getOrder(id);
  if (!order) notFound();

  const tickets = await ticketsForOrder(id);
  const approved = order.status === "approved" && tickets.length > 0;
  const message = approved ? approvalMessage(order, tickets) : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/admin"
        className="t-fact inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)] transition-colors duration-[var(--duration-quick)] hover:text-[var(--gold)]"
      >
        <ArrowLeft className="size-4" />
        Back to queue
      </Link>

      <ReviewPanel
        order={{
          id: order.id,
          buyerName: order.buyerName,
          buyerWhatsapp: order.buyerWhatsapp,
          buyerNote: order.buyerNote,
          claimedCents: order.claimedCents,
          ocrCents: order.ocrCents,
          ocrRan: Boolean(order.ocrRanAt),
          approvedCents: order.approvedCents,
          hasScreenshot: Boolean(order.screenshotKey),
          status: order.status,
          rejectReason: order.rejectReason,
          createdAt: ms(order.createdAt),
        }}
        tickets={tickets.map((t) => ({
          id: t.id,
          code: t.code,
          seq: t.seq,
          status: t.status,
          usedAt: ms(t.usedAt),
        }))}
        initialMessage={message}
        initialWhatsapp={
          message ? whatsappLink(order.buyerWhatsapp, message) : null
        }
        rejectionWhatsapp={whatsappLink(
          order.buyerWhatsapp,
          `Hi ${order.buyerName.split(" ")[0]}, we couldn't confirm the transfer you sent through for ${EVENT.theme}.${order.rejectReason ? `\n\nReason: ${order.rejectReason}` : ""}\n\nReply here and we'll sort it out.`
        )}
        currency={EVENT.currency}
        priceCents={EVENT.ticketPriceCents}
      />
    </main>
  );
}
