import { describe, expect, it } from "vitest";
import { buildComponentTree } from "../src/index.js";
import type {
    ComponentCandidate,
    ComponentNode,
    ComponentTree,
} from "../src/index.js";

// Hand-made candidate: only the name and paths matter to the tree builder.
function make(name: string, paths: string[]): ComponentCandidate {
    return { name, kind: "section", role: null, paths, score: 50, reasons: [] };
}

// Finds a node by id, failing loudly when it is missing.
function nodeById(tree: ComponentTree, id: string): ComponentNode {
    const node = tree.nodes.find((item) => item.id === id);

    if (!node) {
        throw new Error(`No node with id ${id}`);
    }

    return node;
}

describe("buildComponentTree", () => {
    it("returns only the root when there are no candidates", () => {
        const tree = buildComponentTree([]);

        expect(tree).toEqual({
            rootId: "page",
            nodes: [
                {
                    id: "page",
                    name: "Page",
                    type: "page",
                    sourcePaths: [],
                    children: [],
                    props: [],
                },
            ],
        });
    });

    it("describes a component node", () => {
        const tree = buildComponentTree([make("Navbar", ["0"])]);

        expect(nodeById(tree, "component:Navbar")).toEqual({
            id: "component:Navbar",
            name: "Navbar",
            type: "component",
            sourcePaths: ["0"],
            children: [],
            props: [],
        });
    });

    it("orders root children by document order, not by input order", () => {
        // Input is ranked by score, so the footer arrives first.
        const tree = buildComponentTree([
            make("Footer", ["2"]),
            make("Navbar", ["0"]),
        ]);

        expect(nodeById(tree, "page").children).toEqual([
            "component:Navbar",
            "component:Footer",
        ]);
    });

    it("nests a candidate inside its container", () => {
        const tree = buildComponentTree([
            make("Features", ["0"]),
            make("Card", ["0.0", "0.1"]),
        ]);

        expect(nodeById(tree, "page").children).toEqual(["component:Features"]);
        // Two cards, but one child entry.
        expect(nodeById(tree, "component:Features").children).toEqual([
            "component:Card",
        ]);
    });

    it("attaches to the nearest candidate and skips plain elements", () => {
        // "0.2" is a plain <div>, not a candidate, so Card links to Main.
        const tree = buildComponentTree([
            make("Main", ["0"]),
            make("Card", ["0.2.1"]),
        ]);

        expect(nodeById(tree, "component:Main").children).toEqual([
            "component:Card",
        ]);
        expect(nodeById(tree, "page").children).toEqual(["component:Main"]);
    });

    it("links a shared component to every parent that uses it", () => {
        const tree = buildComponentTree([
            make("A", ["0"]),
            make("B", ["1"]),
            make("Card", ["0.0", "1.0"]),
        ]);

        expect(nodeById(tree, "component:A").children).toEqual([
            "component:Card",
        ]);
        expect(nodeById(tree, "component:B").children).toEqual([
            "component:Card",
        ]);
        // Card is always inside A or B, so it is not a root child.
        expect(nodeById(tree, "page").children).toEqual([
            "component:A",
            "component:B",
        ]);
    });

    it("links a component to the root when one instance is top-level", () => {
        // Card appears at the top level and inside B.
        const tree = buildComponentTree([
            make("Card", ["0", "1.0"]),
            make("B", ["1"]),
        ]);

        expect(nodeById(tree, "page").children).toEqual([
            "component:Card",
            "component:B",
        ]);
        expect(nodeById(tree, "component:B").children).toEqual([
            "component:Card",
        ]);
    });

    it("never makes a component its own parent", () => {
        // The second instance sits inside the first.
        const tree = buildComponentTree([make("Box", ["0", "0.0"])]);

        expect(nodeById(tree, "component:Box").children).toEqual([]);
        expect(nodeById(tree, "page").children).toEqual(["component:Box"]);
    });
});
