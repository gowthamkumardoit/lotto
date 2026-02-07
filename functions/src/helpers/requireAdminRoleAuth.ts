import { HttpsError } from "firebase-functions/v2/https";

export function requireAdminRoleAuth(request: any) {
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Not logged in");
  }

  if (auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Admins only");
  }

  return auth.uid;
}
