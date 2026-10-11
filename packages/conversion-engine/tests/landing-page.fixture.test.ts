/// <reference types="node" />
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analyzeCss, cleanHtml, detectComponents } from "../src/index.js";

// Reads a fixture file. The path goes from this test file up to the repo
// root: tests -> conversion-engine -> packages -> root.
function fixture(name: string): string {
    const url = new URL(
        `../../../examples/landing-page/${name}`,
        import.meta.url,
    );

    return readFileSync(fileURLToPath(url), "utf8");
}

// Runs the whole Phase 1A pipeline once, shared by every test below.
const cleaned = cleanHtml(fixture("input.html"), fixture("input.css"));
const css = analyzeCss(cleaned.nodes, cleaned.css);
const detection = detectComponents(cleaned.nodes);

describe("landing-page fixture", () => {
    it("cleans the input and reports what it removed", () => {
        expect(cleaned.mode).toBe("fragment");
        expect(cleaned.warnings.map((warning) => warning.code)).toEqual([
            "SCRIPTS_REMOVED",
            "EVENT_HANDLERS_REMOVED",
        ]);
    });

    it("maps css rules to elements and reports problems", () => {
        // Rule order follows the stylesheet: 4 is `.footer a:hover`,
        // 5 is `.unused`.
        expect(css.unsupportedRules).toEqual([4]);
        expect(css.unusedRules).toEqual([5]);

        // `.feature-card` (rule 2) applies to all three cards.
        expect(css.rules[2]?.matchedPaths).toHaveLength(3);
        // `.feature-card h3` (rule 3) applies to one heading per card.
        expect(css.rules[3]?.matchedPaths).toHaveLength(3);
    });

    it("finds the page sections", () => {
        expect(detection.sections.map((section) => section.role)).toEqual([
            "navbar",
            "hero",
            "features",
            "footer",
        ]);
    });

    it("builds the component tree", () => {
        const names = detection.tree.nodes.map((node) => node.name);
        const childrenOf = (id: string): string[] =>
            detection.tree.nodes.find((node) => node.id === id)?.children ?? [];

        expect(names).toEqual([
            "Page",
            "Navbar",
            "ListItem",
            "Hero",
            "Features",
            "FeatureCard",
            "Footer",
        ]);
        expect(childrenOf("page")).toEqual([
            "component:Navbar",
            "component:Hero",
            "component:Features",
            "component:Footer",
        ]);
        expect(childrenOf("component:Navbar")).toEqual(["component:ListItem"]);
        expect(childrenOf("component:Features")).toEqual([
            "component:FeatureCard",
        ]);
    });
});
