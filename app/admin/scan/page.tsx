import { Suspense } from "react";
import { counts } from "@/lib/db";
import { Scanner } from "@/components/scanner";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const c = await counts();

  return (
    <main>
      <div className="mx-auto flex max-w-lg items-baseline justify-between px-4 pt-8 sm:px-6">
        <h1 className="t-gold text-3xl">Door</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          <span className="font-[family-name:var(--font-mono)] text-[var(--gold)]">{c.used}</span>
          {" in · "}
          <span className="font-[family-name:var(--font-mono)] text-white">{c.valid}</span>
          {" still out"}
        </p>
      </div>
      <Suspense fallback={null}>
        <Scanner />
      </Suspense>
    </main>
  );
}
