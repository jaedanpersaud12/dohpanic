import { redirect } from "next/navigation";

/**
 * Landing spot for a QR scanned with an ordinary phone camera.
 *
 * It never validates anything itself — it hands the payload to the staff
 * scanner. Middleware protects this route, so a guest who scans their own
 * ticket out of curiosity meets a Clerk sign-in, not an admission.
 */
export default async function VerifyRedirect({
  params,
}: {
  params: Promise<{ payload: string }>;
}) {
  const { payload } = await params;
  redirect(`/admin/scan?p=${encodeURIComponent(payload)}`);
}
