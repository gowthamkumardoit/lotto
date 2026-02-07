import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TopupRequest } from "@/hooks/useTopupRequests";
import { cn } from "@/lib/utils";

export const depositColumns: ColumnDef<TopupRequest>[] = [
  {
    accessorKey: "userId",
    header: "User ID",
    cell: ({ row }) => (
      <div className="font-mono text-xs">{row.original.userId}</div>
    ),
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
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.utr}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      return (
        <Badge
          className={cn(
            "rounded-full px-3 py-1",
            s === "SUBMITTED" && "bg-amber-500/15 text-amber-600",
            s === "APPROVED" && "bg-emerald-500/15 text-emerald-600",
            s === "REJECTED" && "bg-red-500/15 text-red-600"
          )}
        >
          {s}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Requested At",
    cell: ({ row }) =>
      row.original.createdAt.toLocaleString("en-IN"),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) =>
      row.original.status === "SUBMITTED" ? (
        <Button size="sm">Review</Button>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];
