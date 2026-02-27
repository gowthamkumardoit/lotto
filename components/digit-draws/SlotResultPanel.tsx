"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WinnerPreviewDialog } from "@/components/digit-draws/WinnerPreviewDialog";

type ResultPanelProps = {
  slotId: string;
  status: string;
  winningNumber?: string;
  digits: number;
  declared?: boolean;
};

export function SlotResultPanel({
  slotId,
  status,
  winningNumber,
  digits,
  declared,
}: ResultPanelProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  // Only show after draw has run
  if (!winningNumber) return null;

  return (
    <>
      <Card className="border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardContent className="p-8 text-center space-y-6">
          {/* Winning Number */}
          <div>
            <p className="text-sm opacity-70">Winning Number</p>
            <h2 className="text-5xl font-bold tracking-widest">
              {winningNumber.padStart(digits, "0")}
            </h2>
          </div>

          {/* Action Section */}
          <div>
            {declared ? (
              <Badge className="bg-green-500 text-white px-4 py-1">
                Winners Declared
              </Badge>
            ) : status === "DRAWN" ? (
              <Button
                onClick={() => setPreviewOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Preview & Declare Winners
              </Button>
            ) : (
              <Badge className="bg-yellow-500 text-white px-4 py-1">
                Awaiting Declaration
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <WinnerPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        slotId={slotId}
        winningNumber={winningNumber}
        digits={digits}
      />
    </>
  );
}
