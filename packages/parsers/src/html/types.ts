export type HtmlAttribute = {
    name: string;
    value: string;
};

export type HtmlElementNode = {
    type: "element";
    tag: string;
    attributes: HtmlAttribute[];
    children: HtmlNode[];
    /** Missing for elements the parser invented (see below). */
    source?: SourceRange;
};

export type HtmlTextNode = {
    type: "text";
    value: string;
};

export type HtmlCommentNode = {
    type: "comment";
    value: string;
};

export type HtmlNode = HtmlElementNode | HtmlTextNode | HtmlCommentNode;

export type ParsedHtml = {
    mode: "document" | "fragment";
    children: HtmlNode[];
};

/** Where an element sits in the ORIGINAL html string, as character offsets. */
export type SourceRange = {
    /** Offset of the first character of the opening tag. */
    start: number;
    /** Offset just after the last character of the element. */
    end: number;
};
