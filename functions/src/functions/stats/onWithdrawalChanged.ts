import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { recomputeAdminPendingCounts } from "../admin/recomputeAdminPendingCounts";

export const onWithdrawalChanged = onDocumentWritten(
    {
        document: "withdrawalRequests/{id}",
        region: "asia-south1",
    },
    async () => {
        await recomputeAdminPendingCounts();
    }
);
