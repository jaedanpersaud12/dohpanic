import { EVENT } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * The "DOH PANIC" wordmark: gold line over flame line, skewed and outlined so
 * it reads as painted lettering rather than typed text. `size` is a plain
 * font-size string so a caller can drop it into a hero or a stub unchanged.
 */
export function Wordmark({
  className,
  size = "clamp(3.5rem,13vw,8rem)",
}: {
  className?: string;
  size?: string;
}) {
  const [first, ...rest] = EVENT.theme.split(" ");
  return (
    <span
      className={cn("t-brush block", className)}
      style={{ fontSize: size }}
      aria-label={EVENT.theme}
    >
      <span className="t-gold block">{first}</span>
      {rest.length > 0 && (
        <span className="t-flame-text block">{rest.join(" ")}</span>
      )}
    </span>
  );
}

/** The italic "Theme:" tag that sits above the wordmark on the printed ticket. */
export function ThemeTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "t-script text-[var(--gold-bright)]/80 text-2xl leading-none",
        className
      )}
    >
      Theme:
    </span>
  );
}

/** Gold awareness ribbon — flat line style, matching the rest of the icon set. */
export function RibbonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M12 13.5 7.5 22l3-1.6L12 23l1.5-2.6 3 1.6L12 13.5Z" />
      <path d="M12 14.5c3-2.4 4.5-5 4.5-7.6A4.5 4.5 0 0 0 12 2a4.5 4.5 0 0 0-4.5 4.9c0 2.6 1.5 5.2 4.5 7.6Z" />
    </svg>
  );
}

/** Heart cupped in two hands — the giving mark from the ticket's corners. */
export function GivingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M12 9.8 10.9 8.6a2 2 0 1 0-2.8 2.8L12 15.3l3.9-3.9a2 2 0 1 0-2.8-2.8L12 9.8Z" />
      <path d="M3 14v3a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-3" />
      <path d="M3 14a2 2 0 0 1 4 0v2" />
      <path d="M21 14a2 2 0 0 0-4 0v2" />
    </svg>
  );
}

/** Hula-hooping dancer, for the competition column. */
export function HoopIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 6.5v6" />
      <path d="M9 8.5 12 7l3 1.5" />
      <path d="m12 12.5-2.5 5M12 12.5l2.5 5" />
      <ellipse cx="12" cy="13" rx="8" ry="2.6" />
    </svg>
  );
}

/**
 * Ember specks drifting up behind the hero. Positions and timings are fixed so
 * the server and client render identically — no randomness, no hydration drift.
 */
const EMBERS = [
  { left: "8%", top: "62%", size: 3, delay: "0s", duration: "9s" },
  { left: "17%", top: "78%", size: 2, delay: "2.4s", duration: "11s" },
  { left: "29%", top: "55%", size: 4, delay: "1.1s", duration: "10s" },
  { left: "41%", top: "84%", size: 2, delay: "3.6s", duration: "12s" },
  { left: "56%", top: "60%", size: 3, delay: "0.7s", duration: "9.5s" },
  { left: "68%", top: "80%", size: 2, delay: "2.9s", duration: "11.5s" },
  { left: "79%", top: "58%", size: 4, delay: "1.8s", duration: "10.5s" },
  { left: "91%", top: "74%", size: 3, delay: "4.2s", duration: "13s" },
];

export function Embers() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="t-ember"
          style={{
            left: e.left,
            top: e.top,
            width: e.size,
            height: e.size,
            animationDelay: e.delay,
            animationDuration: e.duration,
          }}
        />
      ))}
    </div>
  );
}

/** The tear line between a ticket's body and its stub. */
export function Perforation({ className }: { className?: string }) {
  return <div aria-hidden className={cn("t-perforation", className)} />;
}
