/**
 * ============================================================
 * Firebase Functions – Entry Point
 * ------------------------------------------------------------
 * All callable, HTTP, cron, and background functions
 * must be exported from this file.
 *
 * Structure:
 * 1. Admin / Platform Management
 * 2. Draw & Lottery Engine
 * 3. User Lifecycle & Auth
 * 4. Wallet / Payments / Withdrawals
 * 5. KYC & Compliance
 * 6. Support & Telegram Integration
 * 7. Stats & Aggregations
 * 8. Cron Jobs
 * 9. Dev / Test Utilities
 * ============================================================
 */

/* ============================================================
 * 1️⃣ ADMIN / PLATFORM MANAGEMENT
 * ============================================================
 */

export { createDrawName } from "./functions/createDrawName";
export { updateDrawName } from "./functions/updateDrawName";
export { toggleDrawStatus } from "./functions/toggleDrawStatus";
export { deleteDrawName } from "./functions/deleteDrawName";

export * from "./functions/admin/updatePlatformSettings";
export * from "./functions/admin/createNotification";

export { seedMockUsers } from "./functions/admin/seedMockUsers";
export { updatePayoutSettings } from "./functions/admin/updatePayoutSettings";
export { uploadUpiQrFn } from "./functions/admin/uploadUpiQrFn";
export { getAdminPendingCounts } from "./functions/admin/getAdminPendingCounts";
export { getPlatformConfig } from "./functions/admin/getPlatformConfig";
export { grantSignupBonus } from "./functions/admin/grantSignupBonus";
export { updateKuberGoldCloseTime } from "./functions/admin/updateKuberGoldCloseTime";
export { expireUserBonuses } from "./functions/admin/expireUserBonuses";

/* ============================================================
 * 2️⃣ DRAW / LOTTERY ENGINE
 * ============================================================
 */

export { updateDrawConfig } from "./functions/draw/updateDrawConfig";
export { createDailyDrawRuns } from "./functions/draw/createDailyDrawRuns";
export { lockDrawRun } from "./functions/draw/lockDrawRun";
export { runDraw } from "./functions/draw/runDraw";
export { settleDrawRun } from "./functions/draw/settleDrawRun";
export { getDrawTicketStats } from "./functions/draw/getDrawTicketStats";

export { getDrawSummary } from "./functions/draw-details/getDrawSummary";
export { getMostPlayedNumbers } from "./functions/draw-details/getMostPlayedNumbers";

export { createJackpotDraw } from "./functions/jackpot/createJackpotDraw";
export { updateJackpotDraw } from "./functions/jackpot/updateJackpotDraw";
export { deleteJackpotDraw } from "./functions/jackpot/deleteJackpotDraw";
export { getJackpotSummary } from "./functions/jackpot/getJackpotSummary";

export { createDigitDraw } from "./functions/digitDraw/createDigitDraw";
export { updateDigitDraw } from "./functions/digitDraw/updateDigitDraw";
export { updateDigitDrawConfig } from "./functions/digitDraw/updateDigitDrawConfig";
export { toggleDigitDrawStatus } from "./functions/digitDraw/toggleDigitDrawStatus";
export { deleteDigitDraw } from "./functions/digitDraw/deleteDigitDraw";

export { createDigitDrawSlot } from "./functions/digitDraw/createDigitDrawSlots";

export { lockDigitDrawSlot } from "./functions/digitDraw/lockDigitDrawSlot";
export { runDigitDrawSlot } from "./functions/digitDraw/runDigitDrawSlot";
export { previewDigitDrawWinners } from "./functions/digitDraw/previewDigitDrawWinners";
export { declareDigitDrawWinners } from "./functions/digitDraw/declareDigitDrawWinners";

/* ============================================================
 * 3️⃣ USER LIFECYCLE & AUTH
 * ============================================================`
 */

export { handleAuthUserCreate } from "./functions/users/handleAuthUserCreate";
export { setUserStatus } from "./functions/users/blockUser";

/* ============================================================
 * 4️⃣ WALLET / TOPUPS / WITHDRAWALS
 * ============================================================
 */

export { approveTopup } from "./functions/topups/approveTopup";
export { rejectTopup } from "./functions/topups/rejectTopup";

export { submitWithdraw } from "./functions/withdraw/submitWithdraw";
export { approveWithdraw } from "./functions/withdraw/approveWithdraw";
export { rejectWithdraw } from "./functions/withdraw/rejectWithdraw";
export { saveBankAccount } from "./functions/users/saveBankAccount";
export { approveBankAccount } from "./functions/users/approveBankAccount";
export { deleteBankAccount } from "./functions/users/deleteBankAccount";
export { rejectBankAccount } from "./functions/users/rejectBankAccount";
export { setPrimaryBankAccount } from "./functions/users/setPrimaryBankAccount";

/* ============================================================
 * 5️⃣ TICKETS / PURCHASE FLOW
 * ============================================================
 */

export { purchase2DTicket } from "./functions/tickets/purchase2DTicket";
export { purchase3DTicket } from "./functions/tickets/purchase3DTicket";
export { purchase4DTicket } from "./functions/tickets/purchase4DTicket";
export { purchaseKuberGoldTicket } from "./functions/tickets/purchaseKuberGoldTicket";
export { holdKuberGoldNumbers } from "./functions/tickets/holdKuberGoldNumbers";
export { releaseExpiredHolds } from "./functions/tickets/releaseExpiredHolds";

/* ============================================================
 * 6️⃣ KYC & COMPLIANCE
 * ============================================================
 */

export { approveKyc } from "./functions/kyc/approveKyc";
export { rejectKyc } from "./functions/kyc/rejectKyc";

/* ============================================================
 * 7️⃣ UPI REQUESTS
 * ============================================================
 */

export { approveUpi } from "./functions/upi-requests/approveUpi";
export { rejectUpi } from "./functions/upi-requests/rejectUpi";

/* ============================================================
 * 8️⃣ ROLES & PERMISSIONS
 * ============================================================
 */

export { assignRole } from "./functions/roles/assignRoles";
export { listRoleAssignments } from "./functions/roles/listRoleAssignments";

/* ============================================================
 * 9️⃣ SUPPORT & TELEGRAM INTEGRATION
 * ============================================================
 */

export { sendSupportMessage } from "./functions/telegram/sendSupportMessage";
export { telegramChatWebhook } from "./functions/telegram/telegramChatWebhook";
export { postToTelegramChannel } from "./functions/telegram/telegramChannel";
export { onDrawStatusChanged } from "./functions/telegram/onDrawStatusChanged";
export { onKuberGoldStatusChanged } from "./functions/telegram/onKuberGoldStatusChanged";

/* ============================================================
 * 🔟 STATS / AGGREGATIONS (Firestore Triggers)
 * ============================================================
 */

export { onKycChanged } from "./functions/stats/onKycChanged";
export { onSupportTicketChanged } from "./functions/stats/onSupportTicketChanged";
export { onTopupChanged } from "./functions/stats/onTopupChanged";
export { onUpiRequests } from "./functions/stats/onUpiRequests";
export { onWithdrawalChanged } from "./functions/stats/onWithdrawalChanged";
export { onBankAccountRequests } from "./functions/stats/onBankAccountRequests";

/* ============================================================
 * 1️⃣1️⃣ CRON JOBS / SCHEDULED TASKS
 * ============================================================
 */

export { createDailyDrawRunsCron } from "./functions/crons/createDailyDrawRuns.cron";
export { autoLockDraws } from "./functions/crons/autoLockDraw.cron";
export { notifyDrawClosing } from "./functions/crons/notifyDrawClosing.cron";

/* ============================================================
 * 1️⃣2️⃣ HEALTH / SYSTEM
 * ============================================================
 */

export * from "./functions/health";

/* ============================================================
 * 1️⃣3️⃣ DEV / TEST UTILITIES (NON-PRODUCTION)
 * ============================================================
 */

export { generateMockTickets } from "./functions/dev/generateMockTickets";
