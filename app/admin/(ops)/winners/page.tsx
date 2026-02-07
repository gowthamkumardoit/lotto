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
        <div className="text-sm text-muted-foreground">
          Loading winners…
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">
          Failed to load winners
        </div>
      )}

      {!loading && grouped.length > 0 && (
        <WinnersTable data={grouped} />
      )}

      {!loading && grouped.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No winners found
        </div>
      )}
    </div>
  );
}
