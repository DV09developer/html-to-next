import { describe, expect, it } from "vitest";
import { parseHtml } from "@html-to-next/parsers";
import { analyzeDom } from "../src/index.js";

// Parse a snippet and analyze it in one step, to keep each test short.
function statsOf(html: string) {
    return analyzeDom(parseHtml(html).children);
}

describe("analyzeDom", () => {
    it("counts elements and tags", () => {
        const stats = statsOf("<div><p>A</p><p>B</p></div>");

        expect(stats.elementCount).toBe(3);
        expect(stats.tagCounts).toEqual({ div: 1, p: 2 });
    });

    it("counts text nodes but ignores whitespace-only ones", () => {
        // The newline and spaces between tags must not count as content.
        const stats = statsOf("<div>\n  <p>Hi</p>\n</div>");

        expect(stats.textNodeCount).toBe(1);
    });

    it("measures nesting depth in levels", () => {
        expect(statsOf("<div><p>Hi</p></div>").maxDepth).toBe(2);
        expect(statsOf("<p>Hi</p>").maxDepth).toBe(1);
    });

    it("counts how many elements use each class", () => {
        const stats = statsOf(
            '<div class="card big"></div><div class="card"></div>',
        );

        expect(stats.classFrequency).toEqual({ card: 2, big: 1 });
    });

    it("groups elements into features", () => {
        const stats = statsOf(
            '<nav><a href="/">Home</a></nav>' +
                "<img src='a.png' alt=''>" +
                "<form><input><select></select><button>Go</button></form>" +
                "<table></table><ul></ul><ol></ol><h1>T</h1><h2>S</h2>",
        );

        expect(stats.features).toEqual({
            links: 1,
            images: 1,
            buttons: 1,
            forms: 1,
            formControls: 2,
            tables: 1,
            lists: 2,
            headings: 2,
            semanticSections: 1,
        });
    });

    it("handles an empty tree", () => {
        const stats = analyzeDom([]);

        expect(stats.elementCount).toBe(0);
        expect(stats.maxDepth).toBe(0);
        expect(stats.tagCounts).toEqual({});
    });

    it("treats hostile class names as plain keys", () => {
        // On a normal object, "__proto__" would change the prototype
        // instead of being stored as a key.
        const stats = statsOf('<p class="__proto__ constructor">Hi</p>');

        expect(Object.keys(stats.classFrequency).sort()).toEqual([
            "__proto__",
            "constructor",
        ]);
        expect(stats.classFrequency["constructor"]).toBe(1);
    });
});
