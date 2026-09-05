"use client";

import * as React from "react";
import { Check, Link2, Loader2, Send, Share2 } from "lucide-react";
import { markTicketSharedAction, nameTicketAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ShareTicket = {
  id: string;
  code: string;
  seq: number;
  shareToken: string;
  assignedName: string | null;
  status: "valid" | "used" | "void";
  shared: boolean;
};

type Props = {
  orderToken: string;
  tickets: ShareTicket[];
  baseUrl: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
};

/**
 * One ticket, one send.
 *
 * Sending the whole order as a single link means every recipient can see (and
 * use) everyone else's QR, and nobody can tell which one is theirs. So each
 * ticket gets its own link and its own send button, and the buyer can label
 * who it's for and see what they've already sent.
 */
export function TicketDistributor({
  orderToken,
  tickets,
  baseUrl,
  eventName,
  eventDate,
  eventTime,
  venue,
}: Props) {
  const [rows, setRows] = React.useState(tickets);
  const sentCount = rows.filter((t) => t.shared).length;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="t-fact text-[10px] text-[var(--muted-foreground)]">
          Send each ticket to whoever it&apos;s for
        </p>
        <p className="t-fact text-[10px] text-[var(--muted-foreground)]">
          <span className="text-[var(--gold)]">{sentCount}</span> of {rows.length} sent
        </p>
      </div>

      <ul className="mt-4 grid gap-3">
        {rows.map((t, i) => (
          <TicketRow
            key={t.id}
            ticket={t}
            index={i}
            total={rows.length}
            orderToken={orderToken}
            baseUrl={baseUrl}
            eventName={eventName}
            eventDate={eventDate}
            eventTime={eventTime}
            venue={venue}
            onChange={(next) =>
              setRows((prev) => prev.map((r) => (r.id === next.id ? next : r)))
            }
          />
        ))}
      </ul>
    </div>
  );
}

function TicketRow({
  ticket,
  index,
  total,
  orderToken,
  baseUrl,
  eventName,
  eventDate,
  eventTime,
  venue,
  onChange,
}: {
  ticket: ShareTicket;
  index: number;
  total: number;
  orderToken: string;
  baseUrl: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  onChange: (t: ShareTicket) => void;
}) {
  const [name, setName] = React.useState(ticket.assignedName ?? "");
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [canShareFiles, setCanShareFiles] = React.useState(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const link = `${baseUrl}/t/${ticket.shareToken}`;
  const used = ticket.status === "used";

  React.useEffect(() => {
    try {
      const probe = new File([new Blob(["x"])], "p.png", { type: "image/png" });
      setCanShareFiles(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanShareFiles(false);
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const message = [
    `🎟️ Your ticket for *${eventName}*`,
    "",
    name.trim() ? `For: ${name.trim()}` : null,
    `Ticket ${ticket.seq} of ${total} · ${ticket.code}`,
    "",
    "Open it here:",
    link,
    "",
    `📅 ${eventDate} · ${eventTime}`,
    `📍 ${venue}`,
    "",
    "Show the QR at the door. It admits one person and works once.",
  ]
    .filter((l) => l !== null)
    .join("\n");

  /** Debounced so typing a name doesn't fire a request per keystroke. */
  function rename(value: string) {
    setName(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void nameTicketAction(orderToken, ticket.id, value);
      onChange({ ...ticket, assignedName: value.trim() || null });
    }, 700);
  }

  async function markSent() {
    if (ticket.shared) return;
    onChange({ ...ticket, shared: true });
    await markTicketSharedAction(orderToken, ticket.id);
  }

  /** Share the QR image itself where the phone allows it, else the link. */
  async function send() {
    setBusy(true);
    try {
      if (canShareFiles) {
        const blob = await (await fetch(`/api/qr/t/${ticket.shareToken}`)).blob();
        const file = new File([blob], `${ticket.code}.png`, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text: message });
          await markSent();
          return;
        }
      }
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener"
      );
      await markSent();
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        console.error(err);
      }
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    void markSent();
  }

  return (
    <li
      className={cn(
        "t-enter t-frame rounded-2xl p-4",
        used && "opacity-60"
      )}
      style={{ ["--i" as string]: index }}
    >
      <div className="flex items-start gap-4">
        <a
          href={`/t/${ticket.shareToken}`}
          target="_blank"
          rel="noreferrer"
          className="relative shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr/t/${ticket.shareToken}`}
            alt={`QR for ticket ${ticket.code}`}
            width={84}
            height={84}
            className="size-21 rounded-lg bg-white p-1.5"
            style={{ width: 84, height: 84 }}
          />
          {used && (
            <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/75">
              <span className="t-fact rotate-[-8deg] text-[10px] font-bold text-white/85">
                USED
              </span>
            </span>
          )}
        </a>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="t-fact text-[10px] text-[var(--muted-foreground)]">
              Ticket {ticket.seq} of {total}
            </span>
            {used ? (
              <Badge>Scanned in</Badge>
            ) : ticket.shared ? (
              <Badge variant="approved">Sent</Badge>
            ) : null}
          </div>

          <p className="mt-1 truncate font-[family-name:var(--font-mono)] text-sm text-white">
            {ticket.code}
          </p>

          <Input
            value={name}
            onChange={(e) => rename(e.target.value)}
            placeholder="Who's this for?"
            aria-label={`Who is ticket ${ticket.seq} for`}
            className="mt-2.5 h-9 text-sm"
          />
        </div>
      </div>

      {!used && (
        <div className="mt-3 flex gap-2">
          <Button
            onClick={send}
            disabled={busy}
            variant={ticket.shared ? "subtle" : "accent"}
            size="sm"
            className="flex-1"
          >
            {busy ? (
              <Loader2 className="animate-spin" />
            ) : canShareFiles ? (
              <Share2 />
            ) : (
              <Send />
            )}
            {ticket.shared ? "Send again" : "Send ticket"}
          </Button>

          <Button
            onClick={copyLink}
            variant="outline"
            size="sm"
            aria-label="Copy this ticket's link"
          >
            <span className="t-icon-swap size-4">
              <Link2 className="size-4" data-state={copied ? "hidden" : "shown"} />
              <Check className="size-4" data-state={copied ? "shown" : "hidden"} />
            </span>
            {copied ? "Copied" : "Link"}
          </Button>
        </div>
      )}
    </li>
  );
}
