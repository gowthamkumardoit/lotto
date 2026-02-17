"use client";

import { cn } from "@/lib/utils";

type DotGridProps = {
  totalTickets: number;
  soldTickets: number;
  guaranteedAt?: number;
  title?: string;
};

function getHeatColor(percent: number) {
  if (percent <= 20) return "bg-blue-400";
  if (percent <= 40) return "bg-emerald-400";
  if (percent <= 60) return "bg-yellow-400";
  if (percent <= 80) return "bg-orange-400";
  return "bg-red-500";
}

export function DotGrid({
  totalTickets,
  soldTickets,
  guaranteedAt,
  title = "Ticket Sales Heat Map",
}: DotGridProps) {
  const soldPct = Math.min(100, Math.round((soldTickets / totalTickets) * 100));

  const guaranteedPct =
    guaranteedAt != null
      ? Math.round((guaranteedAt / totalTickets) * 100)
      : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="text-xs text-muted-foreground">
          10×10 grid · 1 dot = 1%
        </span>
      </div>

      {/* Heat Grid */}
      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: 100 }).map((_, i) => {
          const pct = i + 1;
          const isSold = pct <= soldPct;
          const isGuaranteed = guaranteedPct != null && pct === guaranteedPct;

          const ticketsAtThisPct = Math.round((pct / 100) * totalTickets);

          return (
            <div
              key={i}
              className={cn(
                "h-4 w-4 rounded-md transition-all",
                isSold ? getHeatColor(pct) : "bg-muted",
                isGuaranteed && "ring-2 ring-amber-500 animate-pulse",
              )}
              title={
                `Progress: ${pct}%\n` +
                `Tickets sold: ${ticketsAtThisPct.toLocaleString(
                  "en-IN",
                )} / ${totalTickets.toLocaleString("en-IN")}` +
                (isGuaranteed ? "\nGuaranteed threshold" : "")
              }
            />
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">Sold</span>
          <div className="font-semibold">
            {soldTickets.toLocaleString("en-IN")} ({soldPct}%)
          </div>
        </div>

        <div>
          <span className="text-muted-foreground">Remaining</span>
          <div className="font-semibold">
            {(totalTickets - soldTickets).toLocaleString("en-IN")} (
            {100 - soldPct}%)
          </div>
        </div>

        {guaranteedPct != null && (
          <div>
            <span className="text-muted-foreground">Guaranteed at</span>
            <div className="font-semibold text-amber-600">
              {guaranteedAt!.toLocaleString("en-IN")} tickets
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Legend color="bg-blue-400" label="0–20% Cold" />
        <Legend color="bg-emerald-400" label="21–40% Warm" />
        <Legend color="bg-yellow-400" label="41–60% Medium" />
        <Legend color="bg-orange-400" label="61–80% Hot" />
        <Legend color="bg-red-500" label="81–100% Very Hot" />
        {guaranteedPct != null && <Legend ring label="Guaranteed threshold" />}
      </div>
    </div>
  );
}

/* ---------------- LEGEND ---------------- */

function Legend({
  color,
  label,
  ring,
}: {
  color?: string;
  label: string;
  ring?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span
        className={cn(
          "h-3 w-3 rounded-sm",
          color ?? "bg-muted",
          ring && "ring-2 ring-amber-500 animate-pulse",
        )}
      />
      {label}
    </div>
  );
}
