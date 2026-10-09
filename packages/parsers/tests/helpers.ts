import type { HtmlElementNode, HtmlNode } from "../src/index.js";

export function expectElement(node: HtmlNode | undefined): HtmlElementNode {
    if (!node || node.type !== "element") {
        throw new Error(`Expected an element node, got ${node?.type}`);
    }
    return node;
}
