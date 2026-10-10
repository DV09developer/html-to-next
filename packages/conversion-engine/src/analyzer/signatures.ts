import type { HtmlElementNode, HtmlNode } from "@html-to-next/parsers";
import { getClassList } from "../utils/attributes.js";

/**
 * Makes a tag or class name safe to embed in a signature.
 *
 * Signatures use `( ) , . #` as structure characters. Names come from
 * untrusted HTML, so a class like "a),b(" could otherwise forge a different
 * structure and make two unrelated elements look identical.
 * `\p{L}` and `\p{N}` keep letters and digits from any language, so
 * non-English class names are not all flattened into the same text.
 */
function safe(name: string): string {
    return name.replace(/[^\p{L}\p{N}_-]/gu, "_");
}

/**
 * Computes a signature for every element in the tree.
 *
 * Returns a map of element path -> signature. Paths use the same scheme as
 * `analyzeCss`: the child index at each level joined by dots, where text and
 * comment nodes use up an index but never get a path of their own.
 *
 * Each element's signature is built from its children's signatures, so one
 * bottom-up pass computes all of them. Computing each element separately
 * would rebuild the same sub-strings again and again.
 */
export function computeSignatures(nodes: HtmlNode[]): Record<string, string> {
    const signatures: Record<string, string> = {};

    function describe(node: HtmlElementNode, path: string): string {
        const parts: string[] = [];

        node.children.forEach((child, index) => {
            if (child.type === "text") {
                // Whitespace between tags is formatting. Real text becomes
                // one "#" marker, so the words themselves never matter.
                if (child.value.trim() !== "") {
                    parts.push("#");
                }
                return;
            }

            // Comments are not structure.
            if (child.type !== "element") {
                return;
            }

            parts.push(describe(child, `${path}.${index}`));
        });

        // Sorting and de-duplicating makes class order irrelevant.
        const classes = [...new Set(getClassList(node).map(safe))].sort();
        const head =
            safe(node.tag) + classes.map((name) => `.${name}`).join("");

        // Leaf elements (like <br>) have no parentheses at all.
        const signature =
            parts.length > 0 ? `${head}(${parts.join(",")})` : head;

        signatures[path] = signature;
        return signature;
    }

    nodes.forEach((node, index) => {
        // Top-level text and comments are skipped but still use an index.
        if (node.type === "element") {
            describe(node, String(index));
        }
    });

    return signatures;
}
