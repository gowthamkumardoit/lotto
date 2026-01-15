/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

import { HeatMap2D } from "../heatmap/HeatMap2D";
import { HeatMap3D } from "../heatmap/HeatMap3D";
import { HeatMap4D } from "../heatmap/HeatMap4D";

/* ---------------- TYPES ---------------- */

type FlatItem = {
  type: "2D" | "3D" | "4D";
  number: string;
  amount: number;
  tickets: number;
};

type NumberStat = {
  number: string;
  amount: number;
  tickets: number;
};

type TypeStat = {
  totalTickets: number;
  totalAmount: number;
  numbers: NumberStat[];
};

type StatsResponse = {
  "2D"?: TypeStat;
  "3D"?: TypeStat;
  "4D"?: TypeStat;
};

/* ---------------- HELPERS ---------------- */

function groupStats(items: FlatItem[]): StatsResponse {
  const result: StatsResponse = {};

  items.forEach((item) => {
    const { type, number, amount, tickets } = item;

    if (!result[type]) {
      result[type] = {
        totalAmount: 0,
        totalTickets: 0,
        numbers: [],
      };
    }

    const bucket = result[type]!;

    bucket.totalAmount += amount;
    bucket.totalTickets += tickets;

    bucket.numbers.push({ number, amount, tickets });
  });

  Object.values(result).forEach((t) => {
    t.numbers.sort((a, b) => b.amount - a.amount);
  });

  return result;
}

function build2DHeatMap(numbers: NumberStat[]) {
  const map: Record<string, { amount: number; tickets: number }> = {};

  numbers.forEach((n) => {
    const key = n.number.padStart(2, "0");
    if (!map[key]) map[key] = { amount: 0, tickets: 0 };
    map[key].amount += n.amount;
    map[key].tickets += n.tickets;
  });

  return map;
}

function build3DHeatMap(numbers: NumberStat[]) {
  const map: Record<string, { amount: number; tickets: number }> = {};

  numbers.forEach((n) => {
    const key = n.number.padStart(3, "0");
    if (!map[key]) map[key] = { amount: 0, tickets: 0 };
    map[key].amount += n.amount;
    map[key].tickets += n.tickets;
  });

  return map;
}

/* ---------------- COMPONENT ---------------- */

export function MostPlayedNumbers({ drawRunId }: { drawRunId: string }) {
  const [data, setData] = useState<StatsResponse>({});
  const [view, setView] = useState<"2D" | "3D" | "4D">("2D");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* -------- Fetch Data -------- */

  useEffect(() => {
    if (!drawRunId) return;

    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const callable = httpsCallable(functions, "getMostPlayedNumbers");

        const res: any = await callable({ drawRunId });

        const grouped = groupStats(res.data.items);
        setData(grouped);
      } catch (err) {
        console.error(err);
        setError("Failed to load most played numbers");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [drawRunId]);

  /* -------- Prepare Views -------- */

  const heatMap2D = data["2D"] ? build2DHeatMap(data["2D"].numbers) : null;

  const heatMap3D = data["3D"] ? build3DHeatMap(data["3D"].numbers) : null;

  const fourDStats = data["4D"];

  const top10_4D = fourDStats ? fourDStats.numbers.slice(0, 10) : [];

  const least10_4D = fourDStats
    ? [...fourDStats.numbers].reverse().slice(0, 10)
    : [];

  /* -------- UI States -------- */

  if (loading) {
    return <div className="text-sm">Loading…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  /* -------- Render -------- */

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex gap-2">
        {(["2D", "3D", "4D"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded text-sm font-medium
              ${
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }
            `}
          >
            {v}
          </button>
        ))}
      </div>

      {/* 2D */}
      {view === "2D" && heatMap2D && <HeatMap2D map={heatMap2D} />}

      {/* 3D */}
      {view === "3D" && heatMap3D && <HeatMap3D map={heatMap3D} />}

      {/* 4D */}
      {view === "4D" && data["4D"] && (
        <HeatMap4D numbers={data["4D"].numbers} />
      )}
    </div>
  );
}
