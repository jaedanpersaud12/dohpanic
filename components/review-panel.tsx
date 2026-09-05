"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  Check,
  ExternalLink,
  Loader2,
  MessageCircle,
  ScanText,
  Ticket as TicketIcon,
} from "lucide-react";
import {
  approveOrderAction,
  recordOcrAction,
  rejectOrderAction,
} from "@/app/actions";
import { guessAmountCents } from "@/lib/ocr";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { SuccessCheck } from "@/components/success-check";
import { cn, timeAgo } from "@/lib/utils";

type OrderView = {
  id: string;
  buyerName: string;
  buyerWhatsapp: string;
  buyerNote: string | null;
  claimedCents: number;
  ocrCents: number | null;
  ocrRan: boolean;
  approvedCents: number | null;
  hasScreenshot: boolean;
  status: "pending" | "approved" | "rejected";
  rejectReason: string | null;
  createdAt: number;
};

type TicketView = {
  id: string;
  code: string;
  seq: number;
  status: "valid" | "used" | "void";
  usedAt: number;
};

type Props = {
  order: OrderView;
  tickets: TicketView[];
  initialMessage: string | null;
  initialWhatsapp: string | null;
  rejectionWhatsapp: string;
  currency: string;
  priceCents: number;
};

export function ReviewPanel({
  order,
  tickets,
  initialMessage,
  initialWhatsapp,
  rejectionWhatsapp,
  currency,
  priceCents,
}: Props) {
  const router = useRouter();

  const [amount, setAmount] = React.useState(
    ((order.approvedCents ?? order.ocrCents ?? order.claimedCents) / 100).toFixed(2)
  );
  const [ocrCents, setOcrCents] = React.useState<number | null>(
    order.ocrRan ? order.ocrCents : null
  );
  const [ocrDone, setOcrDone] = React.useState(order.ocrRan);
  const [ocrBusy, setOcrBusy] = React.useState(false);
  const [ocrProgress, setOcrProgress] = React.useState(0);
  const [ocrError, setOcrError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<"approve" | "reject" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [result, setResult] = React.useState<{
    message: string;
    whatsapp: string;
    tickets: number;
  } | null>(
    initialMessage && initialWhatsapp
      ? { message: initialMessage, whatsapp: initialWhatsapp, tickets: tickets.length }
      : null
  );

  const cents = Math.round((parseFloat(amount.replace(/[^\d.]/g, "")) || 0) * 100);
  const count = Math.floor(cents / priceCents);
  const remainder = cents - count * priceCents;
  const settled = order.status !== "pending";

  /**
   * Tesseract runs here in the browser, not on the server: the wasm build plus
   * the English model is far too heavy for a serverless function. The number it
   * produces is only a suggestion — the amount below still has to be confirmed
   * by a person before anything is issued.
   */
  const runOcr = React.useCallback(async () => {
    setOcrBusy(true);
    setOcrError(null);
    setOcrProgress(0);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setOcrProgress(m.progress);
        },
      });
      try {
        const {
          data: { text },
        } = await worker.recognize(`/api/admin/screenshot/${order.id}`);
        const guess = guessAmountCents(text);
        setOcrCents(guess);
        setOcrDone(true);
        if (guess) setAmount((guess / 100).toFixed(2));
        await recordOcrAction(order.id, guess, text);
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      setOcrError(
        err instanceof Error ? err.message : "Couldn't read that image."
      );
    } finally {
      setOcrBusy(false);
    }
  }, [order.id]);

  // Read the screenshot once, the first time somebody opens a pending order.
  const ranOnce = React.useRef(false);
  React.useEffect(() => {
    if (ranOnce.current || settled || ocrDone || !order.hasScreenshot) return;
    ranOnce.current = true;
    void runOcr();
  }, [settled, ocrDone, order.hasScreenshot, runOcr]);

  async function approve() {
    setBusy("approve");
    setError(null);
    const res = await approveOrderAction(order.id, cents);
    if (res.ok) {
      setResult({ message: res.message, whatsapp: res.whatsapp, tickets: res.tickets });
      router.refresh();
    } else {
      setError(res.error);
    }
    setBusy(null);
  }

  async function reject() {
    setBusy("reject");
    setError(null);
    const res = await rejectOrderAction(order.id, reason);
    if (res.ok) {
      router.refresh();
      router.push("/admin");
    } else {
      setError(res.error);
      setBusy(null);
    }
  }

  const mismatch = ocrCents != null && ocrCents !== order.claimedCents;

  return (
    <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      {/* ------------------------------------------------------- screenshot */}
      <div className="t-enter lg:sticky lg:top-20">
        <div className="t-frame overflow-hidden rounded-2xl bg-black">
          {order.hasScreenshot ? (
            <a
              href={`/api/admin/screenshot/${order.id}`}
              target="_blank"
              rel="noreferrer"
              className="group relative block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/admin/screenshot/${order.id}`}
                alt="Proof of payment"
                className="max-h-[70vh] w-full object-contain"
              />
              <span className="t-fact absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[10px] text-white opacity-0 backdrop-blur transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100">
                <ExternalLink className="size-3" /> Full size
              </span>
            </a>
          ) : (
            <p className="p-16 text-center text-sm text-[var(--muted-foreground)]">
              No screenshot attached.
            </p>
          )}
        </div>

        {/* OCR readout */}
        <div className="t-frame mt-3 rounded-2xl p-4">
          <div className="flex items-center gap-2.5">
            <ScanText className="size-4 shrink-0 text-[var(--gold)]" />
            {ocrBusy ? (
              <span className="t-shimmer text-sm font-medium">
                Reading the screenshot
                {ocrProgress > 0 ? ` — ${Math.round(ocrProgress * 100)}%` : "…"}
              </span>
            ) : ocrDone ? (
              <span className="text-sm text-[var(--foreground)]">
                OCR reads{" "}
                <span className="font-[family-name:var(--font-mono)] text-[var(--gold)]">
                  {ocrCents != null
                    ? `${currency}${(ocrCents / 100).toFixed(2)}`
                    : "no amount"}
                </span>
              </span>
            ) : (
              <span className="text-sm text-[var(--muted-foreground)]">
                {ocrError ?? "Screenshot not read yet."}
              </span>
            )}
            {!ocrBusy && order.hasScreenshot && !settled && (
              <button
                onClick={runOcr}
                className="ml-auto shrink-0 text-xs text-[var(--muted-foreground)] underline-offset-4 transition-colors duration-[var(--duration-quick)] hover:text-[var(--gold)] hover:underline"
              >
                {ocrDone ? "Re-read" : "Read now"}
              </button>
            )}
          </div>

          <p className="mt-2.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
            A suggestion only — screenshots are trivial to edit. Confirm the money
            landed in the real account before approving.
          </p>

          {mismatch && (
            <p className="t-toast-in mt-3 flex items-start gap-2 rounded-xl border border-[var(--gold)]/35 bg-[var(--gold)]/10 px-3 py-2.5 text-xs text-[var(--gold)]">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              Buyer typed {currency}
              {(order.claimedCents / 100).toFixed(2)} but OCR read {currency}
              {(ocrCents! / 100).toFixed(2)}. Check carefully.
            </p>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------ panel */}
      <div className="t-enter" style={{ ["--i" as string]: 1 }}>
        <div className="t-frame t-frame-double rounded-2xl p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="t-gold t-fact truncate text-2xl font-bold">
                {order.buyerName}
              </h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {order.buyerWhatsapp} · submitted {timeAgo(order.createdAt)}
              </p>
            </div>
            <Badge variant={order.status as "pending" | "approved" | "rejected"}>
              {order.status}
            </Badge>
          </div>

          {order.buyerNote && (
            <p className="mt-4 rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-sm leading-relaxed text-[var(--foreground)]">
              {order.buyerNote}
            </p>
          )}

          {/* ------------------------------------------------ approved view */}
          {result ? (
            <div className="mt-7">
              <div className="flex flex-col items-center text-center">
                <SuccessCheck />
                <p className="mt-5 text-xl text-white">
                  <span className="t-number-pop inline-block font-bold text-[var(--success)]">
                    {result.tickets}
                  </span>{" "}
                  ticket{result.tickets === 1 ? "" : "s"} issued
                </p>
                <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                  Send this message to {order.buyerName.split(" ")[0]}.
                </p>
              </div>

              <Textarea
                readOnly
                value={result.message}
                className="mt-6 min-h-64 font-[family-name:var(--font-mono)] text-xs leading-relaxed"
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Button asChild variant="success" size="lg">
                  <a href={result.whatsapp} target="_blank" rel="noreferrer">
                    <MessageCircle /> Open in WhatsApp
                  </a>
                </Button>
                <CopyButton
                  value={result.message}
                  label="Copy message"
                  variant="wide"
                  className="h-13 justify-center text-base"
                />
              </div>

              {tickets.length > 0 && (
                <div className="mt-7">
                  <p className="t-fact text-[10px] text-[var(--muted-foreground)]">
                    Issued codes
                  </p>
                  <ul className="mt-3 grid gap-2">
                    {tickets.map((t, i) => (
                      <li
                        key={t.id}
                        className="t-enter flex items-center gap-3 rounded-xl border border-[var(--border)] bg-black/30 px-4 py-2.5"
                        style={{ ["--i" as string]: i }}
                      >
                        <TicketIcon className="size-4 shrink-0 text-[var(--gold)]" />
                        <span className="font-[family-name:var(--font-mono)] text-sm text-white">
                          {t.code}
                        </span>
                        <span
                          className={cn(
                            "ml-auto text-xs",
                            t.status === "used"
                              ? "text-[var(--muted-foreground)]"
                              : "text-[var(--success)]"
                          )}
                        >
                          {t.status === "used"
                            ? `scanned ${timeAgo(t.usedAt)}`
                            : "valid"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : order.status === "rejected" ? (
            /* ---------------------------------------------- rejected view */
            <div className="mt-7">
              <p className="rounded-xl border border-[var(--destructive)]/35 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
                Rejected{order.rejectReason ? `: ${order.rejectReason}` : "."}
              </p>
              <div className="mt-4">
                <Button asChild variant="subtle" className="w-full">
                  <a href={rejectionWhatsapp} target="_blank" rel="noreferrer">
                    <MessageCircle /> Tell them on WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            /* ----------------------------------------------- pending view */
            <div className="mt-7">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3">
                  <p className="t-fact text-[10px] text-[var(--muted-foreground)]">
                    Buyer says
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-lg text-white">
                    {currency}
                    {(order.claimedCents / 100).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3">
                  <p className="t-fact text-[10px] text-[var(--muted-foreground)]">
                    OCR reads
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-lg text-white">
                    {ocrBusy ? (
                      <span className="t-shimmer">·····</span>
                    ) : ocrCents != null ? (
                      `${currency}${(ocrCents / 100).toFixed(2)}`
                    ) : (
                      <span className="text-[var(--muted-foreground)]">—</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Label htmlFor="confirmed">Amount that actually landed</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-[family-name:var(--font-mono)] text-[var(--gold)]">
                    {currency}
                  </span>
                  <Input
                    id="confirmed"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-14 font-[family-name:var(--font-mono)] text-lg"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--gold)]/35 bg-[var(--gold)]/10 px-4 py-3.5">
                <span className="text-sm text-[var(--muted-foreground)]">Issues</span>
                <span className="text-right">
                  <span
                    key={count}
                    className="t-number-pop t-fact inline-block text-2xl font-bold text-[var(--gold)]"
                  >
                    {count}
                  </span>
                  <span className="ml-1.5 text-sm text-white">
                    ticket{count === 1 ? "" : "s"}
                  </span>
                  {remainder > 0 && (
                    <span className="block text-xs text-[var(--muted-foreground)]">
                      {currency}
                      {(remainder / 100).toFixed(2)} left over
                    </span>
                  )}
                </span>
              </div>

              {error && (
                <p className="t-shake mt-4 rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
                  {error}
                </p>
              )}

              <Button
                onClick={approve}
                variant="success"
                size="lg"
                disabled={busy !== null || count < 1}
                className="mt-5 w-full"
              >
                {busy === "approve" ? <Loader2 className="animate-spin" /> : <Check />}
                {busy === "approve"
                  ? "Issuing…"
                  : `Confirm & issue ${count} ticket${count === 1 ? "" : "s"}`}
              </Button>

              <button
                onClick={() => setRejectOpen((v) => !v)}
                className="mt-3 w-full text-center text-sm text-[var(--muted-foreground)] transition-colors duration-[var(--duration-quick)] hover:text-[var(--destructive)]"
              >
                Can&apos;t confirm this payment?
              </button>

              <div className="t-collapse" data-open={rejectOpen}>
                <div>
                  <div className="pt-4">
                    <Label htmlFor="reason">Why are you rejecting it?</Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Nothing arrived in the account"
                    />
                    <Button
                      onClick={reject}
                      variant="destructive"
                      disabled={busy !== null}
                      className="mt-3 w-full"
                    >
                      {busy === "reject" ? <Loader2 className="animate-spin" /> : <Ban />}
                      Reject this order
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
