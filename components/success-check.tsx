import { cn } from "@/lib/utils";

/**
 * Success check (transitions.dev): the disc pops in with a blur + rotate over
 * 500ms while the tick path draws itself, offset by one micro-step so the
 * stroke lands just after the disc settles.
 */
export function SuccessCheck({
  className,
  tone = "success",
}: {
  className?: string;
  tone?: "success" | "accent";
}) {
  const color = tone === "accent" ? "var(--accent)" : "var(--success)";
  return (
    <span
      className={cn("t-check-pop grid size-16 place-items-center rounded-full", className)}
      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 40%, transparent)` }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-8" aria-hidden>
        <path
          d="M5 12.5 10 17.5 19 7"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="t-draw"
          style={{ ["--len" as string]: 26 }}
        />
      </svg>
    </span>
  );
}
