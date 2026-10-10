export {
    validateInput,
    DEFAULT_INPUT_LIMITS,
} from "./cleaner/validate-input.js";
export type { InputLimits } from "./cleaner/validate-input.js";

export { removeScripts } from "./cleaner/remove-scripts.js";
export type { RemoveScriptsResult } from "./cleaner/remove-scripts.js";

export { normalizeAttributes } from "./cleaner/normalize-attributes.js";
export type { NormalizeAttributesResult } from "./cleaner/normalize-attributes.js";

export { parseStyle, toCamelCaseProperty } from "./cleaner/parse-style.js";
export type { StyleEntry } from "./cleaner/parse-style.js";

export { cleanHtml } from "./cleaner/clean-html.js";
export type { CleanHtmlResult, CleanWarning } from "./cleaner/clean-html.js";

export { matchesSelector } from "./css/match-selector.js";

export { analyzeCss } from "./css/analyze-css.js";
export type { CssAnalysis, RuleAnalysis } from "./css/analyze-css.js";

export { analyzeDom } from "./analyzer/analyze-dom.js";
export type { DomFeatures, DomStats } from "./analyzer/analyze-dom.js";

export { computeSignatures } from "./analyzer/signatures.js";
