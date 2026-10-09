import type { HtmlNode } from "./types.js";

export type WalkContext = {
    parent: HtmlNode | null;
    depth: number;
};

export type Visitor = (node: HtmlNode, context: WalkContext) => void;

export function walk(nodes: HtmlNode[], visitor: Visitor): void {
    visitNodes(nodes, null, 0, visitor);
}

function visitNodes(
    nodes: HtmlNode[],
    parent: HtmlNode | null,
    depth: number,
    visitor: Visitor,
): void {
    for (const node of nodes) {
        visitor(node, { parent, depth });

        if (node.type === "element") {
            visitNodes(node.children, node, depth + 1, visitor);
        }
    }
}
