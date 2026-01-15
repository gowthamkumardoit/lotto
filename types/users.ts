// /types/user.ts

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "blocked";

export interface User {
    id: string;
    name: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
}
