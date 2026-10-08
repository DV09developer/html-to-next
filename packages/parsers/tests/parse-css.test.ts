import { describe, expect, it } from "vitest";
import { parseCss } from "../src/index.js";

describe("parseCss", () => {
    it("parses a simple rule", () => {
        const result = parseCss(".hero { color: red; margin: 0 }");

        expect(result.rules).toEqual([
            {
                selector: ".hero",
                declarations: [
                    { property: "color", value: "red", important: false },
                    { property: "margin", value: "0", important: false },
                ],
                atRules: [],
            },
        ]);
    });

    it("splits selector lists into separate rules", () => {
        const result = parseCss("h1, h2 { color: red }");

        expect(result.rules.map((r) => r.selector)).toEqual(["h1", "h2"]);
    });

    it("records important", () => {
        const result = parseCss("p { color: red !important }");

        expect(result.rules[0]?.declarations[0]?.important).toBe(true);
    });

    it("records media query context", () => {
        const result = parseCss(
            "@media (min-width: 768px) { .a { display: none } }",
        );

        expect(result.rules[0]?.atRules).toEqual([
            "@media (min-width: 768px)",
        ]);
    });

    it("returns no rules for empty css", () => {
        expect(parseCss("").rules).toEqual([]);
    });
});