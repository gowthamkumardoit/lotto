"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { DateRangeFilter } from "../common/DateRangeFilter";

type TicketType = "2D" | "3D" | "4D";
type TicketStatus = "LOCKED" | "WON" | "LOST" | "OPEN";

export type Filters = {
  search: string;
  types: TicketType[];
  statuses: TicketStatus[];
  dateFrom?: Date;
  dateTo?: Date;
};

export function TicketFilterSidebar({
  onChange,
}: {
  onChange: (filters: Filters) => void;
}) {
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState<TicketType[]>([]);
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  /* 🔴 THIS WAS MISSING */
  useEffect(() => {
    onChange({
      search,
      types,
      statuses,
      dateFrom,
      dateTo,
    });
  }, [search, types, statuses, dateFrom, dateTo, onChange]);

  const resetFilters = () => {
    setSearch("");
    setTypes([]);
    setStatuses([]);
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <aside
      className="
        w-72 shrink-0 sticky top-20
        max-h-[calc(100vh-6rem)]
        overflow-y-auto
        rounded-2xl
        bg-white
        border border-neutral-200
        shadow-[0_10px_30px_rgba(0,0,0,0.08)]
        p-5 space-y-6
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-neutral-500 hover:text-indigo-600"
        >
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* SEARCH */}
      <Section title="Search">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ticket ID or number"
        />
      </Section>

      {/* DATE */}
      <Section title="Date">
        <DateRangeFilter
          value={{ from: dateFrom, to: dateTo }}
          onChange={(range) => {
            setDateFrom(range?.from);
            setDateTo(range?.to);
          }}
        />
      </Section>

      {/* TYPE */}
      <Section title="Type">
        {(["2D", "3D", "4D"] as TicketType[]).map((t) => (
          <CheckboxRow
            key={t}
            label={t}
            checked={types.includes(t)}
            onChange={(checked) =>
              setTypes((prev) =>
                checked ? [...prev, t] : prev.filter((x) => x !== t)
              )
            }
          />
        ))}
      </Section>

      {/* STATUS */}
      <Section title="Status">
        {(["PENDING","LOCKED", "WON", "LOST"] as TicketStatus[]).map((s) => (
          <CheckboxRow
            key={s}
            label={s.charAt(0) + s.slice(1).toLowerCase()}
            checked={statuses.includes(s)}
            onChange={(checked) =>
              setStatuses((prev) =>
                checked ? [...prev, s] : prev.filter((x) => x !== s)
              )
            }
          />
        ))}
      </Section>

      {/* APPLY (optional UX only) */}
      <Button className="w-full" disabled>
        Filters Applied Automatically
      </Button>
    </aside>
  );
}

/* ---------------- HELPERS ---------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
      <div className="text-xs font-medium text-neutral-600">{title}</div>
      {children}
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(Boolean(v))}
      />
      <span className="text-sm text-neutral-700">{label}</span>
    </div>
  );
}
