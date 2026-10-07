import { describe, expect, it } from "vitest";
import { AppError } from "@html-to-next/shared";
import { validateInput } from "../src/index.js";

const limits = {
    maxHtmlSize: 100,
    maxCssSize: 50,
    maxTotalInputSize: 120,
};

describe("validateInput", () => {
    it("accepts valid html and css", () => {
        expect(() =>
            validateInput("<p>Hello</p>", ".a { color: red; }", limits),
        ).not.toThrow();
    });

    it("accepts html without css", () => {
        expect(() =>
            validateInput("<p>Hello</p>", undefined, limits),
        ).not.toThrow();
    });

    it("rejects empty html", () => {
        expect(() => validateInput("   ", undefined, limits)).toThrow(AppError);
    });

    it("rejects html over the limit", () => {
        expect(() => validateInput("a".repeat(101), undefined, limits)).toThrow(
            "HTML input is too large",
        );
    });

    it("rejects css over the limit", () => {
        expect(() => validateInput("<p></p>", "a".repeat(51), limits)).toThrow(
            "CSS input is too large",
        );
    });

    it("rejects total size over the limit", () => {
        expect(() =>
            validateInput("a".repeat(90), "b".repeat(40), limits),
        ).toThrow("Total input is too large");
    });

    it("rejects null bytes", () => {
        expect(() => validateInput("<p>\u0000</p>", undefined, limits)).toThrow(
            "null bytes",
        );
    });
});
