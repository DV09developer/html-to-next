import { parseHtml } from "@html-to-next/parsers";
import type { HtmlNode } from "@html-to-next/parsers";
import { DEFAULT_INPUT_LIMITS, validateInput } from "./validate-input.js";
import type { InputLimits } from "./validate-input.js";
import { removeScripts } from "./remove-scripts.js";
import { normalizeAttributes } from "./normalize-attributes.js";

export type CleanWarning = {
    code: "SCRIPTS_REMOVED" | "EVENT_HANDLERS_REMOVED";
    message: string;
    count: number;
};

export type CleanHtmlResult = {
    mode: "document" | "fragment";
    nodes: HtmlNode[];
    css: string;
    warnings: CleanWarning[];
};

export function cleanHtml(
    html: string,
    css?: string,
    limits: InputLimits = DEFAULT_INPUT_LIMITS,
): CleanHtmlResult {
    validateInput(html, css, limits);

    const parsed = parseHtml(html);
    const withoutScripts = removeScripts(parsed.children);
    const normalized = normalizeAttributes(withoutScripts.nodes);

    const warnings: CleanWarning[] = [];

    if (withoutScripts.removedCount > 0) {
        warnings.push({
            code: "SCRIPTS_REMOVED",
            message: `${withoutScripts.removedCount} script tag(s) were removed.`,
            count: withoutScripts.removedCount,
        });
    }

    if (normalized.removedEventHandlers > 0) {
        warnings.push({
            code: "EVENT_HANDLERS_REMOVED",
            message: `${normalized.removedEventHandlers} inline event handler(s) were removed.`,
            count: normalized.removedEventHandlers,
        });
    }

    return {
        mode: parsed.mode,
        nodes: normalized.nodes,
        css: css ?? "",
        warnings,
    };
}
