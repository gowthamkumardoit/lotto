import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { recomputeAdminPendingCounts } from "../admin/recomputeAdminPendingCounts";

export const onTopupChanged = onDocumentWritten(
    {
        document: "topupRequests/{id}",
        region: "asia-south1",
    },
    async () => {
        await recomputeAdminPendingCounts();
    }
);
