"use client";

import { useState, useMemo } from "react";
import { HeatGrid2D } from "./HeatGrid2D";

type HeatMap2DProps = {
  map: Record<
    string,
    {
      amount: number;
      tickets: number;
    }
  >;
};

export function HeatMap2D({ map }: HeatMap2DProps) {
  const [minTickets, setMinTickets] = useState(0);
  const [minAmount, setMinAmount] = useState(0);

  let maxAmount = 0;
  let totalAmount = 0;
  let totalTickets = 0;

  Object.values(map).forEach((cell) => {
    if (cell.amount > maxAmount) {
      maxAmount = cell.amount;
    }

    totalAmount += cell.amount;
    totalTickets += cell.tickets;
  });

  // Filtered heat map (derived state)
  const filteredMap = useMemo(() => {
    const result: typeof map = {};

    Object.entries(map).forEach(([key, value]) => {
      if (value.tickets >= minTickets && value.amount >= minAmount) {
        result[key] = value;
      }
    });

    return result;
  }, [map, minTickets, minAmount]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">2D Numbers Heat Map</h3>

        <div className="text-sm text-muted-foreground">
          ₹{totalAmount} • {totalTickets} tickets
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Low</span>
        <div className="h-2 w-40 rounded bg-gradient-to-r from-green-500 via-yellow-400 to-red-600" />
        <span className="text-muted-foreground">High</span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tickets slider */}
        <div>
          <label className="text-xs text-muted-foreground">
            Min Tickets: {minTickets}
          </label>
          <input
            type="range"
            min={0}
            max={50}
            value={minTickets}
            onChange={(e) => setMinTickets(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Amount slider */}
        <div>
          <label className="text-xs text-muted-foreground">
            Min Amount: ₹{minAmount}
          </label>
          <input
            type="range"
            min={0}
            max={maxAmount}
            step={100}
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-lg border border-zinc-800">
        <div
          className="overflow-auto"
          style={{
            maxHeight: "520px",
          }}
        >
          <HeatGrid2D map={filteredMap} maxAmount={maxAmount} />
        </div>
      </div>
    </div>
  );
}
