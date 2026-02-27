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

import { useEffect, useMemo, useState } from "react";
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

import { toast } from "sonner";

import { useUsersByIds } from "@/hooks/useUsersByIds";
import { getWithdrawalWithWallet } from "@/services/withdrawalService";
import WithdrawReviewDrawer from "@/components/withdrawals/WithdrawReviewDrawer";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RefreshWrapper } from "@/components/ui/RefreshWrapper";

/* ---------------- Types ---------------- */

export type WithdrawalRequest = {
  id: string;
  userId: string;
  amount: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED";
  method: "UPI" | "BANK";
  createdAt: Date;
};

/* ---------------- Page ---------------- */

export default function WithdrawalRequestsPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(
    null,
  );
  const [openReview, setOpenReview] = useState(false);

  /* ---------------- Load withdrawals ---------------- */

  const loadWithdrawals = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "withdrawalRequests"),
        orderBy("createdAt", "desc"),
      );

      const snap = await getDocs(q);

      setWithdrawals(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
          createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        })),
      );
    } catch (e) {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  /* ---------------- Users ---------------- */

  const userIds = useMemo(
    () => Array.from(new Set(withdrawals.map((w) => w.userId))),
    [withdrawals],
  );

  const usersById = useUsersByIds(userIds);

  /* ---------------- Columns ---------------- */

  const columns = useMemo<ColumnDef<WithdrawalRequest>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => {
          const uid = row.original.userId;
          const user = usersById[uid];

          return (
            <div>
              <div className="font-medium">
                {user?.username || user?.displayName || uid.slice(0, 8) + "…"}
              </div>
              <div className="text-xs text-muted-foreground">
                📱 {user?.phone ?? "—"}
              </div>
            </div>
          );
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
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.method || "UPI"}</Badge>
        ),
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

  /* ---------------- Table ---------------- */

  const table = useReactTable({
    data: withdrawals,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _col, value) => {
      const search = String(value).toLowerCase().trim();
      if (!search) return true;

      const w = row.original;
      const u = usersById[w.userId];

      return (
        u?.phone?.toLowerCase().includes(search) ||
        u?.username?.toLowerCase().includes(search) ||
        u?.displayName?.toLowerCase().includes(search) ||
        w.amount.toString().includes(search)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <RefreshWrapper onRefresh={loadWithdrawals}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Withdrawal Requests</h1>
          <p className="text-sm text-muted-foreground">
            User withdrawal requests pending admin review
          </p>
        </div>

        {/* Search */}
        <Input
          type="search"
          placeholder="Search by user / phone / amount"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-80"
        />

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
                    No withdrawal requests found
                  </TableCell>
                </TableRow>
              )}

              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={async () => {
                    try {
                      const full = await getWithdrawalWithWallet(
                        row.original.id,
                      );
                      setSelectedWithdrawal(full);
                      setOpenReview(true);
                    } catch {
                      toast.error("Failed to load withdrawal details");
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
        </div>

        {/* Drawer */}
        <WithdrawReviewDrawer
          open={openReview}
          withdrawal={selectedWithdrawal}
          onClose={() => setOpenReview(false)}
        />
      </div>
    </RefreshWrapper>
  );
}
