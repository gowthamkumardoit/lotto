"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { CreateDrawForm } from "./CreateDrawForm";


export function CreateDrawDialog() {
  const [open, setOpen] = useState(false);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Create Draw</Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Draw</DialogTitle>
        </DialogHeader>

        <CreateDrawForm onSuccess={() => setOpen(false)} />

        <DialogFooter className="text-xs text-muted-foreground">
          Once created, draw settings cannot be edited after locking.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
