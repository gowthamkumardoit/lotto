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
  digitDrawId?: string;
  initialName?: string;
  initialDigits?: number;
  initialDate?: string; // yyyy-mm-dd
  initialTime?: string;
  children?: React.ReactNode;
};

export function DigitDrawDialog({
  digitDrawId,
  initialName,
  initialDigits,
  initialDate,
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
  const [digits, setDigits] = useState<number | "">(initialDigits ?? "");
  const [date, setDate] = useState(initialDate ?? "");
  const [time, setTime] = useState(initialTime ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(digitDrawId);

  const isUnchanged = useMemo(
    () =>
      isEdit &&
      name.trim() === initialName?.trim() &&
      digits === initialDigits &&
      date === initialDate &&
      time === initialTime,
    [
      isEdit,
      name,
      digits,
      date,
      time,
      initialName,
      initialDigits,
      initialDate,
      initialTime,
    ],
  );

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    if (open) {
      setName(initialName ?? "");
      setDigits(initialDigits ?? "");
      setDate(initialDate ?? "");
      setTime(initialTime ?? "");
      setError("");
    }
  }, [open, initialName, initialDigits, initialDate, initialTime]);

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

    if (!digits || digits <= 0) {
      setError("Number of digits is required");
      return;
    }

    
    if (isUnchanged) {
      setOpen(false);
      return;
    }

    setLoading(true);
    setError("");

    const toastId = toast.loading(
      isEdit ? "Updating digit draw..." : "Creating digit draw...",
    );

    try {
      if (isEdit) {
        const updateDigitDraw = httpsCallable(functions, "updateDigitDraw");

        await updateDigitDraw({
          digitDrawId,
          name,
          digits,
        });
      } else {
        const createDigitDraw = httpsCallable(functions, "createDigitDraw");

        await createDigitDraw({
          name,
          digits,
        });
      }

      toast.success(
        isEdit
          ? "Digit draw updated successfully"
          : "Digit draw created successfully",
        { id: toastId },
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

  if (!authReady) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>{isEdit ? "Edit Digit Draw" : "+ Add Digit Draw"}</Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Digit Draw" : "Create Digit Draw"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Draw Name */}
          <Input
            autoFocus
            placeholder="e.g. 3 Digit Night"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />

          {/* Digits */}
          <Input
            type="number"
            min={1}
            placeholder="Number of digits"
            value={digits}
            onChange={(e) =>
              setDigits(e.target.value ? Number(e.target.value) : "")
            }
            disabled={loading}
          />


          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || isUnchanged}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Digit Draw"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
