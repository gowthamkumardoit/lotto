/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

import { useMemo, useState } from "react";
import { useTopupRequests, TopupRequest } from "@/hooks/useTopupRequests";
import { useUsersByIds } from "@/hooks/useUsersByIds";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import DepositReviewDrawer from "@/components/deposits/DepositReviewDrawer";
import { DepositRequestWithWallet } from "@/types/deposit";
import { getDepositWithWallet } from "@/services/depositService";
import type { FilterFn } from "@tanstack/react-table";
import { RefreshWrapper } from "@/components/ui/RefreshWrapper";

import { toast } from "sonner";
/* ---------------- Helpers ---------------- */

function getUserLabel(userId: string, users: Record<string, any>) {
  const u = users[userId];
  return u?.username || u?.displayName || userId.slice(0, 8) + "…";
}

/* ---------------- Page ---------------- */

export default function DepositRequestsPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedDeposit, setSelectedDeposit] =
    useState<DepositRequestWithWallet | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [openReview, setOpenReview] = useState(false);
  const { data: topups, loading } = useTopupRequests(refreshKey);

  const userIds = useMemo(
    () => Array.from(new Set(topups.map((t) => t.userId))),
    [topups],
  );

  const usersById = useUsersByIds(userIds);

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const handleRefresh = async () => {
    setRefreshKey((prev) => prev + 1);
  };

  /* ---------------- Columns (need usersById) ---------------- */

  const columns = useMemo<ColumnDef<TopupRequest>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => {
          const uid = row.original.userId;
          const user = usersById[uid];

          return (
            <div>
              <div className="font-medium">{getUserLabel(uid, usersById)}</div>
              <div className="text-xs text-muted-foreground">
                📱 {user?.phone ?? "—"}
              </div>
            </div>
          );
        },
      },
      {
        id: "mobile",
        header: "Mobile",
        cell: ({ row }) => {
          const uid = row.original.userId;
          return usersById[uid]?.phone ?? "—";
        },
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-semibold">₹{row.original.amount}</span>
        ),
      },
      {
        accessorKey: "utr",
        header: "UTR",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <Badge
              className={
                s === "SUBMITTED"
                  ? "bg-amber-500/15 text-amber-600"
                  : s === "APPROVED"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-red-500/15 text-red-600"
              }
            >
              {s}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Requested At",
        cell: ({ row }) => row.original.createdAt.toLocaleString("en-IN"),
      },
    ],
    [usersById],
  );

  const filteredTopups = useMemo(() => {
    return topups.filter((t) => {
      const created = t.createdAt;

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (created < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (created > to) return false;
      }

      return true;
    });
  }, [topups, fromDate, toDate]);

  /* ---------------- Table ---------------- */
  const globalFilterFn: FilterFn<TopupRequest> = (
    row,
    _columnId,
    filterValue,
  ) => {
    const search = String(filterValue).toLowerCase().trim();
    if (!search) return true; // ✅ ALWAYS boolean

    const topup = row.original;
    const user = usersById[topup.userId];

    return (
      topup.utr?.toLowerCase().includes(search) === true ||
      topup.amount?.toString().includes(search) === true ||
      user?.phone?.toLowerCase().includes(search) === true ||
      user?.username?.toLowerCase().includes(search) === true ||
      user?.displayName?.toLowerCase().includes(search) === true
    );
  };

  const table = useReactTable({
    data: filteredTopups,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,

    globalFilterFn, // ✅ THIS FIXES SEARCH

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  return (
    <RefreshWrapper onRefresh={handleRefresh}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Deposit Requests</h1>
          <p className="text-sm text-muted-foreground">
            Wallet top-up requests from users
          </p>
        </div>

        {/* Search */}

        <div className="flex flex-wrap gap-4 items-end">
          <Input
            type="search"
            placeholder="Search by UTR / User / Mobile"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-80"
          />

          <div className="flex gap-2">
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">To</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Loading…
                  </TableCell>
                </TableRow>
              )}

              {!loading && table.getRowModel().rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    No deposit requests found
                  </TableCell>
                </TableRow>
              )}

              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={async () => {
                    try {
                      const fullDeposit = await getDepositWithWallet(
                        row.original.id,
                      );
                      setSelectedDeposit(fullDeposit);
                      setOpenReview(true);
                    } catch (err) {
                      console.error(err);
                      toast.error("Failed to load deposit details");
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            {/* Page info */}
            <div className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-medium">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              of <span className="font-medium">{table.getPageCount()}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
              >
                ⏮ First
              </button>

              <button
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                ◀ Prev
              </button>

              <button
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next ▶
              </button>

              <button
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
              >
                Last ⏭
              </button>
            </div>
          </div>
        </div>

        {/* Drawer */}
        <DepositReviewDrawer
          open={openReview}
          deposit={selectedDeposit}
          onClose={() => setOpenReview(false)}
        />
      </div>
    </RefreshWrapper>
  );
}
