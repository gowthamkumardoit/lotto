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

import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CreateDigitDrawSlotDialog } from "@/components/digit-draws/CreateDigitDrawSlotDialog";

/* ---------------- TYPES ---------------- */

type SlotStatus =
  | "OPEN"
  | "LOCKED"
  | "RUNNING"
  | "COMPLETED"
  | "DISABLED";

type DigitDrawSlot = {
  id: string;
  name: string;
  digits: number;
  templateId: string;
  status: SlotStatus;
  sales: number;
  openAt: Timestamp;
  closeAt: Timestamp;
  createdAt: Timestamp;
};

/* ---------------- STATUS STYLES ---------------- */

const statusStyles: Record<SlotStatus, string> = {
  OPEN: "bg-sky-500/15 text-sky-600",
  LOCKED: "bg-red-500/15 text-red-600",
  RUNNING: "bg-amber-500/15 text-amber-600",
  COMPLETED: "bg-emerald-500/15 text-emerald-600",
  DISABLED: "bg-gray-500/15 text-gray-600",
};

/* ---------------- PAGE ---------------- */

export default function DigitDrawSlotsPage() {
  const router = useRouter();

  const [slots, setSlots] = useState<DigitDrawSlot[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD SLOTS ---------------- */

  useEffect(() => {
    const q = query(
      collection(db, "digitDrawSlots"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data: DigitDrawSlot[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      setSlots(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------------- RENDER ---------------- */

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Digit Draw Slots
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage active 2D / 3D / 4D draw instances
          </p>
        </div>

        <CreateDigitDrawSlotDialog>
          <Button>+ Create Slot</Button>
        </CreateDigitDrawSlotDialog>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-background shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pl-6">Slot Name</TableHead>
              <TableHead>Digits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Open At</TableHead>
              <TableHead>Close At</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="pr-6 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8"
                >
                  Loading slots...
                </TableCell>
              </TableRow>
            )}

            {!loading && slots.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8"
                >
                  No slots created yet.
                </TableCell>
              </TableRow>
            )}

            {slots.map((slot) => (
              <TableRow
                key={slot.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="pl-6 font-medium">
                  {slot.name}
                </TableCell>

                <TableCell>{slot.digits}D</TableCell>

                <TableCell>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-1",
                      statusStyles[slot.status]
                    )}
                  >
                    {slot.status}
                  </Badge>
                </TableCell>

                <TableCell>
                  ₹{slot.sales?.toLocaleString() ?? 0}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {slot.openAt?.toDate().toLocaleString()}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {slot.closeAt?.toDate().toLocaleString()}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {slot.createdAt
                    ?.toDate()
                    .toLocaleDateString()}
                </TableCell>

                <TableCell className="pr-6 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/admin/digit-draws/${slot.id}`
                      )
                    }
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
