import { z } from "zod";

export const generatedFileSchema = z.object({
    path: z.string().min(1),
    language: z.enum(["tsx", "ts", "css", "json", "md"]),
    content: z.string(),
    generatedBy: z.enum(["system", "ai", "repair"]),
});

export type GeneratedFile = z.infer<typeof generatedFileSchema>;
