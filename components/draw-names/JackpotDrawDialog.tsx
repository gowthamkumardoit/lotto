/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

import { functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ---------------- TYPES ---------------- */
type Tier = {
  matchDigits: number;
  winnersCount: number;
  prizePerWinner: number;
};
type Mode = "create" | "edit";

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: Mode;
  drawId?: string;
  children?: React.ReactNode;
};
type RecurringType = "none" | "daily" | "weekly" | "monthly";

/* ---------------- HELPERS ---------------- */
function generatePrizeTiers(digits: number, prev?: Tier[]): Tier[] {
  const tiers: Tier[] = [];

  // Top 3 prizes → full match
  for (let i = 0; i < 3; i++) {
    tiers.push(
      prev?.[i] ?? {
        matchDigits: digits,
        winnersCount: 0,
        prizePerWinner: 0,
      },
    );
  }

  // Remaining prizes → digits-1 down to 3
  let index = 3;
  for (let d = digits - 1; d >= 3; d--) {
    tiers.push(
      prev?.[index] ?? {
        matchDigits: d,
        winnersCount: 0,
        prizePerWinner: 0,
      },
    );
    index++;
  }

  return tiers;
}

function getPrizeLabel(index: number) {
  const n = index + 1;
  if (n === 1) return "1st Prize";
  if (n === 2) return "2nd Prize";
  if (n === 3) return "3rd Prize";
  return `${n}th Prize`;
}

function getMultiplier(digits: number, matchDigits: number) {
  return Math.pow(10, digits - matchDigits);
}

function formatINR(value: number) {
  return value.toLocaleString("en-IN");
}

function formatIndianWords(value: number) {
  if (value >= 1e7) {
    return `${(value / 1e7).toFixed(2)} crore`;
  }
  if (value >= 1e5) {
    return `${(value / 1e5).toFixed(2)} lakh`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)} thousand`;
  }
  return value.toString();
}

/* ---------------- COMPONENT ---------------- */
export function CreateJackpotDialog({
  children,
  open: controlledOpen,
  onOpenChange,
  mode = "create",
  drawId,
}: Props) {
  /* ---------------- AUTH ---------------- */
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, [auth]);

  /* ---------------- STATE ---------------- */

  const [name, setName] = useState("");
  const [drawDate, setDrawDate] = useState("");
  const [time, setTime] = useState("");

  const [ticketPrice, setTicketPrice] = useState(100);
  const [digits, setDigits] = useState(5);
  const [jackpotAmount, setJackpotAmount] = useState(100000);
  const [maxExtensions, setMaxExtensions] = useState(3);
  const [recurring, setRecurring] = useState<RecurringType>("none");

  const [tiers, setTiers] = useState<Tier[]>(() => generatePrizeTiers(5));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = mode === "edit";
  const [open, setOpen] = useState(false);

  const actualOpen = controlledOpen ?? open;
  const setActualOpen = onOpenChange ?? setOpen;
  const [status, setStatus] = useState<
    "CREATED" | "OPEN" | "GUARANTEED" | "LOCKED" | "SETTLED"
  >("CREATED");

  /* ---------------- REGENERATE TIERS ON DIGITS CHANGE ---------------- */
  useEffect(() => {
    setTiers((prev) => generatePrizeTiers(digits, prev));
  }, [digits]);

  useEffect(() => {
    if (!isEdit || !drawId || !actualOpen) return;

    (async () => {
      const snap = await getDoc(doc(db, "jackpotDraws", drawId));
      if (!snap.exists()) return;

      const d = snap.data();

      setName(d.name);
      setDrawDate(d.drawDate);
      setTime(d.time);
      setTicketPrice(d.ticketPrice);
      setDigits(d.digits);
      setJackpotAmount(d.jackpotAmount);
      setMaxExtensions(d.maxExtensions);
      setRecurring(d.recurring);
      setTiers(d.prizeTiers);
      setStatus(d.status);
    })();
  }, [isEdit, drawId, actualOpen]);

  /* ---------------- CALCULATIONS ---------------- */
  const totalRisk = useMemo(() => {
    return tiers.reduce((sum, t) => {
      const multiplier = getMultiplier(digits, t.matchDigits);
      return sum + t.winnersCount * t.prizePerWinner * multiplier;
    }, 0);
  }, [tiers, digits]);

  const totalNumberSpace = Math.pow(10, digits);
  const requiredSales = totalRisk / ticketPrice;
  const guaranteedSalesPct = requiredSales / totalNumberSpace;

  const isSafe = totalRisk <= jackpotAmount;

  const totalTickets = totalNumberSpace;
  const maxCollectionAmount = totalTickets * ticketPrice;

  /* ---------------- SUBMIT ---------------- */
  async function handleCreate() {
    if (!user) return;

    if (!name || !drawDate || !time) {
      setError("Jackpot name, draw date and time are required");
      return;
    }

    if (!isSafe) {
      setError("Worst-case payout exceeds jackpot amount");
      return;
    }

    setLoading(true);
    setError("");

    const toastId = toast.loading("Creating jackpot draw...");

    try {
      const fn = httpsCallable(functions, "createJackpotDraw");

      await fn({
        name,
        drawDate,
        time,
        ticketPrice,
        digits,
        jackpotAmount,
        guaranteedSalesPct,
        maxExtensions,
        recurring,
        prizeTiers: tiers,
      });

      toast.success("Jackpot draw created", { id: toastId });
      setActualOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Create failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!user || !drawId) return;

    if (!name || !drawDate || !time) {
      setError("Jackpot name, draw date and time are required");
      return;
    }

    if (!isSafe) {
      setError("Worst-case payout exceeds jackpot amount");
      return;
    }

    setLoading(true);
    setError("");

    const toastId = toast.loading("Updating jackpot draw...");

    try {
      const fn = httpsCallable(functions, "updateJackpotDraw");

      await fn({
        drawId,
        name,
        drawDate,
        time,
        ticketPrice,
        digits,
        jackpotAmount,
        guaranteedSalesPct,
        maxExtensions,
        recurring,
        prizeTiers: tiers,
        status, // ← editable in edit mode
      });

      toast.success("Jackpot updated", { id: toastId });
      setActualOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Update failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- RENDER ---------------- */
  if (!authReady) return <Loader2 className="mx-auto animate-spin" />;
  if (!user) return null;

  return (
    <Sheet open={actualOpen} onOpenChange={setActualOpen}>
      {mode !== "edit" && (
        <SheetTrigger asChild>
          {children ?? (
            <Button className="bg-amber-500 text-black hover:bg-amber-600">
              + Create Jackpot
            </Button>
          )}
        </SheetTrigger>
      )}

      <SheetContent
        side="right"
        className="fixed inset-y-0 right-0 w-[920px] max-w-none sm:max-w-none p-0 flex flex-col"
      >
        <SheetHeader className="px-10 py-6 border-b">
          <SheetTitle className="text-lg font-semibold">
            {mode === "edit"
              ? "Edit Jackpot Configuration"
              : "Create Jackpot Draw"}
          </SheetTitle>
        </SheetHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-12">
          {/* IDENTITY */}
          <section className="space-y-6">
            <h3 className="text-sm font-semibold">Identity & Schedule</h3>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <Label className="text-xs mb-1">Jackpot Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <Label className="text-xs mb-1">Draw Date</Label>
                <Input
                  type="date"
                  value={drawDate}
                  onChange={(e) => setDrawDate(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs mb-1">Draw Time</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs mb-1">Recurring</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={recurring}
                  onChange={(e) =>
                    setRecurring(e.target.value as RecurringType)
                  }
                >
                  <option value="none">No Recurring</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </section>

          {isEdit && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Jackpot Status</h3>

              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="CREATED">CREATED</option>
                <option value="OPEN">OPEN</option>
                <option value="GUARANTEED">GUARANTEED</option>
                <option value="LOCKED">LOCKED</option>
                <option value="SETTLED">SETTLED</option>
              </select>
            </section>
          )}

          {/* ECONOMICS */}
          <section className="space-y-6">
            <h3 className="text-sm font-semibold">
              Ticket & Jackpot Economics
            </h3>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <Label className="text-xs mb-1">Ticket Price (₹)</Label>
                <Input
                  type="number"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(+e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs mb-1">Number of Digits</Label>
                <Input
                  type="number"
                  value={digits}
                  onChange={(e) => setDigits(+e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs mb-1">Jackpot Amount (₹)</Label>
                <Input
                  type="number"
                  value={jackpotAmount}
                  onChange={(e) => setJackpotAmount(+e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs mb-1">Max Extensions</Label>
                <Input
                  type="number"
                  value={maxExtensions}
                  onChange={(e) => setMaxExtensions(+e.target.value)}
                />
              </div>
            </div>
          </section>
          {/* SECTION — Ticket Capacity & Max Collection */}
          <section className="rounded-lg border bg-muted/40 px-6 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="text-sm">
                Total tickets that can be issued:{" "}
                <b>{formatINR(totalTickets)}</b>{" "}
                <span className="text-muted-foreground">
                  ({formatIndianWords(totalTickets)})
                </span>
              </div>

              <div className="text-sm font-medium">
                Maximum collection amount:{" "}
                <b>₹{formatINR(maxCollectionAmount)}</b>{" "}
                <span className="text-muted-foreground">
                  ({formatIndianWords(maxCollectionAmount)} rupees)
                </span>
              </div>
            </div>
          </section>

          {/* SECTION — Risk & Guarantee Info */}
          <section className="rounded-lg border bg-muted/40 px-6 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="text-sm">
                Guaranteed after selling{" "}
                <b>{(guaranteedSalesPct * 100).toFixed(2)}%</b> of all possible
                tickets
              </div>

              <div
                className={`text-sm font-medium ${
                  isSafe ? "text-green-700" : "text-red-700"
                }`}
              >
                Worst-case payout: ₹{totalRisk.toLocaleString()}
                {!isSafe && " (exceeds jackpot)"}
              </div>
            </div>
          </section>

          {/* PRIZES */}
          <section className="space-y-6">
            <h3 className="text-sm font-semibold">Prize Distribution</h3>

            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-[140px_1fr_1fr_1fr_1fr_1fr] gap-4 bg-muted px-4 py-3 text-xs font-medium">
                <div>Prize</div>
                <div>Match Digits</div>
                <div>Winners</div>
                <div>Prize / Winner (₹)</div>
                <div>Multiplier</div>
                <div>Total Amount (₹)</div>
              </div>

              {tiers.map((t, i) => {
                const multiplier = getMultiplier(digits, t.matchDigits);
                const total = t.winnersCount * t.prizePerWinner * multiplier;

                return (
                  <div
                    key={i}
                    className="grid grid-cols-[140px_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-t items-center"
                  >
                    <div className="font-semibold">{getPrizeLabel(i)}</div>

                    <Input
                      type="number"
                      value={t.matchDigits}
                      onChange={(e) => {
                        const v = [...tiers];
                        v[i].matchDigits = +e.target.value;
                        setTiers(v);
                      }}
                    />

                    <Input
                      type="number"
                      value={t.winnersCount}
                      onChange={(e) => {
                        const v = [...tiers];
                        v[i].winnersCount = +e.target.value;
                        setTiers(v);
                      }}
                    />

                    <Input
                      type="number"
                      value={t.prizePerWinner}
                      onChange={(e) => {
                        const v = [...tiers];
                        v[i].prizePerWinner = +e.target.value;
                        setTiers(v);
                      }}
                    />

                    <Input value={multiplier} disabled />

                    <div className="tabular-nums">
                      ₹{total.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="border-t px-10 py-5 flex justify-end">
          <Button
            disabled={!isSafe || loading}
            onClick={mode === "edit" ? handleUpdate : handleCreate}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "edit" ? "Update Jackpot" : "Create Jackpot"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
