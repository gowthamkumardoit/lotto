"use client";

import { Search, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

/* ---------------- Types ---------------- */

export type BonusFilters = {
  search?: string;
  startDate?: Date;
  endDate?: Date;
};

type Props = {
  filters: BonusFilters;
  setFilters: React.Dispatch<React.SetStateAction<BonusFilters>>;
};

/* ---------------- Toolbar ---------------- */

export default function BonusToolbar({ filters, setFilters }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Search (Left) */}
      <div className="relative min-w-[260px] max-w-sm flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search bonuses"
          value={filters.search || ""}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              search: e.target.value || undefined,
            }))
          }
        />
      </div>

      {/* Date Range (Right) */}
      <div className="ml-auto flex items-center gap-3">
        <DatePicker
          label="Start date"
          date={filters.startDate}
          onChange={(date) => setFilters((p) => ({ ...p, startDate: date }))}
        />

        <DatePicker
          label="End date"
          date={filters.endDate}
          onChange={(date) => setFilters((p) => ({ ...p, endDate: date }))}
        />

        {(filters.startDate || filters.endDate) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setFilters((p) => ({
                ...p,
                startDate: undefined,
                endDate: undefined,
              }))
            }
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Date Picker ---------------- */

function DatePicker({
  label,
  date,
  onChange,
}: {
  label: string;
  date?: Date;
  onChange: (date?: Date) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[150px] justify-start text-left">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd MMM yyyy") : label}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d || undefined)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
