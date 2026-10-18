import { z } from "zod";

export const warningSchema = z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    count: z.number().int().nonnegative().optional(),
    nodeId: z.string().optional(),
});

export type Warning = z.infer<typeof warningSchema>;