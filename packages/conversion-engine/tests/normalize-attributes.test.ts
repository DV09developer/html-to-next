import { describe, expect, it } from "vitest";
import { parseHtml } from "@html-to-next/parsers";
import type { HtmlElementNode, HtmlNode } from "@html-to-next/parsers";
import { normalizeAttributes } from "../src/index.js";

function firstElement(nodes: HtmlNode[]): HtmlElementNode {
    const node = nodes[0];
    if (!node || node.type !== "element") {
        throw new Error("Expected an element");
    }
    return node;
}

describe("normalizeAttributes", () => {
    it("renames class and for", () => {
        const tree = parseHtml("<label class='a' for='x'>Name</label>");
        const { nodes, renamedCount } = normalizeAttributes(tree.children);

        expect(firstElement(nodes).attributes).toEqual([
            { name: "className", value: "a" },
            { name: "htmlFor", value: "x" },
        ]);
        expect(renamedCount).toBe(2);
    });

    it("renames attributes on nested elements", () => {
        const tree = parseHtml("<div><input tabindex='1' maxlength='5'></div>");
        const { nodes } = normalizeAttributes(tree.children);
        const input = firstElement(firstElement(nodes).children);

        expect(input.attributes).toEqual([
            { name: "tabIndex", value: "1" },
            { name: "maxLength", value: "5" },
        ]);
    });

    it("removes inline event handlers and counts them", () => {
        const tree = parseHtml("<button onclick='go()' id='b'>Go</button>");
        const { nodes, removedEventHandlers } = normalizeAttributes(
            tree.children,
        );

        expect(firstElement(nodes).attributes).toEqual([
            { name: "id", value: "b" },
        ]);
        expect(removedEventHandlers).toBe(1);
    });

    it("leaves data and aria attributes alone", () => {
        const tree = parseHtml("<div data-id='1' aria-label='Menu'></div>");
        const { nodes, renamedCount } = normalizeAttributes(tree.children);

        expect(firstElement(nodes).attributes).toEqual([
            { name: "data-id", value: "1" },
            { name: "aria-label", value: "Menu" },
        ]);
        expect(renamedCount).toBe(0);
    });

    it("does not mutate the input tree", () => {
        const tree = parseHtml("<p class='a' onclick='x()'>Hi</p>");

        normalizeAttributes(tree.children);

        expect(firstElement(tree.children).attributes).toEqual([
            { name: "class", value: "a" },
            { name: "onclick", value: "x()" },
        ]);
    });
});
