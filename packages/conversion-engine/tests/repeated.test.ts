import { describe, expect, it } from "vitest";
import { parseHtml } from "@html-to-next/parsers";
import { computeSignatures, findRepeatedStructures } from "../src/index.js";

// Runs the two stages together on an HTML snippet, to keep each test short.
function repeatsOf(html: string, minOccurrences?: number) {
    const signatures = computeSignatures(parseHtml(html).children);

    return findRepeatedStructures(signatures, minOccurrences);
}

describe("findRepeatedStructures", () => {
    it("groups identical siblings", () => {
        const result = repeatsOf(
            '<ul><li class="item">A</li><li class="item">B</li></ul>',
        );

        expect(result).toEqual([
            { signature: "li.item(#)", paths: ["0.0", "0.1"] },
        ]);
    });

    it("drops elements nested inside a repeated group", () => {
        // The <h3> appears twice only because the card does.
        const result = repeatsOf(
            '<div class="card"><h3>A</h3></div><div class="card"><h3>B</h3></div>',
        );

        expect(result).toEqual([
            { signature: "div.card(h3(#))", paths: ["0", "1"] },
        ]);
    });

    it("keeps a nested structure that also repeats on its own", () => {
        // Two <h3> sit inside the cards (covered) and two sit outside (kept).
        const result = repeatsOf(
            '<div class="card"><h3>A</h3></div>' +
                '<div class="card"><h3>B</h3></div>' +
                "<h3>C</h3><h3>D</h3>",
        );

        expect(result).toEqual([
            { signature: "div.card(h3(#))", paths: ["0", "1"] },
            { signature: "h3(#)", paths: ["2", "3"] },
        ]);
    });

    it("returns nothing when no structure repeats", () => {
        expect(repeatsOf("<div><p>A</p></div>")).toEqual([]);
    });

    it("respects a higher minimum", () => {
        const html = "<ul><li>A</li><li>B</li></ul>";

        expect(repeatsOf(html, 2)).toHaveLength(1);
        expect(repeatsOf(html, 3)).toEqual([]);
    });

    it("lists paths in document order, not text order", () => {
        // Hand-made input: "10" must come after "2".
        const result = findRepeatedStructures({ "10": "x", "2": "x" });

        expect(result).toEqual([{ signature: "x", paths: ["2", "10"] }]);
    });
});
