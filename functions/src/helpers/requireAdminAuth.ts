import { HttpsError } from "firebase-functions/https";

export function requireAdminAuth(request: any) {
    const auth = request.auth;

    if (!auth) {
        throw new HttpsError("unauthenticated", "Login required");
    }

    // if (auth.token.admin !== true) {
    //     throw new HttpsError("permission-denied", "Admin only");
    // }

    return auth;
}
