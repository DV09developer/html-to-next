export type CssDeclaration = {
    property: string;
    value: string;
    important: boolean;
};

export type CssRule = {
    selector: string;
    declarations: CssDeclaration[];
    atRules: string[];
};

export type ParsedCss = {
    rules: CssRule[];
};