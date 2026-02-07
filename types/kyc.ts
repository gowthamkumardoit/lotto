import { Timestamp } from "firebase/firestore";

export type KycStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

export interface KycRequest {
  uid: string;
  fullName: string;
  dob: string;
  docType: string;
  docNumber: string;
  docImageUrl: string;
  status: KycStatus;
  createdAt: Date;
}
