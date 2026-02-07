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

import {
  User,
  Wallet,
  Calendar,
  Hash,
  CheckCircle,
  XCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

import type { DepositRequestWithWallet } from "@/types/deposit";
import { toast } from "sonner";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function DepositReviewDrawer({
  open,
  onClose,
  deposit,
  onApprove,
  onReject,
}: {
  open: boolean;
  onClose: () => void;
  deposit: DepositRequestWithWallet | null;
  onApprove?: (deposit: DepositRequestWithWallet, note: string) => void;
  onReject?: (deposit: DepositRequestWithWallet, note: string) => void;
}) {
  const [note, setNote] = useState("");

  const functions = getFunctions(undefined, "asia-south1");

  const approveTopupFn = httpsCallable<
    { topupId: string; note: string },
    { success: boolean }
  >(functions, "approveTopup");

  const rejectTopupFn = httpsCallable<
    { topupId: string; note: string },
    { success: boolean }
  >(functions, "rejectTopup");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setNote("");
  }, [open]);

  if (!deposit) return null;

  console.log("deposit", deposit);

  const isPending = deposit.status === "SUBMITTED";

  return (
    <Sheet
      open={open}
      onOpenChange={() => {
        if (!submitting) onClose();
      }}
    >
      <SheetContent side="right" className="w-[460px] p-0 flex flex-col h-full">
        {/* Header */}
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Review Deposit</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Deposit Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Deposit Amount
              </span>
              <span className="text-lg font-semibold">₹{deposit.amount}</span>
            </div>

            <div className="flex gap-2">
              <Badge variant="secondary">BANK / UPI</Badge>
              <Badge
                variant={
                  deposit.status === "SUBMITTED"
                    ? "outline"
                    : deposit.status === "APPROVED"
                      ? "success"
                      : "destructive"
                }
              >
                {deposit.status}
              </Badge>
            </div>
          </div>

          {/* User Info */}
          <Section title="User">
            <InfoRow icon={User} label="Name" value={deposit.userName} />
            <InfoRow icon={Hash} label="Phone" value={deposit.userPhone} />
          </Section>

          {/* Wallet Snapshot */}
          <Section title="Wallet Snapshot">
            <InfoRow
              icon={Wallet}
              label="Available"
              value={`₹${deposit.wallet.available}`}
            />
            <InfoRow
              icon={Wallet}
              label="Locked"
              value={`₹${deposit.wallet.locked}`}
            />
            <InfoRow
              icon={Wallet}
              label="Bonus"
              value={`₹${deposit.wallet.bonus}`}
            />
          </Section>

          {/* Payment Details */}
          <Section title="Payment Details">
            <InfoRow
              icon={Calendar}
              label="Requested At"
              value={deposit.createdAt}
            />
            <InfoRow icon={Hash} label="Reference" value={deposit.reference} />
          </Section>

          {/* Proof Image */}
          {deposit.proofUrl && (
            <Section title="Payment Proof">
              <div className="p-3">
                <img
                  src={deposit.proofUrl}
                  alt="Payment Proof"
                  className="w-full rounded-lg border cursor-pointer hover:opacity-90 transition"
                  onClick={() => window.open(deposit.proofUrl, "_blank")}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Click image to view full size
                </p>
              </div>
            </Section>
          )}

          {/* Admin Note */}
          <Section title="Admin Note">
            {isPending ? (
              <>
                <Textarea
                  rows={3}
                  placeholder="Explain approval or rejection reason"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  This note will be stored in audit logs.
                </p>
              </>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                {deposit.adminNote || "—"}
              </div>
            )}
          </Section>

          {/* Actions */}
          {isPending && (
            <div className="space-y-3">
              <Button
                className="w-full"
                disabled={!note || submitting}
                onClick={async () => {
                  if (!deposit) return;

                  setSubmitting(true);

                  const toastId = toast.loading("Approving deposit…");

                  try {
                    await approveTopupFn({
                      topupId: deposit.id,
                      note,
                    });

                    toast.success("Deposit approved & wallet credited", {
                      id: toastId,
                    });

                    onClose();
                  } catch (err: any) {
                    toast.error(err?.message || "Failed to approve deposit", {
                      id: toastId,
                    });
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve & Credit Wallet
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                disabled={!note || submitting}
                onClick={async () => {
                  if (!deposit) return;

                  setSubmitting(true);

                  const toastId = toast.loading("Rejecting deposit…");

                  try {
                    await rejectTopupFn({
                      topupId: deposit.id,
                      note,
                    });

                    toast.success("Deposit rejected", {
                      id: toastId,
                    });

                    onClose();
                  } catch (err: any) {
                    toast.error(err?.message || "Failed to reject deposit", {
                      id: toastId,
                    });
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Deposit
              </Button>
            </div>
          )}

          {/* Safety Warning */}
          {isPending && (
            <div className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              Approving this deposit will immediately credit the user’s wallet
              and cannot be undone.
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
