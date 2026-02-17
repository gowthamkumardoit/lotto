/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/common/BackButton";
import { JackpotTable } from "@/components/jackpotDraw/JackpotTable";

export default function JackpotPage() {
  const [loading, setLoading] = useState(false);

  async function handleCreateJackpot() {
    setLoading(true);
    const toastId = toast.loading("Opening jackpot creation…");

    try {
      // This just opens the dialog route or prepares data
      // Actual creation happens inside CreateJackpotDialog
      toast.success("Ready to create jackpot", { id: toastId });
    } catch (err: any) {
      toast.error(
        err?.message || err?.details || "Failed to start jackpot creation",
        { id: toastId },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <BackButton fallbackHref="/admin" />
          <h1 className="text-2xl font-semibold">Jackpot Draws</h1>
          <p className="text-sm text-muted-foreground">
            Manage jackpot lifecycle, pricing, and settlements
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        {/* This button is optional if you already have CreateJackpotDialog elsewhere */}
        <Button onClick={handleCreateJackpot} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlusCircle className="mr-2 h-4 w-4" />
          )}
          Create Jackpot
        </Button>
      </div>

      {/* Jackpot Table */}
      <JackpotTable />
    </div>
  );
}
