import { logger } from "firebase-functions";

export const log = {
    info: (msg: string, data?: unknown) =>
        logger.info(msg, data),
    warn: (msg: string, data?: unknown) =>
        logger.warn(msg, data),
    error: (msg: string, data?: unknown) =>
        logger.error(msg, data),
};
