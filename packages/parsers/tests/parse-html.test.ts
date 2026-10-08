import { describe, expect, it } from "vitest";
import { parseHtml } from "../src/index.js";

describe("parseHtml", () => {
    it("parses a fragment without adding html/body wrappers", () => {
        const result = parseHtml("<section class='hero'><h1>Hi</h1></section>");

        expect(result.mode).toBe("fragment");
        expect(result.children).toHaveLength(1);

        const section = result.children[0];
        expect(section).toMatchObject({
            type: "element",
            tag: "section",
            attributes: [{ name: "class", value: "hero" }],
        });
    });

    it("parses nested children", () => {
        const result = parseHtml("<div><p>Hello</p></div>");
        const div = result.children[0];

        expect(div?.type).toBe("element");
        if (div?.type === "element") {
            expect(div.children[0]).toMatchObject({
                type: "element",
                tag: "p",
            });
        }
    });

    it("keeps text nodes", () => {
        const result = parseHtml("<p>Hello</p>");
        const paragraph = result.children[0];

        if (paragraph?.type === "element") {
            expect(paragraph.children[0]).toEqual({
                type: "text",
                value: "Hello",
            });
        }
    });

    it("detects a full document", () => {
        const result = parseHtml(
            "<!doctype html><html><body><p>x</p></body></html>",
        );

        expect(result.mode).toBe("document");
        expect(result.children[0]).toMatchObject({
            type: "element",
            tag: "html",
        });
    });

    it("repairs unclosed tags like a browser", () => {
        const result = parseHtml("<div><p>Unclosed");
        const div = result.children[0];

        expect(div).toMatchObject({ type: "element", tag: "div" });
    });
});
