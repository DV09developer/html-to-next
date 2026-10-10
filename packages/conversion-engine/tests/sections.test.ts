import { describe, expect, it } from "vitest";
import { parseHtml } from "@html-to-next/parsers";
import { detectSections } from "../src/index.js";

// Parses a snippet and detects its sections in one step.
function sectionsOf(html: string) {
    return detectSections(parseHtml(html).children);
}

describe("detectSections", () => {
    it("recognizes strong semantic tags", () => {
        const result = sectionsOf(
            "<nav></nav><header></header><main></main><aside></aside>" +
                "<form></form><article></article><footer></footer>",
        );

        expect(result.map((item) => item.role)).toEqual([
            "navbar",
            "header",
            "main",
            "sidebar",
            "form",
            "article",
            "footer",
        ]);
        expect(result[0]?.reason).toBe("tag <nav>");
    });

    it("recognizes a div by its class", () => {
        const result = sectionsOf('<div class="hero"><h1>Hi</h1></div>');

        expect(result).toEqual([
            { path: "0", tag: "div", role: "hero", reason: 'class "hero"' },
        ]);
    });

    it("keeps a plain section generic and refines a hinted one", () => {
        const result = sectionsOf(
            '<section>a</section><section class="pricing">b</section>',
        );

        expect(result.map((item) => item.role)).toEqual(["section", "pricing"]);
        expect(result[1]?.reason).toBe('<section> with class "pricing"');
    });

    it("lets a strong tag win over a conflicting class", () => {
        const result = sectionsOf('<header class="hero"></header>');

        expect(result.map((item) => item.role)).toEqual(["header"]);
    });

    it("ignores filler words but not partial matches", () => {
        // "footer-link" must NOT be mistaken for a footer.
        const result = sectionsOf(
            '<div class="site-footer"></div>' +
                '<div class="hero-section"></div>' +
                '<div class="footer-link"></div>',
        );

        expect(result.map((item) => item.role)).toEqual(["footer", "hero"]);
        expect(result.map((item) => item.path)).toEqual(["0", "1"]);
    });

    it("reads hints from the id, ignoring case", () => {
        const result = sectionsOf('<div id="Pricing"></div>');

        expect(result[0]?.role).toBe("pricing");
        expect(result[0]?.reason).toBe('id "Pricing"');
    });

    it("limits name hints to the top of the page but not semantic tags", () => {
        // Four levels deep: too far down for a class hint.
        const deepHint = sectionsOf(
            '<div><div><div><div class="hero"></div></div></div></div>',
        );
        // Three levels deep: still allowed.
        const nearHint = sectionsOf(
            '<div><div><div class="hero"></div></div></div>',
        );
        // A strong tag counts at any depth.
        const deepTag = sectionsOf(
            "<div><div><div><div><nav></nav></div></div></div></div>",
        );

        expect(deepHint).toEqual([]);
        expect(nearHint).toHaveLength(1);
        expect(deepTag.map((item) => item.role)).toEqual(["navbar"]);
    });

    it("treats hostile class names as plain text", () => {
        // On a plain object these would match built-in properties.
        const result = sectionsOf(
            '<div class="constructor __proto__ toString"></div>',
        );

        expect(result).toEqual([]);
    });

    it("reports nested sections in document order with correct paths", () => {
        // The text node takes index 0, so <main> is index 1.
        const result = sectionsOf(
            'text<main><section class="hero"></section></main>',
        );

        expect(result.map((item) => item.path)).toEqual(["1", "1.0"]);
        expect(result.map((item) => item.role)).toEqual(["main", "hero"]);
    });
});
