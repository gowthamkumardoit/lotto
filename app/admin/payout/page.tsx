/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Upload, Banknote, QrCode, Plus, Trash } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db, functions, auth, storage } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { CardHeader, Field } from "@/components/helpers/uploadUpiQR";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/* ---------------- Types ---------------- */

type UpiAccount = {
  id: string;
  upiId: string;
  qr?: string;
  enabled: boolean;
};

/* ---------------- Page ---------------- */

export default function AdminPayoutSettingsPage() {
  const [loading, setLoading] = useState(false);

  /* -------- UPI STATE -------- */
  const [upiAccounts, setUpiAccounts] = useState<UpiAccount[]>([]);

  /* -------- BANK STATE -------- */
  const [bankEnabled, setBankEnabled] = useState(false);
  const [bank, setBank] = useState({
    holder: "",
    bankName: "",
    account: "",
    ifsc: "",
  });

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* ---------------- Upload QR (Firebase SDK) ---------------- */

  async function uploadQr(id: string, file: File) {
    if (!auth.currentUser) {
      toast.error("Not authenticated");
      return;
    }

    const uid = auth.currentUser.uid;
    const fileRef = ref(storage, `payouts/upi/${uid}/${id}-${Date.now()}.png`);

    console.log("fileref", storage);
    setUploadingId(id);
    setUploadProgress(0);

    const task = uploadBytesResumable(fileRef, file, {
      contentType: file.type,
    });

    task.on(
      "state_changed",
      (snap) => {
        const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setUploadProgress(p);
      },
      (err) => {
        console.error(err);
        toast.error("Upload failed");
        setUploadingId(null);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        updateUpi(id, { qr: url });
        toast.success("QR uploaded");
        setUploadingId(null);
        setUploadProgress(0);
      }
    );
  }

  /* ---------------- Load Settings ---------------- */

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "settings/payouts"));
        if (!snap.exists()) return;

        const data = snap.data();
        setUpiAccounts(data.upiAccounts || []);
        setBankEnabled(data.bank?.enabled ?? false);
        setBank({
          holder: data.bank?.holder ?? "",
          bankName: data.bank?.bankName ?? "",
          account: data.bank?.account ?? "",
          ifsc: data.bank?.ifsc ?? "",
        });
      } catch {
        toast.error("Failed to load payout settings");
      }
    }

    load();
  }, []);

  /* ---------------- Handlers ---------------- */

  function addUpi() {
    setUpiAccounts((p) => [
      ...p,
      { id: crypto.randomUUID(), upiId: "", enabled: false },
    ]);
  }

  function updateUpi(id: string, patch: Partial<UpiAccount>) {
    setUpiAccounts((p) => p.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  function removeUpi(id: string) {
    setUpiAccounts((p) => p.filter((u) => u.id !== id));
  }

  const saveSettings = useMemo(
    () => httpsCallable(functions, "updatePayoutSettings"),
    []
  );

  async function handleSave() {
    if (
      upiAccounts.some((u) => u.enabled && !u.upiId.trim()) ||
      (bankEnabled &&
        (!bank.holder || !bank.bankName || !bank.account || !bank.ifsc))
    ) {
      toast.warning("Please complete all enabled payout details");
      return;
    }

    setLoading(true);

    try {
      await saveSettings({
        upiAccounts,
        bank: { enabled: bankEnabled, ...bank },
      });

      toast.success("Payout settings saved successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to save payout settings");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold">Payout Settings</h1>
        <p className="text-sm text-muted-foreground">
          Control how users see and use payout methods
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---------------- UPI ---------------- */}
        <div className="rounded-xl border bg-background">
          <CardHeader
            icon={QrCode}
            title="UPI Payments"
            description="Multiple UPI IDs with individual control"
            toggle={
              <Button size="sm" variant="outline" onClick={addUpi}>
                <Plus className="mr-1 h-4 w-4" />
                Add UPI
              </Button>
            }
          />

          <div className="divide-y">
            {upiAccounts.map((upi) => (
              <div key={upi.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">UPI ID</div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={upi.enabled}
                      onCheckedChange={(v) => updateUpi(upi.id, { enabled: v })}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeUpi(upi.id)}
                    >
                      <Trash className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <Input
                  placeholder="example@upi"
                  value={upi.upiId}
                  onChange={(e) => updateUpi(upi.id, { upiId: e.target.value })}
                />

                <div className="flex items-start gap-4">
                  <div className="h-32 w-32 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                    {upi.qr ? (
                      <img
                        src={upi.qr}
                        alt="UPI QR"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No QR
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="inline-flex">
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadQr(upi.id, file);
                          e.currentTarget.value = "";
                        }}
                      />
                      <Button
                        variant="outline"
                        disabled={uploadingId === upi.id}
                        asChild
                      >
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          {uploadingId === upi.id ? "Uploading…" : "Upload QR"}
                        </span>
                      </Button>
                    </label>

                    {uploadingId === upi.id && (
                      <div className="h-2 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {upiAccounts.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">
                No UPI IDs added
              </p>
            )}
          </div>
        </div>

        {/* ---------------- BANK ---------------- */}
        <div className="rounded-xl border bg-background">
          <CardHeader
            icon={Banknote}
            title="Bank Transfer"
            description="Single bank account"
            toggle={
              <Switch checked={bankEnabled} onCheckedChange={setBankEnabled} />
            }
          />

          {bankEnabled && (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Account Holder Name">
                <Input
                  value={bank.holder}
                  onChange={(e) =>
                    setBank((b) => ({ ...b, holder: e.target.value }))
                  }
                />
              </Field>

              <Field label="Bank Name">
                <Input
                  value={bank.bankName}
                  onChange={(e) =>
                    setBank((b) => ({ ...b, bankName: e.target.value }))
                  }
                />
              </Field>

              <Field label="Account Number">
                <Input
                  value={bank.account}
                  onChange={(e) =>
                    setBank((b) => ({ ...b, account: e.target.value }))
                  }
                />
              </Field>

              <Field label="IFSC Code">
                <Input
                  value={bank.ifsc}
                  onChange={(e) =>
                    setBank((b) => ({ ...b, ifsc: e.target.value }))
                  }
                />
              </Field>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 p-6">
        <h3 className="font-semibold mb-3">User Preview</h3>
        <div className="space-y-3 text-sm">
          {upiAccounts
            .filter((u) => u.enabled && u.upiId)
            .map((u) => (
              <div key={u.id} className="rounded-lg border bg-background p-4">
                <div className="font-medium">UPI Payment</div>
                <p className="text-muted-foreground">{u.upiId}</p>
              </div>
            ))}

          {bankEnabled && (
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">Bank Transfer</div>
              <p className="text-muted-foreground">
                Account •••• {bank.account.slice(-4)}
              </p>
            </div>
          )}

          {!bankEnabled && upiAccounts.every((u) => !u.enabled) && (
            <p className="text-muted-foreground">No payout methods enabled</p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t pt-4 flex justify-end gap-3">
        <Button variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
