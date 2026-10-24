import { z } from "zod";
import { componentNodeSchema } from "./component.js";
import { generatedFileSchema } from "./generated-file.js";
import { validationResultSchema } from "./validation.js";
import { warningSchema } from "./warning.js";

export const conversionErrorSchema = z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    stage: z.string().optional(),
});

export type ConversionError = z.infer<typeof conversionErrorSchema>;

export const conversionMetadataSchema = z.object({
    durationMs: z.number().nonnegative(),
    aiUsed: z.boolean(),
    repairAttempts: z.number().int().nonnegative(),
    model: z.string().optional(),
    promptVersion: z.string().optional(),
    inputTokens: z.number().int().nonnegative().optional(),
    outputTokens: z.number().int().nonnegative().optional(),
});

export type ConversionMetadata = z.infer<typeof conversionMetadataSchema>;

export const conversionResultSchema = z.object({
    files: z.array(generatedFileSchema),
    components: z.array(componentNodeSchema),
    warnings: z.array(warningSchema),
    errors: z.array(conversionErrorSchema),
    validation: validationResultSchema,
    metadata: conversionMetadataSchema,
});

export type ConversionResult = z.infer<typeof conversionResultSchema>;
