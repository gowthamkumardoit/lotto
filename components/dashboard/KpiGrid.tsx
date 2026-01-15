import { KpiCard } from "./KpiCard";

export function KpiGrid() {
  // mock data for now
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard title="Today Sales" value="₹5,60,000" />
      <KpiCard title="Tickets Sold" value={23001} />
      <KpiCard title="Active Draws" value={3} />
      <KpiCard title="Pending Payouts" value={2} />
    </div>
  );
}
