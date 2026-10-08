import { parse, parseFragment } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";
import type { HtmlNode, ParsedHtml } from "./types.js";

type P5Node = DefaultTreeAdapterMap["node"];
type P5Parent = DefaultTreeAdapterMap["parentNode"];

function convertNode(node: P5Node): HtmlNode | null {
    switch (node.nodeName) {
        case "#text":
            return { type: "text", value: (node as { value: string }).value };
        case "#comment":
            return {
                type: "comment",
                value: (node as { data: string }).data,
            };
        case "#documentType":
            return null;
        default:
            break;
    }

    if (!("tagName" in node)) {
        return null;
    }

    const element = node as DefaultTreeAdapterMap["element"];
    const source = element.tagName === "template" ? null : element;
    const rawChildren = source ? source.childNodes : [];

    return {
        type: "element",
        tag: element.tagName,
        attributes: element.attrs.map((attr) => ({
            name: attr.name,
            value: attr.value,
        })),
        children: convertChildren(rawChildren),
    };
}

function convertChildren(nodes: P5Node[]): HtmlNode[] {
    const result: HtmlNode[] = [];

    for (const node of nodes) {
        const converted = convertNode(node);
        if (converted) {
            result.push(converted);
        }
    }

    return result;
}

export function parseHtml(html: string): ParsedHtml {
    const isDocument = /^\s*(<!doctype|<html[\s>])/i.test(html);

    if (isDocument) {
        const document = parse(html);
        return {
            mode: "document",
            children: convertChildren(document.childNodes),
        };
    }

    const fragment = parseFragment(html);
    return {
        mode: "fragment",
        children: convertChildren((fragment as P5Parent).childNodes),
    };
}
