import { describe, expect, it } from "vitest";
import { parseHtml } from "@html-to-next/parsers";
import { computeSignatures } from "../src/index.js";

// Computes signatures for a snippet, to keep each test short.
function sigs(html: string): Record<string, string> {
    return computeSignatures(parseHtml(html).children);
}

describe("computeSignatures", () => {
    it("describes tag, classes, and children", () => {
        const result = sigs('<div class="card"><h3>Pro</h3><p>$10</p></div>');

        expect(result["0"]).toBe("div.card(h3(#),p(#))");
    });

    it("gives the same signature to the same shape with different text", () => {
        const a = sigs('<div class="card"><h3>Pro</h3><p>$10</p></div>');
        const b = sigs('<div class="card"><h3>Team</h3><p>$25</p></div>');

        expect(a["0"]).toBe(b["0"]);
    });

    it("gives different signatures to different structures", () => {
        const a = sigs("<div><p>x</p></div>");
        const b = sigs("<div><p>x</p><p>y</p></div>");

        expect(a["0"]).not.toBe(b["0"]);
    });

    it("ignores class order and duplicates", () => {
        const a = sigs('<p class="b a a">x</p>');
        const b = sigs('<p class="a b">x</p>');

        expect(a["0"]).toBe("p.a.b(#)");
        expect(a["0"]).toBe(b["0"]);
    });

    it("tells apart elements with different classes", () => {
        const a = sigs('<div class="card">x</div>');
        const b = sigs('<div class="panel">x</div>');

        expect(a["0"]).not.toBe(b["0"]);
    });

    it("ignores attribute values, whitespace, and comments", () => {
        const a = sigs('<a href="/one" id="x">Go</a>');
        const b = sigs('<a href="/two">Go</a>');
        const c = sigs("<div>\n  <!-- note -->\n  <br>\n</div>");

        expect(a["0"]).toBe(b["0"]);
        // The comment and the whitespace-only text leave only <br>.
        expect(c["0"]).toBe("div(br)");
    });

    it("records every element by path and counts text nodes in the index", () => {
        // The text node "x" takes index 0, so the <p> is index 1.
        const result = sigs("<div>x<p>y</p></div>");

        expect(result).toEqual({
            "0": "div(#,p(#))",
            "0.1": "p(#)",
        });
    });

    it("cannot be forged through hostile class names", () => {
        // Without sanitizing, this class would inject parentheses and commas.
        const result = sigs('<p class="a),b(">x</p>');

        expect(result["0"]).toBe("p.a__b_(#)");
    });
});
