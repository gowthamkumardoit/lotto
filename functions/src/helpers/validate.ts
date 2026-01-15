import { z } from "zod";
import { HttpsError } from "firebase-functions/v2/https";

/**
 * Validate incoming callable data using Zod
 */
export function validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): T {
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
        const message = parsed.error.issues
            .map((e) =>
                e.path.length
                    ? `${e.path.join(".")}: ${e.message}`
                    : e.message
            )
            .join(", ");

        throw new HttpsError("invalid-argument", message);
    }

    return parsed.data;
}
