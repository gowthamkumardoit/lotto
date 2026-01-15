/**
 * Firebase Functions entry point
 * All callable / HTTP / background functions
 * must be exported from this file.
 */


/**
 * Global options (v2 only)
 * Controls cold starts & cost
 */


/* ------------------------------------------------------------------ */
/*                          ADMIN FUNCTIONS                           */
/* ------------------------------------------------------------------ */

export { createDrawName } from "./functions/createDrawName";
export { updateDrawName } from "./functions/updateDrawName";
export { toggleDrawStatus } from "./functions/toggleDrawStatus";
export { deleteDrawName } from "./functions/deleteDrawName";

export * from "./functions/health";
export * from "./functions/admin/updatePlatformSettings";
export * from "./functions/admin/createNotification";

export { seedMockUsers } from "./functions/admin/seedMockUsers";
export { updatePayoutSettings } from "./functions/admin/updatePayoutSettings";
export { uploadUpiQrFn } from "./functions/admin/uploadUpiQrFn";
export { setUserStatus } from "./functions/users/blockUser";

export { updateDrawConfig } from "./functions/draw/updateDrawConfig";
export { createDailyDrawRuns } from "./functions/draw/createDailyDrawRuns";
export { lockDrawRun } from "./functions/draw/lockDrawRun";
export { runDraw } from "./functions/draw/runDraw";
export { getDrawTicketStats } from "./functions/draw/getDrawTicketStats";
export { settleDrawRun } from "./functions/draw/settleDrawRun";

export { getDrawSummary } from "./functions/draw-details/getDrawSummary";
export { getMostPlayedNumbers } from "./functions/draw-details/getMostPlayedNumbers";

export { postToTelegramChannel } from "./functions/telegram/telegramChannel";
export { onDrawStatusChanged } from "./functions/telegram/onDrawStatusChanged";
/* ------------------------------------------------------------------ */
/*                          USER FUNCTIONS                            */
/* ------------------------------------------------------------------ */

// export { listActiveDrawNames } from "./functions/listActiveDrawNames";

/* ------------------------------------------------------------------ */
/*                          SYSTEM / TEST                             */
/* ------------------------------------------------------------------ */

// export { healthCheck } from "./functions/healthCheck";
