"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Icon swap transition (transitions.dev): the two icons share one grid cell
 * and cross-fade with a scale + blur over 250ms. Nothing reflows, so the
 * button never jumps while the label changes.
 */
export function CopyButton({
  value,
  label,
  className,
  variant = "icon",
}: {
  value: string;
  label?: string;
  className?: string;
  variant?: "icon" | "wide";
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : `Copy ${label ?? "to clipboard"}`}
      className={cn(
        "t-press inline-flex items-center justify-center gap-2 rounded-full border border-[var(--input)] text-[var(--muted-foreground)] hover:border-white/30 hover:text-white",
        variant === "icon" ? "size-9 shrink-0" : "h-11 px-5 text-sm font-medium",
        copied && "border-[var(--success)]/50 text-[var(--success)]",
        className
      )}
    >
      <span className="t-icon-swap size-4">
        <Copy className="size-4" data-state={copied ? "hidden" : "shown"} />
        <Check className="size-4" data-state={copied ? "shown" : "hidden"} />
      </span>
      {variant === "wide" && (
        <span className="t-icon-swap">
          <span data-state={copied ? "hidden" : "shown"}>{label ?? "Copy"}</span>
          <span data-state={copied ? "shown" : "hidden"}>Copied</span>
        </span>
      )}
    </button>
  );
}
