"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { toast } from "sonner";

type PreviewProps = {
  open: boolean;
  onClose: () => void;
  slotId: string;
  winningNumber: string;
  digits: number;
};

export function WinnerPreviewDialog({
  open,
  onClose,
  slotId,
  winningNumber,
  digits,
}: PreviewProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    if (!open) return;

    const fetchPreview = async () => {
      try {
        setLoading(true);

        const previewFn = httpsCallable(functions, "previewDigitDrawWinners");
        const res: any = await previewFn({ slotId });

        setPreview(res.data);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load preview");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [open, slotId]);

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const declareFn = httpsCallable(functions, "declareDigitDrawWinners");
      await declareFn({ slotId });

      toast.success("Winners declared successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Declaration failed");
    } finally {
      setLoading(false);
    }
  };

  if (!preview) return null;

  const { prizes, totals } = preview;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl space-y-6">
        <DialogHeader>
          <DialogTitle>Winner Preview</DialogTitle>
        </DialogHeader>

        {loading && <p>Loading preview...</p>}

        {!loading && (
          <>
            {/* 🥇 FIRST PRIZE (EXACT) */}
            <div className="space-y-3 border rounded-xl p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">
                  🥇 1st Prize – Exact Match
                </h3>
                <span className="font-bold text-green-600">
                  ₹{prizes?.exact}
                </span>
              </div>

              <p className="text-2xl font-bold">{winningNumber}</p>

              <p className="text-sm text-muted-foreground">
                Winners: {preview.exactWinners?.length || 0}
              </p>
            </div>

            {/* 🥈 SECOND PRIZE */}
            {digits >= 2 && (
              <div className="space-y-3 border rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">
                    🥈 2nd Prize – Last {digits - 1} Digit Match
                  </h3>
                  <span className="font-bold text-blue-600">
                    ₹{prizes?.minusOne}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  Winners: {preview.minusOneWinners?.length || 0}
                </p>
              </div>
            )}

            {/* 🥉 THIRD PRIZE (Only for 3D & 4D) */}
            {digits >= 3 && (
              <div className="space-y-3 border rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">
                    🥉 3rd Prize – Last {digits - 2} Digit Match
                  </h3>
                  <span className="font-bold text-orange-600">
                    ₹{prizes?.minusTwo}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  Winners: {preview.minusTwoWinners?.length || 0}
                </p>
              </div>
            )}

            {/* 💰 FINANCIAL SUMMARY */}
            <div className="border rounded-xl p-4 bg-muted/30 space-y-2">
              <h3 className="font-semibold text-lg">💰 Financial Summary</h3>

              <div className="flex justify-between text-sm">
                <span>Total Tickets Sold</span>
                <span>{totals?.totalTickets}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Total Sales</span>
                <span className="font-semibold text-green-600">
                  ₹{totals?.totalSales}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Total Payout</span>
                <span className="font-semibold text-red-600">
                  ₹{totals?.totalPayout}
                </span>
              </div>

              <div className="flex justify-between text-base font-bold pt-2 border-t">
                <span>Estimated Profit</span>
                <span
                  className={
                    totals?.profit >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  ₹{totals?.profit}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>Confirm & Declare</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
