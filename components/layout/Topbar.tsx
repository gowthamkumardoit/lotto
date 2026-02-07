/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Moon,
  Sun,
  ChevronDown,
  Search,
  Plus,
  Circle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  setDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { usePlatformConfigStore } from "@/store/platformConfig.store";
import { DrawSoonAlertModal } from "../common/DrawSoonAlertModal";
import { AdminSearch } from "../common/AdminSearch";
/* ---------------- Types ---------------- */

type AdminNotification = {
  id: string;
  title: string;
  message: string;
  createdAt?: any;
  unread: boolean;
};

function getInitials(email?: string | null) {
  if (!email) return "A";
  return email.charAt(0).toUpperCase();
}

/* ---------------- Component ---------------- */

export default function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [time, setTime] = useState("");

  const { config, loading: configLoading } = usePlatformConfigStore();
  const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV?.toUpperCase() ?? "LOCAL";
  const [role, setRole] = useState<string | null>(null);
  const isSupport = role === "SUPPORT";

  /* ⏱ Live clock (IST) */
  useEffect(() => {
    const i = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 1000);
    return () => clearInterval(i);
  }, []);

  /* 🔄 Realtime notifications */
  useEffect(() => {
    if (!user || role === 'SUPPORT') return;

    const notifQuery = query(
      collection(db, "adminNotifications"),
      orderBy("createdAt", "desc"),
      limit(10),
    );

    const unsub = onSnapshot(notifQuery, (snap) => {
      const rows: AdminNotification[] = snap.docs.map((doc) => {
        const d = doc.data() as any;
        return {
          id: doc.id,
          title: d.title,
          message: d.message,
          createdAt: d.createdAt,
          unread: d.read !== true, // ✅ SINGLE SOURCE OF TRUTH
        };
      });

      setNotifications(rows);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }

    user.getIdTokenResult(true).then((token) => {
      const rawRole = token.claims.role;
      if (typeof rawRole === "string") {
        setRole(rawRole.toUpperCase());
      }
    });
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  );

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => n.unread),
    [notifications],
  );

  /* ---------------- Actions ---------------- */

  async function markAllRead() {
    const batch = writeBatch(db);

    notifications
      .filter((n) => n.unread)
      .forEach((n) => {
        batch.update(doc(db, "adminNotifications", n.id), { read: true });
      });

    await batch.commit();
  }

  async function markOneRead(id: string) {
    await setDoc(
      doc(db, "adminNotifications", id),
      { read: true },
      { merge: true },
    );
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  /* ---------------- UI ---------------- */

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur flex items-center justify-between px-6 gap-4">
      {/* LEFT */}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">
            Admin Dashboard
          </h2>

          {role && (
            <Badge
              variant="outline"
              className={
                role === "ADMIN"
                  ? "border-red-500/40 text-red-600"
                  : role === "MANAGER"
                    ? "border-blue-500/40 text-blue-600"
                    : "border-emerald-500/40 text-emerald-600"
              }
            >
              {role}
            </Badge>
          )}
        </div>

        {/* 🟢 System Status */}
        {configLoading ? (
          <Badge variant="outline">Checking…</Badge>
        ) : config?.general?.maintenanceMode ? (
          <Badge className="gap-1 bg-amber-500/15 text-amber-600">
            <Circle className="h-2.5 w-2.5 fill-amber-500 animate-pulse" />
            Maintenance
          </Badge>
        ) : (
          <Badge className="gap-1 bg-emerald-500/15 text-emerald-600">
            <Circle className="h-2.5 w-2.5 fill-emerald-500" />
            Live
          </Badge>
        )}

        {/* 🟣 ENV */}
        <Badge
          variant="outline"
          className={
            APP_ENV === "PRODUCTION"
              ? "border-emerald-500/40 text-emerald-600"
              : APP_ENV === "STAGING"
                ? "border-amber-500/40 text-amber-600"
                : "border-muted text-muted-foreground"
          }
        >
          {APP_ENV}
        </Badge>
      </div>

      {/* CENTER – GLOBAL SEARCH */}
      {/* <AdminSearch /> */}

      {/* RIGHT */}
      <div className="flex items-center gap-1">
        {/* ⏱ Clock */}
        <div className="flex items-center gap-2 rounded-lg border bg-background/60 px-3 mr-5 py-1.5 shadow-sm backdrop-blur">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Time (IST)
            </span>
            <span className="text-sm font-semibold tabular-nums">{time}</span>
          </div>

          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        {/* ➕ Quick Actions */}
        {!isSupport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push("/admin/draw-names")}
              >
                Create Draw
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/admin/telegram-msg")}
              >
                Telegram Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                Platform Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 🔔 Notifications */}
        {!isSupport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-[18px] px-1 text-[10px] rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96">
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-medium">Notifications</p>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead}>
                    Mark all read
                  </Button>
                )}
              </div>

              <DropdownMenuSeparator />

              {visibleNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  You’re all caught up 🎉
                </div>
              ) : (
                <>
                  {visibleNotifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => markOneRead(n.id)}
                      className={`cursor-pointer ${n.unread ? "bg-muted/40" : ""}`}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push("/admin/notifications")}
                    >
                      View all notifications
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 👤 Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full px-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL ?? undefined} />
                <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="px-4 py-3">
              <p className="text-sm font-medium">Administrator</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : (
                <Sun className="mr-2 h-4 w-4" />
              )}
              {isDark ? "Dark mode" : "Light mode"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive"
              onClick={handleLogout}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
