import { ancestorPaths, comparePaths } from "../utils/paths.js";

/** A set of elements that all share one structure. */
export type RepeatedGroup = {
    /** The shared signature, e.g. "div.card(h3(#),p(#))". */
    signature: string;
    /** Element paths in document order. Always at least `minOccurrences` long. */
    paths: string[];
};

/**
 * Finds structures that appear more than once.
 *
 * `signatures` is the output of `computeSignatures` (path -> signature).
 * Groups are ordered by where their signature first appears in the document.
 *
 * Note: this reports every repeat, including trivial ones such as a lone
 * `p(#)`. Deciding which repeats are worth a component is the job of the
 * scoring step, which comes later.
 */
export function findRepeatedStructures(
    signatures: Record<string, string>,
    minOccurrences = 2,
): RepeatedGroup[] {
    // A "repeat" needs at least two members, whatever the caller asks for.
    const minimum = Math.max(2, minOccurrences);

    // Sort first. Object key order is not document order: integer-like keys
    // such as "0" and "1" jump ahead of keys like "0.1".
    const paths = Object.keys(signatures).sort(comparePaths);

    // Step 1: group paths by signature. A Map keeps insertion order, so the
    // groups come out ordered by first occurrence, and signatures are never
    // treated as object property names.
    const groups = new Map<string, string[]>();

    for (const path of paths) {
        const signature = signatures[path];

        if (signature === undefined) {
            continue;
        }

        const members = groups.get(signature);

        if (members) {
            members.push(path);
        } else {
            groups.set(signature, [path]);
        }
    }

    // Step 2: keep only groups that really repeat, and remember which group
    // owns each member path. We look ancestors up in this map in step 3.
    const repeated = [...groups].filter(
        ([, members]) => members.length >= minimum,
    );
    const ownerOf = new Map<string, string>();

    for (const [signature, members] of repeated) {
        for (const path of members) {
            ownerOf.set(path, signature);
        }
    }

    // Step 3: drop members that sit inside a member of another repeated
    // group, then drop groups that no longer repeat. Ancestors are checked
    // against the original `ownerOf` map, so a chain like
    // list > card > heading is handled: the heading is inside a card, and
    // the card is inside a list, so both are covered.
    const result: RepeatedGroup[] = [];

    for (const [signature, members] of repeated) {
        const standalone = members.filter(
            (path) =>
                !ancestorPaths(path).some((ancestor) => {
                    const owner = ownerOf.get(ancestor);

                    return owner !== undefined && owner !== signature;
                }),
        );

        if (standalone.length >= minimum) {
            result.push({ signature, paths: standalone });
        }
    }

    return result;
}
