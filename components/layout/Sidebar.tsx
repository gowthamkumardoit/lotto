"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Trophy,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
  Users,
  Gift,
  Bell,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
  Building2,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Draw Names",
    href: "/admin/draw-names",
    icon: Layers,
  },
  {
    label: "Draws",
    href: "/admin/draws",
    icon: Calendar,
  },
  {
    label: "Tickets",
    href: "/admin/tickets",
    icon: Ticket,
  },
  {
    label: "Winners",
    href: "/admin/winners",
    icon: Trophy,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },

  /* 💰 MONEY */

  {
    label: "Admin Banks",
    href: "/admin/payout",
    icon: Building2,
  },
  {
    label: "Deposits",
    href: "/admin/deposits",
    icon: ArrowDownToLine,
  },
  {
    label: "Withdrawals",
    href: "/admin/withdrawals",
    icon: ArrowUpFromLine,
  },
  {
    label: "Bonuses",
    href: "/admin/bonuses",
    icon: Gift,
  },

  /* 🔔 COMMUNICATION */
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },

  /* ⚙️ SYSTEM */
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: FileText,
  },
  {
    label: "Admin Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "relative h-screen border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-4">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-semibold">🎟️ Lottery Admin</h1>
            <p className="text-xs text-muted-foreground">Control Panel</p>
          </div>
        )}

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={clsx(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {/* Active indicator */}
              <span
                className={clsx(
                  "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r",
                  isActive ? "bg-primary" : "bg-transparent"
                )}
              />

              <Icon size={18} />

              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
