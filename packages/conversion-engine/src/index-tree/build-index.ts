import type {
    HtmlElementNode,
    HtmlNode,
    SourceRange,
} from "@html-to-next/parsers";

/** One element of the cleaned tree, with a stable identity. */
export type IndexedNode = {
    /** Stable, deterministic for the same input: "n0", "n1", ... */
    id: string;
    /** Same path scheme as the analyzers use today. Kept for debugging. */
    path: string;
    parentId: string | null;
    /** Element children only, in document order. */
    childIds: string[];
    tag: string;
    /** Offsets into the ORIGINAL html, or null for parser-invented elements. */
    source: SourceRange | null;
    /** The element itself, so analyzers can read classes and attributes. */
    node: HtmlElementNode;
};

export type TreeIndex = {
    /** Iterates in document order (see buildIndex). */
    byId: Map<string, IndexedNode>;
    /** Path -> id. A bridge so analyzers can migrate to ids one at a time. */
    idByPath: Map<string, string>;
    /** Ids of the top-level elements, in document order. */
    rootIds: string[];
};

/**
 * Builds the index for a cleaned tree.
 *
 * Ids are handed out in depth-first, parent-first order, so they depend only
 * on the shape of the tree: the same input always gives the same ids. A
 * record is added to the maps BEFORE its children are visited, so iterating
 * `byId` also gives document order.
 *
 * The tree is only read, never modified.
 */
export function buildIndex(nodes: HtmlNode[]): TreeIndex {
    const byId = new Map<string, IndexedNode>();
    const idByPath = new Map<string, string>();
    let counter = 0;

    // Returns the ids of the elements found directly in `list`.
    function visit(
        list: HtmlNode[],
        parentPath: string,
        parentId: string | null,
    ): string[] {
        const ids: string[] = [];

        list.forEach((node, index) => {
            // Text and comments are skipped but still use up an index, so
            // paths match computeSignatures, analyzeCss and the others.
            if (node.type !== "element") {
                return;
            }

            const path =
                parentPath === "" ? String(index) : `${parentPath}.${index}`;
            const id = `n${counter}`;
            counter += 1;

            const record: IndexedNode = {
                id,
                path,
                parentId,
                childIds: [],
                tag: node.tag,
                source: node.source ?? null,
                node,
            };

            byId.set(id, record);
            idByPath.set(path, id);
            record.childIds = visit(node.children, path, id);
            ids.push(id);
        });

        return ids;
    }

    return { byId, idByPath, rootIds: visit(nodes, "", null) };
}

/**
 * Returns the ids of every ancestor of `id`, from the top level downwards
 * (the same order as `ancestorPaths`). Unknown ids return an empty list.
 */
export function ancestorIdsOf(index: TreeIndex, id: string): string[] {
    const result: string[] = [];
    let current = index.byId.get(id)?.parentId ?? null;

    while (current !== null) {
        result.push(current);
        current = index.byId.get(current)?.parentId ?? null;
    }

    return result.reverse();
}
