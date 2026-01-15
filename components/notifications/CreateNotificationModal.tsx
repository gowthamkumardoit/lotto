/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";

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
import { Bell, Users, User, AlertTriangle } from "lucide-react";

import { functions } from "@/lib/firebase";

type CreateNotificationModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function CreateNotificationModal({
  open,
  onClose,
}: CreateNotificationModalProps) {
  const [type, setType] = useState<"INFO" | "PROMO" | "ALERT">("INFO");
  const [target, setTarget] = useState<"ALL" | "USER" | "SEGMENT">("ALL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [adminReason, setAdminReason] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (!title || !message || !adminReason) {
      toast.error("Please fill all required fields");
      return;
    }

    setSending(true);

    try {
      const fn = httpsCallable(functions, "createNotification");

      await fn({
        title,
        message,
        type,
        target,
        adminReason,
      });

      toast.success("Notification sent");

      // reset + close
      setTitle("");
      setMessage("");
      setAdminReason("");
      setType("INFO");
      setTarget("ALL");
      onClose();
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : err?.code === "permission-denied"
          ? "You do not have permission to perform this action."
          : "Failed to send notification";

      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            Create Notification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Type */}
          <div className="space-y-2">
            <Label>Notification Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "INFO" ? "default" : "outline"}
                onClick={() => setType("INFO")}
              >
                Info
              </Button>
              <Button
                type="button"
                variant={type === "PROMO" ? "default" : "outline"}
                onClick={() => setType("PROMO")}
              >
                Promo
              </Button>
              <Button
                type="button"
                variant={type === "ALERT" ? "destructive" : "outline"}
                onClick={() => setType("ALERT")}
              >
                Alert
              </Button>
            </div>
          </div>

          {/* Target */}
          <div className="space-y-2">
            <Label>Target Audience</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={target === "ALL" ? "default" : "outline"}
                onClick={() => setTarget("ALL")}
              >
                <Users className="mr-1 h-4 w-4" />
                All Users
              </Button>
              {/* <Button
                type="button"
                variant={target === "USER" ? "default" : "outline"}
                onClick={() => setTarget("USER")}
              >
                <User className="mr-1 h-4 w-4" />
                Single User
              </Button>
              <Button
                type="button"
                variant={target === "SEGMENT" ? "default" : "outline"}
                onClick={() => setTarget("SEGMENT")}
              >
                Segment
              </Button> */}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Draw Result Published"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the notification message"
            />
          </div>

          {/* Admin Reason */}
          <div className="space-y-2">
            <Label>Admin Reason</Label>
            <Textarea
              rows={2}
              value={adminReason}
              onChange={(e) => setAdminReason(e.target.value)}
              placeholder="Explain why this notification is being sent"
            />
          </div>

          {/* Safety */}
          <div className="rounded-md border bg-muted/50 p-3 text-xs">
            <Badge variant="secondary" className="mb-2">
              Important
            </Badge>
            <p className="text-muted-foreground">
              Notifications are immutable and permanently logged.
            </p>
          </div>

          {type === "ALERT" && (
            <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              Use ALERT notifications only for critical issues.
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={sending}>
            {sending ? "Sending…" : "Send Notification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
