import { describe, expect, it } from "vitest";
import { AppError } from "@html-to-next/shared";
import type { HtmlElementNode, HtmlNode } from "@html-to-next/parsers";
import { cleanHtml } from "../src/index.js";

function firstElement(nodes: HtmlNode[]): HtmlElementNode {
    const node = nodes[0];
    if (!node || node.type !== "element") {
        throw new Error("Expected an element");
    }
    return node;
}

describe("cleanHtml", () => {
    it("cleans a fragment and reports warnings", () => {
        const result = cleanHtml(
            '<div class="a" onclick="x()"><script>y()</script><p>Hi</p></div>',
        );
        const div = firstElement(result.nodes);

        expect(result.mode).toBe("fragment");
        expect(div.attributes).toEqual([{ name: "className", value: "a" }]);
        expect(div.children).toHaveLength(1);
        expect(result.warnings.map((w) => w.code)).toEqual([
            "SCRIPTS_REMOVED",
            "EVENT_HANDLERS_REMOVED",
        ]);
    });

    it("returns no warnings for clean input", () => {
        const result = cleanHtml("<p>Hello</p>");

        expect(result.warnings).toEqual([]);
    });

    it("keeps style as a raw string", () => {
        const result = cleanHtml('<p style="color: red">Hi</p>');

        expect(firstElement(result.nodes).attributes).toEqual([
            { name: "style", value: "color: red" },
        ]);
    });

    it("handles full documents", () => {
        const result = cleanHtml(
            "<!doctype html><html><head><script>x()</script></head><body><p>Hi</p></body></html>",
        );

        expect(result.mode).toBe("document");
        expect(result.warnings[0]?.code).toBe("SCRIPTS_REMOVED");
    });

    it("passes css through", () => {
        expect(cleanHtml("<p>Hi</p>", ".a { color: red; }").css).toBe(
            ".a { color: red; }",
        );
    });

    it("throws a validation error for empty input", () => {
        expect(() => cleanHtml("   ")).toThrow(AppError);
    });
});
