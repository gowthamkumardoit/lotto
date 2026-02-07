"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";

interface Winner {
  winAmount?: number;
  drawRunId?: string;
}

function getDateFromDrawRunId(drawRunId?: string): Date | null {
  if (!drawRunId) return null;
  const [, datePart] = drawRunId.split("_");
  if (!datePart) return null;

  const date = new Date(datePart);
  return isNaN(date.getTime()) ? null : date;
}

export function WinnerSummary() {
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "winners"), (snap) => {
      const data: Winner[] = [];
      snap.forEach((doc) => data.push(doc.data() as Winner));
      setWinners(data);
    });

    return () => unsub();
  }, []);

  /* ---------------- DERIVED METRICS ---------------- */

  const {
    totalWinners,
    totalPayout,
    todayWinners,
    todayPayout,
    avgPayout,
  } = useMemo(() => {
    let totalWinners = 0;
    let totalPayout = 0;
    let todayWinners = 0;
    let todayPayout = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const w of winners) {
      totalWinners += 1;
      totalPayout += w.winAmount ?? 0;

      const drawDate = getDateFromDrawRunId(w.drawRunId);
      if (!drawDate) continue;

      drawDate.setHours(0, 0, 0, 0);

      if (drawDate.getTime() === today.getTime()) {
        todayWinners += 1;
        todayPayout += w.winAmount ?? 0;
      }
    }

    return {
      totalWinners,
      totalPayout,
      todayWinners,
      todayPayout,
      avgPayout:
        totalWinners > 0
          ? Math.round(totalPayout / totalWinners)
          : 0,
    };
  }, [winners]);

  /* ---------------- UI ---------------- */

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <StatCard label="Total Winners" value={totalWinners} />
      <StatCard
        label="Total Payout"
        value={`₹${totalPayout.toLocaleString()}`}
      />
      <StatCard
        label="Today Winners"
        value={todayWinners}
      />
      <StatCard
        label="Avg Payout / Winner"
        value={`₹${avgPayout.toLocaleString()}`}
      />
    </div>
  );
}

/* ---------------- SMALL COMPONENT ---------------- */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
