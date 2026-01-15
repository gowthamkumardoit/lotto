export type WalletSnapshot = {
  available: number;
  locked: number;
  bonus: number;
};

export type WithdrawalRequest = {
  id: string;
  userName: string;
  userPhone: string;
  amount: number;
  method: "UPI" | "BANK";
  status: "PENDING" | "APPROVED" | "REJECTED";
  destination: string;
  createdAt: string;
};

export type WithdrawalRequestWithWallet = WithdrawalRequest & {
  wallet: WalletSnapshot;
};
