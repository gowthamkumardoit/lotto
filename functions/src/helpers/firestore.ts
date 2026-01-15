import { HttpsError } from "firebase-functions/v2/https";

/**
 * Ensures no other draw exists with the same name (case-insensitive)
 */
export async function assertUniqueDrawName(
    db: FirebaseFirestore.Firestore,
    name: string
): Promise<void> {
    const nameLower = name.trim().toLowerCase();

    const snapshot = await db
        .collection("drawNames")
        .where("nameLower", "==", nameLower)
        .limit(1)
        .get();

    if (!snapshot.empty) {
        throw new HttpsError(
            "already-exists",
            "A draw name with this name already exists"
        );
    }
}
