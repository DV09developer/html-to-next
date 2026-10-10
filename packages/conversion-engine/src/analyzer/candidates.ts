import type { HtmlElementNode, HtmlNode } from "@html-to-next/parsers";
import { getClassList } from "../utils/attributes.js";
import { comparePaths } from "../utils/paths.js";
import type { RepeatedGroup } from "./repeated.js";
import type { SectionCandidate, SectionRole } from "./sections.js";

/** Where a candidate came from. */
export type CandidateKind = "section" | "repeated";

/** One thing we suggest turning into a component. */
export type ComponentCandidate = {
    /** Unique PascalCase name. A suggestion: the AI may rename it later. */
    name: string;
    kind: CandidateKind;
    /** The section role, when the element is also a recognized section. */
    role: SectionRole | null;
    /** Element paths of every instance, in document order. */
    paths: string[];
    /** Higher means a stronger candidate. See the scoring rules above. */
    score: number;
    /** Human-readable evidence for the score. Later given to the AI. */
    reasons: string[];
};

export type CandidateOptions = {
    /** Candidates scoring below this are dropped. */
    minScore?: number;
};

export const DEFAULT_MIN_SCORE = 30;

/** An element together with the number of elements in its subtree. */
type ElementInfo = { node: HtmlElementNode; size: number };

/**
 * Builds a lookup from element path to the element and its subtree size.
 * Paths use the same scheme as every other analyzer: child index at each
 * level joined by dots, where text and comment nodes use up an index.
 */
function indexElements(nodes: HtmlNode[]): Map<string, ElementInfo> {
    const index = new Map<string, ElementInfo>();

    // Returns the size of the subtree below `node`, counting `node` itself.
    function visit(node: HtmlElementNode, path: string): number {
        let size = 1;

        node.children.forEach((child, childIndex) => {
            if (child.type === "element") {
                size += visit(child, `${path}.${childIndex}`);
            }
        });

        index.set(path, { node, size });
        return size;
    }

    nodes.forEach((node, nodeIndex) => {
        if (node.type === "element") {
            visit(node, String(nodeIndex));
        }
    });

    return index;
}

/**
 * Turns free text into PascalCase: "product-card" -> "ProductCard".
 * Only ASCII letters and digits are kept, because the result becomes a
 * TypeScript identifier and a file name. Text with no usable characters
 * (for example "___" or a non-ASCII class) returns "".
 */
function toPascalCase(text: string): string {
    return text
        .split(/[^A-Za-z0-9]+/)
        .filter((part) => part !== "")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
}

/** An identifier cannot start with a digit: "3col" -> "Component3col". */
function toIdentifier(name: string): string {
    if (name === "") {
        return "";
    }

    return /^[0-9]/.test(name) ? `Component${name}` : name;
}

/** The first class that produces a usable name, or "" if none does. */
function nameFromClasses(node: HtmlElementNode): string {
    for (const className of getClassList(node)) {
        const name = toIdentifier(toPascalCase(className));

        if (name !== "") {
            return name;
        }
    }

    return "";
}

/** Role names that are not just the capitalized role. */
const ROLE_NAMES = new Map<SectionRole, string>([["cta", "CallToAction"]]);

/** Friendlier names for tags that repeat without a class. */
const TAG_NAMES = new Map<string, string>([
    ["li", "ListItem"],
    ["tr", "TableRow"],
    ["td", "TableCell"],
    ["div", "Item"],
    ["span", "Item"],
]);

/**
 * Names that would clash with browser globals, JavaScript built-ins, or
 * imports Next.js code commonly uses (`next/image`, `next/link`, ...).
 * Not exhaustive: it covers the names a real page is most likely to produce.
 */
const RESERVED_NAMES = new Set([
    "Image",
    "Link",
    "Head",
    "Script",
    "Option",
    "Audio",
    "Text",
    "Event",
    "File",
    "Range",
    "Request",
    "Response",
    "Headers",
    "Notification",
    "Object",
    "Array",
    "Map",
    "Set",
    "Error",
    "Date",
    "Promise",
    "Symbol",
    "String",
    "Number",
    "Boolean",
    "Function",
    "Math",
    "JSON",
    "React",
    "Fragment",
]);

/** The suggested name for a section candidate. */
function nameForSection(role: SectionRole, node: HtmlElementNode): string {
    // A plain <section> has no role of its own, so use its class if any.
    if (role === "section") {
        return nameFromClasses(node) || "Section";
    }

    return ROLE_NAMES.get(role) ?? toPascalCase(role);
}

/** The suggested name for a repeated structure. */
function nameForRepeated(node: HtmlElementNode): string {
    return (
        nameFromClasses(node) ||
        TAG_NAMES.get(node.tag) ||
        toIdentifier(toPascalCase(node.tag)) ||
        "Item"
    );
}

/**
 * Makes a name safe and unique. Reserved names get a suffix, and a name
 * that is already taken gets a number: "Card", "Card2", "Card3".
 */
function finalizeName(name: string, used: Set<string>): string {
    const base = RESERVED_NAMES.has(name) ? `${name}Component` : name;

    if (!used.has(base)) {
        used.add(base);
        return base;
    }

    let counter = 2;

    while (used.has(`${base}${counter}`)) {
        counter += 1;
    }

    const unique = `${base}${counter}`;
    used.add(unique);
    return unique;
}

/** Score for a section, based on how clear its role is. */
function sectionScore(role: SectionRole): number {
    if (role === "section") {
        return 30;
    }

    if (role === "main" || role === "article" || role === "form") {
        return 40;
    }

    return 60;
}

/** Score for a repeated structure: bigger and more frequent scores higher. */
function repeatedScore(size: number, copies: number): number {
    return 20 + Math.min(size, 6) * 5 + Math.min(copies, 5) * 4;
}

/** A candidate before names are made unique. */
type Draft = Omit<ComponentCandidate, "name"> & { baseName: string };

/**
 * Merges repeated structures and sections into one ranked candidate list.
 *
 * `nodes` is the cleaned tree. `repeated` comes from `findRepeatedStructures`
 * and `sections` from `detectSections`, both computed on that same tree.
 * The result is ordered by score (highest first). Candidates with equal
 * scores stay in document order.
 */
export function buildCandidates(
    nodes: HtmlNode[],
    repeated: RepeatedGroup[],
    sections: SectionCandidate[],
    options: CandidateOptions = {},
): ComponentCandidate[] {
    const minScore = options.minScore ?? DEFAULT_MIN_SCORE;
    const elements = indexElements(nodes);
    const sectionByPath = new Map<string, SectionCandidate>(
        sections.map((section): [string, SectionCandidate] => [
            section.path,
            section,
        ]),
    );

    const drafts: Draft[] = [];
    // Paths already claimed by a repeated candidate. A section on one of
    // these paths is merged into that candidate instead of added twice.
    const covered = new Set<string>();

    // Pass 1: repeated structures.
    for (const group of repeated) {
        const first = elements.get(group.paths[0] ?? "");

        // A repeat of a single element (a bare <li>) is just a list.
        if (!first || first.size < 2) {
            continue;
        }

        const score = repeatedScore(first.size, group.paths.length);

        if (score < minScore) {
            continue;
        }

        // Only claim the paths once we know the candidate is kept.
        group.paths.forEach((path) => covered.add(path));

        const sectionMatch = group.paths
            .map((path) => sectionByPath.get(path))
            .find((section) => section !== undefined);

        const reasons = [
            `${group.paths.length} copies of the same structure`,
            `${first.size} elements in each copy`,
        ];

        if (sectionMatch) {
            reasons.push(
                `also a ${sectionMatch.role} section (${sectionMatch.reason})`,
            );
        }

        drafts.push({
            baseName: nameForRepeated(first.node),
            kind: "repeated",
            role: sectionMatch?.role ?? null,
            paths: group.paths,
            score,
            reasons,
        });
    }

    // Pass 2: sections that were not merged into a repeated candidate.
    for (const section of sections) {
        const info = elements.get(section.path);

        if (covered.has(section.path) || !info) {
            continue;
        }

        const score = sectionScore(section.role);

        if (score < minScore) {
            continue;
        }

        drafts.push({
            baseName: nameForSection(section.role, info.node),
            kind: "section",
            role: section.role,
            paths: [section.path],
            score,
            reasons: [`${section.role} section (${section.reason})`],
        });
    }

    // Assign names in document order, so "Card" always goes to the first
    // card on the page and the result does not depend on scores.
    drafts.sort((a, b) => comparePaths(a.paths[0] ?? "", b.paths[0] ?? ""));

    const usedNames = new Set<string>();
    const candidates = drafts.map(
        ({ baseName, ...rest }): ComponentCandidate => ({
            name: finalizeName(baseName, usedNames),
            ...rest,
        }),
    );

    // Rank by score. Array.sort is stable, so equal scores keep the
    // document order established above.
    return candidates.sort((a, b) => b.score - a.score);
}
