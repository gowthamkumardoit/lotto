import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export const approveKycFn = httpsCallable<
  { uid: string },
  { success: boolean }
>(functions, "approveKyc");

export const rejectKycFn = httpsCallable<
  { uid: string; reason: string },
  { success: boolean }
>(functions, "rejectKyc");
