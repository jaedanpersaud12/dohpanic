"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ImageUp, Loader2, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SuccessCheck } from "@/components/success-check";
import { cn } from "@/lib/utils";

type Props = { currency: string; priceCents: number };

const MAX_BYTES = 8 * 1024 * 1024;

export function PaymentForm({ currency, priceCents }: Props) {
  const [amount, setAmount] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ token: string; tickets: number } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const cents = Math.round((parseFloat(amount.replace(/[^\d.]/g, "")) || 0) * 100);
  const ticketCount = Math.floor(cents / priceCents);

  function accept(f: File | undefined | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("That file isn't an image.");
    if (f.size > MAX_BYTES) return setError("That image is over 8MB — try a screenshot instead of a photo.");
    setError(null);
    setFile(f);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const form = new FormData(e.currentTarget);
    if (file) form.set("screenshot", file);
    else return setError("Attach the screenshot of your transfer.");

    setBusy(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setDone({ token: data.token, tickets: data.tickets });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="t-pop-in t-frame t-frame-double flex flex-col items-center rounded-2xl p-10 text-center">
        <SuccessCheck />
        <h3 className="t-gold mt-6 text-2xl">Sent through</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
          We&apos;re checking the transfer against the account now. The moment it clears you&apos;ll
          get your {done.tickets > 0 ? `${done.tickets} ` : ""}code
          {done.tickets === 1 ? "" : "s"} on WhatsApp.
        </p>
        <Button asChild variant="accent" className="mt-7">
          <Link href={`/o/${done.token}`}>
            Track this order <ArrowRight />
          </Link>
        </Button>
        <p className="mt-4 text-xs text-[var(--muted-foreground)]">
          Bookmark that link — your tickets appear there too.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="t-frame t-frame-double rounded-2xl p-6 sm:p-8"
    >
      <h2 className="t-gold text-xl">Send your proof of payment</h2>
      <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
        Transfer first, then upload the screenshot here.
      </p>

      <div className="mt-7 grid gap-5">
        <div>
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" required placeholder="As it appears on the transfer" />
        </div>

        <div>
          <Label htmlFor="whatsapp">WhatsApp number</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            required
            inputMode="tel"
            placeholder="868 123 4567"
          />
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            This is where your ticket codes get sent.
          </p>
        </div>

        <div>
          <Label htmlFor="amount">Amount you sent</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-[family-name:var(--font-mono)] text-[var(--gold)]">
              {currency}
            </span>
            <Input
              id="amount"
              name="amount"
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="200"
              className="pl-14 font-[family-name:var(--font-mono)]"
            />
          </div>

          <div
            className="t-collapse mt-0"
            data-open={ticketCount > 0 ? "true" : "false"}
          >
            <div>
              <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-[var(--gold)]/35 bg-[var(--gold)]/10 px-4 py-3">
                <Ticket className="size-4 shrink-0 text-[var(--gold)]" />
                <p className="text-sm text-[var(--foreground)]">
                  That&apos;s{" "}
                  <span
                    key={ticketCount}
                    className="t-number-pop inline-block font-semibold text-[var(--gold)]"
                  >
                    {ticketCount}
                  </span>{" "}
                  ticket{ticketCount === 1 ? "" : "s"}
                  {cents % priceCents > 0 && (
                    <span className="text-[var(--muted-foreground)]">
                      {" "}
                      · {currency}
                      {((cents % priceCents) / 100).toFixed(2)} left over
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="screenshot">Screenshot of the transfer</Label>
          <input
            ref={inputRef}
            id="screenshot"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => accept(e.target.files?.[0])}
          />

          {preview ? (
            <div className="t-pop-in relative overflow-hidden rounded-xl border border-[var(--input)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Your transfer screenshot" className="max-h-72 w-full object-contain bg-black/50" />
              <button
                type="button"
                onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
                aria-label="Remove screenshot"
                className="t-press absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files?.[0]); }}
              className={cn(
                "flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center",
                "transition-[border-color,background-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]",
                dragging
                  ? "scale-[1.01] border-[var(--gold)] bg-[var(--gold)]/10"
                  : "border-[var(--input)] hover:border-[var(--gold)]/60 hover:bg-[var(--gold)]/[0.05]"
              )}
            >
              <ImageUp className={cn("size-6 transition-colors", dragging ? "text-[var(--gold)]" : "text-[var(--muted-foreground)]")} />
              <span className="text-sm font-medium">Tap to attach, or drop it here</span>
              <span className="text-xs text-[var(--muted-foreground)]">PNG or JPG, up to 8MB</span>
            </button>
          )}
        </div>

        <div>
          <Label htmlFor="note">Anything we should know? (optional)</Label>
          <Textarea id="note" name="note" placeholder="e.g. 3 of these are for Anisa, Kavir and Shelly" />
        </div>
      </div>

      {error && (
        <p className="t-shake mt-5 rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
          {error}
        </p>
      )}

      <Button type="submit" variant="accent" size="lg" disabled={busy} className="mt-7 w-full">
        <span className="t-icon-swap size-5">
          <Ticket className="size-5" data-state={busy ? "hidden" : "shown"} />
          <Loader2 className="size-5 animate-spin" data-state={busy ? "shown" : "hidden"} />
        </span>
        {busy ? "Sending…" : "Submit proof of payment"}
      </Button>

      <p className="mt-4 text-center text-xs leading-relaxed text-[var(--muted-foreground)]">
        Every payment is checked against the account by hand before codes go out.
        All proceeds go towards the medical expenses.
      </p>
    </form>
  );
}
