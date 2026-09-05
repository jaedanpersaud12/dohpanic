import fs from "node:fs/promises";
import path from "node:path";
import { randomId } from "@/lib/codes";
import { ticketsFor } from "@/lib/config";
import { createOrder } from "@/lib/service";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/gif": ".gif",
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const name = String(form.get("name") ?? "").trim();
    const whatsapp = String(form.get("whatsapp") ?? "").trim();
    const note = String(form.get("note") ?? "").trim();
    const amountRaw = String(form.get("amount") ?? "").replace(/[^\d.]/g, "");
    const file = form.get("screenshot");

    if (name.length < 2) {
      return Response.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (whatsapp.replace(/\D/g, "").length < 9) {
      return Response.json({ error: "That WhatsApp number doesn't look right." }, { status: 400 });
    }

    const claimedCents = Math.round((parseFloat(amountRaw) || 0) * 100);
    if (claimedCents <= 0) {
      return Response.json({ error: "Enter the amount you transferred." }, { status: 400 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "Attach the screenshot of your transfer." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: "That image is over 8MB." }, { status: 400 });
    }
    // Trust the bytes, not the name the browser sent.
    const ext = EXT[file.type];
    if (!ext) {
      return Response.json({ error: "Upload a PNG, JPG or WebP image." }, { status: 400 });
    }

    const filename = `${randomId("shot")}${ext}`;
    const dir = path.join(process.cwd(), "uploads");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, filename),
      Buffer.from(await file.arrayBuffer())
    );

    const order = createOrder({
      name,
      whatsapp,
      note,
      claimedCents,
      screenshot: filename,
    });

    return Response.json({
      ok: true,
      token: order.token,
      tickets: ticketsFor(claimedCents).count,
    });
  } catch (err) {
    console.error("[orders] ", err);
    return Response.json(
      { error: "We couldn't save that. Try again in a moment." },
      { status: 500 }
    );
  }
}
