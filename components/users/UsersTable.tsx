"use client";

import { flexRender, Table as TanTable } from "@tanstack/react-table";
import { Shield } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User } from "@/types/users";

/* ---------------- Props ---------------- */

type Props = {
  table: TanTable<User>;
  loading?: boolean;
  onSelect?: (user: User) => void;
};

/* ---------------- Component ---------------- */

export function UsersTable({ table, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="border rounded-xl p-10 text-center text-muted-foreground">
        Loading users…
      </div>
    );
  }

  if (!table.getRowModel().rows.length) {
    return (
      <div className="border rounded-xl p-10 text-center">
        <p className="text-sm text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      {/* Header */}
      <div className="border-b px-5 py-4">
        <h3 className="text-lg font-semibold">Users</h3>
        <p className="text-sm text-muted-foreground">
          Manage registered users and access control
        </p>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="bg-muted/40">
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className={cn(
                    "select-none",
                    header.column.getCanSort() && "cursor-pointer",
                    header.column.getIsSorted() && "text-primary"
                  )}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const u = row.original;

            return (
              <TableRow
                key={row.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => onSelect?.(u)}
              >
                {row.getVisibleCells().map((cell) => {
                  // Custom rendering for specific columns
                  if (cell.column.id === "role") {
                    return (
                      <TableCell key={cell.id}>
                        <Badge
                          className={cn(
                            "gap-2 px-3 py-1 rounded-full",
                            u.role === "admin"
                              ? "bg-primary/15 text-primary"
                              : "bg-zinc-500/15 text-zinc-600"
                          )}
                        >
                          {u.role === "admin" && <Shield className="h-3 w-3" />}
                          {u.role}
                        </Badge>
                      </TableCell>
                    );
                  }

                  if (cell.column.id === "status") {
                    const active = u.status === "active";
                    return (
                      <TableCell key={cell.id}>
                        <Badge
                          className={cn(
                            "gap-2 px-3 py-1 rounded-full",
                            active
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-red-500/15 text-red-600"
                          )}
                        >
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              active ? "bg-emerald-500" : "bg-red-500"
                            )}
                          />
                          {active ? "Active" : "Blocked"}
                        </Badge>
                      </TableCell>
                    );
                  }

                  if (cell.column.id === "actions") {
                    return (
                      <TableCell
                        key={cell.id}
                        className="text-right pr-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                          View
                        </span>
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
