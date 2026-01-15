import { HttpsError } from "firebase-functions/v2/https";
import { DocumentReference } from "firebase-admin/firestore";

export async function getDocOrThrow<T>(
    ref: DocumentReference<T>,
    errorMessage = "Document not found"
): Promise<T> {
    const snap = await ref.get();
    if (!snap.exists) {
        throw new HttpsError("not-found", errorMessage);
    }
    return snap.data()!;
}
