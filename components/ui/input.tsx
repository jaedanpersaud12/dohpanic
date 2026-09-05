import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl border border-[var(--input)] bg-black/40 px-4 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] " +
  "transition-[border-color,background-color,box-shadow] duration-[var(--duration-quick)] ease-[var(--ease-smooth-out)] " +
  "hover:border-white/30 focus:border-[var(--accent)] focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 " +
  "disabled:opacity-40";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(base, "h-12 text-[15px]", className)} {...props} />
  )
);
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "min-h-24 py-3 text-[15px] leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "mb-2 block text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Input, Textarea, Label };
