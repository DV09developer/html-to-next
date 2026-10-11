import { defaultTreeAdapter, parse, parseFragment } from "parse5";
import type { DefaultTreeAdapterMap, TreeAdapter } from "parse5";
import { AppError } from "@html-to-next/shared";
import type { HtmlNode, ParsedHtml } from "./types.js";

// Short aliases for parse5's node types, to keep the code below readable.
type P5Node = DefaultTreeAdapterMap["node"];
type P5Parent = DefaultTreeAdapterMap["parentNode"];
type P5Child = DefaultTreeAdapterMap["childNode"];

/**
 * Default limit on how many levels of elements may be nested.
 * Deep trees are dangerous in two ways: every function that walks the tree
 * recurses once per level (stack overflow), and parse5 itself gets very
 * slow while building them.
 */
export const DEFAULT_MAX_NESTING_DEPTH = 256;

export type ParseHtmlOptions = {
    /** Maximum nesting depth, counted in element levels. */
    maxDepth?: number;
};

function tooDeep(maxDepth: number): AppError {
    return new AppError("HTML is nested too deeply", "VALIDATION_ERROR", {
        max: maxDepth,
    });
}

/**
 * Wraps parse5's default tree adapter so deep nesting is rejected WHILE
 * parsing instead of after it.
 *
 * parse5 calls `appendChild` / `insertBefore` every time it attaches a node.
 * We remember each element's depth (its parent's depth + 1) and throw as soon
 * as one exceeds the limit. Throwing from inside the adapter aborts the
 * whole parse, so a hostile document never gets the chance to be slow.
 *
 * A fresh adapter is made per parse, because the depth table belongs to
 * one parse only.
 */
function createDepthLimitedAdapter(
    maxDepth: number,
): TreeAdapter<DefaultTreeAdapterMap> {
    // The document and fragment roots are not in this table; they count as 0.
    // A WeakMap lets the nodes be garbage collected with the tree.
    const depths = new WeakMap<object, number>();

    function track(parent: P5Parent, child: P5Child): void {
        // Only elements are nesting levels. Text and comments are not.
        if (!defaultTreeAdapter.isElementNode(child)) {
            return;
        }

        const depth = (depths.get(parent) ?? 0) + 1;

        if (depth > maxDepth) {
            throw tooDeep(maxDepth);
        }

        depths.set(child, depth);
    }

    return {
        ...defaultTreeAdapter,
        appendChild(parent, child) {
            track(parent, child);
            defaultTreeAdapter.appendChild(parent, child);
        },
        insertBefore(parent, child, reference) {
            track(parent, child);
            defaultTreeAdapter.insertBefore(parent, child, reference);
        },
    };
}

/**
 * Converts one parse5 node into our own node type.
 *
 * `depth` is how many element levels are above this node (0 at the top).
 * Returns null for nodes we drop (doctype, unknown kinds).
 */
function convertNode(
    node: P5Node,
    depth: number,
    maxDepth: number,
): HtmlNode | null {
    switch (node.nodeName) {
        case "#text":
            return { type: "text", value: (node as { value: string }).value };
        case "#comment":
            return {
                type: "comment",
                value: (node as { data: string }).data,
            };
        case "#documentType":
            // A doctype has no meaning for JSX output.
            return null;
        default:
            break;
    }

    // Only elements have a tagName, so this filters out anything else.
    if (!("tagName" in node)) {
        return null;
    }

    // Backstop. The adapter above normally rejects deep input first, but
    // parse5 can move subtrees around after attaching them (for example when
    // repairing misnested tags), which can make the adapter's depth numbers
    // stale. This exact check runs before recursing, so the stack is safe.
    if (depth + 1 > maxDepth) {
        throw tooDeep(maxDepth);
    }

    const element = node as DefaultTreeAdapterMap["element"];
    // <template> keeps its children in a separate `content` field, which we
    // skip for now (see Known Issues in the README).
    const rawChildren =
        element.tagName === "template" ? [] : element.childNodes;

    return {
        type: "element",
        tag: element.tagName,
        attributes: element.attrs.map((attr) => ({
            name: attr.name,
            value: attr.value,
        })),
        children: convertChildren(rawChildren, depth + 1, maxDepth),
    };
}

/** Converts a list of parse5 nodes, dropping the ones we don't keep. */
function convertChildren(
    nodes: P5Node[],
    depth: number,
    maxDepth: number,
): HtmlNode[] {
    const result: HtmlNode[] = [];

    for (const node of nodes) {
        const converted = convertNode(node, depth, maxDepth);

        if (converted) {
            result.push(converted);
        }
    }

    return result;
}

/**
 * Parses HTML into our own tree.
 *
 * Input starting with a doctype or <html> is parsed as a full document.
 * Anything else is parsed as a fragment, so no <html><body> wrapper is added.
 * Throws AppError("VALIDATION_ERROR") if elements nest deeper than the limit.
 */
export function parseHtml(
    html: string,
    options: ParseHtmlOptions = {},
): ParsedHtml {
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_NESTING_DEPTH;
    // The adapter only needs to abort EARLY, so it gets a limit one level
    // looser than the real one. parse5 may count an extra internal level
    // (fragment parsing happens inside a hidden <html> root), and an exact
    // limit here would wrongly reject input that is exactly at the limit.
    // The exact check happens afterwards, in convertNode, on our own tree.
    const treeAdapter = createDepthLimitedAdapter(maxDepth + 1);

    const isDocument = /^\s*(<!doctype|<html[\s>])/i.test(html);

    if (isDocument) {
        const document = parse(html, { treeAdapter });

        return {
            mode: "document",
            children: convertChildren(document.childNodes, 0, maxDepth),
        };
    }

    const fragment = parseFragment(html, { treeAdapter });

    return {
        mode: "fragment",
        children: convertChildren(
            (fragment as P5Parent).childNodes,
            0,
            maxDepth,
        ),
    };
}
