export async function assertNotProcessed(
    tx: FirebaseFirestore.Transaction,
    ref: FirebaseFirestore.DocumentReference
) {
    const snap = await tx.get(ref);
    if (snap.exists) {
        throw new Error("Operation already processed");
    }
}
