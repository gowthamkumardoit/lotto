import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

/* ---------------- Callables ---------------- */

const approveUpiWithdrawal = httpsCallable<
  { requestId: string },
  { success: boolean }
>(functions, "approveUpi");

const rejectUpiWithdrawal = httpsCallable<
  { requestId: string; reason?: string },
  { success: boolean }
>(functions, "rejectUpi");

/* ---------------- Service API ---------------- */

export async function approveUpiWithdrawFn(requestId: string) {
  const res = await approveUpiWithdrawal({ requestId });
  return res.data;
}

export async function rejectUpiWithdrawFn(
  requestId: string,
  reason?: string,
) {
  const res = await rejectUpiWithdrawal({
    requestId,
    reason,
  });
  return res.data;
}
