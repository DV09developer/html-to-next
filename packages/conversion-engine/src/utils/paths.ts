/**
 * Compares two element paths in document order.
 *
 * Paths look like "0.1.2" (child index at each level). They must be compared
 * as numbers: sorting them as text puts "10" before "2", which is the wrong
 * document order.
 */
export function comparePaths(a: string, b: string): number {
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);
    const shared = Math.min(aParts.length, bParts.length);

    for (let index = 0; index < shared; index += 1) {
        const difference = (aParts[index] ?? 0) - (bParts[index] ?? 0);

        if (difference !== 0) {
            return difference;
        }
    }

    // One path is a prefix of the other: the parent comes before its child.
    return aParts.length - bParts.length;
}

/**
 * Returns every ancestor path of `path`, from the top level downwards.
 * Example: "0.1.2" -> ["0", "0.1"]. A top-level path has no ancestors.
 */
export function ancestorPaths(path: string): string[] {
    const parts = path.split(".");
    const result: string[] = [];

    // Stop before the full length, because the path itself is not an ancestor.
    for (let length = 1; length < parts.length; length += 1) {
        result.push(parts.slice(0, length).join("."));
    }

    return result;
}
