export type StyleEntry = {
    property: string;
    value: string;
};

function splitTopLevel(input: string, separator: string): string[] {
    const parts: string[] = [];
    let current = "";
    let quote: string | null = null;
    let depth = 0;

    for (const char of input) {
        if (quote) {
            if (char === quote) {
                quote = null;
            }
        } else if (char === '"' || char === "'") {
            quote = char;
        } else if (char === "(") {
            depth += 1;
        } else if (char === ")" && depth > 0) {
            depth -= 1;
        } else if (char === separator && depth === 0) {
            parts.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    parts.push(current);
    return parts;
}

export function toCamelCaseProperty(property: string): string {
    if (property.startsWith("--")) {
        return property;
    }

    const lower = property.toLowerCase();
    const withoutMsPrefix = lower.startsWith("-ms-") ? lower.slice(1) : lower;

    return withoutMsPrefix.replace(/-([a-z])/g, (_match, letter: string) =>
        letter.toUpperCase(),
    );
}

export function parseStyle(style: string): StyleEntry[] {
    const entries: StyleEntry[] = [];

    for (const declaration of splitTopLevel(style, ";")) {
        const [rawProperty, ...rest] = splitTopLevel(declaration, ":");
        const property = rawProperty?.trim();
        const value = rest.join(":").trim();

        if (!property || !value) {
            continue;
        }

        entries.push({ property: toCamelCaseProperty(property), value });
    }

    return entries;
}
