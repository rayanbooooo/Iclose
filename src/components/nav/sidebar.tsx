"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  CandlestickChart,
  NotebookText,
  BarChart3,
  Settings,
  Newspaper,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chart", label: "Chart", icon: CandlestickChart },
  { href: "/journal", label: "Journal", icon: NotebookText },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-wide text-sidebar-foreground">
          <span className="relative inline-flex size-1.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-sidebar-primary/60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-sidebar-primary" />
          </span>
          MNQ<span className="text-sidebar-primary">.</span>Dashboard
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-sidebar-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative size-4" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-sidebar-foreground/50">MNQ · 15m</div>
    </aside>
  );
}
