import type { HtmlNode } from "@html-to-next/parsers";
import { analyzeDom } from "./analyze-dom.js";
import type { DomStats } from "./analyze-dom.js";
import { buildCandidates } from "./candidates.js";
import type { CandidateOptions, ComponentCandidate } from "./candidates.js";
import { buildComponentTree } from "./component-tree.js";
import type { ComponentTree } from "./component-tree.js";
import { findRepeatedStructures } from "./repeated.js";
import type { RepeatedGroup } from "./repeated.js";
import { detectSections } from "./sections.js";
import type { SectionCandidate } from "./sections.js";
import { computeSignatures } from "./signatures.js";

export type DetectOptions = CandidateOptions & {
    /** Smallest number of copies that counts as a repeated structure. */
    minOccurrences?: number;
};

/** Everything Milestone 3 learns about a page. */
export type ComponentDetection = {
    stats: DomStats;
    sections: SectionCandidate[];
    repeated: RepeatedGroup[];
    /** Ranked by score, best first. */
    candidates: ComponentCandidate[];
    tree: ComponentTree;
};

/**
 * Runs every analyzer on a cleaned tree and returns all the results.
 * The intermediate results (stats, sections, repeats) are returned too,
 * because the AI prompt in a later milestone needs them as context.
 */
export function detectComponents(
    nodes: HtmlNode[],
    options: DetectOptions = {},
): ComponentDetection {
    const stats = analyzeDom(nodes);
    const sections = detectSections(nodes);
    const repeated = findRepeatedStructures(
        computeSignatures(nodes),
        options.minOccurrences,
    );
    const candidates = buildCandidates(nodes, repeated, sections, options);

    return {
        stats,
        sections,
        repeated,
        candidates,
        tree: buildComponentTree(candidates),
    };
}
