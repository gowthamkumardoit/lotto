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
import BankAccountReviewDrawer from "@/components/bank/BankAccountReviewDrawer";

import { collectionGroup, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RefreshWrapper } from "@/components/ui/RefreshWrapper";

/* ---------------- Types ---------------- */

export type BankAccountRequest = {
  id: string;
  userId: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isPrimary: boolean;
  createdAt: Date;
};

/* ---------------- Page ---------------- */

export default function BankAccountRequestsPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [accounts, setAccounts] = useState<BankAccountRequest[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [openReview, setOpenReview] = useState(false);

  /* ---------------- Load Accounts ---------------- */

  const loadAccounts = async () => {
    try {
      setLoading(true);

      const q = query(
        collectionGroup(db, "bankAccounts"),
        orderBy("createdAt", "desc"),
      );

      const snap = await getDocs(q);

      setAccounts(
        snap.docs.map((d) => {
          const data = d.data() as any;

          return {
            id: d.id,
            userId: d.ref.parent.parent?.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          };
        }),
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  /* ---------------- Users ---------------- */

  const userIds = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.userId))),
    [accounts],
  );

  const usersById = useUsersByIds(userIds);

  /* ---------------- Global Search ---------------- */

  const globalFilterFn = (row: any, _: any, value: string) => {
    const s = value.toLowerCase();
    if (!s) return true;

    const user = usersById[row.original.userId];

    return (
      row.original.bankName?.toLowerCase().includes(s) ||
      row.original.ifsc?.toLowerCase().includes(s) ||
      row.original.accountNumber?.toLowerCase().includes(s) ||
      user?.phone?.toLowerCase().includes(s) ||
      user?.email?.toLowerCase().includes(s)
    );
  };

  /* ---------------- Columns ---------------- */

  const columns = useMemo<ColumnDef<BankAccountRequest>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => {
          const uid = row.original.userId;
          const user = usersById[uid];

          return (
            <div className="leading-tight">
              <div className="font-medium">
                {user?.username ||
                  user?.displayName ||
                  user?.phone ||
                  uid.slice(0, 8) + "…"}
              </div>

              {user?.phone && (
                <div className="text-xs text-muted-foreground">
                  📱 {user.phone}
                </div>
              )}

              {user?.email && (
                <div className="text-xs text-muted-foreground break-all">
                  ✉ {user.email}
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Bank",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.bankName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.ifsc}
            </div>
          </div>
        ),
      },
      {
        header: "Account",
        cell: ({ row }) => (
          <span className="font-mono">
            •••• {row.original.accountNumber.slice(-4)}
          </span>
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
                s === "PENDING"
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
        header: "Submitted At",
        cell: ({ row }) => row.original.createdAt.toLocaleString("en-IN"),
      },
    ],
    [usersById],
  );

  /* ---------------- Table ---------------- */

  const table = useReactTable({
    data: accounts,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /* ---------------- UI ---------------- */

  return (
    <RefreshWrapper onRefresh={loadAccounts}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Bank Account Requests</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve user bank accounts
          </p>
        </div>

        <Input
          type="search"
          placeholder="Search by phone / email / bank / IFSC"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-96"
        />

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
                    No bank account requests found
                  </TableCell>
                </TableRow>
              )}

              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelected(row.original);
                    setOpenReview(true);
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

        <BankAccountReviewDrawer
          open={openReview}
          account={selected}
          onClose={() => setOpenReview(false)}
        />
      </div>
    </RefreshWrapper>
  );
}
