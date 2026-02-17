"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
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
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { JackpotRowActions } from "./JackpotRowActions";
import { JackpotDrawsEmptyState } from "../jackpotDraw/JackpotDrawsEmptyState";

/* ---------------- TYPES ---------------- */
type JackpotDraw = {
  id: string;
  name: string;
  drawDate: string;
  time: string;
  digits: number;
  jackpotAmount: number;
  status: "CREATED" | "OPEN" | "LOCKED" | "SETTLED";
  createdAt: Timestamp;
};

/* ---------------- STATUS STYLES ---------------- */
const statusStyles: Record<JackpotDraw["status"], string> = {
  CREATED: "bg-slate-500/15 text-slate-600",
  OPEN: "bg-sky-500/15 text-sky-600",
  LOCKED: "bg-red-500/15 text-red-600",
  SETTLED: "bg-emerald-500/15 text-emerald-600",
};

/* ---------------- COMPONENT ---------------- */
export function JackpotDrawTable() {
  const [draws, setDraws] = useState<JackpotDraw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "jackpotDraws"),
      orderBy("drawDate", "asc"),
      orderBy("time", "asc"),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data: JackpotDraw[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<JackpotDraw, "id">),
      }));

      setDraws(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="border rounded-xl p-10 text-center text-sm text-muted-foreground">
        Loading jackpot draws…
      </div>
    );
  }

  /* ---------------- EMPTY ---------------- */
  if (!draws.length) {
    return <JackpotDrawsEmptyState />;
  }

  /* ---------------- TABLE ---------------- */
  return (
    <div className="rounded-xl border bg-background shadow-sm">
      {/* Header */}
      <div className="border-b px-5 py-4">
        <h3 className="text-lg font-semibold">Jackpot Draws</h3>
        <p className="text-sm text-muted-foreground">
          Manage jackpot lottery draws
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="pl-6">Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Digits</TableHead>
            <TableHead>Jackpot</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {draws.map((draw) => (
            <TableRow
              key={draw.id}
              className="hover:bg-muted/50 transition-colors"
            >
              {/* Name */}
              <TableCell className="pl-6 font-medium">{draw.name}</TableCell>

              {/* Date */}
              <TableCell className="text-sm">{draw.drawDate}</TableCell>

              {/* Time */}
              <TableCell className="font-mono text-sm">{draw.time}</TableCell>

              {/* Digits */}
              <TableCell className="text-sm">{draw.digits}</TableCell>

              {/* Jackpot Amount */}
              <TableCell className="font-medium">
                ₹{draw.jackpotAmount.toLocaleString("en-IN")}
              </TableCell>

              {/* Status */}
              <TableCell>
                <Badge
                  className={cn(
                    "rounded-full px-3 py-1",
                    statusStyles[draw.status],
                  )}
                >
                  {draw.status}
                </Badge>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right pr-6">
                <JackpotRowActions drawId={draw.id} status={draw.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
