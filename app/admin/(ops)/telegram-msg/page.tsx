/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const STATUSES = ["OPEN", "LOCKED", "DRAWN", "SETTLED"] as const;
const LANGUAGES = [
  { key: "en", label: "English" },
  { key: "ta", label: "Tamil" },
  { key: "ml", label: "Malayalam" },
  { key: "hi", label: "Hindi" },
  { key: "kn", label: "Kannada" },
  { key: "te", label: "Telugu" },
];

export default function TelegramMessageSettingsPage() {
  const [templates, setTemplates] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ref = doc(db, "platformConfig", "global");

    return onSnapshot(ref, (snap) => {
      const data = snap.data();
      setTemplates(data?.notifications?.telegram?.templates ?? {});
    });
  }, []);

  async function save() {
    try {
      setSaving(true);
      const fn = httpsCallable(functions, "updatePlatformSettings");

      await fn({
        notifications: {
          telegram: {
            templates,
          },
        },
      });

      toast.success("Telegram templates saved");
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold">Telegram Message Templates</h1>
        <p className="text-sm text-muted-foreground">
          Configure multilingual Telegram notifications
        </p>
      </div>

      <Tabs defaultValue="OPEN">
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUSES.map((status) => (
          <TabsContent key={status} value={status}>
            <div className="grid grid-cols-2 gap-6 mt-6">
              {LANGUAGES.map((lang) => (
                <div key={lang.key} className="space-y-2">
                  <label className="text-sm font-medium">{lang.label}</label>

                  <Textarea
                    rows={6}
                    value={templates?.[status]?.[lang.key] ?? ""}
                    onChange={(e) =>
                      setTemplates((p: any) => ({
                        ...p,
                        [status]: {
                          ...p?.[status],
                          [lang.key]: e.target.value,
                        },
                      }))
                    }
                    placeholder={`Message for ${status} (${lang.label})`}
                  />

                  <p className="text-xs text-muted-foreground">
                    Variables:
                    <code> {"{{name}}"}</code>
                    <code> {"{{drawName}}"}</code>
                    {status === "SETTLED" && (
                      <>
                        <code> {"{{result}}"}</code>
                        <code> {"{{amount}}"}</code>
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save Templates"}
      </Button>
    </div>
  );
}
