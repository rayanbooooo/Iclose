"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  PlayCircle,
  PenSquare,
  NotebookText,
  ClipboardList,
  Activity,
  CandlestickChart,
  BarChart3,
  Newspaper,
  Globe,
  Cpu,
  Award,
  Calculator,
  FileText,
  Music,
  MessageCircle,
  Settings,
  HelpCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/session", label: "Start Session", icon: PlayCircle },
      { href: "/log-trade", label: "Log Trade", icon: PenSquare },
      { href: "/journal", label: "Journal", icon: NotebookText },
      { href: "/notes", label: "Notes", icon: ClipboardList },
    ],
  },
  {
    label: "Analyze",
    items: [
      { href: "/pattern-intel", label: "Pattern Intel", icon: Activity },
      { href: "/chart", label: "Chart", icon: CandlestickChart },
      { href: "/stats", label: "Stats", icon: BarChart3 },
      { href: "/news", label: "News", icon: Newspaper },
      { href: "/global-intelligence", label: "Global Intelligence", icon: Globe },
    ],
  },
  {
    label: "Grow",
    items: [
      { href: "/coach", label: "AI Coach", icon: Cpu },
      { href: "/ranks", label: "Ranks", icon: Award },
      { href: "/risk-calculator", label: "Risk Calculator", icon: Calculator },
      { href: "/tax-report", label: "Tax Report", icon: FileText },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/focus", label: "Focus Music", icon: Music },
      { href: "/clan", label: "The Clan", icon: MessageCircle },
    ],
  },
] as const;

const BOTTOM_ITEMS = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Get Help", icon: HelpCircle },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
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
      <Icon className="relative size-4 shrink-0" />
      <span className="relative truncate">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-wide text-sidebar-foreground">
          <span className="relative inline-flex size-1.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-sidebar-primary/60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-sidebar-primary" />
          </span>
          MNQ<span className="text-sidebar-primary">.</span>Dashboard
        </span>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink key={item.href} {...item} active={isActive(item.href)} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border px-3 py-3">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </div>
      <div className="px-5 py-4 text-xs text-sidebar-foreground/50">MNQ · 15m</div>
    </aside>
  );
}
