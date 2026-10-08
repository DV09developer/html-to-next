import { describe, expect, it } from "vitest";
import { parseHtml, walk } from "../src/index.js";

describe("walk", () => {
    it("visits nodes parent-first", () => {
        const tree = parseHtml("<div><p>Hi</p></div>");
        const seen: string[] = [];

        walk(tree.children, (node) => {
            seen.push(node.type === "element" ? node.tag : node.type);
        });

        expect(seen).toEqual(["div", "p", "text"]);
    });

    it("reports depth", () => {
        const tree = parseHtml("<div><p>Hi</p></div>");
        const depths: number[] = [];

        walk(tree.children, (_node, context) => {
            depths.push(context.depth);
        });

        expect(depths).toEqual([0, 1, 2]);
    });

    it("reports the parent", () => {
        const tree = parseHtml("<ul><li>A</li></ul>");
        const parents: (string | null)[] = [];

        walk(tree.children, (_node, context) => {
            parents.push(
                context.parent?.type === "element" ? context.parent.tag : null,
            );
        });

        expect(parents).toEqual([null, "ul", "li"]);
    });
});