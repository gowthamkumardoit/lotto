/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Hash, IndianRupee, Calendar } from "lucide-react";

export type DrawResult = {
  drawName: string;
  time: string;
  winningNumbers: {
    type: "2D" | "3D" | "4D";
    number: string;
  }[];
  totalSales: number;
  totalWinners: number;
  totalPayout: number;
};

export function ViewResultsDialog({
  open,
  onOpenChange,
  result,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: DrawResult | null;
}) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Draw Results</DialogTitle>
          <DialogDescription>Finalized results for this draw</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Draw Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="font-semibold">{result.drawName}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {result.time}
            </div>
          </div>

          {/* Winning Numbers */}
          <Section title="Winning Numbers">
            <div className="flex gap-3 flex-wrap">
              {result.winningNumbers.map((w) => (
                <div
                  key={w.type}
                  className="rounded-lg border px-4 py-3 text-center min-w-[90px]"
                >
                  <div className="text-xs text-muted-foreground">{w.type}</div>
                  <div className="text-lg font-semibold tracking-widest">
                    {w.number}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Summary */}
          <Section title="Summary">
            <InfoRow
              icon={IndianRupee}
              label="Total Sales"
              value={`₹${result.totalSales.toLocaleString()}`}
            />
            <InfoRow
              icon={Trophy}
              label="Total Winners"
              value={result.totalWinners.toString()}
            />
            <InfoRow
              icon={IndianRupee}
              label="Total Payout"
              value={`₹${result.totalPayout.toLocaleString()}`}
            />
          </Section>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Helpers ---------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="rounded-lg border p-4">{children}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium">{value}</span>
    </div>
  );
}
