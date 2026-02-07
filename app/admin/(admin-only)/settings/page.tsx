/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Shield,
  Wallet,
  Bell,
  AlertTriangle,
  IdCard,
  Image as ImageIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { db, functions } from "@/lib/firebase";
import { toast } from "sonner";

import { storage } from "@/lib/firebase";

/* ---------------- Page ---------------- */

export default function AdminSettingsPage() {
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  /* 🔄 Load settings (read-only, realtime) */
  useEffect(() => {
    const refDoc = doc(db, "platformConfig", "global");

    const unsub = onSnapshot(refDoc, (snap) => {
      if (snap.exists()) {
        setForm(snap.data());
      } else {
        setForm({
          general: {
            platformName: "Lottery App",
            maintenanceMode: false,
          },
          wallet: {
            minWithdrawal: 100,
            maxWithdrawalPerDay: 10000,
            allowManualDeposits: true,
          },
          security: {
            requireAdminNote: true,
            autoLockSuspicious: false,
          },
          notifications: {
            notifyLargeWithdrawal: true,
            largeWithdrawalThreshold: 5000,
            telegram: {
              languages: {
                en: true, // 🔒 always on
                ta: false,
                ml: false,
                hi: false,
              },
            },
          },
          kyc: {
            requiredForWithdrawals: true,
            requiredAboveAmount: 5000,
            gracePeriodDays: 7,
          },
          branding: {
            logoUrl: "",
          },
          danger: {
            withdrawalsDisabled: false,
          },
        });
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* 💾 Save settings */
  async function handleSave() {
    if (!form) return;
    setSaving(true);
    console.log("form", form);
    try {
      const fn = httpsCallable(functions, "updatePlatformSettings");
      await fn(form);

      toast.success("Settings saved", {
        description: "Platform configuration updated successfully.",
      });
    } catch (error: any) {
      toast.error("Save failed", {
        description:
          error?.message || "Something went wrong while saving settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Control platform behavior, security, and financial limits
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <Separator />

      {/* Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Branding */}
        <SettingsCard
          icon={ImageIcon}
          title="Platform Branding"
          description="Logo & visual identity"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-md border flex items-center justify-center bg-muted">
                {logoPreview || form.branding?.logoUrl ? (
                  <img
                    src={logoPreview || form.branding.logoUrl}
                    alt="Logo"
                    className="h-full w-full object-contain rounded-md"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // instant preview
                  setLogoPreview(URL.createObjectURL(file));

                  try {
                    const ext = file.name.split(".").pop();
                    const logoRef = ref(storage, `platform/logo.${ext}`);

                    await uploadBytes(logoRef, file);

                    const url = await getDownloadURL(logoRef);

                    setForm((p: any) => ({
                      ...p,
                      branding: { ...p.branding, logoUrl: url },
                    }));

                    toast.success("Logo uploaded");
                  } catch (err) {
                    console.error(err);
                    toast.error("Logo upload failed");
                  }
                }}
              />
            </div>
          </div>
        </SettingsCard>

        {/* General */}
        <SettingsCard
          icon={Settings}
          title="General"
          description="Basic platform configuration"
        >
          <SettingRow label="Platform Name">
            <Input
              value={form.general?.platformName || ""}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  general: {
                    ...p.general,
                    platformName: e.target.value,
                  },
                }))
              }
            />
          </SettingRow>

          <SettingRow
            label="Maintenance Mode"
            hint="Temporarily disable user access"
          >
            <Switch
              checked={form.general?.maintenanceMode}
              onCheckedChange={(v) =>
                setForm((p: any) => ({
                  ...p,
                  general: { ...p.general, maintenanceMode: v },
                }))
              }
            />
          </SettingRow>
        </SettingsCard>

        {/* Wallet */}
        <SettingsCard
          icon={Wallet}
          title="Wallet & Limits"
          description="Financial safety rules"
        >
          <SettingRow label="Minimum Withdrawal">
            <Input
              type="number"
              value={form.wallet?.minWithdrawal}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  wallet: {
                    ...p.wallet,
                    minWithdrawal: Number(e.target.value),
                  },
                }))
              }
            />
          </SettingRow>

          <SettingRow label="Max Withdrawal / Day">
            <Input
              type="number"
              value={form.wallet?.maxWithdrawalPerDay}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  wallet: {
                    ...p.wallet,
                    maxWithdrawalPerDay: Number(e.target.value),
                  },
                }))
              }
            />
          </SettingRow>

          <SettingRow label="Manual Deposits">
            <Switch
              checked={form.wallet?.allowManualDeposits}
              onCheckedChange={(v) =>
                setForm((p: any) => ({
                  ...p,
                  wallet: {
                    ...p.wallet,
                    allowManualDeposits: v,
                  },
                }))
              }
            />
          </SettingRow>
        </SettingsCard>

        {/* Security */}
        <SettingsCard
          icon={Shield}
          title="Security"
          description="Admin & transaction protection"
        >
          <SettingRow label="Admin Notes Required">
            <Switch
              checked={form.security?.requireAdminNote}
              onCheckedChange={(v) =>
                setForm((p: any) => ({
                  ...p,
                  security: {
                    ...p.security,
                    requireAdminNote: v,
                  },
                }))
              }
            />
          </SettingRow>

          <SettingRow label="Auto-lock Suspicious Accounts">
            <Switch
              checked={form.security?.autoLockSuspicious}
              onCheckedChange={(v) =>
                setForm((p: any) => ({
                  ...p,
                  security: {
                    ...p.security,
                    autoLockSuspicious: v,
                  },
                }))
              }
            />
          </SettingRow>
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard
          icon={Bell}
          title="Notifications"
          description="Admin alerts & thresholds"
        >
          <SettingRow label="Alert on Large Withdrawals">
            <Switch
              checked={form.notifications?.notifyLargeWithdrawal}
              onCheckedChange={(v) =>
                setForm((p: any) => ({
                  ...p,
                  notifications: {
                    ...p.notifications,
                    notifyLargeWithdrawal: v,
                  },
                }))
              }
            />
          </SettingRow>

          <SettingRow label="Alert Threshold">
            <Input
              type="number"
              value={form.notifications?.largeWithdrawalThreshold}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  notifications: {
                    ...p.notifications,
                    largeWithdrawalThreshold: Number(e.target.value),
                  },
                }))
              }
            />
          </SettingRow>
        </SettingsCard>

        {/* KYC */}
        <SettingsCard
          icon={IdCard}
          title="KYC Compliance"
          description="Identity verification rules"
        >
          <SettingRow label="Require KYC for Withdrawals">
            <Switch
              checked={form.kyc?.requiredForWithdrawals}
              onCheckedChange={(v) =>
                setForm((p: any) => ({
                  ...p,
                  kyc: {
                    ...p.kyc,
                    requiredForWithdrawals: v,
                  },
                }))
              }
            />
          </SettingRow>

          <SettingRow label="KYC Required Above Amount">
            <Input
              type="number"
              value={form.kyc?.requiredAboveAmount}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  kyc: {
                    ...p.kyc,
                    requiredAboveAmount: Number(e.target.value),
                  },
                }))
              }
            />
          </SettingRow>

          <SettingRow label="KYC Grace Period (Days)">
            <Input
              type="number"
              value={form.kyc?.gracePeriodDays}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  kyc: {
                    ...p.kyc,
                    gracePeriodDays: Number(e.target.value),
                  },
                }))
              }
            />
          </SettingRow>
        </SettingsCard>

        {/* Telegram Language Channels */}
        <SettingsCard
          icon={Bell}
          title="Telegram Language Channels"
          description="Configure admin alert languages"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* English (Locked) */}
            <LanguageToggle label="English" flag="🇬🇧" checked locked />

            {/* Tamil */}
            <LanguageToggle
              label="Tamil"
              flag="🇮🇳"
              checked={form.notifications?.telegram?.languages?.ta}
              onChange={(v: boolean) =>
                setForm((p: any) => ({
                  ...p,
                  notifications: {
                    ...p.notifications,
                    telegram: {
                      ...(p.notifications.telegram ?? {}),
                      languages: {
                        ...(p.notifications.telegram?.languages ?? {
                          en: true,
                          ta: false,
                          ml: false,
                          hi: false,
                        }),
                        ta: v,
                      },
                    },
                  },
                }))
              }
            />

            {/* Malayalam */}
            <LanguageToggle
              label="Malayalam"
              flag="🇮🇳"
              checked={form.notifications?.telegram?.languages?.ml}
              onChange={(v: boolean) =>
                setForm((p: any) => ({
                  ...p,
                  notifications: {
                    ...p.notifications,
                    telegram: {
                      ...(p.notifications.telegram ?? {}),
                      languages: {
                        ...(p.notifications.telegram?.languages ?? {
                          en: true,
                          ta: false,
                          ml: false,
                          hi: false,
                        }),
                        ml: v,
                      },
                    },
                  },
                }))
              }
            />

            {/* Hindi */}
            <LanguageToggle
              label="Hindi"
              flag="🇮🇳"
              checked={form.notifications?.telegram?.languages?.hi}
              onChange={(v: boolean) =>
                setForm((p: any) => ({
                  ...p,
                  notifications: {
                    ...p.notifications,
                    telegram: {
                      ...(p.notifications.telegram ?? {}),
                      languages: {
                        ...(p.notifications.telegram?.languages ?? {
                          en: true,
                          ta: false,
                          ml: false,
                          hi: false,
                        }),
                        hi: v,
                      },
                    },
                  },
                }))
              }
            />
          </div>
        </SettingsCard>
        {/* Danger Zone */}
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
          <div className="flex items-center gap-3 text-red-600 mb-3">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Danger Zone</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-red-600">
                Disable Withdrawals
              </div>
              <p className="text-sm text-muted-foreground">
                Immediately stop all withdrawal processing
              </p>
            </div>

            <Switch
              checked={form.danger?.withdrawalsDisabled}
              onCheckedChange={(v) =>
                setForm((p: any) => ({
                  ...p,
                  danger: { withdrawalsDisabled: v },
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI Helpers ---------------- */

function SettingsCard({ icon: Icon, title, description, children }: any) {
  return (
    <div className="rounded-xl border bg-background p-6 space-y-6">
      <div className="flex gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function SettingRow({ label, hint, children }: any) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="w-[180px] flex justify-end">{children}</div>
    </div>
  );
}

function LanguageToggle({
  label,
  flag,
  checked,
  onChange,
  locked,
}: {
  label: string;
  flag: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <span className="text-xl">{flag}</span>
        <div className="text-sm font-medium">{label}</div>
      </div>

      <Switch checked={checked} disabled={locked} onCheckedChange={onChange} />
    </div>
  );
}
