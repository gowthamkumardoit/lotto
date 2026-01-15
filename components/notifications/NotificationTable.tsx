/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  getDocs,
  startAfter,
  where,
  QueryConstraint,
  QueryDocumentSnapshot,
} from "firebase/firestore";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Bell, Users, User } from "lucide-react";

import { db } from "@/lib/firebase";
import { NotificationFilters } from "@/app/admin/notifications/page";

/* ---------------- Types ---------------- */

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "ALERT" | "PROMO";
  target: "ALL" | "USER" | "SEGMENT";
  createdBy: string;
  createdAt?: any;
};

const PAGE_SIZE = 25;

/* ---------------- Component ---------------- */

export default function NotificationsTable({
  filters,
}: {
  filters: NotificationFilters;
}) {
  const [rows, setRows] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  /* 🔄 Realtime: latest page */
  useEffect(() => {
    setLoading(true);

    const constraints: QueryConstraint[] = [
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
    ];

    if (filters.startDate) {
      constraints.push(where("createdAt", ">=", filters.startDate));
    }

    if (filters.endDate) {
      constraints.push(where("createdAt", "<=", filters.endDate));
    }

    const q = query(collection(db, "adminNotifications"), ...constraints);

    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Notification),
      }));

      // client-side search (safe: page only)
      if (filters.search) {
        const s = filters.search.toLowerCase();
        data = data.filter(
          (n) =>
            n.title.toLowerCase().includes(s) ||
            n.message.toLowerCase().includes(s)
        );
      }

      setRows(data);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
      setLoading(false);
    });

    return () => unsub();
  }, [filters]);

  /* 📄 Pagination */
  async function loadMore() {
    if (!lastDoc || !hasMore) return;

    setLoadingMore(true);

    const constraints: QueryConstraint[] = [
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(PAGE_SIZE),
    ];

    if (filters.startDate) {
      constraints.push(where("createdAt", ">=", filters.startDate));
    }

    if (filters.endDate) {
      constraints.push(where("createdAt", "<=", filters.endDate));
    }

    const q = query(collection(db, "adminNotifications"), ...constraints);

    const snap = await getDocs(q);

    const more = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Notification),
    }));

    setRows((p) => [...p, ...more]);
    setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  /* ---------------- Loading ---------------- */

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border p-10 text-center text-muted-foreground">
        No notifications found
      </div>
    );
  }

  /* ---------------- Table ---------------- */

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="pl-6">Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((n) => (
            <TableRow key={n.id}>
              <TableCell className="pl-6">
                <div className="flex items-center gap-2 font-medium">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  {n.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {n.message}
                </div>
              </TableCell>

              <TableCell>
                <Badge
                  className={cn(
                    n.type === "INFO" && "bg-sky-500/15 text-sky-600",
                    n.type === "PROMO" && "bg-emerald-500/15 text-emerald-600",
                    n.type === "ALERT" && "bg-red-500/15 text-red-600"
                  )}
                >
                  {n.type}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  {n.target === "ALL" && <Users className="h-4 w-4" />}
                  {n.target === "USER" && <User className="h-4 w-4" />}
                  {n.target}
                </div>
              </TableCell>

              <TableCell>{n.createdBy}</TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {n.createdAt?.toDate
                  ? n.createdAt.toDate().toLocaleString()
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {hasMore && (
        <div className="border-t p-4 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
