"use client";

import {
  ColumnDef,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { useUpiWithdrawRequests } from "@/hooks/useUpiWithdrawRequests";
import { UpiWithdrawalRequest } from "@/types/upiWithdrawal";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import {
  approveUpiWithdrawFn,
  rejectUpiWithdrawFn,
} from "@/services/upiWithdrawService";
import { toast } from "sonner";

export default function UpiWithdrawRequestsPage() {
  const { data, loading, refetch } = useUpiWithdrawRequests();

  const [globalFilter, setGlobalFilter] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* ---------------- Filter ---------------- */

  const globalFilterFn: FilterFn<UpiWithdrawalRequest> = (row, _, value) => {
    const s = String(value).toLowerCase();
    if (!s) return true;

    return (
      row.original.userId.toLowerCase().includes(s) ||
      row.original.primaryUpi.toLowerCase().includes(s)
    );
  };

  /* ---------------- Columns ---------------- */

  const columns = useMemo<ColumnDef<UpiWithdrawalRequest>[]>(
    () => [
      {
        header: "User",
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.userId.slice(0, 8)}…
            </div>
          </div>
        ),
      },
      {
        accessorKey: "primaryUpi",
        header: "Primary UPI",
      },
      {
        accessorKey: "secondaryUpi",
        header: "Secondary UPI",
        cell: ({ row }) =>
          row.original.secondaryUpi ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.status === "APPROVED"
                ? "bg-emerald-500/15 text-emerald-600"
                : row.original.status === "REJECTED"
                  ? "bg-red-500/15 text-red-600"
                  : "bg-amber-500/15 text-amber-600"
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "submittedAt",
        header: "Submitted",
        cell: ({ row }) => row.original.submittedAt.toLocaleString("en-IN"),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) =>
          row.original.status === "PENDING" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={actionId === row.original.id}
                onClick={async () => {
                  try {
                    setActionId(row.original.id);
                    await approveUpiWithdrawFn(row.original.id);
                    toast.success("UPI withdrawal approved");
                    await refetch();
                  } catch {
                    toast.error("Failed to approve request");
                    await refetch();
                  } finally {
                    setActionId(null);
                  }
                }}
              >
                Approve
              </Button>

              <Button
                size="sm"
                variant="destructive"
                disabled={actionId !== null}
                onClick={() => {
                  setSelectedId(row.original.id);
                  setRejectOpen(true);
                }}
              >
                Reject
              </Button>
            </div>
          ),
      },
    ],
    [actionId],
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">UPI Withdraw Requests</h1>

      <Input
        className="w-80"
        placeholder="Search by user / UPI"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
      />

      <div className="border rounded-xl">
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
                <TableCell colSpan={6} className="py-10 text-center">
                  Loading…
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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

      <ConfirmActionDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject UPI Withdrawal"
        description="Are you sure you want to reject this withdrawal request?"
        confirmText="Reject Withdrawal"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!selectedId) return;

          try {
            setActionId(selectedId);
            await rejectUpiWithdrawFn(selectedId);
            toast.success("UPI withdrawal rejected");
          } catch {
            toast.error("Failed to reject request");
          } finally {
            setRejectOpen(false);
            setSelectedId(null);
            setActionId(null);
          }
        }}
      />
    </div>
  );
}
