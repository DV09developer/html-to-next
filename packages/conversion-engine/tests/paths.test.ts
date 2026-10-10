import { describe, expect, it } from "vitest";
import { ancestorPaths, comparePaths } from "../src/utils/paths.js";

describe("comparePaths", () => {
    it("sorts numerically, not as text", () => {
        // As text, "10" would sort before "2".
        const sorted = ["10", "2", "0.1", "0", "0.0"].sort(comparePaths);

        expect(sorted).toEqual(["0", "0.0", "0.1", "2", "10"]);
    });

    it("puts a parent before its children", () => {
        expect(comparePaths("1", "1.0")).toBeLessThan(0);
        expect(comparePaths("1.0", "1")).toBeGreaterThan(0);
    });
});

describe("ancestorPaths", () => {
    it("lists ancestors from the top down", () => {
        expect(ancestorPaths("0.1.2")).toEqual(["0", "0.1"]);
    });

    it("returns nothing for a top-level path", () => {
        expect(ancestorPaths("3")).toEqual([]);
    });
});
