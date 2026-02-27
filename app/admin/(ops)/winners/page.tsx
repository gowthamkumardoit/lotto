"use client";

import { WinnerSummary } from "@/components/winners/WinnerSummary";
import { WinnersTable } from "@/components/winners/WinnerTable";
import { useWinners } from "@/hooks/useWinners";
import { groupWinnersByDraw } from "@/utils/groupWinnersByDraw";

export default function WinnersPage() {
  const { winners, loading, error } = useWinners();

  const grouped = groupWinnersByDraw(winners);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Winners</h1>

      <WinnerSummary />

      {loading && (
        <div className="text-sm text-muted-foreground">Loading winners…</div>
      )}

      {error && (
        <div className="text-sm text-red-600">Failed to load winners</div>
      )}

      {!loading && grouped.length > 0 && <WinnersTable data={grouped} />}

      {!loading && grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            🏆
          </div>

          <h3 className="text-sm font-semibold text-foreground">
            No winners yet
          </h3>

          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Winners will appear here once a draw is completed and results are
            processed.
          </p>
        </div>
      )}
    </div>
  );
}
