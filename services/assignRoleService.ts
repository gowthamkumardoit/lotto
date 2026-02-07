// services/assignRoleService.ts
import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

/**
 * Assign role to a user by email
 */
export const assignRoleCallable = httpsCallable<
    { email: string; role: string },
    { success: boolean }
>(functions, "assignRole");

/**
 * List all role assignments
 */
export const listRoleAssignmentsCallable = httpsCallable<
    void,
    {
        items: {
            email: string;
            role: string;
            assignedAt: number;
        }[];
    }
>(functions, "listRoleAssignments");
