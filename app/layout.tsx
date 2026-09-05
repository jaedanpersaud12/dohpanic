import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Anton, Caveat, Inter, JetBrains_Mono, Oswald } from "next/font/google";
import { CAUSE, EVENT } from "@/lib/config";
import "./globals.css";

/* Body copy — stays quiet so the three poster voices can be loud. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

/* Voice 1 — condensed caps for every hard fact. */
const oswald = Oswald({ subsets: ["latin"], variable: "--font-condensed", display: "swap" });

/* Voice 2 — the poster wordmark, skewed and outlined in CSS. */
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-brush",
  display: "swap",
});

/* Voice 3 — the light italic hand for connectors and the sign-off. */
const caveat = Caveat({ subsets: ["latin"], variable: "--font-script", display: "swap" });

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-code", display: "swap" });

export const metadata: Metadata = {
  title: `${EVENT.theme} — ${EVENT.tagline}`,
  description: `${EVENT.tagline}. ${EVENT.date}, ${EVENT.timeRange} at ${EVENT.venue}. ${CAUSE.kicker} ${CAUSE.beneficiary}.`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#f0b43c",
          colorBackground: "#120d09",
          borderRadius: "0.75rem",
        },
      }}
    >
      <html
        lang="en"
        className={`dark ${inter.variable} ${oswald.variable} ${anton.variable} ${caveat.variable} ${mono.variable}`}
      >
        <body className="min-h-dvh bg-[var(--background)] antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
