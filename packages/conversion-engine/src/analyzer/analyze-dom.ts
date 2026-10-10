import { walk } from "@html-to-next/parsers";
import type { HtmlNode } from "@html-to-next/parsers";
import { getClassList } from "../utils/attributes.js";

/** Counts of the element kinds that matter for component detection. */
export type DomFeatures = {
    links: number;
    images: number;
    buttons: number;
    forms: number;
    formControls: number;
    tables: number;
    lists: number;
    headings: number;
    /** header, nav, main, section, article, aside, footer */
    semanticSections: number;
};

export type DomStats = {
    elementCount: number;
    /** Text nodes that contain more than whitespace. */
    textNodeCount: number;
    /** Number of nesting levels. A lone element counts as 1; no elements is 0. */
    maxDepth: number;
    /** Tag name -> how many times it appears. */
    tagCounts: Record<string, number>;
    /** CSS class -> how many elements use it. */
    classFrequency: Record<string, number>;
    features: DomFeatures;
};

/** Tag groups used to build `features`. */
const SEMANTIC_TAGS = [
    "header",
    "nav",
    "main",
    "section",
    "article",
    "aside",
    "footer",
];
const FORM_CONTROL_TAGS = ["input", "select", "textarea"];
const LIST_TAGS = ["ul", "ol"];
const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

/** Adds up the counts of several tags, treating missing tags as zero. */
function sumTags(tagCounts: Record<string, number>, tags: string[]): number {
    return tags.reduce((total, tag) => total + (tagCounts[tag] ?? 0), 0);
}

/**
 * Measures a cleaned HTML tree. The tree is only read, never modified.
 */
export function analyzeDom(nodes: HtmlNode[]): DomStats {
    // Null-prototype objects: tag and class names come from untrusted HTML.
    // On a normal object, a class called "constructor" or "__proto__" would
    // read or overwrite built-in properties instead of acting as a plain key.
    const tagCounts = Object.create(null) as Record<string, number>;
    const classFrequency = Object.create(null) as Record<string, number>;

    let elementCount = 0;
    let textNodeCount = 0;
    let maxDepth = 0;

    walk(nodes, (node, context) => {
        if (node.type === "text") {
            // Whitespace between tags is formatting, not content.
            if (node.value.trim() !== "") {
                textNodeCount += 1;
            }
            return;
        }

        if (node.type !== "element") {
            return;
        }

        elementCount += 1;
        // `depth` starts at 0 for top-level nodes, so add 1 to count levels.
        maxDepth = Math.max(maxDepth, context.depth + 1);
        tagCounts[node.tag] = (tagCounts[node.tag] ?? 0) + 1;

        for (const name of getClassList(node)) {
            classFrequency[name] = (classFrequency[name] ?? 0) + 1;
        }
    });

    return {
        elementCount,
        textNodeCount,
        maxDepth,
        tagCounts,
        classFrequency,
        features: {
            links: tagCounts["a"] ?? 0,
            images: tagCounts["img"] ?? 0,
            buttons: tagCounts["button"] ?? 0,
            forms: tagCounts["form"] ?? 0,
            formControls: sumTags(tagCounts, FORM_CONTROL_TAGS),
            tables: tagCounts["table"] ?? 0,
            lists: sumTags(tagCounts, LIST_TAGS),
            headings: sumTags(tagCounts, HEADING_TAGS),
            semanticSections: sumTags(tagCounts, SEMANTIC_TAGS),
        },
    };
}
