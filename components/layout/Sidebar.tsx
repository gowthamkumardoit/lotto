/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
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
  BadgeCheck,
  TicketCheck,
  Send,
  UserCog,
  QrCode,
  Megaphone,
  Building,
} from "lucide-react";
import { getAuth } from "firebase/auth";

import { db } from "@/lib/firebase";
import { usePlatformConfigStore } from "@/store/platformConfig.store";
import { Role } from "@/constants/roles";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

/* ---------------- NAV CONFIG ---------------- */

export type AdminPendingCounts = {
  deposits: number;
  withdrawals: number;
  supportTickets: number;
  kycRequests: number;
  upiWithdrawals: number;
  bankAccounts: number;
};
const navItems: {
  label: string;
  href: string;
  icon: any;
  roles: Role[];
}[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MANAGER", "SUPPORT"],
  },
  {
    label: "Draw Names",
    href: "/admin/draw-names",
    icon: Layers,
    roles: ["ADMIN"],
  },

  {
    label: "Kuber Golds Draws",
    href: "/admin/digit-draws",
    icon: Calendar,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Kuber X Draws",
    href: "/admin/draws",
    icon: Calendar,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Tickets",
    href: "/admin/tickets",
    icon: Ticket,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Winners",
    href: "/admin/winners",
    icon: Trophy,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "KYC Verification",
    href: "/admin/kyc",
    icon: BadgeCheck,
    roles: ["ADMIN", "MANAGER", "SUPPORT"],
  },
  { label: "Users", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
  {
    label: "Assign Role",
    href: "/admin/assign-role",
    icon: UserCog,
    roles: ["ADMIN"],
  },

  /* 💰 MONEY */
  {
    label: "Admin Banks",
    href: "/admin/payout",
    icon: Building2,
    roles: ["ADMIN", "MANAGER"],
  },

  {
    label: "Upi Requests",
    href: "/admin/upi-requests",
    icon: QrCode,
    roles: ["ADMIN", "MANAGER", "SUPPORT"],
  },
  {
    label: "Bank Requests",
    href: "/admin/bank-requests",
    icon: Building,
    roles: ["ADMIN", "MANAGER", "SUPPORT"],
  },
  {
    label: "Deposits",
    href: "/admin/deposits",
    icon: ArrowDownToLine,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Withdrawals",
    href: "/admin/withdrawals",
    icon: ArrowUpFromLine,
    roles: ["ADMIN", "MANAGER"],
  },
  { label: "Bonuses", href: "/admin/bonuses", icon: Gift, roles: ["ADMIN"] },

  /* 🔔 COMMUNICATION */
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    roles: ["ADMIN"],
  },
  {
    label: "Support & Tickets",
    href: "/admin/support-tickets",
    icon: TicketCheck,
    roles: ["ADMIN", "MANAGER", "SUPPORT"],
  },

  /* ⚙️ SYSTEM */
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: FileText,
    roles: ["ADMIN"],
  },
  {
    label: "Admin Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    label: "Promotions",
    href: "/admin/promotions",
    icon: Megaphone,
    roles: ["ADMIN"],
  },
  {
    label: "Telegram Msg Settings",
    href: "/admin/telegram-msg",
    icon: Send,
    roles: ["ADMIN", "MANAGER"],
  },
];

/* ---------------- COMPONENT ---------------- */

export default function Sidebar() {
  const pathname = usePathname();
  const auth = getAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState<Role | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousCountsRef = useRef<AdminPendingCounts | null>(null);

  const [pendingCounts, setPendingCounts] = useState<AdminPendingCounts>({
    deposits: 0,
    withdrawals: 0,
    supportTickets: 0,
    kycRequests: 0,
    upiWithdrawals: 0,
    bankAccounts: 0,
  });
  const platformName =
    usePlatformConfigStore((s) => s.config?.general.platformName) ??
    "Lottery Admin";

  const firestoreLogoUrl = usePlatformConfigStore(
    (s) => s.config?.branding?.logoUrl,
  );

  const logoUrl =
    firestoreLogoUrl && firestoreLogoUrl.trim().length > 0
      ? firestoreLogoUrl
      : "/logo.png";
  const [roleLoading, setRoleLoading] = useState(true);
  /* -------- LOAD ROLE FROM AUTH CLAIMS -------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setRoleLoading(false);
        return;
      }

      try {
        const token = await user.getIdTokenResult(true);
        const rawRole = token.claims.role;

        console.log("ALL CLAIMS:", token.claims);

        if (typeof rawRole === "string") {
          setRole(rawRole.toUpperCase() as Role);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("Failed to load role from token", err);
        setRole(null);
      } finally {
        setRoleLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  /* -------- LOAD BADGE COUNTS -------- */
  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
          })
          .catch(() => {});
      }

      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);

    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  useEffect(() => {
    const ref = doc(db, "admin_stats", "pending_counts");

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      const newCounts: AdminPendingCounts = {
        deposits: data.deposits ?? 0,
        withdrawals: data.withdrawals ?? 0,
        supportTickets: data.supportTickets ?? 0,
        kycRequests: data.kycRequests ?? 0,
        upiWithdrawals: data.upiWithdrawals ?? 0,
        bankAccounts: data.bankAccounts ?? 0,
      };

      if (previousCountsRef.current) {
        const prev = previousCountsRef.current;

        const hasIncrease =
          newCounts.deposits > prev.deposits ||
          newCounts.withdrawals > prev.withdrawals ||
          newCounts.supportTickets > prev.supportTickets ||
          newCounts.kycRequests > prev.kycRequests ||
          newCounts.upiWithdrawals > prev.upiWithdrawals ||
          newCounts.bankAccounts > prev.bankAccounts;

        if (hasIncrease && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }

      previousCountsRef.current = newCounts;
      setPendingCounts(newCounts);
    });

    return () => unsub();
  }, []);

  /* -------- HARD BLOCK USER -------- */

  if (roleLoading) {
    return null; // or skeleton
  }

  if (role === "USER" || !role) {
    return null;
  }

  /* -------- FILTER MENU BY ROLE -------- */

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  const getBadgeCount = (href: string) => {
    switch (href) {
      case "/admin/deposits":
        return pendingCounts.deposits;
      case "/admin/withdrawals":
        return pendingCounts.withdrawals;
      case "/admin/support-tickets":
        return pendingCounts.supportTickets;
      case "/admin/kyc":
        return pendingCounts.kycRequests;
      case "/admin/upi-requests":
        return pendingCounts.upiWithdrawals;
      case "/admin/bank-requests":
        return pendingCounts.bankAccounts;
      default:
        return 0;
    }
  };

  /* ---------------- RENDER ---------------- */

  return (
    <aside
      className={clsx(
        "relative h-screen border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img
              src={logoUrl}
              alt="Platform Logo"
              className="h-8 w-8 rounded object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
            />
            <div>
              <h1 className="text-sm font-semibold leading-tight">
                {platformName}
              </h1>
              <p className="text-xs text-muted-foreground">Control Panel</p>
            </div>
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
        {filteredNavItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          const Icon = item.icon;
          const badgeCount = getBadgeCount(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={clsx(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <span
                className={clsx(
                  "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r",
                  isActive ? "bg-primary" : "bg-transparent",
                )}
              />

              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}

              {badgeCount > 0 && (
                <span
                  className={clsx(
                    "ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white",
                    collapsed && "absolute right-2 top-2",
                  )}
                >
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
