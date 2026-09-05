"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, QrCode, Inbox } from "lucide-react";
import { EVENT } from "@/lib/config";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Queue", icon: Inbox },
  { href: "/admin/scan", label: "Scan", icon: QrCode },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/admin"
          className="font-[family-name:var(--font-display)] font-bold tracking-[-0.02em]"
        >
          {EVENT.name}
          <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
            admin
          </span>
        </Link>

        {/* Sliding pill indicator follows the active tab */}
        <nav className="relative ml-auto flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] p-1">
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
                  "relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm",
                  "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]",
                  active
                    ? "bg-white text-black"
                    : "text-[var(--muted-foreground)] hover:text-white"
                )}
              >
                <tab.icon className="size-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={signOut}
          aria-label="Sign out"
          className="t-press grid size-10 shrink-0 place-items-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-white/30 hover:text-white"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
