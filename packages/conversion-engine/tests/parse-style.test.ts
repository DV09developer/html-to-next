import { describe, expect, it } from "vitest";
import { parseStyle, toCamelCaseProperty } from "../src/index.js";

describe("toCamelCaseProperty", () => {
    it("converts kebab-case", () => {
        expect(toCamelCaseProperty("margin-top")).toBe("marginTop");
    });

    it("keeps css variables", () => {
        expect(toCamelCaseProperty("--brand-color")).toBe("--brand-color");
    });

    it("handles vendor prefixes", () => {
        expect(toCamelCaseProperty("-webkit-box-shadow")).toBe(
            "WebkitBoxShadow",
        );
        expect(toCamelCaseProperty("-ms-transform")).toBe("msTransform");
    });
});

describe("parseStyle", () => {
    it("parses simple declarations", () => {
        expect(parseStyle("color: red; margin-top: 4px")).toEqual([
            { property: "color", value: "red" },
            { property: "marginTop", value: "4px" },
        ]);
    });

    it("ignores trailing semicolons and empty input", () => {
        expect(parseStyle("color: red;")).toEqual([
            { property: "color", value: "red" },
        ]);
        expect(parseStyle("")).toEqual([]);
    });

    it("does not split inside url()", () => {
        expect(
            parseStyle(
                'background: url("data:image/png;base64,AAA"); color: red',
            ),
        ).toEqual([
            {
                property: "background",
                value: 'url("data:image/png;base64,AAA")',
            },
            { property: "color", value: "red" },
        ]);
    });

    it("does not split inside quotes", () => {
        expect(parseStyle('font-family: "A;B", serif')).toEqual([
            { property: "fontFamily", value: '"A;B", serif' },
        ]);
    });

    it("skips declarations without a value", () => {
        expect(parseStyle("color:; margin: 0")).toEqual([
            { property: "margin", value: "0" },
        ]);
    });
});
