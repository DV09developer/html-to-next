export type HtmlAttribute = {
    name: string;
    value: string;
};

export type HtmlElementNode = {
    type: "element";
    tag: string;
    attributes: HtmlAttribute[];
    children: HtmlNode[];
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
