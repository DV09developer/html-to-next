import { describe, expect, it } from "vitest";
import { conversionOptionsSchema } from "../src/index.js";

describe("conversionOptionsSchema", () => {
    it("fills defaults from an empty object", () => {
        const options = conversionOptionsSchema.parse({});

        expect(options.framework).toBe("nextjs");
        expect(options.componentStrategy).toBe("auto");
        expect(options.accessibility).toBe(true);
    });

    it("rejects unsupported frameworks", () => {
        const result = conversionOptionsSchema.safeParse({ framework: "vue" });

        expect(result.success).toBe(false);
    });
});
