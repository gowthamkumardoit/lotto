"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  slotId: string;
  currentCloseAt: Date;
  callableName: string; // ex: "updateKuberGoldCloseTime"
  disabled?: boolean;
};

interface ExtendRequest {
  slotId: string;
  newCloseAt: string;
}

const EXTENSIONS = [
  { label: "+5m", ms: 5 * 60 * 1000 },
  { label: "+10m", ms: 10 * 60 * 1000 },
  { label: "+15m", ms: 15 * 60 * 1000 },
  { label: "+30m", ms: 30 * 60 * 1000 },
  { label: "+1h", ms: 60 * 60 * 1000 },
  { label: "+4h", ms: 4 * 60 * 60 * 1000 },
  { label: "+12h", ms: 12 * 60 * 60 * 1000 },
  { label: "+1d", ms: 24 * 60 * 60 * 1000 },
];

export function ExtendCloseTimePanel({
  slotId,
  currentCloseAt,
  callableName,
  disabled,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExtend = async (ms: number, label: string) => {
    try {
      setLoading(label);

      const newClose = new Date(
        Math.max(currentCloseAt.getTime(), Date.now()) + ms,
      );

      const fn = httpsCallable<ExtendRequest, void>(functions, callableName);

      await fn({
        slotId,
        newCloseAt: newClose.toISOString(),
      });

      toast.success(`Extended by ${label}`);
    } catch (error: unknown) {
      console.error("Extension failed:", error);

      const message =
        error instanceof Error ? error.message : "Failed to extend time";

      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        Extend Close Time
      </p>

      <div className="flex flex-wrap gap-2">
        {EXTENSIONS.map((ext) => (
          <Button
            key={ext.label}
            size="sm"
            variant="outline"
            disabled={disabled || loading !== null}
            onClick={() => handleExtend(ext.ms, ext.label)}
          >
            {loading === ext.label ? "Updating..." : ext.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
