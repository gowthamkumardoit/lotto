/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";

import { functions } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";

/* ---------------- TYPES ---------------- */

type JackpotSummary = {
  totalTickets: number; // total tickets sold
  totalCollection: number; // ₹ collected
  jackpotAmount: number; // jackpot pool
  totalPayout?: number; // payout after settlement
  guaranteedPct: number; // % crossed
  netResult?: number; // profit / loss
};

/* ---------------- COMPONENT ---------------- */

export function JackpotSummaryCards({ jackpotId }: { jackpotId: string }) {
  const [data, setData] = useState<JackpotSummary | null>(null);

  useEffect(() => {
    const fn = httpsCallable<{ jackpotId: string }, JackpotSummary>(
      functions,
      "getJackpotSummary",
    );

    fn({ jackpotId }).then((res) => setData(res.data));
  }, [jackpotId]);

  if (!data) return null;

  const isProfit =
    typeof data.netResult === "number" ? data.netResult >= 0 : null;

  return (
    <div className="flex gap-4">
      {/* Tickets Sold */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardContent className="p-4 text-center space-y-1">
            <div className="text-xs text-muted-foreground">Tickets Sold</div>
            <div className="text-xl font-semibold tabular-nums">
              🎟 {data.totalTickets.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardContent className="p-4 text-center space-y-1">
            <div className="text-xs text-muted-foreground">
              Total Collection
            </div>
            <div className="text-xl font-semibold tabular-nums">
              💰 ₹{data.totalCollection.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jackpot Pool */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardContent className="p-4 text-center space-y-1">
            <div className="text-xs text-muted-foreground">Jackpot Amount</div>
            <div className="text-xl font-semibold tabular-nums">
              🏆 ₹{data.jackpotAmount.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guaranteed % */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardContent className="p-4 text-center space-y-1">
            <div className="text-xs text-muted-foreground">Guaranteed %</div>
            <div className="text-xl font-semibold tabular-nums">
              🔒 {(data.guaranteedPct * 100).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Result (only meaningful after settlement) */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardContent
            className={`p-4 text-center space-y-1 ${
              isProfit === null
                ? ""
                : isProfit
                  ? "text-emerald-600"
                  : "text-red-600"
            }`}
          >
            <div className="text-xs text-muted-foreground">Net Result</div>

            {typeof data.netResult === "number" ? (
              <div className="text-xl font-semibold tabular-nums">
                ₹{Math.abs(data.netResult).toLocaleString("en-IN")}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Not settled</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
