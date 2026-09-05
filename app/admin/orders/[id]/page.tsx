import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getOrder, ticketsForOrder } from "@/lib/db";
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
  await requireAdmin(`/admin/orders/${id}`);

  const order = getOrder(id);
  if (!order) notFound();

  const tickets = ticketsForOrder(id);
  const approved = order.status === "approved" && tickets.length > 0;
  const message = approved ? approvalMessage(order, tickets) : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors duration-[var(--duration-quick)] hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back to queue
      </Link>

      <ReviewPanel
        order={order}
        tickets={tickets}
        initialMessage={message}
        initialWhatsapp={
          message ? whatsappLink(order.buyer_whatsapp, message) : null
        }
        currency={EVENT.currency}
        priceCents={EVENT.ticketPriceCents}
      />
    </main>
  );
}
