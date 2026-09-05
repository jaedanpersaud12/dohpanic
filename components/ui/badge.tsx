import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em] [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-[var(--border)] bg-white/5 text-[var(--muted-foreground)]",
        pending: "border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]",
        approved: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
        rejected: "border-[var(--destructive)]/30 bg-[var(--destructive)]/10 text-[var(--destructive)]",
        accent: "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
