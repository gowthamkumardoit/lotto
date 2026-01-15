/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Bell, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
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
  serverTimestamp,
} from "firebase/firestore";

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

  /* 🔄 Realtime notifications */
  useEffect(() => {
    if (!user) return;

    const notifQuery = query(
      collection(db, "adminNotifications"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsub = onSnapshot(notifQuery, async (snap) => {
      const readsSnap = await getDocs(
        collection(db, "admins", user.uid, "adminNotificationReads")
      );

      const readIds = new Set(readsSnap.docs.map((d) => d.id));

      const rows: AdminNotification[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
        unread: !readIds.has(doc.id),
      }));

      setNotifications(rows);
    });

    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  /* ---------------- Actions ---------------- */

  async function markOneRead(id: string) {
    if (!user) return;

    await setDoc(doc(db, "admins", user.uid, "adminNotifications", id), {
      read: true,
    });
  }

  async function markAllRead() {
    if (!user) return;

    const batch = writeBatch(db);

    notifications
      .filter((n) => n.unread)
      .forEach((n) => {
        batch.set(doc(db, "admins", user.uid, "adminNotifications", n.id), {
          read: true,
        });
      });

    await batch.commit();
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  /* ---------------- UI ---------------- */

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6">
      <h2 className="text-sm font-semibold">Admin Dashboard</h2>

      <div className="flex items-center gap-2">
        {/* 🔔 Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-medium">Notifications</p>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={markAllRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>

            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => markOneRead(n.id)}
                  className={`flex flex-col items-start gap-1 py-3 ${
                    n.unread ? "bg-muted/50" : ""
                  }`}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 👤 Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL ?? undefined} />
                <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">Administrator</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                {isDark ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                {isDark ? "Dark Mode" : "Light Mode"}
              </div>
            </DropdownMenuItem>

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
