export type AuditLogFilters = {
    search?: string;
    entity?: string;
    actorType?: "admin" | "user" | "system";
    startDate?: Date;
    endDate?: Date;
};
