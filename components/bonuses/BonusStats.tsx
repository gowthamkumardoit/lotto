"use client";

import { Gift, CheckCircle, Clock } from "lucide-react";
import { Bonus } from "@/types/bonus";

type Props = {
  bonuses: Bonus[];
};

export default function BonusStats({ bonuses }: Props) {
  const total = bonuses.length;
  const active = bonuses.filter((b) => b.status === "ACTIVE").length;
  const expiredOrUsed = bonuses.filter(
    (b) => b.status === "EXPIRED" || b.status === "USED"
  ).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Total Bonuses" value={total} icon={<Gift />} />
      <StatCard
        label="Active Bonuses"
        value={active}
        icon={<CheckCircle />}
        accent="emerald"
      />
      <StatCard
        label="Expired / Used"
        value={expiredOrUsed}
        icon={<Clock />}
        accent="zinc"
      />
    </div>
  );
}

/* ---------------- Small Stat Card ---------------- */

function StatCard({
  label,
  value,
  icon,
  accent = "sky",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "sky" | "emerald" | "zinc";
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-background px-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>

        <div
          className={`rounded-lg p-2 bg-${accent}-500/15 text-${accent}-600`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
