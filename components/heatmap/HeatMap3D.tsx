"use client";

import { useMemo, useState } from "react";
import { HeatGrid3D } from "./HeatGrid3D";

type HeatMap3DProps = {
  map: Record<
    string,
    {
      amount: number;
      tickets: number;
    }
  >;
};

export function HeatMap3D({ map }: HeatMap3DProps) {
  const [activeRange, setActiveRange] = useState(0);
  const [minTickets, setMinTickets] = useState(0);
  const [minAmount, setMinAmount] = useState(0);

  let maxAmount = 0;
  let totalAmount = 0;
  let totalTickets = 0;

  Object.values(map).forEach((cell) => {
    maxAmount = Math.max(maxAmount, cell.amount);
    totalAmount += cell.amount;
    totalTickets += cell.tickets;
  });

  const filteredMap = useMemo(() => {
    const result: typeof map = {};

    Object.entries(map).forEach(([key, value]) => {
      if (value.amount >= minAmount && value.tickets >= minTickets) {
        result[key] = value;
      }
    });

    return result;
  }, [map, minAmount, minTickets]);

  const rangeStart = activeRange * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">3D Numbers Heat Map</h3>
        <div className="text-sm text-muted-foreground">
          ₹{totalAmount} • {totalTickets} tickets
        </div>
      </div>

      {/* Range Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: 10 }).map((_, i) => {
          const start = i * 100;
          const end = start + 99;

          return (
            <button
              key={i}
              onClick={() => setActiveRange(i)}
              className={`px-3 py-1 rounded text-xs font-medium
                ${
                  activeRange === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }
              `}
            >
              {start.toString().padStart(3, "0")}–
              {end.toString().padStart(3, "0")}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Grid (Scrollable & Contained) */}
      <div
        className="rounded-lg border border-zinc-800 overflow-auto"
        style={{ maxHeight: "520px" }}
      >
        <HeatGrid3D
          map={filteredMap}
          rangeStart={rangeStart}
          maxAmount={maxAmount}
        />
      </div>
    </div>
  );
}
