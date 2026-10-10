import type {
    CompoundSelector,
    HtmlElementNode,
    ParsedSelector,
} from "@html-to-next/parsers";
import { getAttribute, getClassList } from "../utils/attributes.js";

function matchesCompound(
    compound: CompoundSelector,
    node: HtmlElementNode,
): boolean {
    if (compound.tag !== null && compound.tag !== node.tag) {
        return false;
    }

    if (compound.id !== null && getAttribute(node, "id") !== compound.id) {
        return false;
    }

    if (compound.classes.length > 0) {
        const present = new Set(getClassList(node));

        return compound.classes.every((name) => present.has(name));
    }

    return true;
}

function matchesAncestors(
    selector: ParsedSelector,
    stepIndex: number,
    ancestors: HtmlElementNode[],
    ancestorIndex: number,
): boolean {
    if (stepIndex === 0) {
        return true;
    }

    const step = selector.steps[stepIndex];
    const previous = selector.steps[stepIndex - 1];

    if (!step || !previous) {
        return false;
    }

    if (step.combinator === "child") {
        const parent = ancestors[ancestorIndex];

        return (
            parent !== undefined &&
            matchesCompound(previous.compound, parent) &&
            matchesAncestors(
                selector,
                stepIndex - 1,
                ancestors,
                ancestorIndex - 1,
            )
        );
    }

    for (let index = ancestorIndex; index >= 0; index -= 1) {
        const candidate = ancestors[index];

        if (
            candidate !== undefined &&
            matchesCompound(previous.compound, candidate) &&
            matchesAncestors(selector, stepIndex - 1, ancestors, index - 1)
        ) {
            return true;
        }
    }

    return false;
}

export function matchesSelector(
    selector: ParsedSelector,
    node: HtmlElementNode,
    ancestors: HtmlElementNode[],
): boolean {
    const lastIndex = selector.steps.length - 1;
    const last = selector.steps[lastIndex];

    if (!last || !matchesCompound(last.compound, node)) {
        return false;
    }

    return matchesAncestors(
        selector,
        lastIndex,
        ancestors,
        ancestors.length - 1,
    );
}
