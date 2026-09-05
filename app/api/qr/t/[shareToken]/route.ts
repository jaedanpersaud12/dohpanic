import QRCode from "qrcode";
import { qrUrlFor } from "@/lib/codes";
import { getTicketByShareToken } from "@/lib/service";

export const runtime = "nodejs";

/**
 * GET /api/qr/t/{shareToken}
 *
 * The QR for exactly one ticket, addressed by that ticket's own public handle.
 * Whoever the buyer forwarded it to can load this; nobody can walk from it to
 * the rest of the order.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;
  const found = await getTicketByShareToken(shareToken);
  if (!found || found.order.status !== "approved") {
    return new Response("Not found", { status: 404 });
  }

  const png = await QRCode.toBuffer(qrUrlFor(found.ticket.code), {
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
      "Content-Disposition": `inline; filename="${found.ticket.code}.png"`,
    },
  });
}
