/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { DrawTable } from "@/components/draws/DrawTable";

export default function DrawsPage() {
  const [loading, setLoading] = useState(false);

  async function handleCreateDailyRuns() {
    setLoading(true);
    const toastId = toast.loading("Creating today's draws...");

    try {
      const createDailyDrawRuns = httpsCallable(
        functions,
        "createDailyDrawRuns"
      );

      const res: any = await createDailyDrawRuns({});

      toast.success(`Created ${res.data.created} draw(s) for today`, {
        id: toastId,
      });
    } catch (err: any) {
      toast.error(
        err?.message || err?.details || "Failed to create daily draws",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Today’s Draws</h1>

        {/* ✅ ONLY ACTION */}
        <Button onClick={handleCreateDailyRuns} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlusCircle className="mr-2 h-4 w-4" />
          )}
          Create Today’s Draws
        </Button>
      </div>

      {/* Draw Runs Table */}
      <DrawTable />
    </div>
  );
}
