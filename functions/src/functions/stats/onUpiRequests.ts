import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { recomputeAdminPendingCounts } from "../admin/recomputeAdminPendingCounts";

export const onUpiRequests = onDocumentWritten(
    {
        document: "upiWithdrawals/{id}",
        region: "asia-south1",
    },
    async () => {
        await recomputeAdminPendingCounts();
    }
);
