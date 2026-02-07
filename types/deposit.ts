export type WalletSnapshot = {
  available: number;
  locked: number;
  bonus: number;
};

export type DepositRequest = {
  id: string;
  userName: string;
  userPhone: string;
  amount: number;
  method: "UPI" | "BANK" | "CASH";
  status: "SUBMITTED" | "APPROVED" | "REJECTED";
  reference: string;
  createdAt: string;
};

export type DepositRequestWithWallet = DepositRequest & {
  wallet: WalletSnapshot;
  proofUrl?: string;     // ✅ ADD THIS
  adminNote?: string;    // ✅ ADD THIS/ ✅ REQUIRED here
};