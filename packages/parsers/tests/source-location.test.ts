import { describe, expect, it } from "vitest";
import { parseHtml } from "../src/index.js";
import { expectElement } from "./helpers.js";

// Cuts the original input at an element's recorded range.
function textOf(html: string, source: { start: number; end: number }): string {
    return html.slice(source.start, source.end);
}

describe("parseHtml source locations", () => {
    it("records the range of a simple element", () => {
        const html = "<p>Hi</p>";
        const p = expectElement(parseHtml(html).children[0]);

        expect(p.source).toEqual({ start: 0, end: 9 });
    });

    it("points at the exact source text of nested elements", () => {
        const html = "<div><p>A</p></div>";
        const div = expectElement(parseHtml(html).children[0]);
        const p = expectElement(div.children[0]);

        expect(div.source && textOf(html, div.source)).toBe(html);
        expect(p.source && textOf(html, p.source)).toBe("<p>A</p>");
    });

    it("counts text before an element in its offset", () => {
        const html = "text<p>x</p>";
        const p = expectElement(parseHtml(html).children[1]);

        expect(p.source?.start).toBe(4);
    });

    it("still gives an implicitly closed element a usable range", () => {
        const html = "<div><p>Unclosed";
        const div = expectElement(parseHtml(html).children[0]);
        const p = expectElement(div.children[0]);

        expect(p.source?.start).toBe(5);
        expect(p.source?.end).toBeGreaterThan(5);
        expect(p.source?.end).toBeLessThanOrEqual(html.length);
    });

    it("leaves source out for elements the parser invented", () => {
        const html = "<!doctype html><p>x</p>";
        const root = expectElement(parseHtml(html).children[0]);
        const body = expectElement(root.children[1]);
        const p = expectElement(body.children[0]);

        // <html> and <body> were never written, so they have no position.
        expect(root.source).toBeUndefined();
        expect(body.source).toBeUndefined();
        expect("source" in root).toBe(false);
        expect(p.source && textOf(html, p.source)).toBe("<p>x</p>");
    });
});
