/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/platformConfig.store.ts
import { create } from "zustand";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { PlatformConfigSchema, PlatformConfig } from "@/schemas/platformConfig.schema";

type PlatformConfigState = {
  config: PlatformConfig | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
};

export const usePlatformConfigStore = create<PlatformConfigState>((set) => ({
  config: null,
  loading: false,
  error: null,

  load: async () => {
    try {
      set({ loading: true, error: null });

      const getConfig = httpsCallable(functions, "getPlatformConfig");
      const res = await getConfig();

      const parsed = PlatformConfigSchema.parse(res.data);

      set({ config: parsed, loading: false });
    } catch (err: any) {
      console.error("PlatformConfig load failed", err);
      set({
        error: err?.message ?? "Failed to load platform config",
        loading: false,
      });
    }
  },
}));
