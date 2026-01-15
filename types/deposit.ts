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
  status: "PENDING" | "COMPLETED" | "REJECTED";
  reference: string;
  createdAt: string;
};

export type DepositRequestWithWallet = DepositRequest & {
  wallet: WalletSnapshot; // ✅ REQUIRED here
};