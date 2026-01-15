"use client";

import { TodayDrawsTable } from "./TodayDrawsTable";

export function TodayDrawsSection() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">📅 Today’s Draws</h2>

      <TodayDrawsTable />
    </section>
  );
}
