import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { recomputeAdminPendingCounts } from "../admin/recomputeAdminPendingCounts";

export const onKycChanged = onDocumentWritten(
  {
    document: "kycRequests/{uid}",
    region: "asia-south1",
  },
  async () => {
    await recomputeAdminPendingCounts();
  }
);
