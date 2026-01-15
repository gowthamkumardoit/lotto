"use client";

import { HeatCell } from "./HeatCell";

type HeatGrid3DProps = {
  map: Record<
    string,
    {
      amount: number;
      tickets: number;
    }
  >;
  rangeStart: number; // 0, 100, 200...
  maxAmount: number;
};

export function HeatGrid3D({ map, rangeStart, maxAmount }: HeatGrid3DProps) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: "repeat(10, 1fr)",
      }}
    >
      {Array.from({ length: 10 }).map((_, row) =>
        Array.from({ length: 10 }).map((_, col) => {
          const value = rangeStart + row * 10 + col;
          const number = value.toString().padStart(3, "0");

          const cell = map[number];

          return (
            <HeatCell
              key={number}
              number={number}
              amount={cell?.amount ?? 0}
              tickets={cell?.tickets ?? 0}
              maxAmount={maxAmount}
            />
          );
        })
      )}
    </div>
  );
}
