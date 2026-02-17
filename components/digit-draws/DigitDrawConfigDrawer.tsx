/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, AlertTriangle, Ban } from "lucide-react";
import { toast } from "sonner";
import { httpsCallable } from "firebase/functions";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { functions } from "@/lib/firebase";

/* ---------------- TYPES ---------------- */

type DigitDrawStatus = "OPEN" | "LOCKED" | "RUNNING" | "DISABLED" | "COMPLETED";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draw: {
    id: string;
    name: string;
    digits: number;
    status: DigitDrawStatus;
    config?: any;
  };
};

/* ---------------- HELPERS ---------------- */

// Total combinations
const totalCombinations = (digits: number) => Math.pow(10, digits);

// Display range like 0000 – 9999
const combinationsRange = (digits: number) =>
  `${"0".repeat(digits)} – ${"9".repeat(digits)}`;

// ✅ Exclusive winners ONLY (0-match intentionally excluded)
const exclusiveWinners = (match: number, digits: number) => {
  if (match === digits) return 1; // 1st prize
  if (match === digits - 1) return 9; // 2nd prize
  if (match === digits - 2) return 90; // 3rd prize
  return 0; // 🚫 0-match disabled
};

/* ---------------- COMPONENT ---------------- */

export function DigitDrawConfigDrawer({ open, onOpenChange, draw }: Props) {
  const isEditable = draw.status === "OPEN";

  /* ---------------- STATE ---------------- */

  const [enabled, setEnabled] = useState(true);
  const [ticketPrice, setTicketPrice] = useState(10);

  const [firstPrize, setFirstPrize] = useState(0);
  const [secondPrize, setSecondPrize] = useState(0);
  const [thirdPrize, setThirdPrize] = useState(0);

  const [loading, setLoading] = useState(false);

  const thirdPrizeEnabled = draw.digits - 2 > 0;

  /* ---------------- HYDRATE ---------------- */

  useEffect(() => {
    if (open && draw.config) {
      setEnabled(draw.config.enabled ?? true);
      setTicketPrice(draw.config.ticketPrice ?? 10);
      setFirstPrize(draw.config.prizes?.exact ?? 0);
      setSecondPrize(draw.config.prizes?.minusOne ?? 0);
      setThirdPrize(draw.config.prizes?.minusTwo ?? 0);
    }
  }, [open, draw]);

  /* ---------------- DERIVED ---------------- */

  const combinations = useMemo(
    () => totalCombinations(draw.digits),
    [draw.digits],
  );

  const maxLiability = useMemo(() => {
    return (
      firstPrize * exclusiveWinners(draw.digits, draw.digits) +
      secondPrize * exclusiveWinners(draw.digits - 1, draw.digits) +
      thirdPrize * exclusiveWinners(draw.digits - 2, draw.digits)
    );
  }, [firstPrize, secondPrize, thirdPrize, draw.digits]);

  const maxRevenue = useMemo(
    () => combinations * ticketPrice,
    [combinations, ticketPrice],
  );

  const expectedMargin = useMemo(() => {
    if (maxRevenue === 0) return 0;
    return ((maxRevenue - maxLiability) / maxRevenue) * 100;
  }, [maxRevenue, maxLiability]);

  const invalidConfig = firstPrize < secondPrize || secondPrize < thirdPrize;

  /* ---------------- SAVE ---------------- */

  async function handleSave() {
    if (!isEditable || invalidConfig) return;

    setLoading(true);
    try {
      await httpsCallable(
        functions,
        "updateDigitDrawConfig",
      )({
        digitDrawId: draw.id,
        config: {
          enabled,
          ticketPrice,
          prizes: {
            exact: firstPrize,
            minusOne: secondPrize,
            minusTwo: thirdPrize,
          },
          // 0-match NEVER stored, NEVER paid
          stats: {
            totalCombinations: combinations,
            maxLiability,
            expectedMargin,
          },
        },
      });

      toast.success("Configuration saved");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        err?.message || err?.details || "Failed to save configuration",
      );
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- RENDER ---------------- */

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[420px] sm:w-[480px] p-0 flex flex-col"
      >
        {/* ---------- HEADER ---------- */}
        <div className="p-4 border-b">
          <SheetHeader>
            <SheetTitle>Digit Draw Configuration</SheetTitle>
            <SheetDescription>
              {draw.name} · {draw.digits}-Digit ·
            </SheetDescription>
          </SheetHeader>

          <div className="mt-3 rounded-md bg-muted p-2 text-sm">
            <strong>Total combinations:</strong>{" "}
            {combinationsRange(draw.digits)} ({combinations.toLocaleString()})
          </div>
        </div>

        {/* ---------- BODY (SCROLLABLE) ---------- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* ENABLE */}
          <div className="flex items-center justify-between">
            <Label>Enable Draw</Label>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={!isEditable}
            />
          </div>

          {/* TICKET PRICE */}
          <div className="space-y-2">
            <Label>Ticket Price</Label>
            <Input
              type="number"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(+e.target.value)}
              disabled={!isEditable}
            />
          </div>

          <Separator />

          {/* PRIZES */}
          <div className="space-y-4">
            <Label className="font-semibold">Prize Structure</Label>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                1st Prize — 1x winner (Exact {draw.digits} match)
              </Label>
              <Input
                type="number"
                value={firstPrize}
                onChange={(e) => setFirstPrize(+e.target.value)}
                disabled={!isEditable}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                2nd Prize — 9x winners ({draw.digits - 1} match)
              </Label>
              <Input
                type="number"
                value={secondPrize}
                onChange={(e) => setSecondPrize(+e.target.value)}
                disabled={!isEditable}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                3rd Prize —{" "}
                {thirdPrizeEnabled ? (
                  <>90x winners ({draw.digits - 2} match)</>
                ) : (
                  <>Disabled (0-digit match not allowed)</>
                )}
              </Label>

              <Input
                type="number"
                value={thirdPrize}
                onChange={(e) => setThirdPrize(+e.target.value)}
                disabled={!isEditable || !thirdPrizeEnabled}
              />
            </div>

            {/* 🚫 0-MATCH DISABLED */}
            <div className="flex items-start gap-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
              <Ban className="h-4 w-4 mt-0.5" />
              <span>
                <strong>0-digit match (no match)</strong> is permanently
                disabled and will never receive a prize.
              </span>
            </div>

            {invalidConfig && (
              <p className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                1st prize must be ≥ 2nd prize ≥ 3rd prize
              </p>
            )}
          </div>

          <Separator />

          {/* STATS */}
          <div className="space-y-2 text-sm">
            <div>
              <strong>Max Liability:</strong> ₹{maxLiability.toLocaleString()}
            </div>
            <div>
              <strong>Max Revenue:</strong> ₹{maxRevenue.toLocaleString()}
            </div>
            <div
              className={
                expectedMargin < 0
                  ? "text-red-600"
                  : expectedMargin < 20
                    ? "text-amber-600"
                    : "text-emerald-600"
              }
            >
              <strong>Expected Margin:</strong> {expectedMargin.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* ---------- FOOTER ---------- */}
        <div className="p-4 border-t">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!isEditable || loading || invalidConfig}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
