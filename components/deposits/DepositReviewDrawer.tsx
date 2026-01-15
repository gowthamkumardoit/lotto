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

  useEffect(() => {
    if (!open) setNote("");
  }, [open]);

  if (!deposit) return null;

  const isPending = deposit.status === "PENDING";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[460px] p-0">
        {/* Header */}
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Review Deposit</SheetTitle>
        </SheetHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Deposit Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Deposit Amount
              </span>
              <span className="text-lg font-semibold">
                ₹{deposit.amount}
              </span>
            </div>

            <div className="flex gap-2">
              <Badge variant="secondary">{deposit.method}</Badge>
              <Badge
                variant={
                  deposit.status === "PENDING"
                    ? "outline"
                    : deposit.status === "COMPLETED"
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
            <InfoRow
              icon={Hash}
              label="Reference"
              value={deposit.reference}
            />
          </Section>

          {/* Admin Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Admin Note <span className="text-red-500">*</span>
            </label>
            <Textarea
              rows={3}
              placeholder="Explain approval or rejection reason"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!isPending}
            />
            <p className="text-xs text-muted-foreground">
              This note will be stored in audit logs.
            </p>
          </div>

          {/* Actions */}
          {isPending && (
            <div className="space-y-3">
              <Button
                className="w-full"
                disabled={!note}
                onClick={() => onApprove?.(deposit, note)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve & Credit Wallet
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                disabled={!note}
                onClick={() => onReject?.(deposit, note)}
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
      <div className="text-sm font-medium text-muted-foreground">
        {title}
      </div>
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
