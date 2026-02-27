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
  QueryDocumentSnapshot,
  where,
  QueryConstraint,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShieldCheck, User, CalendarClock, Database } from "lucide-react";

import { db } from "@/lib/firebase";
import { AuditLogFilters } from "@/types/audit-log";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------------- Types ---------------- */

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  actorId: string;
  actorType: "admin" | "user" | "system";
  metadata?: any;
  createdAt?: any;
};

/* ---------------- Constants ---------------- */

const PAGE_SIZE = 50;

/* ---------------- Component ---------------- */

export default function AuditLogsTable({
  filters,
}: {
  filters: AuditLogFilters;
}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  /* 🔄 Realtime: latest 50 (with filters) */
  useEffect(() => {
    setLoading(true);

    const constraints: QueryConstraint[] = [
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
    ];

    if (filters.entity) {
      constraints.push(where("entity", "==", filters.entity));
    }

    if (filters.actorType) {
      constraints.push(where("actorType", "==", filters.actorType));
    }

    if (filters.startDate) {
      constraints.push(where("createdAt", ">=", filters.startDate));
    }

    if (filters.endDate) {
      constraints.push(where("createdAt", "<=", filters.endDate));
    }

    const q = query(collection(db, "adminActivityLogs"), ...constraints);

    const unsub = onSnapshot(q, (snap) => {
      let rows: AuditLog[] = snap.docs.map((doc) => {
        const data = doc.data() as AuditLog;

        const { id: _ignored, ...rest } = data;

        return {
          id: doc.id,
          ...rest,
        };
      });
      // 🔍 Client-side search (safe: only 50 rows)
      if (filters.search) {
        const s = filters.search.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.action.toLowerCase().includes(s) ||
            r.actorType.toLowerCase().includes(s),
        );
      }

      setLogs(rows);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
      setLoading(false);
    });

    return () => unsub();
  }, [filters]);

  /* 📄 Pagination: older logs (same filters) */
  async function loadMore() {
    if (!lastDoc || !hasMore) return;

    setLoadingMore(true);

    const constraints: QueryConstraint[] = [
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(PAGE_SIZE),
    ];

    if (filters.entity) {
      constraints.push(where("entity", "==", filters.entity));
    }

    if (filters.actorType) {
      constraints.push(where("actorType", "==", filters.actorType));
    }

    if (filters.startDate) {
      constraints.push(where("createdAt", ">=", filters.startDate));
    }

    if (filters.endDate) {
      constraints.push(where("createdAt", "<=", filters.endDate));
    }

    const q = query(collection(db, "adminActivityLogs"), ...constraints);

    const snap = await getDocs(q);

    let rows: AuditLog[] = snap.docs.map((doc) => {
      const data = doc.data() as AuditLog;

      const { id: _ignored, ...rest } = data;

      return {
        id: doc.id,
        ...rest,
      };
    });

    setLogs((prev) => [...prev, ...rows]);
    setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  /* ---------------- Loading ---------------- */

  if (loading) {
    return (
      <div className="rounded-xl border bg-background p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  /* ---------------- Empty ---------------- */

  if (!logs.length) {
    return (
      <div className="border rounded-xl p-10 text-center">
        <p className="text-sm text-muted-foreground">No audit logs available</p>
      </div>
    );
  }

  /* ---------------- Table ---------------- */

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      {/* Header */}
      <div className="border-b px-5 py-4">
        <h3 className="text-lg font-semibold">Audit Logs</h3>
        <p className="text-sm text-muted-foreground">
          System & admin activity across the platform
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="pl-6">Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Performed By</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {logs.map((log) => (
            <TableRow
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <TableCell className="pl-6 font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                {log.action}
              </TableCell>

              <TableCell>
                <Badge
                  className={cn(
                    "rounded-full px-3 py-1",
                    log.entity === "USER" && "bg-sky-500/15 text-sky-600",
                    log.entity === "DRAW" && "bg-violet-500/15 text-violet-600",
                    log.entity === "WALLET" &&
                      "bg-emerald-500/15 text-emerald-600",
                    log.entity === "SYSTEM" && "bg-zinc-500/15 text-zinc-600",
                  )}
                >
                  <Database className="mr-1 h-3 w-3" />
                  {log.entity}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{log.actorType}</span>
                  {log.actorType === "admin" && (
                    <Badge variant="secondary">Admin</Badge>
                  )}
                </div>
              </TableCell>

              <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                {typeof log.metadata === "string"
                  ? log.metadata
                  : log.metadata
                    ? JSON.stringify(log.metadata)
                    : "-"}
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  {log.createdAt?.toDate
                    ? log.createdAt.toDate().toLocaleString()
                    : "-"}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {hasMore && (
        <div className="border-t p-4 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-sm">
              <Detail label="Action" value={selectedLog.action} />
              <Detail label="Entity" value={selectedLog.entity} />
              <Detail label="Actor Type" value={selectedLog.actorType} />
              <Detail
                label="Time"
                value={
                  selectedLog.createdAt?.toDate
                    ? selectedLog.createdAt.toDate().toLocaleString()
                    : "-"
                }
              />
              <div>
                <div className="font-medium mb-1">Metadata</div>

                <pre
                  className="
      max-h-64
      overflow-auto
      rounded-lg
      bg-muted
      p-3
      text-xs
      whitespace-pre-wrap
      break-words
    "
                >
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
