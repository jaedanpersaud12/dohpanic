import QRCode from "qrcode";
import { getOrderByToken, ticketsForOrder } from "@/lib/db";
import { qrUrlFor } from "@/lib/codes";

export const runtime = "nodejs";

/**
 * GET /api/qr/{orderToken}?n={ticketNumber}
 *
 * QR images are addressed by the order's secret token plus the ticket number,
 * never by the ticket code itself — otherwise this endpoint would hand out a
 * valid signature for any code somebody managed to guess.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const n = Number(new URL(req.url).searchParams.get("n") ?? "1");

  const order = getOrderByToken(token);
  if (!order || order.status !== "approved") {
    return new Response("Not found", { status: 404 });
  }

  const ticket = ticketsForOrder(order.id).find((t) => t.seq === n);
  if (!ticket) return new Response("Not found", { status: 404 });

  const png = await QRCode.toBuffer(qrUrlFor(ticket.code), {
    type: "png",
    width: 720,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000ff", light: "#ffffffff" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
