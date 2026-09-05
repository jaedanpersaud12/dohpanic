import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BANK, EVENT } from "@/lib/config";
import { ReceiptMaker } from "@/components/receipt-maker";

export const dynamic = "force-dynamic";

export default function DevReceiptPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors duration-[var(--duration-quick)] hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back to the site
      </Link>

      <h1 className="mt-5 text-3xl">Test screenshot generator</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)]">
        Development only — this page does not exist in a production build.
        Download an image here, then upload it on the home page to walk through
        the whole flow.
      </p>

      <div className="mt-8">
        <ReceiptMaker
          currency={EVENT.currency}
          bank={{
            bank: BANK.bank,
            accountName: BANK.accountName,
            accountNumber: BANK.accountNumber,
            branchCode: BANK.branchCode,
          }}
        />
      </div>
    </main>
  );
}
