import { onRequest } from "firebase-functions/v2/https";

/**
 * Health check endpoint
 * GET /health
 */
export const health = onRequest(
    {
        region: "asia-south1", // change if needed
        timeoutSeconds: 30,
        memory: "256MiB",
    },
    async (_req, res) => {
        try {
            res.status(200).json({
                status: "ok",
                service: "lottery-api",
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            res.status(500).json({
                status: "error",
                message: "Health check failed",
            });
        }
    }
);
