"use client";

import * as React from "react";
import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The poster is deliberately tall, so buying stays one tap away from anywhere
 * on the page. It steps aside once the form is actually on screen — otherwise
 * it would sit on top of the submit button.
 *
 * Deliberately a scroll/resize check rather than an IntersectionObserver:
 * observers are tied to rendering and go quiet in backgrounded or non-
 * compositing tabs, which also makes the behaviour untestable in headless
 * environments. One passive listener and a rect read is cheap and predictable.
 */
export function BuyCta({ label }: { label: string }) {
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    const update = () => {
      const target = document.querySelector("#buy");
      if (!target) return;
      const r = target.getBoundingClientRect();
      const h = window.innerHeight;
      // Hide once a meaningful slice of the form sits in the lower viewport.
      setHidden(r.top < h * 0.8 && r.bottom > h * 0.1);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <a
      href="#buy"
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      className={cn(
        "fixed inset-x-0 bottom-5 z-50 mx-auto flex w-fit items-center gap-2.5 rounded-full",
        "bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[var(--accent-foreground)]",
        "shadow-[0_10px_40px_-8px_rgba(240,180,60,0.6)] hover:brightness-110",
        "transition-[opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]",
        hidden
          ? "pointer-events-none translate-y-4 opacity-0"
          : "translate-y-0 opacity-100"
      )}
    >
      <Ticket className="size-4" />
      {label}
    </a>
  );
}
