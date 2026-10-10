import type { HtmlElementNode, HtmlNode } from "@html-to-next/parsers";
import { getAttribute, getClassList } from "../utils/attributes.js";

/** The kinds of page section we can recognize. */
export type SectionRole =
    | "navbar"
    | "header"
    | "hero"
    | "features"
    | "pricing"
    | "testimonials"
    | "faq"
    | "contact"
    | "cta"
    | "sidebar"
    | "footer"
    | "main"
    | "article"
    | "form"
    | "section";

/** One element we believe is a meaningful page section. */
export type SectionCandidate = {
    /** Element path, same scheme as `analyzeCss` and `computeSignatures`. */
    path: string;
    tag: string;
    role: SectionRole;
    /** Why we chose this role. Shown in reports and given to the AI later. */
    reason: string;
};

/**
 * Tags whose meaning is clear on their own. The tag always decides the role,
 * even if a class name suggests something else.
 *
 * These lookup tables are Maps, not plain objects. Class and id names come
 * from untrusted HTML, and on a plain object a class called "constructor"
 * would find the built-in `constructor` function instead of "not found".
 */
const STRONG_TAG_ROLES = new Map<string, SectionRole>([
    ["nav", "navbar"],
    ["header", "header"],
    ["footer", "footer"],
    ["main", "main"],
    ["aside", "sidebar"],
    ["form", "form"],
    ["article", "article"],
]);

/**
 * Class and id names that hint at a role. Names are compared after
 * `hintKey` has lowercased them and removed filler words.
 */
const NAME_HINTS = new Map<string, SectionRole>([
    ["hero", "hero"],
    ["banner", "hero"],
    ["jumbotron", "hero"],
    ["navbar", "navbar"],
    ["nav", "navbar"],
    ["navigation", "navbar"],
    ["header", "header"],
    ["footer", "footer"],
    ["features", "features"],
    ["services", "features"],
    ["benefits", "features"],
    ["pricing", "pricing"],
    ["plans", "pricing"],
    ["testimonials", "testimonials"],
    ["reviews", "testimonials"],
    ["faq", "faq"],
    ["contact", "contact"],
    ["cta", "cta"],
    ["call-to-action", "cta"],
    ["sidebar", "sidebar"],
]);

/** Words that don't change what a block is: "site-footer" is still a footer. */
const FILLER_WORDS = new Set([
    "section",
    "wrapper",
    "block",
    "area",
    "wrap",
    "site",
    "page",
    "top",
]);

/**
 * Hint matching on non-semantic tags only applies this close to the top of
 * the page, counted in path segments ("0.0.1" is 3 levels). Deeper elements
 * are usually parts of a component, not page sections.
 */
const MAX_HINT_LEVELS = 3;

/**
 * Turns a class or id into the key used to look up a hint.
 * "Site-Footer" -> "footer", "hero_section" -> "hero", "footer-link" -> "footer-link".
 */
function hintKey(name: string): string {
    return name
        .toLowerCase()
        .split(/[-_\s]+/)
        .filter((token) => token !== "" && !FILLER_WORDS.has(token))
        .join("-");
}

/** Looks for a role hint in the element's classes, then in its id. */
function findHint(
    node: HtmlElementNode,
): { role: SectionRole; source: string } | null {
    for (const name of getClassList(node)) {
        const role = NAME_HINTS.get(hintKey(name));

        if (role) {
            return { role, source: `class "${name}"` };
        }
    }

    const id = getAttribute(node, "id");

    if (id) {
        const role = NAME_HINTS.get(hintKey(id));

        if (role) {
            return { role, source: `id "${id}"` };
        }
    }

    return null;
}

/**
 * Decides whether one element is a section, and if so which role and why.
 * Returns null when the element is not a section candidate.
 */
function classify(
    node: HtmlElementNode,
    path: string,
): { role: SectionRole; reason: string } | null {
    // Rule 1: a strong tag always decides.
    const tagRole = STRONG_TAG_ROLES.get(node.tag);

    if (tagRole) {
        return { role: tagRole, reason: `tag <${node.tag}>` };
    }

    const hint = findHint(node);

    // Rule 2: <section> is generic, so a hint may refine it.
    if (node.tag === "section") {
        return hint
            ? { role: hint.role, reason: `<section> with ${hint.source}` }
            : { role: "section", reason: "tag <section>" };
    }

    // Rule 3: any other tag needs a hint, and must be near the top.
    if (hint && path.split(".").length <= MAX_HINT_LEVELS) {
        return { role: hint.role, reason: hint.source };
    }

    return null;
}

/**
 * Finds the page sections in a cleaned tree.
 *
 * Candidates come back in document order. Nested candidates are all
 * reported (for example a `hero` inside a `main`). Deciding which ones
 * become components is the job of the scoring step.
 */
export function detectSections(nodes: HtmlNode[]): SectionCandidate[] {
    const result: SectionCandidate[] = [];

    function visit(list: HtmlNode[], parentPath: string): void {
        list.forEach((node, index) => {
            // Text and comments can't be sections, but they still use up an
            // index so the paths match the other analyzers.
            if (node.type !== "element") {
                return;
            }

            const path =
                parentPath === "" ? String(index) : `${parentPath}.${index}`;
            const match = classify(node, path);

            if (match) {
                result.push({ path, tag: node.tag, ...match });
            }

            // Visiting the element before its children keeps document order.
            visit(node.children, path);
        });
    }

    visit(nodes, "");

    return result;
}