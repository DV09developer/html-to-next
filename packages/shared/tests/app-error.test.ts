import { describe, expect, it } from "vitest";
import { AppError } from "../src/index.js";

describe("AppError", () => {
    it("stores message and code", () => {
        const error = new AppError("Bad input", "VALIDATION_ERROR");

        expect(error.message).toBe("Bad input");
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.name).toBe("AppError");
    });

    it("is an instance of Error", () => {
        const error = new AppError("Boom", "INTERNAL_ERROR");

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
    });

    it("keeps optional details", () => {
        const error = new AppError("Parse failed", "PARSE_ERROR", { line: 3 });

        expect(error.details).toEqual({ line: 3 });
    });
});
