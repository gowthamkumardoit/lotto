import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

/**
 * Calls the Cloud Function `setUserStatus`
 * Admin-only (enforced on backend)
 */
export async function setUserStatus(
    userId: string,
    status: "active" | "blocked"
): Promise<void> {
    const setUserStatusFn = httpsCallable<
        { userId: string; status: "active" | "blocked" },
        { success: boolean }
    >(functions, "setUserStatus");

    await setUserStatusFn({ userId, status });
}
