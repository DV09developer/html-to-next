import { describe, expect, it } from "vitest";
import { parseSelector } from "../src/index.js";
import type { ParsedSelector } from "../src/index.js";

function expectSupported(selector: string): ParsedSelector {
    const result = parseSelector(selector);

    if (!result.supported) {
        throw new Error(`Expected supported, got: ${result.reason}`);
    }

    return result.selector;
}

describe("parseSelector", () => {
    it("parses a tag", () => {
        const { steps } = expectSupported("p");

        expect(steps).toEqual([
            {
                combinator: null,
                compound: { tag: "p", id: null, classes: [] },
            },
        ]);
    });

    it("parses a compound selector", () => {
        const { steps } = expectSupported("h2.title.big#main");

        expect(steps[0]?.compound).toEqual({
            tag: "h2",
            id: "main",
            classes: ["title", "big"],
        });
    });

    it("parses a descendant combinator", () => {
        const { steps } = expectSupported(".card p");

        expect(steps.map((s) => s.combinator)).toEqual([null, "descendant"]);
    });

    it("parses a child combinator with spaces", () => {
        const { steps } = expectSupported(".card > p");

        expect(steps.map((s) => s.combinator)).toEqual([null, "child"]);
    });

    it("parses a child combinator without spaces", () => {
        const { steps } = expectSupported(".card>p");

        expect(steps.map((s) => s.combinator)).toEqual([null, "child"]);
    });

    it("computes specificity", () => {
        expect(expectSupported("#a .b p").specificity).toEqual([1, 1, 1]);
        expect(expectSupported("p").specificity).toEqual([0, 0, 1]);
    });

    it.each([
        ["a:hover"],
        ["a[href]"],
        ["a + b"],
        ["*"],
        [".a >"],
        ["> .a"],
        [""],
    ])("reports %j as unsupported", (selector) => {
        const result = parseSelector(selector);

        expect(result.supported).toBe(false);
    });
});
