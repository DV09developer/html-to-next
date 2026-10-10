import { describe, expect, it } from "vitest";
import { parseHtml } from "@html-to-next/parsers";
import {
    buildCandidates,
    computeSignatures,
    detectSections,
    findRepeatedStructures,
} from "../src/index.js";

// Runs every analyzer on a snippet and builds the candidates, so each test
// can focus on one rule.
function candidatesOf(html: string, minScore?: number) {
    const nodes = parseHtml(html).children;

    return buildCandidates(
        nodes,
        findRepeatedStructures(computeSignatures(nodes)),
        detectSections(nodes),
        minScore === undefined ? {} : { minScore },
    );
}

describe("buildCandidates", () => {
    it("turns a semantic section into a candidate", () => {
        const result = candidatesOf("<nav></nav>");

        expect(result).toEqual([
            {
                name: "Navbar",
                kind: "section",
                role: "navbar",
                paths: ["0"],
                score: 60,
                reasons: ["navbar section (tag <nav>)"],
            },
        ]);
    });

    it("turns a repeated structure into one candidate", () => {
        const result = candidatesOf(
            '<div class="card"><h3>A</h3></div><div class="card"><h3>B</h3></div>',
        );

        // 20 + 2 elements * 5 + 2 copies * 4 = 38
        expect(result).toMatchObject([
            { name: "Card", kind: "repeated", paths: ["0", "1"], score: 38 },
        ]);
    });

    it("ignores repeats of a single element", () => {
        // A list of plain items is not worth a component.
        expect(candidatesOf("<ul><li>A</li><li>B</li></ul>")).toEqual([]);
    });

    it("builds PascalCase names from multi-word classes", () => {
        const result = candidatesOf(
            '<div class="product-card"><h3>A</h3></div>' +
                '<div class="product-card"><h3>B</h3></div>',
        );

        expect(result[0]?.name).toBe("ProductCard");
    });

    it("falls back to a tag-based name when there is no class", () => {
        const result = candidatesOf(
            "<div><h3>A</h3></div><div><h3>B</h3></div>",
        );

        expect(result[0]?.name).toBe("Item");
    });

    it("falls back when a class cannot make a valid name", () => {
        // "___" has no letters, and "3col" starts with a digit.
        const empty = candidatesOf(
            '<div class="___"><h3>A</h3></div><div class="___"><h3>B</h3></div>',
        );
        const digit = candidatesOf(
            '<div class="3col"><h3>A</h3></div><div class="3col"><h3>B</h3></div>',
        );

        expect(empty[0]?.name).toBe("Item");
        expect(digit[0]?.name).toBe("Component3col");
    });

    it("makes duplicate names unique in document order", () => {
        const result = candidatesOf("<nav></nav><nav></nav>");

        expect(result.map((item) => item.name)).toEqual(["Navbar", "Navbar2"]);
        expect(result.map((item) => item.paths)).toEqual([["0"], ["1"]]);
    });

    it("avoids names that clash with globals and next/image", () => {
        const result = candidatesOf(
            '<div class="image"><h3>A</h3></div><div class="image"><h3>B</h3></div>',
        );

        expect(result[0]?.name).toBe("ImageComponent");
    });

    it("merges a repeated section into a single candidate", () => {
        const result = candidatesOf(
            '<section class="plan"><h3>A</h3></section>' +
                '<section class="plan"><h3>B</h3></section>',
        );

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            name: "Plan",
            kind: "repeated",
            role: "section",
        });
        expect(result[0]?.reasons).toContain(
            "also a section section (tag <section>)",
        );
    });

    it("ranks by score but keeps names tied to document order", () => {
        const result = candidatesOf(
            '<div class="card"><h3>A</h3></div>' +
                '<div class="card"><h3>B</h3></div>' +
                "<footer></footer>",
        );

        // Footer (60) outranks Card (38) even though it comes later.
        expect(result.map((item) => item.name)).toEqual(["Footer", "Card"]);
    });

    it("drops candidates below the minimum score", () => {
        // A plain <section> scores 30.
        expect(candidatesOf("<section>x</section>")).toHaveLength(1);
        expect(candidatesOf("<section>x</section>", 50)).toEqual([]);
    });
});
