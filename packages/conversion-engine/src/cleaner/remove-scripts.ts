import type { HtmlNode } from "@html-to-next/parsers";

export type RemoveScriptsResult = {
    nodes: HtmlNode[];
    removedCount: number;
};  

export function removeScripts(nodes: HtmlNode[]): RemoveScriptsResult {
    let removedCount = 0;

    function clean(list: HtmlNode[]): HtmlNode[] {
        const result: HtmlNode[] = [];

        for (const node of list) {
            if (node.type !== "element") {
                result.push(node);
                continue;
            }

            if (node.tag === "script") {
                removedCount += 1;
                continue;
            }

            result.push({ ...node, children: clean(node.children) });
        }

        return result;
    }

    return { nodes: clean(nodes), removedCount };
}