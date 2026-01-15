"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/* ---------------- TYPES ---------------- */

type TicketStats = {
  winners: number; // number of winning tickets
  totalAmount: number; // sum of ticket.amount
};

type TicketStatsMap = {
  "2D": TicketStats;
  "3D": TicketStats;
  "4D": TicketStats;
};

type ConfigSnapshot = {
  enable2D: boolean;
  enable3D: boolean;
  enable4D: boolean;
  multiplier2D: number;
  multiplier3D: number;
  multiplier4D: number;
};

type PreviewProps = {
  stats: TicketStatsMap;
  config: ConfigSnapshot;
  totalSales: number;
  onDeclare: () => Promise<void> | void;
  loading?: boolean;
};

/* ---------------- COMPONENT ---------------- */

export function DrawPayoutPreview({
  stats,
  config,
  totalSales,
  onDeclare,
  loading,
}: PreviewProps) {
  const rows: {
    type: "2D" | "3D" | "4D";
    winners: number;
    betAmount: number;
    multiplier: number;
    payout: number;
  }[] = [];
  const [confirming, setConfirming] = useState(false);

  let totalPayout = 0;

  if (config.enable2D) {
    const payout = stats["2D"].totalAmount * config.multiplier2D;
    rows.push({
      type: "2D",
      winners: stats["2D"].winners,
      betAmount: stats["2D"].totalAmount,
      multiplier: config.multiplier2D,
      payout,
    });
    totalPayout += payout;
  }

  if (config.enable3D) {
    const payout = stats["3D"].totalAmount * config.multiplier3D;
    rows.push({
      type: "3D",
      winners: stats["3D"].winners,
      betAmount: stats["3D"].totalAmount,
      multiplier: config.multiplier3D,
      payout,
    });
    totalPayout += payout;
  }

  if (config.enable4D) {
    const payout = stats["4D"].totalAmount * config.multiplier4D;
    rows.push({
      type: "4D",
      winners: stats["4D"].winners,
      betAmount: stats["4D"].totalAmount,
      multiplier: config.multiplier4D,
      payout,
    });
    totalPayout += payout;
  }

  const profit = totalSales - totalPayout;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full mt-4" size="lg">
          Preview Winners
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>💰 Payout Preview</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 text-sm">
          {rows.map((r) => (
            <div
              key={r.type}
              className="flex justify-between rounded border p-2"
            >
              <div>
                <div>
                  {r.type} — {r.winners} winners
                </div>
                <div className="text-xs text-muted-foreground">
                  Bet ₹{r.betAmount.toLocaleString()} × {r.multiplier}
                </div>
              </div>

              <span className="font-medium">₹{r.payout.toLocaleString()}</span>
            </div>
          ))}

          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Total Payout</span>
              <span className="font-semibold">
                ₹{totalPayout.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Profit</span>
              <span
                className={`font-semibold ${
                  profit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ₹{profit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        {confirming && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            ⚠️ This action is irreversible. Winners will be finalized and
            payouts will be issued.
          </div>
        )}
        {/* ✅ CONFIRM ACTION */}
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </AlertDialogCancel>

          {!confirming ? (
            <Button
              variant="destructive"
              onClick={() => setConfirming(true)}
              disabled={loading}
            >
              Declare Winners
            </Button>
          ) : (
            <AlertDialogAction
              onClick={onDeclare}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Declaring..." : "Yes, Declare"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
