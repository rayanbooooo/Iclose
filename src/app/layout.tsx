import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Sidebar } from "@/components/nav/sidebar";
import { MovingBackground } from "@/components/moving-background";
import { MarketTicker } from "@/components/market-ticker";
import "./globals.css";

// Body workhorse — kept neutral on purpose.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Display face for headings and the hero balance — a technical, geometric
// character distinct from the generic default-Vercel-app look.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

// Every tabular-nums number in the app (prices, P&L, balances) renders in
// this — the "instrument readout" texture that ties back to the terminal
// aesthetic from the original reference.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MNQ Dashboard",
  description: "Personal MNQ trading dashboard and Topstep payout tracker",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <MovingBackground />
        <div className="relative flex min-h-screen flex-col">
          <MarketTicker />
          <div className="flex min-h-0 flex-1">
            <Sidebar />
            <main className="relative flex-1 min-w-0 overflow-x-hidden">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
