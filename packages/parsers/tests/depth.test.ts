import { describe, expect, it } from "vitest";
import { AppError } from "@html-to-next/shared";
import { parseHtml } from "../src/index.js";

// Builds `levels` unclosed <div> tags. parse5 closes them automatically,
// so this is a valid way to create deep nesting.
function nested(levels: number): string {
    return "<div>".repeat(levels) + "x";
}

describe("parseHtml nesting limit", () => {
    it("allows nesting up to the limit", () => {
        expect(() => parseHtml(nested(3), { maxDepth: 3 })).not.toThrow();
    });

    it("rejects nesting beyond the limit", () => {
        expect(() => parseHtml(nested(4), { maxDepth: 3 })).toThrow(
            "HTML is nested too deeply",
        );
    });

    it("applies a default limit", () => {
        expect(() => parseHtml(nested(300))).toThrow(AppError);
    });

    it("fails cleanly instead of overflowing the stack", () => {
        // If the depth check were missing, this would throw a RangeError,
        // and `toThrow(AppError)` would fail.
        expect(() => parseHtml(nested(20_000))).toThrow(AppError);
    });
});
