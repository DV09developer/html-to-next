import { AppError } from "@html-to-next/shared";
import { parseCss, parseSelector } from "@html-to-next/parsers";
import type {
    CssRule,
    HtmlElementNode,
    HtmlNode,
    ParsedCss,
    ParsedSelector,
    Specificity,
} from "@html-to-next/parsers";
import { matchesSelector } from "./match-selector.js";

/** Everything we learned about a single CSS rule. */
export type RuleAnalysis = {
    /** Position in the parsed rule list. Other results refer to it by this number. */
    index: number;
    /** The original rule (selector, declarations, @media context). */
    rule: CssRule;
    /** Specificity, or null when the selector is unsupported. */
    specificity: Specificity | null;
    /** Why the selector is unsupported, or null when it is supported. */
    unsupportedReason: string | null;
    /** Paths of every element this rule matched, e.g. ["0", "0.1"]. */
    matchedPaths: string[];
};

/** The full outcome of matching a stylesheet against a tree. */
export type CssAnalysis = {
    /** One entry per rule, in stylesheet order. */
    rules: RuleAnalysis[];
    /** Element path -> indexes of the rules that apply to it. */
    nodeRules: Record<string, number[]>;
    /** Supported rules that matched no element at all. */
    unusedRules: number[];
    /** Rules whose selector uses syntax we don't support yet. */
    unsupportedRules: number[];
};

/**
 * Parses CSS and converts parser failures into our own AppError.
 * postcss throws its own error class on broken CSS (for example an
 * unclosed `{`). The API layer only understands AppError, so we translate.
 */
function parseCssSafely(css: string): ParsedCss {
    try {
        return parseCss(css);
    } catch (error) {
        throw new AppError("CSS could not be parsed", "PARSE_ERROR", {
            // Keep the original message so the user can see what is wrong.
            reason: error instanceof Error ? error.message : String(error),
        });
    }
}

/**
 * Matches every rule in `css` against every element in `nodes`.
 *
 * `nodes` should be the cleaned tree from `cleanHtml`. The function only
 * reads the tree. It never modifies it.
 */
export function analyzeCss(nodes: HtmlNode[], css: string): CssAnalysis {
    const parsed = parseCssSafely(css);

    // Rule index -> parsed selector. Only supported selectors are stored,
    // so the matching loop below never sees an unsupported one.
    const selectors = new Map<number, ParsedSelector>();
    const rules: RuleAnalysis[] = [];

    // Pass 1: parse each selector exactly once, before touching the tree.
    // Parsing inside the tree loop would repeat the work for every element.
    parsed.rules.forEach((rule, index) => {
        const result = parseSelector(rule.selector);

        if (result.supported) {
            selectors.set(index, result.selector);
            rules.push({
                index,
                rule,
                specificity: result.selector.specificity,
                unsupportedReason: null,
                matchedPaths: [],
            });
        } else {
            rules.push({
                index,
                rule,
                specificity: null,
                unsupportedReason: result.reason,
                matchedPaths: [],
            });
        }
    });

    const nodeRules: Record<string, number[]> = {};

    // Pass 2: walk the tree. `ancestors` lists the elements above the
    // current one, root first and direct parent last. That is the exact
    // format `matchesSelector` expects.
    function visit(
        list: HtmlNode[],
        ancestors: HtmlElementNode[],
        parentPath: string,
    ): void {
        list.forEach((node, childIndex) => {
            // Text and comment nodes can't be styled, but they still use up
            // an index, so the paths of their siblings stay accurate.
            if (node.type !== "element") {
                return;
            }

            const path =
                parentPath === ""
                    ? String(childIndex)
                    : `${parentPath}.${childIndex}`;

            for (const [ruleIndex, selector] of selectors) {
                if (!matchesSelector(selector, node, ancestors)) {
                    continue;
                }

                // Record the match in both directions: node -> rules ...
                const existing = nodeRules[path];
                if (existing) {
                    existing.push(ruleIndex);
                } else {
                    nodeRules[path] = [ruleIndex];
                }

                // ... and rule -> nodes.
                rules[ruleIndex]?.matchedPaths.push(path);
            }

            // Build a new array instead of pushing and popping, so a
            // sibling branch can never see this node as its ancestor.
            visit(node.children, [...ancestors, node], path);
        });
    }

    visit(nodes, [], "");

    return {
        rules,
        nodeRules,
        // Supported but never matched: candidates for "unused CSS" warnings.
        unusedRules: rules
            .filter(
                (item) =>
                    item.unsupportedReason === null &&
                    item.matchedPaths.length === 0,
            )
            .map((item) => item.index),
        // Unsupported selectors are reported, never silently dropped.
        unsupportedRules: rules
            .filter((item) => item.unsupportedReason !== null)
            .map((item) => item.index),
    };
}
