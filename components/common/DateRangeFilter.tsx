"use client";

import * as React from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import type { DateRange } from "react-day-picker";
import { DialogTitle } from "@radix-ui/react-dialog";

/* ---------- INTERNAL SAFE TYPE ---------- */
type SafeRange = {
  from: Date;
  to: Date;
};

type Props = {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
};

export function DateRangeFilter({ value, onChange }: Props) {
  /* ---------- TODAY (SAFE) ---------- */
  const today = React.useMemo<SafeRange>(() => {
    const now = new Date();
    return {
      from: startOfDay(now),
      to: endOfDay(now),
    };
  }, []);

  /* ---------- STATE (NEVER UNDEFINED) ---------- */
  const [range, setRange] = React.useState<SafeRange>(today);
  const [open, setOpen] = React.useState(false);

  /* ---------- SYNC FROM PARENT ---------- */
  React.useEffect(() => {
    if (value?.from) {
      setRange({
        from: startOfDay(value.from),
        to: value.to ? endOfDay(value.to) : endOfDay(value.from),
      });
    }
  }, [value]);

  /* ---------- EMIT INITIAL ---------- */
  React.useEffect(() => {
    onChange?.({ from: range.from, to: range.to });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- CALENDAR SELECT ---------- */
  const handleSelect = (r?: DateRange) => {
    if (!r?.from) return;

    const next: SafeRange = {
      from: startOfDay(r.from),
      to: r.to ? endOfDay(r.to) : endOfDay(r.from),
    };

    setRange(next);
    onChange?.({ from: next.from, to: next.to });
  };

  /* ---------- LABEL (IMPOSSIBLE TO ERROR) ---------- */
  const label = `${format(range.from, "dd MMM yyyy")} – ${format(
    range.to,
    "dd MMM yyyy"
  )}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle></DialogTitle>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left text-sm font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[720px] p-4">
        <Calendar
          mode="range"
          selected={{ from: range.from, to: range.to }}
          onSelect={handleSelect}
          numberOfMonths={2}
          initialFocus
        />

        <div className="flex justify-end pt-4">
          <Button onClick={() => setOpen(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
