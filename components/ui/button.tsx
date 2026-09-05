import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "t-press inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black hover:bg-white/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.4)]",
        // Gold is a light surface: it takes the dark ink, never white.
        accent:
          "bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-110 shadow-[0_6px_24px_-8px_var(--accent)]",
        outline:
          "border border-[var(--input)] bg-transparent text-[var(--foreground)] hover:bg-white/5 hover:border-white/30",
        ghost: "text-[var(--muted-foreground)] hover:bg-white/5 hover:text-[var(--foreground)]",
        subtle: "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] hover:border-white/25",
        destructive: "bg-[var(--destructive)] text-white hover:brightness-110",
        success: "bg-[var(--success)] text-black hover:brightness-110",
      },
      size: {
        sm: "h-9 px-4 text-sm [&_svg]:size-4",
        default: "h-11 px-6 text-sm [&_svg]:size-4",
        lg: "h-13 px-8 text-base [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
