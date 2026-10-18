import { z } from "zod";

export const validationIssueSchema = z.object({
    code: z.string().min(1),
    severity: z.enum(["error", "warning"]),
    message: z.string().min(1),
    file: z.string().optional(),
    line: z.number().int().positive().optional(),
    column: z.number().int().positive().optional(),
});

export type ValidationIssue = z.infer<typeof validationIssueSchema>;

export const validationResultSchema = z.object({
    valid: z.boolean(),
    errors: z.array(validationIssueSchema),
    warnings: z.array(validationIssueSchema),
});

export type ValidationResult = z.infer<typeof validationResultSchema>;

export function createValidationResult(
    issues: ValidationIssue[],
): ValidationResult {
    const errors = issues.filter((issue) => issue.severity === "error");
    const warnings = issues.filter((issue) => issue.severity === "warning");

    return { valid: errors.length === 0, errors, warnings };
}
