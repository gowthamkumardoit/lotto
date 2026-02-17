"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const COLOR_LEGEND = [
  { label: "0–10% sold", className: "bg-zinc-300" },
  { label: "11–30% sold", className: "bg-blue-400" },
  { label: "31–60% sold", className: "bg-emerald-400" },
  { label: "61–85% sold", className: "bg-orange-400" },
  { label: "86–100% sold", className: "bg-red-500" },
];

export function TicketRangeHeatMapLegend() {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide">Legend</h4>

      {/* Color meanings */}
      <div className="grid grid-cols-2 gap-3">
        {COLOR_LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <div className={cn("h-3.5 w-6 rounded-sm", item.className)} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Icons & interactions */}
      <div className="flex flex-col gap-2 pt-2 text-xs">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
          <span className="text-muted-foreground">Winning ticket range</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3.5 w-6 rounded-sm bg-muted border" />
          <span className="text-muted-foreground">
            Unsold / low-activity range
          </span>
        </div>

        <div className="text-muted-foreground pt-1">
          🖱 Click a range to view sold ticket numbers
        </div>
      </div>
    </div>
  );
}
