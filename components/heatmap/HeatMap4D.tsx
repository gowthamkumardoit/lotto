"use client";

import { useMemo, useState } from "react";

/* ---------------- TYPES ---------------- */

type FourDItem = {
  number: string;
  amount: number;
  tickets: number;
};

type HeatMap4DProps = {
  numbers: FourDItem[];
};

/* ---------------- COMPONENT ---------------- */

export function HeatMap4D({ numbers }: HeatMap4DProps) {
  const [minTickets, setMinTickets] = useState(0);
  const [minAmount, setMinAmount] = useState(0);
  const [tab, setTab] = useState<"TOP" | "LEAST">("TOP");

  let totalAmount = 0;
  let totalTickets = 0;
  let maxAmount = 0;

  numbers.forEach((n) => {
    totalAmount += n.amount;
    totalTickets += n.tickets;
    if (n.amount > maxAmount) {
      maxAmount = n.amount;
    }
  });

  /* -------- Filtered numbers -------- */

  const filteredNumbers = useMemo(() => {
    return numbers.filter(
      (n) => n.tickets >= minTickets && n.amount >= minAmount,
    );
  }, [numbers, minTickets, minAmount]);

  /* -------- Top & Least -------- */

  const top10 = filteredNumbers.slice(0, 10);

  const least10 = [...filteredNumbers].reverse().slice(0, 10);

  const visible = tab === "TOP" ? top10 : least10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">4D Numbers Analysis</h3>

        <div className="text-sm text-muted-foreground">
          ₹{totalAmount} • {totalTickets} tickets
        </div>
      </div>

      {/* Filters (future ready) */}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("TOP")}
          className={`px-4 py-2 rounded text-sm font-medium
            ${
              tab === "TOP"
                ? "bg-primary text-primary-foreground"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }
          `}
        >
          🔥 Top 10
        </button>

        <button
          onClick={() => setTab("LEAST")}
          className={`px-4 py-2 rounded text-sm font-medium
            ${
              tab === "LEAST"
                ? "bg-primary text-primary-foreground"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }
          `}
        >
          ❄️ Least 10
        </button>
      </div>

      {/* List */}
      <div className="rounded-lg border border-border p-4 bg-card">
        <div className="space-y-2 text-sm">
          {visible.map((n) => (
            <div
              key={n.number}
              className="flex justify-between rounded-md bg-muted px-3 py-2"
            >
              <span className="font-medium">{n.number}</span>

              <span className="text-muted-foreground">
                ₹{n.amount} • {n.tickets} tickets
              </span>
            </div>
          ))}

          {visible.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No numbers match the filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
