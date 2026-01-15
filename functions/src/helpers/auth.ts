import { HttpsError } from "firebase-functions/v2/https";

export function requireAdmin(request: any): string {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // if (!request.auth.token?.admin) {
  //   throw new HttpsError("permission-denied", "Admin access required");
  // }

  return request.auth.uid; // ✅ ONLY UID
}
