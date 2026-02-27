/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { DrawTable } from "@/components/draws/DrawTable";
import { BackButton } from "@/components/common/BackButton";
import { RefreshWrapper } from "@/components/ui/RefreshWrapper";

export default function DrawsPage() {
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = async () => {
    setRefreshKey((prev) => prev + 1);
  };

  async function handleCreateDailyRuns() {
    setLoading(true);
    const toastId = toast.loading("Creating today's draws...");

    try {
      const createDailyDrawRuns = httpsCallable(
        functions,
        "createDailyDrawRuns",
      );

      const res: any = await createDailyDrawRuns({});

      toast.success(`Created ${res.data.created} draw(s) for today`, {
        id: toastId,
      });
    } catch (err: any) {
      toast.error(
        err?.message || err?.details || "Failed to create daily draws",
        { id: toastId },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <RefreshWrapper onRefresh={handleRefresh}>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <BackButton fallbackHref="/admin" />
            <h1 className="text-2xl font-semibold">Today’s Draws</h1>
          </div>
        </div>

        <div className="flex items-center justify-between">
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
        <DrawTable key={refreshKey} />
      </div>
    </RefreshWrapper>
  );
}
