import postcss from "postcss";
import type { AtRule, ChildNode } from "postcss";
import type { CssRule, ParsedCss } from "./types.js";

export function parseCss(css: string): ParsedCss {
    const root = postcss.parse(css);
    const rules: CssRule[] = [];

    function visit(nodes: ChildNode[], atRules: string[]): void {
        for (const node of nodes) {
            if (node.type === "rule") {
                for (const selector of node.selectors) {
                    rules.push({
                        selector: selector.trim(),
                        declarations: collectDeclarations(node.nodes),
                        atRules,
                    });
                }
            } else if (node.type === "atrule") {
                visitAtRule(node, atRules);
            }
        }
    }

    function visitAtRule(node: AtRule, atRules: string[]): void {
        if (node.nodes) {
            const label = `@${node.name} ${node.params}`.trim();
            visit(node.nodes, [...atRules, label]);
        }
    }

    visit(root.nodes, []);
    return { rules };
}

function collectDeclarations(nodes: ChildNode[]): CssRule["declarations"] {
    const result: CssRule["declarations"] = [];

    for (const node of nodes) {
        if (node.type === "decl") {
            result.push({
                property: node.prop,
                value: node.value,
                important: node.important === true,
            });
        }
    }

    return result;
}