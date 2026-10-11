import { AppError } from "@html-to-next/shared";
import { DEFAULT_MAX_NESTING_DEPTH } from "@html-to-next/parsers";

export type InputLimits = {
    maxHtmlSize: number;
    maxCssSize: number;
    maxTotalInputSize: number;
    /** Optional so older callers keep working. The parser default applies when omitted. */
    maxNestingDepth?: number;
};

export const DEFAULT_INPUT_LIMITS: InputLimits = {
    maxHtmlSize: 500_000,
    maxCssSize: 200_000,
    maxTotalInputSize: 600_000,
    // One number shared with the parser, so the two can't drift apart.
    maxNestingDepth: DEFAULT_MAX_NESTING_DEPTH,
};

export function validateInput(
    html: string,
    css: string | undefined,
    limits: InputLimits = DEFAULT_INPUT_LIMITS,
): void {
    if (html.trim().length === 0) {
        throw new AppError("HTML input is empty", "VALIDATION_ERROR");
    }

    if (html.length > limits.maxHtmlSize) {
        throw new AppError("HTML input is too large", "VALIDATION_ERROR", {
            max: limits.maxHtmlSize,
            actual: html.length,
        });
    }

    const cssLength = css?.length ?? 0;

    if (cssLength > limits.maxCssSize) {
        throw new AppError("CSS input is too large", "VALIDATION_ERROR", {
            max: limits.maxCssSize,
            actual: cssLength,
        });
    }

    if (html.length + cssLength > limits.maxTotalInputSize) {
        throw new AppError("Total input is too large", "VALIDATION_ERROR", {
            max: limits.maxTotalInputSize,
            actual: html.length + cssLength,
        });
    }

    if (html.includes("\u0000") || css?.includes("\u0000")) {
        throw new AppError("Input contains null bytes", "VALIDATION_ERROR");
    }
}
