import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

export function handleError(error: unknown): never {
  logger.error("🔥 FUNCTION ERROR", error);

  if (error instanceof HttpsError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new HttpsError("internal", error.message);
  }

  throw new HttpsError("internal", "Unknown error");
}
