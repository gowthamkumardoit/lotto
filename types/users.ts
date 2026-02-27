// /types/user.ts

export type UserRole = "user" | "admin";

export type UserStatus = "ACTIVE" | "BLOCKED";

export type User = {
  id: string;
  phone: string;
  provider: string;
  walletBalance: number;
  lockedBalance: number;
  bonusBalance: number;
  status: UserStatus; // ✅ keep status
  createdAt: Date;
  lastLoginAt?: Date;
  role: string;
};

// users collection shape
export type UserProfile = {
  uid: string;
  username?: string;
  displayName?: string;
  phone?: string;
};
