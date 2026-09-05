import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "./codes";

export const ADMIN_COOKIE = "mummy_admin";
export const SESSION_HOURS = 12;

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySession(jar.get(ADMIN_COOKIE)?.value);
}

/** Use at the top of every admin page. Sends unauthenticated users to login. */
export async function requireAdmin(next?: string): Promise<void> {
  if (await isAdmin()) return;
  redirect(next ? `/admin/login?next=${encodeURIComponent(next)}` : "/admin/login");
}

/** Use at the top of every admin route handler. */
export async function guardApi(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return Response.json({ error: "Not signed in." }, { status: 401 });
}
