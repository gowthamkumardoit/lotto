"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cva } from "class-variance-authority";

export type Ticket = {
  id: string;
  ticketNumber: string;
  type: "2D" | "3D" | "4D";
  amount: number;
  status: "LOCKED" | "WON" | "LOST" | "OPEN";
  createdAt: string;
};

type Props = {
  data: Ticket[];
  loading?: boolean;
  onRowClick?: (ticket: Ticket) => void;
};

export function TicketsTable({ data, loading = false, onRowClick }: Props) {
  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        accessorKey: "ticketNumber",
        header: "Ticket",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.type}</Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => `₹${row.original.amount}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status;

          return (
            <Badge
              variant={
                s === "WON" ? "success" : s === "LOST" ? "danger" : "warning"
              }
            >
              {s}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Date",
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: 10, // 👈 default
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return (
      <div className="rounded-xl border p-6 text-center text-neutral-400">
        Loading tickets…
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border p-6 text-center text-neutral-400">
        No tickets found
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {sorted === "asc" && <ChevronUp size={14} />}
                      {sorted === "desc" && <ChevronDown size={14} />}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="hover:bg-neutral-50 cursor-pointer"
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* PAGINATION */}
      <div className="flex items-center justify-between p-3 border-t">
        {/* LEFT: PAGE SIZE */}
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span>Show</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border rounded-md px-2 py-1 text-sm"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>

        {/* RIGHT: PAGE CONTROLS */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
