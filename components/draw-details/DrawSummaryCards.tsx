/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DrawSummary = {
  totalTickets: number;
  totalSales: number;
  totalPayout: number;
  winnersCount: number;
  netResult: number;
};

export function DrawSummaryCards({ drawRunId }: { drawRunId: string }) {
  const [data, setData] = useState<DrawSummary | null>(null);

  useEffect(() => {
    const fn = httpsCallable<{ drawRunId: string }, DrawSummary>(
      functions,
      "getDrawSummary"
    );
    fn({ drawRunId }).then((res) => setData(res.data));
  }, [drawRunId]);

  if (!data) return null;

  const isProfit = data.netResult >= 0;

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0">
        <Card>
          <CardContent className="p-4 text-center space-y-1">
            <div className="text-xs text-muted-foreground">Tickets Sold</div>
            <div className="text-xl font-semibold tabular-nums">
              🎟 {data.totalTickets}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-w-0">
        <Card>
          <CardContent className="p-4 text-center space-y-1">
            <div className="text-xs text-muted-foreground">Amount Used</div>
            <div className="text-xl font-semibold tabular-nums">
              💰 ₹{data.totalSales.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-w-0">
        <Card>
          <CardContent className="p-4 text-center space-y-1">
            <div className="text-xs text-muted-foreground">Total Payout</div>
            <div className="text-xl font-semibold tabular-nums">
              🏆 ₹{data.totalPayout.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-w-0">
        <Card>
          <CardContent className="p-4 text-center space-y-1">
            <div className="text-xs text-muted-foreground">Winners</div>
            <div className="text-xl font-semibold tabular-nums">
              🥇 {data.winnersCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-w-0">
        <Card>
          <CardContent className="p-4 text-center space-y-1 text-emerald-600">
            <div className="text-xs text-muted-foreground">Profit</div>
            <div className="text-xl font-semibold tabular-nums">
              ₹{Math.abs(data.netResult).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
