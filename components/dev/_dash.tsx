/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { Button } from "@/components/ui/button";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { toast } from "sonner";
import { GenerateMockTickets } from "@/components/dev/GenerateMockTickets";

export default function AdminDashboardPage() {
  const isDev = process.env.NODE_ENV === "development";
  const seedUsers = httpsCallable(functions, "seedMockUsers");

  async function handleSeed() {
    if (!confirm("This will wipe and recreate mock users. Continue?")) return;

    try {
      const res = await seedUsers();
      toast.success(`Seeded ${(res.data as any).created} users successfully`);
    } catch (err: any) {
      toast.error(err.message || "Seeding failed");
    }
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <KpiGrid />

      {isDev && (
        <div className="rounded-xl border bg-muted/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Dev Tools</h2>
              <p className="text-sm text-muted-foreground">
                Development-only utilities for testing admin flows
              </p>
            </div>

            <Button variant="destructive" onClick={handleSeed}>
              Seed Mock Users
            </Button>
          </div>

          <GenerateMockTickets />
        </div>
      )}
    </div>
  );
}
