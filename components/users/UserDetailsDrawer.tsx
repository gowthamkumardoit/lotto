/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  UserX,
  UserCheck,
  Phone,
  Calendar,
  User as UserIcon,
  Wallet as WalletIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { User } from "@/types/users";
import { ConfirmActionDialog } from "../common/ConfirmActionDialog";
import { setUserStatus } from "@/lib/actions/users";

/* ---------------- Component ---------------- */

export default function UserDetailsDrawer({
  user,
  open,
  onClose,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "block" | "unblock" | null
  >(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  /* ---------------- Handlers ---------------- */

  function openBlockConfirm() {
    setPendingAction("block");
    setConfirmOpen(true);
  }

  function openUnblockConfirm() {
    setPendingAction("unblock");
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!user || !pendingAction || loading) return;

    try {
      setLoading(true);

      await setUserStatus(
        user.id,
        pendingAction === "block" ? "blocked" : "active"
      );

      toast.success(
        pendingAction === "block"
          ? "User blocked successfully"
          : "User unblocked successfully"
      );

      setConfirmOpen(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- Render ---------------- */

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-[420px] p-0">
          {/* Header */}
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>User Details</SheetTitle>
          </SheetHeader>

          <div className="px-6 py-6 space-y-6">
            {/* Profile */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <UserIcon className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="flex-1">
                <div className="font-semibold">{user.name}</div>
                <div className="flex gap-2 pt-1">
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                  >
                    {user.role === "admin" && (
                      <Shield className="mr-1 h-3 w-3" />
                    )}
                    {user.role}
                  </Badge>

                  <Badge
                    variant={
                      user.status === "active" ? "success" : "destructive"
                    }
                  >
                    {user.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="rounded-lg border divide-y">
              <InfoRow icon={Phone} label="Phone" value={user.phone} />
              <InfoRow
                icon={Calendar}
                label="Joined"
                value={format(user.createdAt, "dd MMM yyyy")}
              />
            </div>

            {/* Wallet (placeholder) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <WalletIcon className="h-4 w-4" />
                Wallet
              </div>
            </div>

            {/* Admin Actions */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">
                Admin Actions
              </div>

              {user.status === "active" ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={openBlockConfirm}
                  disabled={loading || user.role === "admin"}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Block User
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={openUnblockConfirm}
                  disabled={loading}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Unblock User
                </Button>
              )}
            </div>

            {/* Footer */}
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              Wallet and account actions are fully logged for audit purposes.
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirm Dialog */}
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={pendingAction === "block" ? "Block user?" : "Unblock user?"}
        description={
          pendingAction === "block"
            ? "This user will be prevented from logging in and performing any actions."
            : "This user will regain access to their account."
        }
        confirmText={pendingAction === "block" ? "Block User" : "Unblock User"}
        confirmVariant={pendingAction === "block" ? "destructive" : "default"}
        onConfirm={handleConfirm}
      />
    </>
  );
}

/* ---------------- Helpers ---------------- */

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
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
