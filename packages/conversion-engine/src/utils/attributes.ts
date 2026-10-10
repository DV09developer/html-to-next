import type { HtmlElementNode } from "@html-to-next/parsers";

/** Returns an attribute's value, or null when the element doesn't have it. */
export function getAttribute(
    node: HtmlElementNode,
    name: string,
): string | null {
    const attribute = node.attributes.find((item) => item.name === name);

    return attribute ? attribute.value : null;
}

/**
 * Returns the element's CSS classes as a list.
 * Reads `className` first (the cleaned tree) and falls back to `class`
 * (a raw tree), so it works on either.
 */
export function getClassList(node: HtmlElementNode): string[] {
    const value =
        getAttribute(node, "className") ?? getAttribute(node, "class");

    return value ? value.split(/\s+/).filter((name) => name !== "") : [];
}
