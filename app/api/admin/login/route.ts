import { cookies } from "next/headers";
import crypto from "node:crypto";
import { signSession } from "@/lib/codes";
import { ADMIN_COOKIE, SESSION_HOURS } from "@/lib/auth";

export const runtime = "nodejs";

/** Constant-time compare so the response time leaks nothing about the password. */
function matches(given: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return Response.json(
      { error: "ADMIN_PASSWORD isn't set on the server." },
      { status: 500 }
    );
  }

  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };

  if (!password || !matches(password, expected)) {
    // Slow the loop down a little; this endpoint is the only way in.
    await new Promise((r) => setTimeout(r, 600));
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }

  const expiresAt = Date.now() + SESSION_HOURS * 3600_000;
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, signSession(expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}
