import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { recomputeAdminPendingCounts } from "../admin/recomputeAdminPendingCounts";

export const onBankAccountRequests = onDocumentWritten(
  {
    document: "users/{uid}/bankAccounts/{bankAccountId}",
    region: "asia-south1",
  },
  async () => {
    await recomputeAdminPendingCounts();
  },
);
