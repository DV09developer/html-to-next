import { describe, expect, it } from "vitest";
import { parseHtml } from "@html-to-next/parsers";
import { detectComponents } from "../src/index.js";

describe("detectComponents", () => {
    it("builds a component tree for a small page", () => {
        const nodes = parseHtml(
            "<nav></nav>" +
                '<section class="features">' +
                '<div class="card"><h3>A</h3></div>' +
                '<div class="card"><h3>B</h3></div>' +
                "</section>" +
                "<footer></footer>",
        ).children;

        const result = detectComponents(nodes);
        const byId = new Map(result.tree.nodes.map((node) => [node.id, node]));

        // The root first, then components in document order.
        expect(result.tree.nodes.map((node) => node.name)).toEqual([
            "Page",
            "Navbar",
            "Features",
            "Card",
            "Footer",
        ]);
        expect(byId.get("page")?.children).toEqual([
            "component:Navbar",
            "component:Features",
            "component:Footer",
        ]);
        expect(byId.get("component:Features")?.children).toEqual([
            "component:Card",
        ]);
        // The intermediate results are returned too.
        expect(result.stats.elementCount).toBe(7);
        expect(result.sections).toHaveLength(3);
    });

    it("returns an empty tree when nothing stands out", () => {
        const result = detectComponents(parseHtml("<p>Hi</p>").children);

        expect(result.candidates).toEqual([]);
        expect(result.tree.nodes).toHaveLength(1);
        expect(result.stats.elementCount).toBe(1);
    });
});
