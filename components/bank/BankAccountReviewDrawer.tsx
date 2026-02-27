/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

type Props = {
  open: boolean;
  account: any | null;
  onClose: () => void;
};

export default function BankAccountReviewDrawer({
  open,
  account,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  if (!account) return null;

  const status = account.status;

  const approve = async () => {
    try {
      setLoading(true);

      await httpsCallable(functions, "approveBankAccount")({
        userId: account.userId,
        bankAccountId: account.id,
        note: note || "Approved",
      });

      toast.success("Bank account approved");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  const reject = async () => {
    if (!note.trim()) {
      toast.error("Rejection reason required");
      return;
    }

    try {
      setLoading(true);

      await httpsCallable(functions, "rejectBankAccount")({
        userId: account.userId,
        bankAccountId: account.id,
        note,
      });

      toast.success("Bank account rejected");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Rejection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-w-xl mx-auto">
        <DrawerHeader>
          <DrawerTitle>Bank Account Review</DrawerTitle>
        </DrawerHeader>

        <div className="p-6 space-y-6">

          {/* Status */}
          <div>
            <Badge
              className={
                status === "PENDING"
                  ? "bg-amber-500/15 text-amber-600"
                  : status === "APPROVED"
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-red-500/15 text-red-600"
              }
            >
              {status}
            </Badge>
          </div>

          <Separator />

          {/* Account Details */}
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Account Holder</span>
              <div className="font-medium">{account.accountName}</div>
            </div>

            <div>
              <span className="text-muted-foreground">Bank</span>
              <div className="font-medium">{account.bankName}</div>
            </div>

            <div>
              <span className="text-muted-foreground">Account Number</span>
              <div className="font-mono">
                {account.accountNumber}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">IFSC</span>
              <div className="font-mono">{account.ifsc}</div>
            </div>
          </div>

          <Separator />

          {/* Admin Note */}
          {status === "PENDING" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Admin Note / Rejection Reason
              </label>
              <Textarea
                placeholder="Enter approval note or rejection reason..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          {status === "PENDING" && (
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={approve}
                disabled={loading}
              >
                Approve
              </Button>

              <Button
                variant="destructive"
                className="flex-1"
                onClick={reject}
                disabled={loading}
              >
                Reject
              </Button>
            </div>
          )}

          {status !== "PENDING" && (
            <div className="text-sm text-muted-foreground">
              This request has already been processed.
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}