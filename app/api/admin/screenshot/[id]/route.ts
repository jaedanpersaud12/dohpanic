import { staffId } from "@/lib/auth";
import { getOrder } from "@/lib/db";
import { screenshotUrl } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Redirects a signed-in staff member to a short-lived presigned R2 link for
 * one order's screenshot. The bucket itself stays private and the link dies in
 * ten minutes, so a URL left in browser history is not a lasting leak.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await staffId())) return new Response("Not signed in", { status: 401 });

  const { id } = await params;
  const order = await getOrder(id);
  if (!order?.screenshotKey) return new Response("Not found", { status: 404 });

  const url = await screenshotUrl(order.screenshotKey);
  return Response.redirect(url, 307);
}
