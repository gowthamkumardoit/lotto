"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Gift } from "lucide-react";
import { toast } from "sonner";

import { createBonus } from "@/services/bonusService";

type CreateBonusModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateBonusModal({
  open,
  onClose,
  onCreated,
}: CreateBonusModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [validDays, setValidDays] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setValidDays("");
    setReason("");
  };

  const handleCreate = async () => {
    if (!title || !amount || !validDays) return;

    try {
      setLoading(true);

      await createBonus({
        title,
        amount: Number(amount),
        validDays: Number(validDays),
        createdBy: "Admin",
        reason,
      });

      toast.success("Bonus campaign created successfully");

      resetForm();
      onClose();
      onCreated();
    } catch {
      toast.error("Failed to create bonus");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        resetForm();
        onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-muted-foreground" />
            Create Bonus Campaign
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label>Bonus Title</Label>
            <Input
              placeholder="New Year Welcome Bonus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Bonus Amount</Label>
            <Input
              type="number"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value ? Number(e.target.value) : "")
              }
            />
          </div>

          {/* Valid Days */}
          <div className="space-y-2">
            <Label>Valid For (Days)</Label>
            <Input
              type="number"
              placeholder="e.g. 7"
              value={validDays}
              onChange={(e) =>
                setValidDays(e.target.value ? Number(e.target.value) : "")
              }
            />
            <p className="text-xs text-muted-foreground">
              Bonus will expire automatically after this many days.
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Admin Reason</Label>
            <Textarea
              rows={3}
              placeholder="Reason for issuing this bonus (internal only)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Safety Notice */}
          <div className="rounded-md border bg-muted/50 p-3 text-xs">
            <Badge variant="secondary" className="mb-2">
              Important
            </Badge>
            <p className="text-muted-foreground">
              Bonus campaigns are permanently logged and cannot be edited or
              revoked once created.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !title || !amount || !validDays}
          >
            {loading ? "Creating..." : "Create Bonus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
