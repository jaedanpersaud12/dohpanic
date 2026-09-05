import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

/**
 * Landing spot for a QR scanned with an ordinary phone camera.
 * It never validates anything itself — it just hands the payload to the
 * admin scanner, which is behind the password. A guest who scans their own
 * ticket out of curiosity gets a login screen, not an admission.
 */
export default async function VerifyRedirect({
  params,
}: {
  params: Promise<{ payload: string }>;
}) {
  const { payload } = await params;
  const next = `/admin/scan?p=${encodeURIComponent(payload)}`;
  redirect(
    (await isAdmin()) ? next : `/admin/login?next=${encodeURIComponent(next)}`
  );
}
