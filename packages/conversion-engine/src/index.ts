export {
    validateInput,
    DEFAULT_INPUT_LIMITS,
} from "./cleaner/validate-input.js";
export type { InputLimits } from "./cleaner/validate-input.js";

export { removeScripts } from "./cleaner/remove-scripts.js";
export type { RemoveScriptsResult } from "./cleaner/remove-scripts.js"; 

export { normalizeAttributes } from "./cleaner/normalize-attributes.js";
export type { NormalizeAttributesResult } from "./cleaner/normalize-attributes.js";