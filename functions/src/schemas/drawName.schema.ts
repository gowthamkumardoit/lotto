import { z } from "zod";

export const createDrawNameSchema = z.object({
  name: z.string().min(3).max(50),
});

export type CreateDrawNameInput = z.infer<
  typeof createDrawNameSchema
>;
