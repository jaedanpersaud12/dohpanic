import { guardApi } from "@/lib/auth";
import { getOrder, ticketsForOrder } from "@/lib/db";
import { ApprovalError, approveOrder, rejectOrder, saveOcr } from "@/lib/service";
import { readScreenshot } from "@/lib/ocr";
import { approvalMessage, whatsappLink } from "@/lib/whatsapp";
import path from "node:path";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const denied = await guardApi();
  if (denied) return denied;

  const { id } = await params;
  const order = getOrder(id);
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    amount?: number;
    reason?: string;
  };

  /* ------------------------------------------------------------------ ocr */
  if (body.action === "ocr") {
    if (!order.screenshot) {
      return Response.json({ error: "No screenshot on this order." }, { status: 400 });
    }
    const result = await readScreenshot(
      path.join(process.cwd(), "uploads", order.screenshot)
    );
    if (!result.ok) {
      return Response.json(
        { ok: false, error: `OCR unavailable: ${result.error}` },
        { status: 200 }
      );
    }
    saveOcr(id, result.cents, result.text);
    return Response.json({ ok: true, cents: result.cents, text: result.text });
  }

  /* -------------------------------------------------------------- approve */
  if (body.action === "approve") {
    const cents = Math.round(Number(body.amount));
    if (!Number.isFinite(cents) || cents <= 0) {
      return Response.json({ error: "Enter the amount that actually landed." }, { status: 400 });
    }
    try {
      const tickets = approveOrder(id, cents);
      const fresh = getOrder(id)!;
      const message = approvalMessage(fresh, tickets);
      return Response.json({
        ok: true,
        tickets: tickets.length,
        message,
        whatsapp: whatsappLink(fresh.buyer_whatsapp, message),
      });
    } catch (err) {
      if (err instanceof ApprovalError) {
        return Response.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  }

  /* --------------------------------------------------------------- reject */
  if (body.action === "reject") {
    if (order.status === "approved") {
      return Response.json(
        { error: "This order already has tickets issued." },
        { status: 400 }
      );
    }
    rejectOrder(id, body.reason ?? "");
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action." }, { status: 400 });
}

export async function GET(_req: Request, { params }: Ctx) {
  const denied = await guardApi();
  if (denied) return denied;
  const { id } = await params;
  const order = getOrder(id);
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
  return Response.json({ order, tickets: ticketsForOrder(id) });
}
