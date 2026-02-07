"use client";

import { DrawNameTable } from "@/components/draw-names/DrawNameTable";
import { DrawNameDialog } from "@/components/draw-names/DrawNameDialog";
import { BackButton } from "@/components/common/BackButton";
import { GenerateMockTickets } from "@/components/dev/GenerateMockTickets";

export default function DrawNamesPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <BackButton fallbackHref="/admin/draws" />

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Draw Names
            </h1>
            <p className="text-sm text-muted-foreground">
              Create and manage predefined draw names used across lotteries
            </p>
          </div>
        </div>
        <GenerateMockTickets />

        {/* Primary Action */}
        <DrawNameDialog />
      </div>

      {/* Table Section */}
      <DrawNameTable />
    </div>
  );
}
