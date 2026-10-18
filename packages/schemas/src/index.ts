export { conversionOptionsSchema } from "./conversion.js";
export type { ConversionOptions } from "./conversion.js";

export { generatedFileSchema } from "./generated-file.js";
export type { GeneratedFile } from "./generated-file.js";

export { validationIssueSchema, validationResultSchema, createValidationResult } from "./validation.js";
export type { ValidationIssue, ValidationResult } from "./validation.js";

export { warningSchema } from "./warning.js";
export type { Warning } from "./warning.js";

export {
    componentPropSchema,
    componentNodeSchema,
    componentTreeSchema,
} from "./component.js";
export type {
    ComponentProp,
    ComponentNode,
    ComponentTree,
} from "./component.js";

export {
    conversionErrorSchema,
    conversionMetadataSchema,
    conversionResultSchema,
} from "./conversion-result.js";
export type {
    ConversionError,
    ConversionMetadata,
    ConversionResult,
} from "./conversion-result.js";
