"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Inbox, QrCode } from "lucide-react";
import { EVENT } from "@/lib/config";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Queue", icon: Inbox },
  { href: "/admin/scan", label: "Scan", icon: QrCode },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/admin" className="t-fact t-gold font-semibold">
          {EVENT.theme}
          <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
            admin
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] p-1">
          {TABS.map((tab) => {
            const active =
              tab.href === "/admin"
                ? pathname === "/admin" || pathname.startsWith("/admin/orders")
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "t-fact inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm",
                  "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]",
                  active
                    ? "bg-[var(--gold)] text-[var(--accent-foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--gold)]"
                )}
              >
                <tab.icon className="size-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <UserButton
          appearance={{
            elements: { userButtonAvatarBox: "size-9" },
          }}
        />
      </div>
    </header>
  );
}
