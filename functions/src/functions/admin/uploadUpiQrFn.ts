import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getStorage } from "firebase-admin/storage";
import { requireAdmin } from "../../helpers/auth";

export const uploadUpiQrFn = onCall(
    { region: "asia-south1", memory: "512MiB" },
    async (req) => {
        const uid = requireAdmin(req);
        const { contentType } = req.data ?? {};

        if (!contentType || !contentType.startsWith("image/")) {
            throw new HttpsError("invalid-argument", "Only image uploads allowed");
        }

        const bucket = getStorage().bucket();
        const ext = contentType.split("/")[1] ?? "png";
        const filePath = `upi-qr/${uid}/${Date.now()}.${ext}`;

        const file = bucket.file(filePath);

        const [uploadUrl] = await file.getSignedUrl({
            action: "write",
            expires: Date.now() + 10 * 60 * 1000,
            contentType,
        });

        return {
            uploadUrl,
            filePath,
            contentType,
            maxSize: 2 * 1024 * 1024,
            expiresIn: 600,
        };
    }
);
