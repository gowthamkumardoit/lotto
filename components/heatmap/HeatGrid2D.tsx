"use client";

import { HeatCell } from "./HeatCell";

type HeatGrid2DProps = {
  map: Record<
    string,
    {
      amount: number;
      tickets: number;
    }
  >;
  maxAmount: number;
};

export function HeatGrid2D({ map, maxAmount }: HeatGrid2DProps) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: "repeat(10, 1fr)",
      }}
    >
      {Array.from({ length: 10 }).map((_, row) =>
        Array.from({ length: 10 }).map((_, col) => {
          const number = `${row}${col}`.padStart(2, "0");
          const cellData = map[number];

          return (
            <HeatCell
              key={number}
              number={number}
              amount={cellData?.amount ?? 0}
              tickets={cellData?.tickets ?? 0}
              maxAmount={maxAmount}
            />
          );
        })
      )}
    </div>
  );
}
