// src/schemas/platformConfig.schema.ts
import { z } from "zod";

export const PlatformConfigSchema = z.object({
    id: z.string(),

    general: z.object({
        maintenanceMode: z.boolean(),
        platformName: z.string(),
    }),

    notifications: z.object({
        notifyLargeWithdrawal: z.boolean(),
        largeWithdrawalThreshold: z.number(),

        telegram: z.object({
            languages: z.object({
                en: z.literal(true), // 🔒 always enabled
                ta: z.boolean().optional().default(false),
                ml: z.boolean().optional().default(false),
                hi: z.boolean().optional().default(false),
            }),
        }).optional(),
    }),


    security: z.object({
        autoLockSuspicious: z.boolean(),
        requireAdminNote: z.boolean(),
    }),

    wallet: z.object({
        allowManualDeposits: z.boolean(),
        maxWithdrawalPerDay: z.number(),
        minWithdrawal: z.number(),
    }),

    kyc: z.object({
        gracePeriodDays: z.number(),
        requiredAboveAmount: z.number(),
        requiredForWithdrawals: z.boolean(),
    }),

    branding: z.object({
        logoUrl: z.string(),
    }),

    danger: z.object({
        withdrawalsDisabled: z.boolean(),
    }),

    updatedAt: z.any().optional(),
    updatedBy: z.any().optional(),
});

export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;
