/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

import { functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  drawId?: string;
  initialName?: string;
  initialTime?: string;
  children?: React.ReactNode;
};

export function DrawNameDialog({
  drawId,
  initialName,
  initialTime,
  children,
}: Props) {
  /* ---------------- AUTH ---------------- */
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, [auth]);

  /* ---------------- STATE ---------------- */
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName ?? "");
  const [time, setTime] = useState(initialTime ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(drawId);

  const isUnchanged = useMemo(
    () => isEdit && name.trim() === initialName?.trim() && time === initialTime,
    [isEdit, name, time, initialName, initialTime]
  );

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    if (open) {
      setName(initialName ?? "");
      setTime(initialTime ?? "");
      setError("");
    }
  }, [open, initialName, initialTime]);

  /* ---------------- HANDLER ---------------- */
  async function handleSubmit() {
    if (!user) {
      toast.error("Session expired. Please login again.");
      return;
    }

    if (!name.trim()) {
      setError("Draw name is required");
      return;
    }

    if (!time) {
      setError("Draw time is required");
      return;
    }

    if (isUnchanged) {
      setOpen(false);
      return;
    }

    setLoading(true);
    setError("");

    const toastId = toast.loading(
      isEdit ? "Updating Kuber X draw..." : "Creating Kuber X draw..."
    );

    try {
      if (isEdit) {
        const updateDrawName = httpsCallable(functions, "updateDrawName");
        await updateDrawName({ drawId, name, time });
      } else {
        const createDrawName = httpsCallable(functions, "createDrawName");
        await createDrawName({ name, time });
      }

      toast.success(
        isEdit ? "Kuber X Draw updated successfully" : "Kuber X Draw created successfully",
        { id: toastId }
      );

      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || err?.details || "Something went wrong", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- RENDER ---------------- */

  // 🔒 Wait for Firebase auth to hydrate
  if (!authReady) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  // 🔐 Not logged in → hide UI or redirect
  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? <Button variant="destructive">{isEdit ? "Edit Kuber X" : "+ Add Kuber X"}</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Kuber X" : "Create Kuber X"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Draw Name */}
          <Input
            autoFocus
            placeholder="e.g. Evening Draw"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />

          {/* Draw Time */}
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={loading}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || isUnchanged}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Kuber X"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
