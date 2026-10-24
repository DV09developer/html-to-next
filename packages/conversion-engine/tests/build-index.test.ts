import { describe, expect, it } from "vitest";
import { parseHtml } from "@html-to-next/parsers";
import {
    ancestorIdsOf,
    buildIndex,
    cleanHtml,
    computeSignatures,
} from "../src/index.js";
import { comparePaths } from "../src/utils/paths.js";

function indexOf(html: string) {
    return buildIndex(parseHtml(html).children);
}

describe("buildIndex", () => {
    it("gives ids in document order and links parents and children", () => {
        const index = indexOf("<div><p>A</p>text<p>B</p></div>");

        expect([...index.byId.keys()]).toEqual(["n0", "n1", "n2"]);
        expect(index.rootIds).toEqual(["n0"]);
        expect(index.byId.get("n0")?.childIds).toEqual(["n1", "n2"]);
        expect(index.byId.get("n1")?.parentId).toBe("n0");
        expect(index.byId.get("n0")?.parentId).toBeNull();
    });

    it("counts text nodes in paths, like the other analyzers", () => {
        // "text" takes index 1, so the second <p> is "0.2".
        const index = indexOf("<div><p>A</p>text<p>B</p></div>");

        expect(index.byId.get("n2")?.path).toBe("0.2");
        expect(index.idByPath.get("0.2")).toBe("n2");
    });

    it("uses exactly the same paths as computeSignatures", () => {
        const nodes = parseHtml(
            "<nav><ul><li>A</li><li>B</li></ul></nav>x<section><p>y</p></section>",
        ).children;
        const index = buildIndex(nodes);

        expect([...index.idByPath.keys()].sort(comparePaths)).toEqual(
            Object.keys(computeSignatures(nodes)).sort(comparePaths),
        );
    });

    it("is deterministic", () => {
        const html = "<div><p>A</p><p>B</p></div><footer></footer>";
        const first = indexOf(html);
        const second = indexOf(html);

        expect([...first.idByPath]).toEqual([...second.idByPath]);
    });

    it("keeps source offsets pointing at the original html", () => {
        const html = "<div><p>Hi</p></div>";
        const record = indexOf(html).byId.get("n1");

        expect(record?.source).toEqual({ start: 5, end: 14 });
        expect(
            record?.source &&
                html.slice(record.source.start, record.source.end),
        ).toBe("<p>Hi</p>");
    });

    it("has no gaps in ids after cleaning removes a script", () => {
        const html = "<div><script>x()</script><p>Hi</p></div>";
        const index = buildIndex(cleanHtml(html).nodes);

        expect([...index.byId.keys()]).toEqual(["n0", "n1"]);
        // The <p> is the first child now, but still points at its original text.
        const p = index.byId.get("n1");

        expect(p?.path).toBe("0.0");
        expect(p?.source && html.slice(p.source.start, p.source.end)).toBe(
            "<p>Hi</p>",
        );
    });

    it("sets source to null for elements the parser invented", () => {
        const index = indexOf("<!doctype html><p>x</p>");
        const root = index.byId.get("n0");

        expect(root?.tag).toBe("html");
        expect(root?.source).toBeNull();
    });

    it("returns an empty index for an empty tree", () => {
        const index = buildIndex([]);

        expect(index.byId.size).toBe(0);
        expect(index.rootIds).toEqual([]);
    });

    it("indexes several top-level elements", () => {
        const index = indexOf("<nav></nav>text<footer></footer>");

        expect(index.rootIds).toEqual(["n0", "n1"]);
        expect(index.byId.get("n1")?.path).toBe("2");
    });
});

describe("ancestorIdsOf", () => {
    it("lists ancestors from the top down", () => {
        const index = indexOf("<div><section><p>x</p></section></div>");

        expect(ancestorIdsOf(index, "n2")).toEqual(["n0", "n1"]);
    });

    it("returns nothing for a top-level element or an unknown id", () => {
        const index = indexOf("<div><p>x</p></div>");

        expect(ancestorIdsOf(index, "n0")).toEqual([]);
        expect(ancestorIdsOf(index, "missing")).toEqual([]);
    });
});
