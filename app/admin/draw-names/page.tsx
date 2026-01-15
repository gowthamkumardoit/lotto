"use client";

import { DrawNameTable } from "@/components/draw-names/DrawNameTable";
import { DrawNameDialog } from "@/components/draw-names/DrawNameDialog";

export default function DrawNamesPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Draw Names</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage predefined draw names used across lotteries
          </p>
        </div>

        {/* Primary Action */}
        <DrawNameDialog />
      </div>

      {/* Table Section */}
      <DrawNameTable />
    </div>
  );
}
