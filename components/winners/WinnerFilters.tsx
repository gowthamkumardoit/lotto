"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type WinnerFilterState = {
  types: ("2D" | "3D" | "4D")[];
  creditStatus: ("CREDITED" | "PENDING")[];
};

interface Props {
  value: WinnerFilterState;
  onChange: (next: WinnerFilterState) => void;
}

export function WinnerFilters({ value, onChange }: Props) {
  const toggle = <T extends string>(key: keyof WinnerFilterState, v: T) => {
    const set = new Set(value[key] as string[]);
    set.has(v) ? set.delete(v) : set.add(v);
    onChange({ ...value, [key]: Array.from(set) });
  };

  const badge = (active: boolean) => (active ? "default" : "outline");

  return (
    <aside className="w-56 rounded-xl border bg-background p-4 space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Number Type
        </p>
        <div className="flex flex-wrap gap-2">
          {(["2D", "3D", "4D"] as const).map((t) => (
            <Badge
              key={t}
              variant={badge(value?.types.includes(t))}
              className="cursor-pointer"
              onClick={() => toggle("types", t)}
            >
              {t}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Credit Status
        </p>
        <div className="flex flex-wrap gap-2">
          {(["CREDITED", "PENDING"] as const).map((s) => (
            <Badge
              key={s}
              variant={badge(value?.creditStatus.includes(s))}
              className="cursor-pointer"
              onClick={() => toggle("creditStatus", s)}
            >
              {s}
            </Badge>
          ))}
        </div>
      </div>
    </aside>
  );
}
