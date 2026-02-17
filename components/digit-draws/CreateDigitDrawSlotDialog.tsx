/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { db, functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Template = {
  id: string;
  name: string;
  digits: number;
  config?: any;
};

export function CreateDigitDrawSlotDialog({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [slotName, setSlotName] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [closeAt, setCloseAt] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- LOAD TEMPLATES ---------------- */

  useEffect(() => {
    const q = query(collection(db, "digitDraws"), orderBy("digits", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const data: Template[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
      setTemplates(data);
    });

    return () => unsub();
  }, []);

  /* ---------------- CREATE SLOT ---------------- */

  async function handleCreate() {
    if (!selectedTemplateId) {
      toast.error("Select a digit template");
      return;
    }

    if (!slotName.trim()) {
      toast.error("Slot name required");
      return;
    }

    if (!openAt || !closeAt) {
      toast.error("Open & Close time required");
      return;
    }

    if (new Date(closeAt) <= new Date(openAt)) {
      toast.error("Close time must be after open time");
      return;
    }

    setLoading(true);

    const toastId = toast.loading("Creating slot...");

    try {
      const createSlot = httpsCallable(functions, "createDigitDrawSlot");

      await createSlot({
        templateId: selectedTemplateId,
        name: slotName,
        openAt: Timestamp.fromDate(new Date(openAt)),
        closeAt: Timestamp.fromDate(new Date(closeAt)),
      });

      toast.success("Slot created successfully", { id: toastId });
      setOpen(false);

      setSelectedTemplateId("");
      setSlotName("");
      setOpenAt("");
      setCloseAt("");
    } catch (err: any) {
      toast.error(err?.message || err?.details || "Failed to create slot", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- RENDER ---------------- */

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? <Button>+ Create Slot</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Digit Draw Slot</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* TEMPLATE SELECT */}
          <div className="space-y-2">
            <Label>Digit Template</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select 2D / 3D / 4D" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name ?? `${t.digits} Digit`} ({t.digits}D)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SLOT NAME */}
          <div className="space-y-2">
            <Label>Slot Name</Label>
            <Input
              placeholder="e.g. 2D Quick – 8PM"
              value={slotName}
              onChange={(e) => setSlotName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* OPEN TIME */}
          <div className="space-y-2">
            <Label>Open Time</Label>
            <Input
              type="datetime-local"
              value={openAt}
              onChange={(e) => setOpenAt(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* CLOSE TIME */}
          <div className="space-y-2">
            <Label>Close Time</Label>
            <Input
              type="datetime-local"
              value={closeAt}
              onChange={(e) => setCloseAt(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Slot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
