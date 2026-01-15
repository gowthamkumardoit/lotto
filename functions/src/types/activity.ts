export type ActorType = "admin" | "user" | "system";

export interface ActivityLogPayload {
    actorId: string;
    actorType: ActorType;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
}
