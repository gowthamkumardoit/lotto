/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { DigitDrawRowActions } from "./DigitDrawRowActions";
import { DrawsEmptyState } from "../draws/DrawEmptyState";

/* ---------------- TYPES ---------------- */

type DigitDraw = {
  id: string;
  name: string;
  digits: number;
  status: "OPEN" | "LOCKED" | "RUNNING" | "COMPLETED";
  createdAt: Timestamp;
  config?: any;
};

/* ---------------- STATUS STYLES ---------------- */

const statusStyles: Record<DigitDraw["status"], string> = {
  OPEN: "bg-sky-500/15 text-sky-600",
  LOCKED: "bg-red-500/15 text-red-600",
  RUNNING: "bg-amber-500/15 text-amber-600",
  COMPLETED: "bg-emerald-500/15 text-emerald-600",
};

/* ---------------- COMPONENT ---------------- */

export function DigitDrawTable() {
  const [draws, setDraws] = useState<DigitDraw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "digitDraws"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data: DigitDraw[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<DigitDraw, "id">),
      }));

      setDraws(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="border rounded-xl p-10 text-center text-sm text-muted-foreground">
        Loading digit draws…
      </div>
    );
  }

  if (!draws.length) {
    return <DrawsEmptyState />;
  }

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      {/* Header */}
      <div className="border-b px-5 py-4">
        <h3 className="text-lg font-semibold">Digit Draws</h3>
        <p className="text-sm text-muted-foreground">
          Manage digit-based lottery draws
        </p>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="pl-6">Draw Name</TableHead>
            <TableHead>Digits</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Configured</TableHead>
            <TableHead>Created</TableHead>
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

              {/* Digits */}
              <TableCell className="font-mono text-sm">
                {draw.digits}-Digit
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

              {/* Configured */}
              <TableCell>
                {draw.config ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600">
                    Configured
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/15 text-red-600">
                    Not Configured
                  </Badge>
                )}
              </TableCell>

              {/* Created */}
              <TableCell className="text-sm text-muted-foreground">
                {draw.createdAt?.toDate().toLocaleDateString()}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right pr-6">
                <DigitDrawRowActions
                  digitDrawId={draw.id}
                  name={draw.name}
                  digits={draw.digits}
                  status={draw.status}
                  config={draw.config}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
