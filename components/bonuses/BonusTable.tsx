"use client";

import { Gift } from "lucide-react";

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

import { Bonus } from "@/types/bonus";
import { BonusRowActions } from "./BonusRowActions";

type Props = {
  bonuses: Bonus[];
  onDelete: () => void;
};

export default function BonusTable({ bonuses, onDelete }: Props) {
  return (
    <div className="rounded-xl border bg-background shadow-sm">
      {/* Header */}
      <div className="border-b px-5 py-4">
        <h3 className="text-lg font-semibold">Bonus History</h3>
        <p className="text-sm text-muted-foreground">
          All bonus campaigns issued on the platform
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="pl-6">Bonus</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valid (Days)</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {bonuses.map((b) => (
            <TableRow
              key={b.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <TableCell className="pl-6 font-medium flex items-center gap-2">
                <Gift className="h-4 w-4 text-muted-foreground" />
                {b.title}
              </TableCell>

              <TableCell className="font-semibold">₹{b.amount}</TableCell>

              {/* Status */}
              <TableCell>
                <Badge
                  className={cn(
                    "rounded-full px-3 py-1",
                    b.status === "ACTIVE" &&
                      "bg-emerald-500/15 text-emerald-600",
                    b.status === "USED" && "bg-violet-500/15 text-violet-600",
                    b.status === "EXPIRED" && "bg-zinc-500/15 text-zinc-500"
                  )}
                >
                  {b.status}
                </Badge>
              </TableCell>

              {/* Valid Days */}
              <TableCell className="text-sm">{b.validDays ?? "-"}</TableCell>

              {/* Expires */}
              <TableCell className="text-sm text-muted-foreground">
                {b.expiresAt ? b.expiresAt.toLocaleDateString() : "-"}
              </TableCell>

              <TableCell>{b.createdBy}</TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {b.createdAt.toLocaleDateString()}
              </TableCell>

              <TableCell className="pr-6 text-right">
                <BonusRowActions id={b.id} onDeleted={onDelete} />
              </TableCell>
            </TableRow>
          ))}

          {bonuses.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-12 text-center text-muted-foreground"
              >
                No bonuses found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
