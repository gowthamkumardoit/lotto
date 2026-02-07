"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { WinnersByDraw } from "@/types/winners";
import { DrawNameCell } from "../common/DrawNameCell";
import { WinnersModal } from "./WinnersModal";

/* ---------------- HELPERS ---------------- */

function getDateFromDrawRunId(drawRunId: string): Date | null {
  const [, datePart] = drawRunId.split("_");
  if (!datePart) return null;

  const date = new Date(datePart);
  return isNaN(date.getTime()) ? null : date;
}

/* ---------------- COMPONENT ---------------- */

export function WinnersTable({ data }: { data: WinnersByDraw[] }) {
  const [open, setOpen] = useState(false);
  const [selectedDraw, setSelectedDraw] =
    useState<WinnersByDraw | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* -------- DATE RANGE FILTER -------- */

  const filteredData = useMemo(() => {
    const from = fromDate
      ? new Date(fromDate + "T00:00:00").getTime()
      : null;

    const to = toDate
      ? new Date(toDate + "T23:59:59").getTime()
      : null;

    return data.filter((d) => {
      const date = getDateFromDrawRunId(d.drawRunId)?.getTime();
      if (!date) return false;

      if (from !== null && date < from) return false;
      if (to !== null && date > to) return false;

      return true;
    });
  }, [data, fromDate, toDate]);

  /* -------- COLUMNS -------- */

  const columns = useMemo<ColumnDef<WinnersByDraw>[]>(
    () => [
      {
        id: "drawDate",
        header: "Date",
        cell: ({ row }) => {
          const date = getDateFromDrawRunId(row.original.drawRunId);

          if (!date) {
            return (
              <span className="text-muted-foreground text-sm">
                —
              </span>
            );
          }

          return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        },
      },
      {
        accessorKey: "drawId",
        header: "Draw",
        cell: ({ row }) => (
          <DrawNameCell drawId={row.original.drawId} />
        ),
      },
      {
        accessorKey: "totalWinners",
        header: "Winners",
      },
      {
        accessorKey: "totalPayout",
        header: "Total Payout",
        cell: ({ getValue }) =>
          `₹${Number(getValue()).toLocaleString()}`,
      },
      {
        id: "action",
        header: "",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedDraw(row.original);
              setOpen(true);
            }}
          >
            View
          </Button>
        ),
      },
    ],
    [],
  );

  /* -------- TABLE -------- */

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  /* -------- RENDER -------- */

  return (
    <div className="space-y-4">
      {/* Date Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">
            From
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">
            To
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
          />
        </div>

        {(fromDate || toDate) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <table className="w-full border rounded-md">
        <thead className="bg-muted">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-3 py-2 text-left text-sm"
                >
                  {flexRender(
                    h.column.columnDef.header,
                    h.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {selectedDraw && (
        <WinnersModal
          open={open}
          onClose={() => setOpen(false)}
          drawId={selectedDraw.drawId}
          winners={selectedDraw.winners ?? []}
        />
      )}
    </div>
  );
}
