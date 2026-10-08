import { describe, expect, it } from "vitest";
import { parseHtml } from "@html-to-next/parsers";
import { removeScripts } from "../src/index.js";

describe("removeScripts", () => {
    it("removes a nested script and keeps siblings", () => {
        const tree = parseHtml("<div><script>alert(1)</script><p>Hi</p></div>");
        const { nodes, removedCount } = removeScripts(tree.children);

        expect(removedCount).toBe(1);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toMatchObject({
            tag: "div",
            children: [{ tag: "p" }],
        });
    });

    it("removes top-level scripts", () => {
        const tree = parseHtml("<script>x()</script><p>a</p>");
        const { nodes, removedCount } = removeScripts(tree.children);

        expect(removedCount).toBe(1);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toMatchObject({ tag: "p" });
    });

    it("counts every script", () => {
        const tree = parseHtml("<script>a()</script><div><SCRIPT>b()</SCRIPT></div>");

        expect(removeScripts(tree.children).removedCount).toBe(2);
    });

    it("reports zero when there are no scripts", () => {
        const tree = parseHtml("<p>Hello</p>");

        expect(removeScripts(tree.children).removedCount).toBe(0);
    });

    it("does not mutate the input tree", () => {
        const tree = parseHtml("<div><script>x()</script><p>Hi</p></div>");

        removeScripts(tree.children);

        expect(tree.children[0]).toMatchObject({
            children: [{ tag: "script" }, { tag: "p" }],
        });
    });
});