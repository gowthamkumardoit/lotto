"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import AuditLogsTable from "@/components/audit-logs/AuditLogsTable";
import { AuditLogFilters } from "@/types/audit-log";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({});

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Immutable system and admin activity history
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions or admins"
            className="pl-8"
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
          {/* Start Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[160px] justify-start text-left"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate
                  ? format(filters.startDate, "dd MMM yyyy")
                  : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) =>
                  setFilters((p) => ({
                    ...p,
                    startDate: date || undefined,
                  }))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* End Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[160px] justify-start text-left"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate
                  ? format(filters.endDate, "dd MMM yyyy")
                  : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) =>
                  setFilters((p) => ({
                    ...p,
                    endDate: date || undefined,
                  }))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear Dates */}
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
      <AuditLogsTable filters={filters} />
    </div>
  );
}
