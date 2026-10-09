export type CompoundSelector = {
    tag: string | null;
    id: string | null;
    classes: string[];
};

export type Combinator = "descendant" | "child";

export type SelectorStep = {
    combinator: Combinator | null;
    compound: CompoundSelector;
};

export type Specificity = [ids: number, classes: number, tags: number];

export type ParsedSelector = {
    steps: SelectorStep[];
    specificity: Specificity;
};

export type ParseSelectorResult =
    | { supported: true; selector: ParsedSelector }
    | { supported: false; reason: string };

const COMPOUND =
    /^(?<tag>[a-zA-Z][a-zA-Z0-9-]*)?(?<rest>(?:[.#][a-zA-Z_][\w-]*)*)$/;

const SUFFIX = /[.#][a-zA-Z_][\w-]*/g;

function parseCompound(token: string): CompoundSelector | null {
    const groups = COMPOUND.exec(token)?.groups;

    if (!groups) {
        return null;
    }

    const tag = groups["tag"] ?? "";
    const rest = groups["rest"] ?? "";

    if (tag === "" && rest === "") {
        return null;
    }

    let id: string | null = null;
    const classes: string[] = [];

    for (const part of rest.match(SUFFIX) ?? []) {
        const name = part.slice(1);

        if (part.startsWith("#")) {
            if (id !== null) {
                return null;
            }
            id = name;
        } else {
            classes.push(name);
        }
    }

    return { tag: tag === "" ? null : tag.toLowerCase(), id, classes };
}

export function parseSelector(selector: string): ParseSelectorResult {
    const tokens = selector
        .trim()
        .replace(/\s*>\s*/g, " > ")
        .split(/\s+/)
        .filter((token) => token !== "");

    if (tokens.length === 0) {
        return { supported: false, reason: "Empty selector" };
    }

    const steps: SelectorStep[] = [];
    let pending: Combinator | null = null;

    for (const token of tokens) {
        if (token === ">") {
            if (steps.length === 0 || pending !== null) {
                return {
                    supported: false,
                    reason: `Malformed selector: "${selector}"`,
                };
            }
            pending = "child";
            continue;
        }

        const compound = parseCompound(token);

        if (!compound) {
            return {
                supported: false,
                reason: `Unsupported selector syntax: "${token}"`,
            };
        }

        steps.push({
            combinator: steps.length === 0 ? null : (pending ?? "descendant"),
            compound,
        });
        pending = null;
    }

    if (pending !== null) {
        return {
            supported: false,
            reason: `Malformed selector: "${selector}"`,
        };
    }

    return {
        supported: true,
        selector: { steps, specificity: specificityOf(steps) },
    };
}

function specificityOf(steps: SelectorStep[]): Specificity {
    let ids = 0;
    let classes = 0;
    let tags = 0;

    for (const { compound } of steps) {
        if (compound.id !== null) ids += 1;
        classes += compound.classes.length;
        if (compound.tag !== null) tags += 1;
    }

    return [ids, classes, tags];
}
