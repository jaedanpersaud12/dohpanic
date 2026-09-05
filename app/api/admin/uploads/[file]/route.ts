import fs from "node:fs/promises";
import path from "node:path";
import { guardApi } from "@/lib/auth";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".gif": "image/gif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const denied = await guardApi();
  if (denied) return denied;

  const { file } = await params;
  // Collapse any traversal attempt down to a bare filename before touching disk.
  const safe = path.basename(file);
  const ext = path.extname(safe).toLowerCase();
  if (!TYPES[ext]) return new Response("Not found", { status: 404 });

  try {
    const bytes = await fs.readFile(path.join(process.cwd(), "uploads", safe));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": TYPES[ext],
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
