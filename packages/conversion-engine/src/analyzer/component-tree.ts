import { ancestorPaths, comparePaths } from "../utils/paths.js";
import type { ComponentCandidate } from "./candidates.js";

/** A prop a component takes. Filled in later by the AI and generator stages. */
export type ComponentProp = {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
};

/** One node of the component tree. */
export type ComponentNode = {
    /** Unique id. The root is "page"; components are "component:<Name>". */
    id: string;
    name: string;
    type: "page" | "component";
    /** Element paths of every instance. Empty for the root. */
    sourcePaths: string[];
    /** Ids of the components used directly inside this one, in document order. */
    children: string[];
    /** Always empty for now: prop detection comes in a later milestone. */
    props: ComponentProp[];
};

export type ComponentTree = {
    rootId: string;
    /** The root first, then every component in document order. */
    nodes: ComponentNode[];
};

export const ROOT_ID = "page";

/** Builds a component id. Names are unique, so ids are unique too. */
function idFor(name: string): string {
    return `component:${name}`;
}

/**
 * Finds the id of the nearest candidate that contains `path`, or null.
 *
 * `ownerOf` maps an element path to the candidate that owns it.
 * `self` is the candidate we are looking for a parent of. It is skipped, so
 * a component can never become its own parent.
 */
function findParent(
    path: string,
    self: string,
    ownerOf: Map<string, string>,
): string | null {
    const ancestors = ancestorPaths(path);

    // `ancestorPaths` goes top-down, so walk backwards to try the nearest
    // ancestor first.
    for (let index = ancestors.length - 1; index >= 0; index -= 1) {
        const ancestor = ancestors[index];
        const owner =
            ancestor === undefined ? undefined : ownerOf.get(ancestor);

        if (owner !== undefined && owner !== self) {
            return owner;
        }
    }

    return null;
}

/**
 * Nests a flat candidate list into a component tree.
 *
 * Candidate names must be unique, which `buildCandidates` guarantees.
 * The input list is not modified.
 */
export function buildComponentTree(
    candidates: ComponentCandidate[],
): ComponentTree {
    // Document order decides the order of every children list. The input is
    // sorted by score, so we sort a copy by position in the page.
    const ordered = [...candidates].sort((a, b) =>
        comparePaths(a.paths[0] ?? "", b.paths[0] ?? ""),
    );

    // Path -> id of the candidate that owns it. Built before linking, so a
    // child can find a parent that comes later in the list.
    const ownerOf = new Map<string, string>();

    for (const candidate of ordered) {
        for (const path of candidate.paths) {
            // If two candidates ever claim a path, the first one keeps it.
            if (!ownerOf.has(path)) {
                ownerOf.set(path, idFor(candidate.name));
            }
        }
    }

    // Parent id -> ids of its children. A Set drops duplicates (a component
    // with five instances inside one parent is still one child) and keeps
    // insertion order, which is document order.
    const childrenOf = new Map<string, Set<string>>([[ROOT_ID, new Set()]]);

    for (const candidate of ordered) {
        childrenOf.set(idFor(candidate.name), new Set());
    }

    for (const candidate of ordered) {
        const id = idFor(candidate.name);

        // Each instance can sit in a different parent, so check them all.
        for (const path of candidate.paths) {
            const parent = findParent(path, id, ownerOf) ?? ROOT_ID;

            childrenOf.get(parent)?.add(id);
        }
    }

    const root: ComponentNode = {
        id: ROOT_ID,
        name: "Page",
        type: "page",
        sourcePaths: [],
        children: [...(childrenOf.get(ROOT_ID) ?? [])],
        props: [],
    };

    const nodes = ordered.map((candidate): ComponentNode => ({
        id: idFor(candidate.name),
        name: candidate.name,
        type: "component",
        sourcePaths: candidate.paths,
        children: [...(childrenOf.get(idFor(candidate.name)) ?? [])],
        props: [],
    }));

    return { rootId: ROOT_ID, nodes: [root, ...nodes] };
}
