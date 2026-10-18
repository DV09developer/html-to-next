export type ErrorCode =
    | "VALIDATION_ERROR"
    | "PARSE_ERROR"
    | "AI_PROVIDER_ERROR"
    | "AI_RESPONSE_INVALID"
    | "VALIDATION_FAILED"
    | "TIMEOUT"
    | "INTERNAL_ERROR";

export class AppError extends Error {
    readonly code: ErrorCode;
    readonly details?: unknown;

    constructor(message: string, code: ErrorCode, details?: unknown) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.details = details;
    }
}
