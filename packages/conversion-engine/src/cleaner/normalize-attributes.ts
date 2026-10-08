import type { HtmlAttribute, HtmlNode } from "@html-to-next/parsers";

const ATTRIBUTE_RENAMES: Readonly<Record<string, string>> = {
    class: "className",
    for: "htmlFor",
    tabindex: "tabIndex",
    readonly: "readOnly",
    maxlength: "maxLength",
    minlength: "minLength",
    colspan: "colSpan",
    rowspan: "rowSpan",
    srcset: "srcSet",
    autocomplete: "autoComplete",
    autofocus: "autoFocus",
    crossorigin: "crossOrigin",
    contenteditable: "contentEditable",
    novalidate: "noValidate",
    enctype: "encType",
    datetime: "dateTime",
    charset: "charSet",
    usemap: "useMap",
    frameborder: "frameBorder",
    allowfullscreen: "allowFullScreen",
    playsinline: "playsInline",
    srclang: "srcLang",
    "accept-charset": "acceptCharset",
    "http-equiv": "httpEquiv",
};

export type NormalizeAttributesResult = {
    nodes: HtmlNode[];
    renamedCount: number;
    removedEventHandlers: number;
};

const EVENT_HANDLER = /^on[a-z]+$/;

export function normalizeAttributes(
    nodes: HtmlNode[],
): NormalizeAttributesResult {
    let renamedCount = 0;
    let removedEventHandlers = 0;

    function normalizeList(attributes: HtmlAttribute[]): HtmlAttribute[] {
        const result: HtmlAttribute[] = [];

        for (const attribute of attributes) {
            if (EVENT_HANDLER.test(attribute.name)) {
                removedEventHandlers += 1;
                continue;
            }

            const renamed = ATTRIBUTE_RENAMES[attribute.name];

            if (renamed) {
                renamedCount += 1;
                result.push({ name: renamed, value: attribute.value });
            } else {
                result.push(attribute);
            }
        }

        return result;
    }

    function clean(list: HtmlNode[]): HtmlNode[] {
        return list.map((node) => {
            if (node.type !== "element") {
                return node;
            }

            return {
                ...node,
                attributes: normalizeList(node.attributes),
                children: clean(node.children),
            };
        });
    }

    return { nodes: clean(nodes), renamedCount, removedEventHandlers };
}