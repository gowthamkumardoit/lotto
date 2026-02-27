import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ColumnFiltersState } from "@tanstack/react-table";

export function UsersFilters({
  filters,
  setFilters,
  globalFilter,
  setGlobalFilter,
}: {
  filters: ColumnFiltersState;
  setFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
  globalFilter: string;
  setGlobalFilter: Dispatch<SetStateAction<string>>;
}) {
  const roleFilter = filters.find((f) => f.id === "role");
  const role = typeof roleFilter?.value === "string" ? roleFilter.value : "";

  const statusFilter = filters.find((f) => f.id === "status");
  const status =
    typeof statusFilter?.value === "string" ? statusFilter.value : "";

  // ✅ LOCAL INPUT STATE (for debounce)
  const [input, setInput] = useState(globalFilter);

  // ✅ DEBOUNCE EFFECT
  useEffect(() => {
    const t = setTimeout(() => {
      setGlobalFilter(input.trim());
    }, 400);

    return () => clearTimeout(t);
  }, [input, setGlobalFilter]);

  // ✅ KEEP INPUT IN SYNC IF FILTER IS CLEARED FROM OUTSIDE
  useEffect(() => {
    setInput(globalFilter);
  }, [globalFilter]);

  function updateFilter(id: string, value: string) {
    setFilters((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (!value) return next;
      return [...next, { id, value }];
    });
  }

  return (
    <div className="w-64 shrink-0 space-y-6 rounded-xl border bg-background p-4 shadow-sm">
      <h3 className="text-sm font-semibold">Filters</h3>

      {/* SEARCH */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Search phone</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter phone"
          className="
            w-full rounded-md border bg-background px-2 py-1.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary/40
          "
        />
      </div>

      {/* ROLE */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Role</label>
        <select
          value={role}
          onChange={(e) => updateFilter("role", e.target.value)}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* STATUS */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Status</label>
        <select
          value={status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      {/* CLEAR */}
      <button
        onClick={() => {
          setFilters([]);
          setGlobalFilter("");
          setInput("");
        }}
        className="w-full rounded-md border px-3 py-2 text-sm hover:bg-muted"
      >
        Clear filters
      </button>
    </div>
  );
}
