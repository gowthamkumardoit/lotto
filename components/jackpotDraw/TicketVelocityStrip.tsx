"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type VelocityPoint = {
  time: string;
  sold: number;
};

export function TicketVelocityStrip({ points }: { points: VelocityPoint[] }) {
  const [animated, setAnimated] = useState<VelocityPoint[]>([]);

  useEffect(() => {
    // Animate in sequence
    setAnimated([]);
    points.forEach((p, i) => {
      setTimeout(() => {
        setAnimated((prev) => [...prev, p]);
      }, i * 120); // ⏱ stagger
    });
  }, [points]);

  const max = Math.max(...points.map((p) => p.sold), 1);

  function getColor(pct: number) {
    if (pct > 80) return "bg-red-500 animate-pulse";
    if (pct > 60) return "bg-orange-400";
    if (pct > 30) return "bg-emerald-400";
    return "bg-slate-400";
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Ticket Sales Velocity</h4>

      {animated.map((p) => {
        const pct = Math.round((p.sold / max) * 100);

        return (
          <div key={p.time} className="flex items-center gap-3">
            <span className="w-12 text-xs text-muted-foreground tabular-nums">
              {p.time}
            </span>

            <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
              <div
                className={cn(
                  "h-3 rounded transition-all duration-700 ease-out",
                  getColor(pct),
                )}
                style={{
                  width: `${pct}%`,
                }}
              />
            </div>

            <span className="w-10 text-xs text-right tabular-nums">
              {p.sold}
            </span>
          </div>
        );
      })}
    </div>
  );
}
