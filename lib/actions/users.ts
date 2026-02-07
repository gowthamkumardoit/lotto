import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export type UserStatus = "ACTIVE" | "BLOCKED";

/**
 * Calls the Cloud Function `setUserStatus`
 * Admin-only (enforced on backend)
 */
export async function setUserStatus(
  userId: string,
  status: UserStatus
): Promise<void> {
  const setUserStatusFn = httpsCallable<
    { userId: string; status: UserStatus },
    { success: boolean }
  >(functions, "setUserStatus");

  await setUserStatusFn({ userId, status });
}
