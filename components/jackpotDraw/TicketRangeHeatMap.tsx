"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

/* ---------------- TYPES ---------------- */

type RangeBucket = {
  index: number;
  sold: number;
  capacity: number;
  isWinningRange?: boolean;
  soldTickets?: number[];
};

type LabelFormat = "compact" | "full";

/* ---------------- HELPERS ---------------- */

function getRangeColor(pct: number) {
  if (pct <= 10) return "bg-zinc-300";
  if (pct <= 30) return "bg-blue-400";
  if (pct <= 60) return "bg-emerald-400";
  if (pct <= 85) return "bg-orange-400";
  return "bg-red-500";
}

function formatLabel(start: number, end: number, format: LabelFormat) {
  if (format === "full") {
    return `${start.toString().padStart(5, "0")}–${end
      .toString()
      .padStart(5, "0")}`;
  }
  return `${Math.floor(start / 1000)}k–${Math.floor((end + 1) / 1000)}k`;
}

/* ---------------- COMPONENT ---------------- */

export function TicketRangeHeatMap({
  buckets,
  title = "Ticket Range Distribution",
}: {
  buckets: RangeBucket[];
  title?: string;
}) {
  const [labelFormat, setLabelFormat] = useState<LabelFormat>("compact");

  const [selectedBucket, setSelectedBucket] = useState<RangeBucket | null>(
    null,
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>

        <button
          className="text-xs underline text-muted-foreground"
          onClick={() =>
            setLabelFormat((f) => (f === "compact" ? "full" : "compact"))
          }
        >
          Toggle labels
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-10 gap-4">
        {buckets.map((b) => {
          const pct = Math.round((b.sold / b.capacity) * 100);
          const start = b.index * b.capacity;
          const end = start + b.capacity - 1;

          return (
            <div
              key={b.index}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setSelectedBucket(b)}
              title={`Sold ${b.sold}/${b.capacity} (${pct}%)`}
            >
              {/* Rectangle */}
              <div
                className={cn(
                  "relative h-6 w-12 rounded-md transition-all duration-700",
                  getRangeColor(pct),
                )}
              >
                {/* 🏆 Winning overlay */}
                {b.isWinningRange && (
                  <Star className="absolute -top-2 -right-2 h-4 w-4 text-amber-500 fill-amber-400" />
                )}
              </div>

              {/* Label */}
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {formatLabel(start, end, labelFormat)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedBucket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-[420px] max-h-[70vh] overflow-auto">
            <h3 className="text-sm font-semibold mb-2">
              Sold Tickets – Range {selectedBucket.index}
            </h3>

            {!selectedBucket.soldTickets?.length ? (
              <p className="text-sm text-muted-foreground">
                No ticket-level data available.
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-2 text-xs font-mono">
                {selectedBucket.soldTickets.map((n) => (
                  <span
                    key={n}
                    className="px-2 py-1 bg-muted rounded text-center"
                  >
                    {n}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                className="text-sm underline"
                onClick={() => setSelectedBucket(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
