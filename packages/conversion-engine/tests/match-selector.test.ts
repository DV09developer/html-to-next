import { describe, expect, it } from "vitest";
import { parseHtml, parseSelector } from "@html-to-next/parsers";
import type { HtmlElementNode, ParsedSelector } from "@html-to-next/parsers";
import { matchesSelector, normalizeAttributes } from "../src/index.js";

function toElement(node: unknown): HtmlElementNode {
    const candidate = node as HtmlElementNode | undefined;

    if (!candidate || candidate.type !== "element") {
        throw new Error("Expected an element");
    }

    return candidate;
}

function rootOf(html: string): HtmlElementNode {
    return toElement(parseHtml(html).children[0]);
}

function childOf(node: HtmlElementNode, index = 0): HtmlElementNode {
    return toElement(node.children[index]);
}

function selector(text: string): ParsedSelector {
    const result = parseSelector(text);

    if (!result.supported) {
        throw new Error(result.reason);
    }

    return result.selector;
}

describe("matchesSelector", () => {
    it("matches a tag", () => {
        const p = rootOf("<p>Hi</p>");

        expect(matchesSelector(selector("p"), p, [])).toBe(true);
        expect(matchesSelector(selector("div"), p, [])).toBe(false);
    });

    it("matches a class", () => {
        const p = rootOf('<p class="a b">Hi</p>');

        expect(matchesSelector(selector(".a"), p, [])).toBe(true);
        expect(matchesSelector(selector(".c"), p, [])).toBe(false);
    });

    it("matches className on a normalized tree", () => {
        const tree = normalizeAttributes(
            parseHtml('<p class="a">Hi</p>').children,
        );
        const p = toElement(tree.nodes[0]);

        expect(matchesSelector(selector(".a"), p, [])).toBe(true);
    });

    it("matches an id", () => {
        const p = rootOf('<p id="x">Hi</p>');

        expect(matchesSelector(selector("#x"), p, [])).toBe(true);
        expect(matchesSelector(selector("#y"), p, [])).toBe(false);
    });

    it("requires every class in a compound", () => {
        const p = rootOf('<p class="a">Hi</p>');

        expect(matchesSelector(selector("p.a.b"), p, [])).toBe(false);
        expect(matchesSelector(selector("p.a"), p, [])).toBe(true);
    });

    it("matches a descendant at any depth", () => {
        const card = rootOf(
            '<div class="card"><section><p>Hi</p></section></div>',
        );
        const section = childOf(card);
        const p = childOf(section);

        expect(matchesSelector(selector(".card p"), p, [card, section])).toBe(
            true,
        );
    });

    it("fails a descendant selector without a matching ancestor", () => {
        const div = rootOf("<div><p>Hi</p></div>");
        const p = childOf(div);

        expect(matchesSelector(selector(".card p"), p, [div])).toBe(false);
    });

    it("matches a child combinator on the direct parent", () => {
        const card = rootOf('<div class="card"><p>Hi</p></div>');
        const p = childOf(card);

        expect(matchesSelector(selector(".card > p"), p, [card])).toBe(true);
    });

    it("rejects a child combinator when another element is in between", () => {
        const card = rootOf(
            '<div class="card"><section><p>Hi</p></section></div>',
        );
        const section = childOf(card);
        const p = childOf(section);

        expect(matchesSelector(selector(".card > p"), p, [card, section])).toBe(
            false,
        );
    });

    it("backtracks to a farther ancestor", () => {
        const a = rootOf(
            '<div class="a"><div class="b"><div class="b"><p>Hi</p></div></div></div>',
        );
        const outerB = childOf(a);
        const innerB = childOf(outerB);
        const p = childOf(innerB);

        expect(
            matchesSelector(selector(".a > .b p"), p, [a, outerB, innerB]),
        ).toBe(true);
    });
});
