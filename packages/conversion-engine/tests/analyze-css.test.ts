import { describe, expect, it } from "vitest";
import { AppError } from "@html-to-next/shared";
import { parseHtml } from "@html-to-next/parsers";
import { analyzeCss } from "../src/index.js";

// Small helper: parse an HTML snippet and return its top-level nodes.
function nodesOf(html: string) {
    return parseHtml(html).children;
}

describe("analyzeCss", () => {
    it("maps rules to element paths", () => {
        const nodes = nodesOf('<div class="card"><p>Hi</p></div>');
        const result = analyzeCss(
            nodes,
            ".card { color: red } .card p { margin: 0 }",
        );

        // div is the first top-level node ("0"); p is its first child ("0.0").
        expect(result.nodeRules).toEqual({ "0": [0], "0.0": [1] });
        expect(result.rules[1]?.matchedPaths).toEqual(["0.0"]);
    });

    it("counts text nodes when numbering paths", () => {
        // The text node takes index 0, so the <p> is index 1.
        const nodes = nodesOf("<div>text<p>Hi</p></div>");
        const result = analyzeCss(nodes, "p { color: red }");

        expect(result.nodeRules).toEqual({ "0.1": [0] });
    });

    it("reports rules that match nothing as unused", () => {
        const nodes = nodesOf("<p>Hi</p>");
        const result = analyzeCss(nodes, ".missing { color: red }");

        expect(result.unusedRules).toEqual([0]);
        expect(result.unsupportedRules).toEqual([]);
    });

    it("reports unsupported selectors with a reason", () => {
        const nodes = nodesOf("<a>Link</a>");
        const result = analyzeCss(nodes, "a:hover { color: red }");

        expect(result.unsupportedRules).toEqual([0]);
        expect(result.rules[0]?.unsupportedReason).toContain("Unsupported");
        // An unsupported rule must not also be counted as unused.
        expect(result.unusedRules).toEqual([]);
    });

    it("handles selector lists as separate rules", () => {
        const nodes = nodesOf("<h1>A</h1><p>B</p>");
        const result = analyzeCss(nodes, "h1, p { color: red }");

        expect(result.nodeRules).toEqual({ "0": [0], "1": [1] });
    });

    it("stores specificity for supported selectors", () => {
        const nodes = nodesOf('<div id="a"><p>Hi</p></div>');
        const result = analyzeCss(nodes, "#a p { color: red }");

        expect(result.rules[0]?.specificity).toEqual([1, 0, 1]);
    });

    it("matches rules inside a media query and keeps the context", () => {
        const nodes = nodesOf("<p>Hi</p>");
        const result = analyzeCss(
            nodes,
            "@media (min-width: 768px) { p { color: red } }",
        );

        expect(result.nodeRules).toEqual({ "0": [0] });
        expect(result.rules[0]?.rule.atRules).toEqual([
            "@media (min-width: 768px)",
        ]);
    });

    it("wraps css syntax errors in AppError", () => {
        const nodes = nodesOf("<p>Hi</p>");

        // The block is never closed, so postcss throws.
        expect(() => analyzeCss(nodes, ".a { color: red")).toThrow(AppError);
    });
});
