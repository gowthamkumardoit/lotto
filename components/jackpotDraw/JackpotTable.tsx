/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Loader2, Gift } from "lucide-react";
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
import { useRouter } from "next/navigation";

/* ---------------- TYPES ---------------- */

type JackpotStatus =
  | "CREATED"
  | "OPEN"
  | "GUARANTEED"
  | "LOCKED"
  | "SETTLED";

type JackpotDraw = {
  id: string;
  name: string;
  drawDate: string;
  time: string;
  status: JackpotStatus;
  ticketsSold: number;
  totalCollection: number;
};

/* ---------------- STATUS BADGE ---------------- */

function JackpotStatusBadge({ status }: { status: JackpotStatus }) {
  switch (status) {
    case "CREATED":
      return (
        <Badge className="rounded-full bg-zinc-500/15 text-zinc-600">
          CREATED
        </Badge>
      );
    case "OPEN":
      return (
        <Badge className="rounded-full bg-emerald-500/15 text-emerald-600">
          OPEN
        </Badge>
      );
    case "GUARANTEED":
      return (
        <Badge className="rounded-full bg-blue-500/15 text-blue-600">
          GUARANTEED
        </Badge>
      );
    case "LOCKED":
      return (
        <Badge className="rounded-full bg-red-500/15 text-red-600">
          LOCKED
        </Badge>
      );
    default:
      return (
        <Badge className="rounded-full bg-purple-500/15 text-purple-600">
          SETTLED
        </Badge>
      );
  }
}

/* ---------------- MAIN TABLE ---------------- */

export function JackpotTable() {
  const [rows, setRows] = useState<JackpotDraw[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [action, setAction] = useState<"OPEN" | "LOCK" | null>(null);
  const [selected, setSelected] = useState<JackpotDraw | null>(null);

  const router = useRouter();

  /* ---------------- FIRESTORE LISTENER ---------------- */

  useEffect(() => {
    const q = query(
      collection(db, "jackpotDraws"),
      orderBy("drawDate", "asc"),
      orderBy("time", "asc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: JackpotDraw[] = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name,
            drawDate: d.drawDate,
            time: d.time,
            status: d.status,
            ticketsSold: d.ticketsSold ?? 0,
            totalCollection: d.totalCollection ?? 0,
          };
        });

        setRows(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, []);

  /* ---------------- ACTION HANDLER ---------------- */

  async function handleConfirm() {
    if (!selected || !action) return;

    const toastId = toast.loading(
      action === "OPEN" ? "Opening jackpot…" : "Locking jackpot…",
    );

    try {
      await httpsCallable(functions, "updateJackpotDraw")({
        drawId: selected.id,
        status: action === "OPEN" ? "OPEN" : "LOCKED",
      });

      toast.success("Status updated", { id: toastId });
      setConfirmOpen(false);
      setSelected(null);
      setAction(null);
    } catch (err: any) {
      toast.error(err?.message || "Action failed", { id: toastId });
    }
  }

  /* ---------------- RENDER ---------------- */

  return (
    <div className="rounded-xl border bg-background shadow-sm min-h-[520px] flex flex-col">
      <div className="border-b px-5 py-4">
        <h3 className="text-lg font-semibold">Jackpot Draws</h3>
        <p className="text-sm text-muted-foreground">
          Manage jackpot lifecycle and monitor collections
        </p>
      </div>

      <div className="flex flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !rows.length ? (
          <div className="flex flex-1 flex-col items-center justify-start gap-3 p-6 pt-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Gift className="h-6 w-6 text-muted-foreground" />
            </div>

            <p className="text-sm font-medium">No jackpot draws created</p>
            <p className="text-xs text-muted-foreground">
              Create a jackpot draw to start selling tickets
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="pl-6">Jackpot</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-6 font-medium">
                    {row.name}
                  </TableCell>

                  <TableCell>{row.drawDate}</TableCell>
                  <TableCell>{row.time}</TableCell>

                  <TableCell>
                    <JackpotStatusBadge status={row.status} />
                  </TableCell>

                  <TableCell>{row.ticketsSold.toLocaleString()}</TableCell>

                  <TableCell className="font-medium">
                    ₹{row.totalCollection.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/admin/jackpot-draws/${row.id}`)
                        }
                      >
                        View
                      </Button>

                      {row.status === "CREATED" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelected(row);
                            setAction("OPEN");
                            setConfirmOpen(true);
                          }}
                        >
                          Open
                        </Button>
                      )}

                      {(row.status === "OPEN" ||
                        row.status === "GUARANTEED") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelected(row);
                            setAction("LOCK");
                            setConfirmOpen(true);
                          }}
                        >
                          Lock
                        </Button>
                      )}

                      {row.status === "LOCKED" && (
                        <Button size="sm" disabled>
                          Locked
                        </Button>
                      )}

                      {row.status === "SETTLED" && (
                        <Button size="sm" disabled>
                          Settled
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

      {/* ---------------- CONFIRM ---------------- */}
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          action === "OPEN"
            ? "Open this jackpot?"
            : "Lock this jackpot?"
        }
        description={
          action === "OPEN"
            ? "Users will be able to start buying tickets."
            : "Ticket sales will be permanently closed."
        }
        confirmText={action === "OPEN" ? "Open Jackpot" : "Lock Jackpot"}
        confirmVariant={action === "LOCK" ? "destructive" : "default"}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
