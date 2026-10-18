import { describe, expect, it } from "vitest";
import {
    conversionResultSchema,
    createValidationResult,
    generatedFileSchema,
    validationIssueSchema,
    warningSchema,
} from "../src/index.js";

const validResult = {
    files: [
        {
            path: "components/Hero.tsx",
            language: "tsx",
            content: "export function Hero() { return null; }",
            generatedBy: "system",
        },
    ],
    components: [
        {
            id: "page",
            name: "Page",
            type: "page",
            sourcePaths: [],
            children: [],
            props: [],
        },
    ],
    warnings: [{ code: "SCRIPTS_REMOVED", message: "Removed 1 script", count: 1 }],
    errors: [],
    validation: { valid: true, errors: [], warnings: [] },
    metadata: { durationMs: 12, aiUsed: false, repairAttempts: 0 },
};

describe("conversionResultSchema", () => {
    it("accepts a complete valid result", () => {
        expect(conversionResultSchema.safeParse(validResult).success).toBe(true);
    });

    it("rejects a result with a missing section", () => {
        const { validation: _validation, ...incomplete } = validResult;

        expect(conversionResultSchema.safeParse(incomplete).success).toBe(false);
    });

    it("rejects negative durations", () => {
        const result = conversionResultSchema.safeParse({
            ...validResult,
            metadata: { ...validResult.metadata, durationMs: -1 },
        });

        expect(result.success).toBe(false);
    });
});

describe("generatedFileSchema", () => {
    it("rejects an empty path", () => {
        const result = generatedFileSchema.safeParse({
            ...validResult.files[0],
            path: "",
        });

        expect(result.success).toBe(false);
    });

    it("rejects an unknown generator", () => {
        const result = generatedFileSchema.safeParse({
            ...validResult.files[0],
            generatedBy: "robot",
        });

        expect(result.success).toBe(false);
    });
});

describe("validationIssueSchema", () => {
    it("rejects line numbers below 1", () => {
        const result = validationIssueSchema.safeParse({
            code: "TS2322",
            severity: "error",
            message: "Type mismatch",
            line: 0,
        });

        expect(result.success).toBe(false);
    });
});

describe("warningSchema", () => {
    it("accepts the shape the cleaner already produces", () => {
        const result = warningSchema.safeParse({
            code: "EVENT_HANDLERS_REMOVED",
            message: "Removed 2 event handlers",
            count: 2,
        });

        expect(result.success).toBe(true);
    });
});

describe("createValidationResult", () => {
    it("is valid when there are only warnings", () => {
        const result = createValidationResult([
            { code: "A11Y_ALT", severity: "warning", message: "Missing alt" },
        ]);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(1);
    });

    it("is invalid when any error exists", () => {
        const result = createValidationResult([
            { code: "TS2322", severity: "error", message: "Type mismatch" },
            { code: "A11Y_ALT", severity: "warning", message: "Missing alt" },
        ]);

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.warnings).toHaveLength(1);
    });

    it("is valid for an empty list", () => {
        expect(createValidationResult([]).valid).toBe(true);
    });
});