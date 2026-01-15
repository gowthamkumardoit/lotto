import { WinnerSummary } from "@/components/winners/WinnerSummary";
import { WinnerFilters } from "@/components/winners/WinnerFilters";
import { WinnerTable } from "@/components/winners/WinnerTable";

export default function WinnersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Winners</h1>

      <WinnerSummary />

      <WinnerFilters />

      <WinnerTable />
    </div>
  );
}
