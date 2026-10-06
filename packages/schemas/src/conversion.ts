import { z } from "zod";

export const conversionOptionsSchema = z.object({
    framework: z.literal("nextjs").default("nextjs"),
    language: z.literal("typescript").default("typescript"),
    styling: z.literal("tailwind").default("tailwind"),
    appRouter: z.literal(true).default(true),
    componentStrategy: z.enum(["auto", "single", "split"]).default("auto"),
    accessibility: z.boolean().default(true),
    optimizeImages: z.boolean().default(true),
    generateProps: z.boolean().default(true),
});

export type ConversionOptions = z.infer<typeof conversionOptionsSchema>;
