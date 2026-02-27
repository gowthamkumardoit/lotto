/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { RefreshWrapper } from "@/components/ui/RefreshWrapper";
/* ---------------- TYPES ---------------- */

type SupportTicket = {
  id: string;
  uid: string;
  username: string;
  category: string;
  message: string;
  status: "OPEN" | "CLOSED";
  createdAt: any;
  adminResponse?: string;
};

/* ---------------- PAGE ---------------- */

export default function SupportTicketsPage() {
  const [data, setData] = useState<SupportTicket[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    const q = query(
      collection(db, "supportTickets"),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    setData(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })),
    );
  }

  /* ---------------- TABLE ---------------- */

  const columns = useMemo<ColumnDef<SupportTicket>[]>(
    () => [
      {
        accessorKey: "username",
        header: "User",
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                s === "OPEN"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {s}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) =>
          format(row.original.createdAt.toDate(), "dd MMM yyyy HH:mm"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant={row.original.status === "CLOSED" ? "outline" : "default"}
            onClick={() => setSelectedTicket(row.original)}
          >
            {row.original.status === "CLOSED" ? "View" : "View / Respond"}
          </Button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: (row, _, value) => {
      const v = value.toLowerCase();
      return (
        row.original.username.toLowerCase().includes(v) ||
        row.original.uid.toLowerCase().includes(v) ||
        row.original.message.toLowerCase().includes(v)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /* ---------------- UI ---------------- */

  return (
    <RefreshWrapper onRefresh={loadTickets}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">
            View, respond to, and close user support requests
          </p>
        </div>

        {/* Filters Card */}
        <div className="bg-card rounded-xl border border-border p-4 flex gap-3">
          <Input
            placeholder="Search user / uid / message"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setColumnFilters(v === "ALL" ? [] : [{ id: "status", value: v }]);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table Card */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="p-3 text-left font-medium border-b"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-border hover:bg-muted/50 ${
                    row.original.status === "OPEN" ? "bg-destructive/5" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No support tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Prev
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

        {selectedTicket && (
          <ResponseModal
            ticket={selectedTicket}
            onClose={() => {
              setSelectedTicket(null);
              loadTickets();
            }}
          />
        )}
      </div>
    </RefreshWrapper>
  );
}

/* ---------------- MODAL ---------------- */

export function ResponseModal({ ticket, onClose }: any) {
  const [response, setResponse] = useState(ticket.adminResponse ?? "");
  const isClosed = ticket.status === "CLOSED";

  async function closeTicket() {
    if (!response.trim()) return;

    await updateDoc(doc(db, "supportTickets", ticket.id), {
      adminResponse: response,
      status: "CLOSED",
      closedAt: serverTimestamp(),
      closedBy: "admin",
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Support Ticket</h2>

        <div className="text-sm">
          <b>User:</b> {ticket.username}
        </div>

        <div>
          <b className="text-sm">Message</b>
          <div className="mt-1 p-3 bg-muted rounded text-sm">
            {ticket.message}
          </div>
        </div>

        <Textarea
          disabled={isClosed}
          placeholder="Admin response"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!isClosed && <Button onClick={closeTicket}>Respond & Close</Button>}
        </div>
      </div>
    </div>
  );
}
