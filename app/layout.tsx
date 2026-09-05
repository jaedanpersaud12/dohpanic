import type { Metadata } from "next";
import { Inter, Figtree, JetBrains_Mono } from "next/font/google";
import { EVENT } from "@/lib/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-code", display: "swap" });

export const metadata: Metadata = {
  title: `${EVENT.name} — Tickets`,
  description: EVENT.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${figtree.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh bg-[var(--background)] antialiased">
        {children}
      </body>
    </html>
  );
}
