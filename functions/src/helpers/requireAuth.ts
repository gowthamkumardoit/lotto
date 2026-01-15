import { HttpsError } from "firebase-functions/v2/https";

export function requireAuth(context: any) {
    if (!context.auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
    }
    return context.auth;
}
