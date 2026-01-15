"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { Loader2 } from "lucide-react";

import { db } from "@/lib/firebase";
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

const typeBadgeStyles: Record<Ticket["type"], string> = {
  "2D": "bg-sky-500/15 text-sky-600 border-sky-500/20",
  "3D": "bg-violet-500/15 text-violet-600 border-violet-500/20",
  "4D": "bg-amber-500/15 text-amber-600 border-amber-500/20",
};

/* ---------------- TYPES ---------------- */

type Ticket = {
  id: string;
  userId: string;
  type: "2D" | "3D" | "4D";
  number: string;
  amount: number;
  winAmount?: number;
};

const PAGE_SIZE = 50;

/* ---------------- COMPONENT ---------------- */

export function TicketsTable({ drawRunId }: { drawRunId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);

  const [hasNext, setHasNext] = useState(true);
  const [page, setPage] = useState(1);

  /* ---------------- FETCH PAGE ---------------- */

  async function fetchPage(reset = false) {
    setLoading(true);

    try {
      let q;

      if (reset || !lastDoc) {
        q = query(
          collection(db, "tickets"),
          where("drawRunId", "==", drawRunId),
          orderBy("createdAt", "asc"),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(
          collection(db, "tickets"),
          where("drawRunId", "==", drawRunId),
          orderBy("createdAt", "asc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);

      const rows: Ticket[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Ticket),
      }));

      setTickets(rows);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasNext(snap.docs.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- INITIAL LOAD ---------------- */

  useEffect(() => {
    setTickets([]);
    setLastDoc(null);
    setPage(1);
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawRunId]);

  /* ---------------- UI ---------------- */

  if (loading && tickets.length === 0) {
    return (
      <div className="rounded-xl border p-10 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">
        No tickets found
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      {/* ---------- TABLE ---------- */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {tickets.map((t) => (
            <TableRow
              key={t.id}
              className={
                t.winAmount && t.winAmount > 0 ? "bg-emerald-50/30" : ""
              }
            >
              <TableCell className="font-mono text-xs">{t.id}</TableCell>

              <TableCell>{t.userId}</TableCell>

              <TableCell>
                <Badge className={typeBadgeStyles[t.type]} variant="outline">
                  {t.type}
                </Badge>
              </TableCell>

              <TableCell className="font-mono">{t.number}</TableCell>

              <TableCell>₹{t.amount}</TableCell>

              <TableCell>
                {t.winAmount && t.winAmount > 0 ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">
                    WON ₹{t.winAmount}
                  </Badge>
                ) : (
                  <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">
                    LOST
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ---------- PAGINATION ---------- */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-muted-foreground">Page {page}</div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || loading}
            onClick={() => {
              // classic pagination = re-fetch from start
              setPage(1);
              setLastDoc(null);
              fetchPage(true);
            }}
          >
            First
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext || loading}
            onClick={() => {
              setPage((p) => p + 1);
              fetchPage();
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
