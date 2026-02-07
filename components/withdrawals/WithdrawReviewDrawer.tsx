/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import {
  User,
  Wallet,
  Calendar,
  Hash,
  Banknote,
  CheckCircle,
  XCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

type WalletSnapshot = {
  available: number;
  locked: number;
  bonus: number;
};

type WithdrawalRequestWithWallet = {
  id: string;
  userName: string;
  userPhone: string;
  amount: number;
  method: "UPI" | "BANK";
  destination: string; // masked
  status: "SUBMITTED" | "APPROVED" | "REJECTED";
  createdAt: string;
  wallet: WalletSnapshot;
};

export default function WithdrawReviewDrawer({
  open,
  onClose,
  withdrawal,
  onApprove,
  onReject,
}: {
  open: boolean;
  onClose: () => void;
  withdrawal: WithdrawalRequestWithWallet | null;
  onApprove?: (withdrawal: WithdrawalRequestWithWallet, note: string) => void;
  onReject?: (withdrawal: WithdrawalRequestWithWallet, note: string) => void;
}) {
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const functions = getFunctions(undefined, "asia-south1");

  const approveWithdrawFn = httpsCallable<
    { withdrawId: string; note: string },
    { success: boolean }
  >(functions, "approveWithdraw");

  const rejectWithdrawFn = httpsCallable<
    { withdrawId: string; note: string },
    { success: boolean }
  >(functions, "rejectWithdraw");

  useEffect(() => {
    if (!open) setNote("");
  }, [open]);

  if (!withdrawal) return null;

  const isPending = withdrawal.status === "SUBMITTED";

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent side="right" className="w-[460px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="border-b px-6 py-4 shrink-0">
          <SheetTitle>Review Withdrawal</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Withdrawal Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Withdrawal Amount
              </span>
              <span className="text-lg font-semibold">
                ₹{withdrawal.amount}
              </span>
            </div>

            <div className="flex gap-2">
              <Badge variant="secondary">BANK / UPI </Badge>
              <Badge
                variant={
                  withdrawal.status === "SUBMITTED"
                    ? "outline"
                    : withdrawal.status === "APPROVED"
                      ? "success"
                      : "destructive"
                }
              >
                {withdrawal.status}
              </Badge>
            </div>
          </div>

          {/* User */}
          <Section title="User">
            <InfoRow icon={User} label="Name" value={withdrawal.userName} />
            <InfoRow icon={Hash} label="Phone" value={withdrawal.userPhone} />
          </Section>

          {/* Wallet Snapshot */}
          <Section title="Wallet Snapshot">
            <InfoRow
              icon={Wallet}
              label="Available"
              value={`₹${withdrawal.wallet.available}`}
            />
            <InfoRow
              icon={Wallet}
              label="Locked"
              value={`₹${withdrawal.wallet.locked}`}
            />
            <InfoRow
              icon={Wallet}
              label="Bonus"
              value={`₹${withdrawal.wallet.bonus}`}
            />
          </Section>

          {/* Payout Details */}
          <Section title="Payout Details">
            <InfoRow
              icon={Banknote}
              label="Destination"
              value={withdrawal.destination}
            />
            <InfoRow
              icon={Calendar}
              label="Requested At"
              value={withdrawal.createdAt}
            />
          </Section>

          {/* Admin Note */}
          {isPending && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Admin Note <span className="text-red-500">*</span>
              </label>
              <Textarea
                rows={3}
                placeholder="Explain approval or rejection reason"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This note will be stored in audit logs.
              </p>
            </div>
          )}

          {/* Actions */}
          {isPending && (
            <div className="space-y-3">
              <Button
                className="w-full"
                disabled={!note || submitting}
                onClick={async () => {
                  if (!withdrawal) return;

                  setSubmitting(true);
                  const toastId = toast.loading("Approving withdrawal…");

                  try {
                    await approveWithdrawFn({
                      withdrawId: withdrawal.id,
                      note,
                    });

                    toast.success("Withdrawal approved & transferred", {
                      id: toastId,
                    });
                    onClose(); // ✅ CLOSE DRAWER
                  } catch (err: any) {
                    toast.error(
                      err?.message || "Failed to approve withdrawal",
                      {
                        id: toastId,
                      },
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve & Transfer Funds
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                disabled={!note || submitting}
                onClick={async () => {
                  if (!withdrawal) return;

                  setSubmitting(true);
                  const toastId = toast.loading("Rejecting withdrawal…");

                  try {
                    await rejectWithdrawFn({
                      withdrawId: withdrawal.id,
                      note,
                    });

                    toast.success("Withdrawal rejected & funds released", {
                      id: toastId,
                    });
                    onClose(); // ✅ CLOSE DRAWER
                  } catch (err: any) {
                    toast.error(err?.message || "Failed to reject withdrawal", {
                      id: toastId,
                    });
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject & Release Funds
              </Button>

              {withdrawal.wallet.locked < withdrawal.amount && (
                <p className="text-xs text-red-500">
                  ⚠ Locked amount is less than withdrawal amount. Check wallet
                  integrity.
                </p>
              )}
            </div>
          )}

          {/* Safety Warning */}
          {isPending && (
            <div className="flex gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              Approving this withdrawal will permanently debit the user’s
              wallet. This action cannot be undone.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------------- Helpers ---------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="rounded-lg border divide-y">{children}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium">{value}</span>
    </div>
  );
}
