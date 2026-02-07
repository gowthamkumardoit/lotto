/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  FilterFn,
} from "@tanstack/react-table";

import { useMemo, useState } from "react";
import { useKycRequests } from "@/hooks/useKycRequests";
import { KycRequest } from "@/types/kyc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { approveKycFn, rejectKycFn } from "@/services/kycService";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";

export default function KycRequestsPage() {
  const { data, loading } = useKycRequests();
  const [globalFilter, setGlobalFilter] = useState("");
  const [actionUid, setActionUid] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  /* ---------------- Search ---------------- */

  const globalFilterFn: FilterFn<KycRequest> = (row, _, value) => {
    const s = String(value).toLowerCase();
    if (!s) return true;

    const k = row.original;
    return (
      k.fullName.toLowerCase().includes(s) ||
      k.docNumber.toLowerCase().includes(s) ||
      k.docType.toLowerCase().includes(s)
    );
  };

  /* ---------------- Columns ---------------- */

  const columns = useMemo<ColumnDef<KycRequest>[]>(
    () => [
      {
        header: "User",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.fullName}</div>
            <div className="text-xs text-muted-foreground">
              UID: {row.original.uid.slice(0, 8)}…
            </div>
          </div>
        ),
      },
      {
        accessorKey: "docType",
        header: "Document",
      },
      {
        accessorKey: "docNumber",
        header: "Doc Number",
      },
      {
        id: "proof",
        header: "Proof",
        cell: ({ row }) => (
          <button
            className="text-blue-600 text-sm underline"
            onClick={() => setPreviewUrl(row.original.docImageUrl)}
          >
            View Proof
          </button>
        ),
      },

      {
        accessorKey: "dob",
        header: "DOB",
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.dob).toLocaleDateString("en-IN")}
          </span>
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
        accessorKey: "createdAt",
        header: "Submitted At",
        cell: ({ row }) => row.original.createdAt.toLocaleString("en-IN"),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) =>
          row.original.status === "SUBMITTED" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={actionUid === row.original.uid}
                onClick={async () => {
                  try {
                    setActionUid(row.original.uid);
                    await approveKycFn({ uid: row.original.uid });
                    toast.success("KYC approved");
                  } catch (e: any) {
                    toast.error(e?.message ?? "Failed to approve KYC");
                  } finally {
                    setActionUid(null);
                  }
                }}
              >
                Approve
              </Button>

              <Button
                size="sm"
                variant="destructive"
                disabled={actionUid === row.original.uid}
                onClick={() => {
                  setSelectedUid(row.original.uid);
                  setRejectDialogOpen(true);
                }}
              >
                Reject
              </Button>
            </div>
          ),
      },
    ],
    [actionUid],
  );

  /* ---------------- Table ---------------- */

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    globalFilterFn,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">KYC Requests</h1>

      <Input
        placeholder="Search by name / PAN / type"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="w-80"
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
                <TableCell colSpan={8} className="text-center py-10">
                  Loading…
                </TableCell>
              </TableRow>
            )}

            {!loading && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  No KYC requests found
                </TableCell>
              </TableRow>
            )}

            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>

          <div className="flex items-center gap-2">
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50].map((s) => (
                <option key={s} value={s}>
                  Show {s}
                </option>
              ))}
            </select>

            <button
              className="px-3 py-1 text-sm border rounded-md"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Prev
            </button>
            <button
              className="px-3 py-1 text-sm border rounded-md"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-background rounded-xl p-4 max-w-lg w-full">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">KYC Document</h3>
              <button
                className="text-sm text-muted-foreground"
                onClick={() => setPreviewUrl(null)}
              >
                Close
              </button>
            </div>

            <img
              src={previewUrl}
              alt="KYC Proof"
              className="w-full rounded-md border"
            />

            <div className="mt-3 text-right">
              <a
                href={previewUrl}
                target="_blank"
                className="text-sm text-blue-600 underline"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}

      <ConfirmActionDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title="Reject KYC Request"
        description="Are you sure you want to reject this KYC request? This action cannot be undone."
        confirmText="Reject KYC"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!selectedUid) return;

          try {
            setActionUid(selectedUid);
            await rejectKycFn({
              uid: selectedUid,
              reason: "Invalid or unclear document",
            });
            toast.success("KYC rejected");
          } catch (e: any) {
            toast.error(e?.message ?? "Failed to reject KYC");
          } finally {
            setActionUid(null);
            setSelectedUid(null);
            setRejectDialogOpen(false);
          }
        }}
      />
    </div>
  );
}
