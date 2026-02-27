/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { CalendarX, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { db, functions } from "@/lib/firebase";
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
import { ConfirmActionDialog } from "../common/ConfirmActionDialog";
import { ViewResultsDialog, DrawResult } from "./ViewResultsDialog";
import { useRouter } from "next/navigation";
import { RunDrawDialog } from "./RunDrawDialog";
/* ---------------- TYPES ---------------- */

type FirestoreStatus = "UPCOMING" | "RUNNING" | "COMPLETED";
type UIStatus = "OPEN" | "LOCKED" | "RUNNING" | "DRAWN";

type Draw = {
  id: string;
  name: string;
  time: string;
  status: UIStatus;
  sales: number;
  result?: DrawResult | null;
  date: string;
};

/* ---------------- STATUS BADGE ---------------- */

function StatusBadge({ status }: { status: UIStatus }) {
  if (status === "RUNNING") {
    return (
      <Badge className="rounded-full bg-blue-500/15 text-blue-600 gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </Badge>
    );
  }

  if (status === "OPEN") {
    return (
      <Badge className="rounded-full bg-emerald-500/15 text-emerald-600">
        OPEN
      </Badge>
    );
  }

  if (status === "LOCKED") {
    return (
      <Badge className="rounded-full bg-red-500/15 text-red-600">LOCKED</Badge>
    );
  }

  return (
    <Badge className="rounded-full bg-zinc-500/15 text-zinc-500">DRAWN</Badge>
  );
}

function NewBadge() {
  return (
    <Badge className="rounded-full bg-purple-500/15 text-purple-600">NEW</Badge>
  );
}

function toDateTime(date: string, time: string): number {
  // Handles "HH:mm" or "hh:mm AM/PM"
  const dt = new Date(`${date} ${time}`);
  return isNaN(dt.getTime()) ? 0 : dt.getTime();
}

/* ---------------- MAIN TABLE ---------------- */

export function DrawTable() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [action, setAction] = useState<"LOCK" | "RUN" | null>(null);
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<DrawResult | null>(null);
  const [runOpen, setRunOpen] = useState(false);

  const [todayISO] = useState(() => new Date().toISOString().slice(0, 10));

  const [tomorrowISO] = useState(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().slice(0, 10);
  });

  const router = useRouter();

  const [refreshKey, setRefreshKey] = useState(0);

  /* ---------------- FIRESTORE LISTENER ---------------- */

  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(db, "drawRuns"),
      where("date", "==", todayISO),
      orderBy("time", "asc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: Draw[] = snap.docs.map((doc) => {
          const d = doc.data();

          const status: UIStatus =
            d.status === "OPEN"
              ? "OPEN"
              : d.status === "LOCKED"
                ? "LOCKED"
                : d.status === "RUNNING"
                  ? "RUNNING"
                  : "DRAWN";

          return {
            id: doc.id,
            name: d.name,
            time: d.time,
            sales: d.sales ?? 0,
            status,
            result: d.result ?? null,
            date: d.date,
          };
        });

        setDraws(rows); // no manual sort needed now
        setLoading(false);
      },
      (error) => {
        console.error("Draw listener error:", error);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [todayISO, refreshKey]);

  /* ---------------- ACTION HANDLERS ---------------- */

  async function handleConfirm() {
    if (!selectedDraw || !action) return;

    const currentAction = action;

    // 🔒 Freeze intent
    setAction(null);

    if (currentAction === "RUN") {
      setConfirmOpen(false);
      setRunOpen(true);
      return;
    }

    if (currentAction === "LOCK") {
      const toastId = toast.loading("Locking draw…");

      try {
        await httpsCallable(
          functions,
          "lockDrawRun",
        )({
          drawRunId: selectedDraw.id,
        });

        toast.success("Draw locked", { id: toastId });

        // ✅ close ONLY after success
        setConfirmOpen(false);
        setSelectedDraw(null);
      } catch (err: any) {
        toast.error(err?.message || "Lock failed", { id: toastId });
      }
    }
  }

  /* ---------------- RENDER ---------------- */

  return (
    <div
      className={`rounded-xl border bg-background shadow-sm flex flex-col ${
        !draws.length ? "min-h-[400px]" : ""
      }`}
    >
      <div className="border-b px-5 py-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Today’s Draws</h3>
        <p className="text-sm text-muted-foreground">
          Manage draw lifecycle and monitor sales
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRefreshKey((prev) => prev + 1)}
          className="group"
        >
          <Loader2 className="mr-2 h-4 w-4 transition-transform group-active:rotate-180" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !draws.length ? (
          <div className="flex flex-1 flex-col items-center justify-start gap-3 p-6 pt-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CalendarX className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                No draws created for today
              </p>
              <p className="text-xs text-muted-foreground">
                Once a draw is created, it will appear here.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="pl-6">Draw</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {draws.map((draw) => (
                <TableRow key={draw.id}>
                  <TableCell className="pl-6 font-medium">
                    <div className="flex items-center gap-2">
                      {draw.name}
                      {draw.date === tomorrowISO && <NewBadge />}
                    </div>
                  </TableCell>

                  <TableCell>{draw.time}</TableCell>

                  <TableCell>
                    <StatusBadge status={draw.status} />
                  </TableCell>

                  <TableCell className="font-medium">
                    ₹{draw.sales.toLocaleString()}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end items-center gap-2 flex-wrap">
                      {/* 👁 View Details (always) */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/draws/${draw.id}`)}
                      >
                        View Details
                      </Button>

                      {/* OPEN → Lock */}
                      {draw.status === "OPEN" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDraw(draw);
                            setAction("LOCK");
                            setConfirmOpen(true);
                          }}
                        >
                          Lock
                        </Button>
                      )}

                      {/* LOCKED → Run Draw */}
                      {draw.status === "LOCKED" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedDraw(draw);
                            setAction("RUN");
                            setConfirmOpen(true);
                          }}
                        >
                          Run Draw
                        </Button>
                      )}

                      {/* RUNNING → Disabled */}
                      {draw.status === "RUNNING" && (
                        <Button size="sm" disabled>
                          Running…
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {/* ---------------- CONFIRM DIALOG ---------------- */}
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={action === "LOCK" ? "Lock this draw?" : "Run this draw now?"}
        description={
          action === "LOCK"
            ? "Once locked, users cannot place tickets."
            : "This will finalize the draw and calculate winners."
        }
        confirmText={action === "LOCK" ? "Lock Draw" : "Run Draw"}
        confirmVariant={action === "RUN" ? "destructive" : "default"}
        onConfirm={handleConfirm}
      />

      {/* ---------------- VIEW RESULTS ---------------- */}
      <ViewResultsDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        result={selectedResult}
      />

      <RunDrawDialog
        open={runOpen}
        onOpenChange={(v) => {
          setRunOpen(v);
          if (!v) {
            setConfirmOpen(false);
            setSelectedDraw(null);
            setAction(null);
          }
        }}
        onRun={async () => {
          const res: any = await httpsCallable(
            functions,
            "runDraw",
          )({
            drawRunId: selectedDraw!.id,
          });

          toast.success("Draw completed");

          return res.data.result;
        }}
      />
    </div>
  );
}
