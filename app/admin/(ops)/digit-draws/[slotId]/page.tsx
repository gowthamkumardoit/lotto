/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { TicketAvailabilityViewer } from "@/components/digit-draws/TicketGridViewer";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { toast } from "sonner";
import { SlotResultPanel } from "@/components/digit-draws/SlotResultPanel";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import confetti from "canvas-confetti";
import { BackButton } from "@/components/common/BackButton";
import { Input } from "@/components/ui/input";
import { ExtendCloseTimePanel } from "@/components/digit-draws/ExtendCloseTimePanel";
import { RefreshWrapper } from "@/components/ui/RefreshWrapper";
type Slot = {
  id: string;
  name: string;
  digits: number;
  status: string;
  sales: number;
  openAt: any;
  closeAt: any;
  configSnapshot: any;
  result: any;
};

export default function DigitDrawSlotDetailsPage() {
  const { slotId } = useParams();
  const [slot, setSlot] = useState<Slot | null>(null);
  const [now, setNow] = useState(0);
  const [locking, setLocking] = useState(false);

  const [runOpen, setRunOpen] = useState(false);
  const [runningDraw, setRunningDraw] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<string>("--");
  const [canClose, setCanClose] = useState(false);
  const rollingRef = useRef(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const handleLock = async () => {
    if (!slot?.id) return;

    try {
      setLocking(true);

      const lockFn = httpsCallable(functions, "lockDigitDrawSlot");

      await lockFn({ slotId: slot.id });

      toast.success("Slot locked successfully");

      setLockDialogOpen(false); // ✅ close only after success
    } catch (error: any) {
      console.error("Lock failed:", error);
      toast.error(error?.message || "Failed to lock the slot");
    } finally {
      setLocking(false);
    }
  };

  const handleRunDraw = async () => {
    if (!slot?.id) return;

    try {
      setRunningDraw(true);
      setCanClose(false);

      const runFn = httpsCallable(functions, "runDigitDrawSlot");

      rollingRef.current = true;

      const roll = () => {
        if (!rollingRef.current) return;

        const random = Math.floor(Math.random() * Math.pow(10, slot.digits))
          .toString()
          .padStart(slot.digits, "0");

        setDisplayNumber(random);
        requestAnimationFrame(roll);
      };

      roll();

      const response: any = await runFn({ slotId: slot.id });
      const winningNumber = response.data?.winningNumber;

      rollingRef.current = false;

      setTimeout(() => {
        setDisplayNumber(winningNumber);

        confetti({
          particleCount: 250,
          spread: 120,
          origin: { y: 0.6 },
        });

        toast.success("Draw executed successfully");

        setRunningDraw(false);
        setCanClose(true);
      }, 800);
    } catch (error: any) {
      rollingRef.current = false;
      setRunningDraw(false);
      setCanClose(true);
      toast.error(error?.message || "Failed to run draw");
    }
  };

  useEffect(() => {
    if (!runOpen) {
      setDisplayNumber("--");
      setCanClose(false);
      setRunningDraw(false);
    }
  }, [runOpen]);
  /* ---------------- TIMER ---------------- */

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------- LOAD SLOT ---------------- */

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "digitDrawSlots", slotId as string),
      (snap) => {
        if (snap.exists()) {
          setSlot(snap.data() as Slot);
        }
      },
    );

    return () => unsub();
  }, [slotId]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCloseTime, setEditedCloseTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!slot) return;

    const close = slot.closeAt?.toDate?.() || new Date(slot.closeAt);

    setEditedCloseTime(close);
  }, [slot]);

  if (!slot) return <div className="p-6">Loading...</div>;

  const openTime = slot.openAt?.toDate?.() || new Date(slot.openAt);
  const closeTime = slot.closeAt?.toDate?.() || new Date(slot.closeAt);

  const remainingMs = closeTime.getTime() - now;
  const remainingSeconds = Math.max(Math.floor(remainingMs / 1000), 0);

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const statusColor =
    {
      OPEN: "bg-green-500",
      LOCKED: "bg-yellow-500",
      RUNNING: "bg-blue-500",
      SETTLED: "bg-purple-500",
      CANCELLED: "bg-red-500",
    }[slot.status] || "bg-gray-500";

  const config = slot.configSnapshot || {};

  const totalCombinations = slot.configSnapshot?.stats?.totalCombinations ?? 0;

  const ticketPrice = slot.configSnapshot?.ticketPrice ?? 0;

  const totalRevenueCap = totalCombinations * ticketPrice;

  const salesRatio =
    totalRevenueCap === 0
      ? 0
      : Math.min((slot.sales / totalRevenueCap) * 100, 100);

  const getSalesGradient = (ratio: number) => {
    if (ratio < 40) {
      return "from-emerald-500 to-green-400";
    }
    if (ratio < 75) {
      return "from-amber-500 to-yellow-400";
    }
    return "from-red-500 to-rose-400";
  };

  const winningNumber = slot?.result?.winningNumber;
  const isDeclared = slot?.result?.isDeclared ?? false;

  const handleSave = async () => {
    if (!slot?.id) {
      toast.error("Slot not found");
      return;
    }

    if (!editedCloseTime) {
      toast.error("Please select a valid close time");
      return;
    }

    try {
      setIsSaving(true);

      // 🔒 Optional frontend guard
      const openTime = slot.openAt?.toDate?.() || new Date(slot.openAt);

      if (editedCloseTime <= openTime) {
        toast.error("Close time must be after open time");
        return;
      }

      const updateFn = httpsCallable(functions, "updateKuberGoldCloseTime");

      await updateFn({
        slotId: slot.id,
        newCloseAt: editedCloseTime.toISOString(),
      });

      toast.success("Close time updated successfully");

      setIsEditing(false);
    } catch (error: any) {
      console.error("Failed to update close time:", error);

      toast.error(error?.message || "Failed to update close time");
    } finally {
      setIsSaving(false);
    }
  };

  const refetchSlot = async () => {
    if (!slotId) return;

    const snap = await new Promise<any>((resolve) => {
      const unsub = onSnapshot(
        doc(db, "digitDrawSlots", slotId as string),
        (s) => {
          resolve(s);
          unsub();
        },
      );
    });

    if (snap.exists()) {
      setSlot(snap.data() as Slot);
    }
  };

  return (
    <RefreshWrapper onRefresh={refetchSlot}>
      <div className="p-6 space-y-6">
        <BackButton fallbackHref="/admin/draws" />
        {/* HEADER + ACTIONS */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{slot.name}</h1>
            <p className="text-sm text-muted-foreground">
              {slot.digits} Digit Draw
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={`${statusColor} text-white`}>{slot.status}</Badge>

            {/* LOCK BUTTON */}
            {slot.status === "OPEN" && (
              <AlertDialog
                open={lockDialogOpen}
                onOpenChange={setLockDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => setLockDialogOpen(true)}
                  >
                    Lock Slot
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Lock this slot?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Once locked, no new tickets can be purchased.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={locking}>
                      Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction onClick={handleLock} disabled={locking}>
                      {locking ? "Locking..." : "Confirm Lock"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* RUN DRAW BUTTON */}
            {slot.status === "LOCKED" && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setRunOpen(true)}
              >
                Run Draw
              </Button>
            )}

            {/* CANCEL BUTTON */}
            {/* {(slot.status === "OPEN" || slot.status === "LOCKED") && (
            <Button variant="destructive">Cancel Slot</Button>
          )} */}
          </div>
        </div>

        {/* DRAW CONFIG BANNER */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* LEFT SECTION */}
            <div>
              <p className="text-sm opacity-80">Draw Configuration</p>
              <h2 className="text-2xl font-bold">
                {slot.digits}D Prize Structure
              </h2>

              {/* Expected Margin + Max Liability */}
              <div className="mt-4 flex gap-6 text-sm opacity-90">
                <div>
                  <span className="opacity-70">Expected Margin</span>
                  <p className="font-semibold">
                    {slot.configSnapshot?.stats?.expectedMargin.toFixed(2) ?? 0}
                    %
                  </p>
                </div>

                <div>
                  <span className="opacity-70">Max Liability</span>
                  <p className="font-semibold">
                    ₹{" "}
                    {slot.configSnapshot?.stats?.maxLiability?.toLocaleString() ??
                      0}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT GRID */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-center">
              {/* Ticket Price */}
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-xs opacity-70">Ticket Price</p>
                <p className="text-lg font-semibold">
                  ₹ {slot.configSnapshot?.ticketPrice ?? 0}
                </p>
              </div>

              {/* 1st Prize (HIGHLIGHTED) */}
              <div className="bg-yellow-400 text-black rounded-xl p-4 shadow-lg scale-105">
                <p className="text-xs font-semibold">🥇 1st Prize</p>
                <p className="text-xl font-bold">
                  ₹ {slot.configSnapshot?.prizes?.exact?.toLocaleString() ?? 0}
                </p>
              </div>

              {/* 2nd Prize */}
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-xs opacity-70">🥈 2nd Prize</p>
                <p className="text-lg font-semibold">
                  ₹{" "}
                  {slot.configSnapshot?.prizes?.minusOne?.toLocaleString() ?? 0}
                </p>
              </div>

              {/* 3rd Prize */}
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-xs opacity-70">🥉 3rd Prize</p>
                <p className="text-lg font-semibold">
                  ₹{" "}
                  {slot.configSnapshot?.prizes?.minusTwo?.toLocaleString() ?? 0}
                </p>
              </div>

              {/* Total Tickets */}
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-xs opacity-70">Total Tickets</p>
                <p className="text-lg font-semibold">
                  {slot.configSnapshot?.stats?.totalCombinations ?? 0}
                </p>
              </div>

              {/* TOTAL PRIZE POOL (HIGHLIGHTED) */}
              {/* TOTAL PRIZE POOL (DERIVED) */}
              <div className="bg-emerald-400 text-black rounded-xl p-4 shadow-lg scale-105">
                <p className="text-xs font-semibold">Total Prize Pool</p>
                <p className="text-xl font-bold">
                  ₹{" "}
                  {(
                    slot.configSnapshot?.stats?.maxLiability ?? 0
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ExtendCloseTimePanel
          slotId={slot.id}
          currentCloseAt={closeTime}
          callableName="updateKuberGoldCloseTime"
          disabled={slot.status !== "OPEN"}
        />
        {/* TIME WINDOW */}
        <Card className="border-none shadow-md">
          <CardContent className="p-6 space-y-6">
            {/* Title */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Draw Schedule</h2>

              <div className="flex items-center gap-2">
                {slot.status === "OPEN" && (
                  <div className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    Live Now
                  </div>
                )}

                {!isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Open Time */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  O
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Opens At</p>
                  <p className="font-medium">{format(openTime, "PPP p")}</p>
                </div>
              </div>

              {/* Close Time */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                  C
                </div>

                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Closes At</p>

                  {!isEditing ? (
                    <>
                      <p className="font-medium">
                        {format(closeTime, "PPP p")}
                      </p>

                      {slot.status === "OPEN" && (
                        <p className="mt-2 text-lg font-semibold text-red-600">
                          Closes in: {formatCountdown(remainingSeconds)}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        type="datetime-local"
                        value={
                          editedCloseTime
                            ? format(editedCloseTime, "yyyy-MM-dd'T'HH:mm")
                            : ""
                        }
                        onChange={(e) =>
                          setEditedCloseTime(new Date(e.target.value))
                        }
                      />

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditedCloseTime(closeTime);
                            setIsEditing(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SALES SUMMARY */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-semibold">
                  ₹ {slot.sales?.toLocaleString() ?? 0}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground">Utilization</p>
                <p className="text-lg font-medium">{salesRatio.toFixed(2)}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getSalesGradient(
                    salesRatio,
                  )} transition-all duration-700`}
                  style={{ width: `${salesRatio}%` }}
                />
              </div>

              {/* Sub Labels */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹ 0</span>
                <span>₹ {totalRevenueCap.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RESULT PANEL */}
        <SlotResultPanel
          slotId={slot.id}
          status={slot.status}
          winningNumber={winningNumber}
          digits={slot.digits}
          declared={isDeclared}
        />
        {/* CONFIG SNAPSHOT (HUMAN READABLE) */}

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Ticket Availability</h2>

            <TicketAvailabilityViewer slotId={slot.id} digits={slot.digits} />
          </CardContent>
        </Card>

        <Dialog open={runOpen} onOpenChange={setRunOpen}>
          <DialogContent className="max-w-md text-center space-y-6">
            <DialogHeader>
              <DialogTitle>Execute Draw</DialogTitle>
            </DialogHeader>
            {/* Rolling Number */}
            <div className="text-6xl font-bold tracking-widest py-6">
              {displayNumber}
            </div>
            <Button
              onClick={handleRunDraw}
              disabled={runningDraw}
              className="w-full"
            >
              {runningDraw ? "Running..." : "Run Now"}
            </Button>
            {canClose && (
              <Button
                onClick={() => setRunOpen(false)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Close
              </Button>
            )}
          </DialogContent>
        </Dialog>
      </div>
      ,
    </RefreshWrapper>
  );
}
