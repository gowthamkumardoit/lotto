"use client";

import { useState } from "react";
import { Search, Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import NotificationsTable from "@/components/notifications/NotificationTable";
import CreateNotificationModal from "@/components/notifications/CreateNotificationModal";

/* ---------------- Types ---------------- */

export type NotificationFilters = {
  search?: string;
  startDate?: Date;
  endDate?: Date;
};

/* ---------------- Page ---------------- */

export default function NotificationsPage() {
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage system notifications
          </p>
        </div>

        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Notification
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search notifications"
            value={filters.search || ""}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                search: e.target.value || undefined,
              }))
            }
          />
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-3">
          {/* Start */}
          <DatePicker
            label="Start date"
            date={filters.startDate}
            onChange={(date) => setFilters((p) => ({ ...p, startDate: date }))}
          />

          {/* End */}
          <DatePicker
            label="End date"
            date={filters.endDate}
            onChange={(date) => setFilters((p) => ({ ...p, endDate: date }))}
          />

          {(filters.startDate || filters.endDate) && (
            <Button
              variant="ghost"
              onClick={() =>
                setFilters((p) => ({
                  ...p,
                  startDate: undefined,
                  endDate: undefined,
                }))
              }
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <NotificationsTable filters={filters} />

      <CreateNotificationModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
      />
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
