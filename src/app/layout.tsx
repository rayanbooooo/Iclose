import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/nav/sidebar";
import { MovingBackground } from "@/components/moving-background";
import { MarketTicker } from "@/components/market-ticker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
