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
          /*
           * Clerk generates its whole grayscale from colorNeutral, which
           * defaults to black — on this near-black card that renders the
           * labels, borders and inputs invisible. Anchoring it to white and
           * pinning the foreground/input colours puts the widget back on the
           * ticket palette from globals.css.
           */
          colorNeutral: "#ffffff",
          colorBackground: "#120d09",
          colorForeground: "#ece4d8",
          colorMuted: "#17110b",
          colorMutedForeground: "#a3937c",
          colorPrimary: "#f0b43c",
          colorPrimaryForeground: "#0a0705",
          colorInput: "#17110b",
          colorInputForeground: "#ece4d8",
          colorBorder: "#3a2a14",
          colorRing: "#f0b43c",
          colorShadow: "#000000",
          colorModalBackdrop: "#0a0705",
          colorDanger: "#e02615",
          colorSuccess: "#35c46a",
          colorWarning: "#f0b43c",
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          fontFamilyMono: "var(--font-mono-code), ui-monospace, monospace",
          borderRadius: "0.75rem",
        },
        elements: {
          /*
           * Clerk paints colorBorder at ~11% alpha, which disappears on the
           * ink background. Pin the field chrome to the same solid border and
           * translucent-black fill the site's own <Input> uses.
           */
          card: { borderColor: "#3a2a14" },
          formFieldInput: {
            borderColor: "#4a3418",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          },
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
