# HTML → Next.js Component Creator

> AI-powered developer platform that transforms HTML/CSS into clean, reusable, production-oriented Next.js components.

The product is built as a **pipeline, not a prompt wrapper**. Deterministic code parses and analyzes the source, AI handles only semantic decisions, and every result is validated and repaired before it is returned.

```text
HTML/CSS → Clean → Parse → Analyze → IR → Component Detection
        → AI (semantic only) → TSX Generation → Validate → Repair → Output
```

> **Full product specification:** the original spec (vision, API design, database design, security, SaaS phases) lives in [`docs/product-spec.md`](docs/product-spec.md). This README documents the **current state of the codebase**.

---

## Table of Contents

1. [Project Status](#1-project-status)
2. [Tech Stack](#2-tech-stack)
3. [Getting Started](#3-getting-started)
4. [Scripts](#4-scripts)
5. [Monorepo Structure](#5-monorepo-structure)
6. [Package Reference](#6-package-reference)
7. [Conversion Pipeline](#7-conversion-pipeline)
8. [API](#8-api)
9. [Conventions](#9-conventions)
10. [Testing](#10-testing)
11. [Known Issues and Decisions](#11-known-issues-and-decisions)
12. [Roadmap](#12-roadmap)

---

## 1. Project Status

**Current phase:** Phase 1A, the deterministic core (no AI yet).

| Milestone | Scope                                                                        | Status                            |
| --------- | ---------------------------------------------------------------------------- | --------------------------------- |
| 0         | Repository foundation (monorepo, tooling, package skeletons, `.env.example`) | Done                              |
| 1         | HTML cleaner and parser                                                      | Done                              |
| 2         | CSS engine                                                                   | Done                              |
| 3         | Component detector                                                           | Done (golden fixture in progress) |
| 4         | AI provider (Gemini)                                                         | Planned                           |
| 5         | TSX generator                                                                | Planned                           |
| 6         | Validation engine                                                            | Planned                           |
| 7         | Repair engine                                                                | Planned                           |
| 8         | Phase 1 REST API                                                             | Planned                           |
| 9+        | Auth, workspace, versioning, AI chat, SaaS                                   | Planned                           |

### Milestone 1: HTML cleaner and parser (done)

- [x] Input validation (size limits, empty input, null bytes)
- [x] HTML parsing into our own typed tree (fragment and full-document modes)
- [x] Tree traversal helper (`walk`)
- [x] `<script>` removal with counting
- [x] Attribute normalization (`class` → `className`, `for` → `htmlFor`, and more)
- [x] Inline event handler removal (`onclick`, ...)
- [x] Inline `style` string parser (handles `url(...)` and quoted values)
- [x] `cleanHtml` pipeline combining all of the above, with structured warnings

### Milestone 2: CSS engine (done)

- [x] Parse CSS into rules (selector lists split, `!important`, `@media` context)
- [x] Parse selectors into a structure (tag, class, id, compound, descendant, child)
- [x] Match selectors against HTML nodes (right-to-left, with backtracking)
- [x] Map rules to nodes; report unused and unsupported CSS (`analyzeCss`)
- [x] Wrap CSS syntax errors in `AppError`

### Milestone 3: DOM analyzer and component detection (done)

- [x] DOM statistics (`analyzeDom`): element counts, depth, tag and class frequency, feature counts
- [x] Subtree signatures (`computeSignatures`): a fingerprint of each element's shape, ignoring text
- [x] Repeated structure detection (`findRepeatedStructures`), with nested repeats removed
- [x] Semantic section detection (`detectSections`): roles such as navbar, hero, footer
- [x] Candidate scoring and naming (`buildCandidates`): ranked, unique PascalCase names
- [x] Component tree (`buildComponentTree`) and the one-call `detectComponents`
- [x] HTML nesting depth limit, enforced while parsing (hardening)
- [ ] Golden fixture running the whole Phase 1A pipeline on a realistic page

---

## 2. Tech Stack

| Area               | Choice                                         | Version in use        |
| ------------------ | ---------------------------------------------- | --------------------- |
| Runtime            | Node.js                                        | 22.x                  |
| Package manager    | pnpm (workspaces)                              | 12.9.1                |
| Task runner        | Turborepo                                      | 2.11.7                |
| Language           | TypeScript (strict)                            | 6.0.3                 |
| Tests              | Vitest                                         | 5.0.3                 |
| Lint / format      | ESLint + typescript-eslint, Prettier           | ESLint 10.12.0        |
| HTML parser        | parse5                                         | 8.0.1                 |
| CSS parser         | postcss                                        | 8.5.29                |
| Schemas            | Zod                                            | latest at install     |
| API                | Express (+ helmet, cors)                       | 5.2.1                 |
| AI (planned)       | Google Gemini behind an `AIProvider` interface | Model TBD (free tier) |
| Database (Phase 2) | MongoDB Atlas + Mongoose                       | Not yet used          |

---

## 3. Getting Started

### Prerequisites

- Node.js 22 or newer
- pnpm 12 (`npm install -g pnpm`)
- Git

### Install and verify

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

All four commands should finish with no errors.

### Environment

```bash
cp .env.example .env      # PowerShell: Copy-Item .env.example .env
```

Fill in the values you need. `.env` is git-ignored. Only `.env.example` is committed. No variable is required to run the tests.

### Run the API

```bash
pnpm --filter @html-to-next/api dev
```

Then open `http://localhost:8000/api/v1/health`. Expected response:

```json
{ "status": "ok" }
```

---

## 4. Scripts

Run from the repository root.

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `pnpm build`        | Builds every package in dependency order (Turbo) |
| `pnpm test`         | Runs all tests (builds dependencies first)       |
| `pnpm lint`         | Runs ESLint in every package                     |
| `pnpm typecheck`    | Type-checks every package without emitting       |
| `pnpm format`       | Rewrites files to match Prettier                 |
| `pnpm format:check` | Reports formatting differences (for CI)          |
| `pnpm dev`          | Runs dev tasks (currently the API)               |

Target one package with `--filter`:

```bash
pnpm --filter @html-to-next/parsers test
```

---

## 5. Monorepo Structure

```text
html-to-next/
├── apps/
│   └── api/                     Express API (health endpoint only so far)
├── packages/
│   ├── shared/                  AppError and shared utilities
│   ├── schemas/                 Zod schemas (conversion options)
│   ├── parsers/                 HTML and CSS parsing wrappers
│   ├── conversion-engine/       Cleaning pipeline (more stages to come)
│   ├── validators/              Skeleton (Milestone 6)
│   └── ai-core/                 Skeleton (Milestone 4)
├── docs/
│   └── product-spec.md          Original full product specification
├── .editorconfig
├── .env.example
├── .prettierrc.json
├── eslint.config.js
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── turbo.json
└── package.json
```

### Dependency graph

```text
shared ──┬─→ schemas ────┐
         ├─→ parsers ────┼─→ conversion-engine ─→ api
         ├─→ validators  │
         └─→ ai-core ←───┘ (also uses schemas)
```

Turbo builds in this order automatically because each package declares its workspace dependencies.

---

## 6. Package Reference

### `@html-to-next/shared`

| Export      | Description                                                                      |
| ----------- | -------------------------------------------------------------------------------- |
| `AppError`  | Error with a machine-readable `code` and optional `details`                      |
| `ErrorCode` | `"VALIDATION_ERROR" \| "PARSE_ERROR" \| "AI_PROVIDER_ERROR" \| "INTERNAL_ERROR"` |

### `@html-to-next/schemas`

| Export                    | Description                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `conversionOptionsSchema` | Zod schema for `ConversionOptions`, with defaults. Phase 1 accepts only Next.js, TypeScript, Tailwind |
| `ConversionOptions`       | Type inferred from the schema                                                                         |

### `@html-to-next/parsers`

The only package that knows about `parse5` and `postcss`. Everything else uses our own types.

| Export                      | Description                                                                                                                                                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parseHtml(html)`           | Parses HTML into `ParsedHtml` (`mode` plus a tree of `HtmlNode`). Starts with `<!doctype` or `<html` means document mode, otherwise fragment mode                                                                                                                                   |
| `walk(nodes, visitor)`      | Depth-first, parent-first traversal. The visitor receives the node, its parent, and its depth                                                                                                                                                                                       |
| `parseCss(css)`             | Parses CSS into a flat list of `CssRule` (one per selector, with declarations and the at-rule chain)                                                                                                                                                                                |
| `parseSelector(selector)`   | Parses a selector into steps (compound plus combinator) with specificity. Returns `{ supported: false, reason }` for syntax we don't support yet                                                                                                                                    |
| `DEFAULT_MAX_NESTING_DEPTH` | 256. `parseHtml` throws `AppError("VALIDATION_ERROR")` beyond it                                                                                                                                                                                                                    |
| Types                       | `HtmlNode`, `HtmlElementNode`, `HtmlTextNode`, `HtmlCommentNode`, `HtmlAttribute`, `ParsedHtml`, `ParseHtmlOptions`, `CssRule`, `CssDeclaration`, `ParsedCss`, `ParsedSelector`, `SelectorStep`, `CompoundSelector`, `ParseSelectorResult`, `Specificity`, `Visitor`, `WalkContext` |

### `@html-to-next/conversion-engine`

| Export                                       | Description                                                                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `cleanHtml(html, css?, limits?)`             | Full cleaning pipeline. Returns `{ mode, nodes, css, warnings }`                                          |
| `validateInput` / `DEFAULT_INPUT_LIMITS`     | Size, emptiness, and null-byte checks. Throws `AppError("VALIDATION_ERROR")`                              |
| `removeScripts(nodes)`                       | Returns a new tree without `<script>` and the removed count                                               |
| `normalizeAttributes(nodes)`                 | Renames attributes to JSX names, removes `on*` handlers, and counts both                                  |
| `parseStyle(style)`                          | Converts an inline style string into `{ property, value }[]` with camelCased names                        |
| `toCamelCaseProperty(name)`                  | `margin-top` → `marginTop`, `-ms-transform` → `msTransform`, CSS variables unchanged                      |
| `matchesSelector(selector, node, ancestors)` | Tests one parsed selector against one element. `ancestors` is root first, direct parent last              |
| `analyzeCss(nodes, css)`                     | Maps CSS rules to element paths. Reports unused and unsupported rules. Throws `PARSE_ERROR` on broken CSS |
| `analyzeDom(nodes)`                          | Statistics: element and text counts, depth, tag and class frequency, feature counts                       |
| `computeSignatures(nodes)`                   | Path → structure fingerprint, such as `div.card(h3(#),p(#))`                                              |
| `findRepeatedStructures(signatures)`         | Groups of elements sharing a structure, with nested repeats removed                                       |
| `detectSections(nodes)`                      | Elements with a recognized role (navbar, hero, footer, ...) and the reason for it                         |
| `buildCandidates(nodes, repeated, sections)` | Ranked component candidates with unique PascalCase names and scoring reasons                              |
| `buildComponentTree(candidates)`             | Nests candidates into a tree under a root `Page` node                                                     |
| `detectComponents(nodes)`                    | Runs all the analyzers above and returns every result, including the tree                                 |

**Element paths.** Analyzer results refer to elements by path: the child index at each level joined by dots (`"0.1.2"`). Text and comment nodes use up an index but never get a path. Every analyzer uses the same scheme, so results can be combined.

### `@html-to-next/api`

Express app built by `createApp()` (testable without a network port) and started by `server.ts`.

### `validators`, `ai-core`

Skeletons only. Real code arrives in Milestones 6 and 4.

---

## 7. Conversion Pipeline

### Implemented: `cleanHtml`

```text
validateInput → parseHtml → removeScripts → normalizeAttributes → warnings
```

```ts
import { cleanHtml } from "@html-to-next/conversion-engine";

const result = cleanHtml(
    '<div class="a" onclick="x()"><script>y()</script><p>Hi</p></div>',
);

result.mode; // "fragment"
result.warnings; // SCRIPTS_REMOVED, EVENT_HANDLERS_REMOVED
// result.nodes[0] has attribute { name: "className", value: "a" }
```

Warning codes currently produced: `SCRIPTS_REMOVED`, `EVENT_HANDLERS_REMOVED`.

### Implemented: analysis

```text
cleaned tree ──→ analyzeCss          (which CSS rules apply to which elements)
             ──→ detectComponents    (stats → signatures → repeats + sections
                                      → candidates → component tree)
```

```ts
import { cleanHtml, detectComponents } from "@html-to-next/conversion-engine";

const cleaned = cleanHtml(html, css);
const detection = detectComponents(cleaned.nodes);

detection.tree.nodes.map((node) => node.name);
// ["Page", "Navbar", "Hero", "Features", "FeatureCard", "Footer"]
```

### Design decisions

- **Every transformation is immutable.** Functions return new trees and never edit their input. Tests enforce this.
- **Inline `style` stays a raw string in the tree.** The JSX generator (Milestone 5) will call `parseStyle` when it prints the attribute, so the tree has one representation.
- **Limits are parameters.** The engine never reads `process.env`. The API layer will read configuration and pass it in.
- **Sizes are counted in characters**, not bytes, to keep the engine free of Node types.

### Planned stages

CSS matching → DOM analysis → intermediate representation → component detection → AI semantic transformation → TSX generation → validation → repair loop.

---

## 8. API

Base URL: `/api/v1`

| Method | Path                        | Status                |
| ------ | --------------------------- | --------------------- |
| GET    | `/health`                   | Implemented           |
| POST   | `/conversions`              | Planned (Milestone 8) |
| GET    | `/conversions/:id`          | Planned               |
| POST   | `/conversions/:id/validate` | Planned               |
| POST   | `/conversions/:id/repair`   | Planned               |

Helmet, CORS, rate limiting, structured logging (pino), and the error middleware are installed or planned but not yet configured.

---

## 9. Conventions

- **Formatting:** 4 spaces, double quotes, trailing commas, 80 columns. Enforced by Prettier. `.editorconfig` keeps editors consistent.
- **Line endings:** LF, enforced by `.gitattributes`.
- **Imports:** the project uses `module: NodeNext`, so relative imports need the **`.js` extension** even in `.ts` files (`import { x } from "./utils.js"`).
- **Package layout:** every package has `src/`, `tests/`, `package.json`, `tsconfig.json`. Each exposes a single entry point through `exports`.
- **Public APIs:** exported functions that return library types declare an explicit return type (avoids TS2883 under pnpm).
- **Commits:** Conventional Commits (`feat(parsers): ...`, `test(...)`, `chore: ...`).
- **Errors:** expected failures throw `AppError` with a code. Anything else is a bug.
- **Files on Windows:** create files in VS Code, not with `Set-Content -Encoding utf8` in PowerShell 5.1, which adds a BOM.

---

## 10. Testing

Vitest, run per package through Turbo. Tests live in each package's `tests/` folder and import from `src/`.

| Package                 | Tests          |
| ----------------------- | -------------- |
| `shared`                | 3              |
| `schemas`               | 2              |
| `parsers`               | 31             |
| `conversion-engine`     | 106            |
| `api`                   | 1 (smoke)      |
| `validators`, `ai-core` | 1 each (smoke) |

AI calls will be mocked in CI. AI output will be checked with structural assertions, not string equality.

---

## 11. Known Issues and Decisions

| Topic                               | Detail                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript pinned to 6.x**        | `typescript-eslint` does not support TypeScript 7 yet. Revisit when it does. The TS Compiler API (Milestone 6) is also safer on 6.x                                                                                                                                                                                                   |
| **`allowBuilds` breaks Turbo**      | Adding `allowBuilds:` to `pnpm-workspace.yaml` (the pnpm 12 way to approve `esbuild`) makes Turbo 2.11.7 find zero packages. The block is commented out. A fresh clone may hit `ERR_PNPM_IGNORED_BUILDS` and need `pnpm approve-builds`, which re-adds the block. Resolve before CI (upgrade Turbo or find another approval location) |
| **`@types/node` is v26**            | The runtime is Node 22. Pin with `pnpm add -D @types/node@^22 --filter @html-to-next/api`                                                                                                                                                                                                                                             |
| **Tests are not type-checked**      | Each `tsconfig.json` includes only `src/`. Vitest runs the tests, but `pnpm typecheck` skips them. Add a test tsconfig later                                                                                                                                                                                                          |
| **`<template>` contents skipped**   | `parseHtml` ignores `<template>` children for now                                                                                                                                                                                                                                                                                     |
| **Nesting depth is capped at 256**  | `parseHtml` rejects deeper input while parsing. Without the cap, `parse5` took about 6 seconds on 20,000 nested elements and recursive walkers could overflow the stack                                                                                                                                                               |
| **Package changes need a rebuild**  | Packages import each other's compiled `dist/`. After changing a package's exports, run `pnpm build` (and restart the TS server in VS Code) or dependents report missing exports                                                                                                                                                       |
| **Unsupported CSS selectors**       | Attribute selectors, pseudo-classes (`:hover`), pseudo-elements, sibling combinators, `:not()` and `*` are reported, not matched. `@keyframes` steps appear as unused or unsupported rules                                                                                                                                            |
| **Section hints are a fixed table** | Role hints (hero, pricing, ...) live in `NAME_HINTS` in `sections.ts`. A `<header>` inside an `<article>` is still labeled `header`                                                                                                                                                                                                   |
| **Component names are ASCII-only**  | A class with no ASCII letters falls back to the tag-based name. The AI may rename components later                                                                                                                                                                                                                                    |
| **Props are not detected yet**      | `ComponentNode.props` is always empty until the AI stage                                                                                                                                                                                                                                                                              |
| **Document detection is simple**    | Input starting with a comment before `<html>` is parsed as a fragment                                                                                                                                                                                                                                                                 |
| **Escaped quotes in inline styles** | `parseStyle` does not handle `\"` inside quoted values                                                                                                                                                                                                                                                                                |
| **Not yet handled by the cleaner**  | SVG attribute renames (`stroke-width`), boolean attribute output, `javascript:` URLs                                                                                                                                                                                                                                                  |
| **Gemini model undecided**          | Choose the free-tier model at Milestone 4, since names and limits change often                                                                                                                                                                                                                                                        |

---

## 12. Roadmap

1. **Next:** golden fixture for the whole Phase 1A pipeline, then a standalone intermediate representation (IR) for the AI prompt
2. **Milestone 3 leftovers:** prop detection ideas, `<template>` support, SVG attribute table
3. **Milestone 4:** `AIProvider` interface, `GeminiProvider`, `MockProvider`, versioned prompts, Zod-validated output
4. **Milestone 5:** TSX generator with Tailwind and Next.js transformations
5. **Milestone 6:** validation (TypeScript Compiler API, Next.js rules, accessibility)
6. **Milestone 7:** repair loop with `MAX_REPAIR_ATTEMPTS`
7. **Milestone 8:** Phase 1 REST API, benchmark suite, golden fixtures
8. **Phase 2 and later:** authentication, projects, Monaco workspace, versioning, AI chat, SaaS features

**Principle:** do not build SaaS features before the conversion engine is reliable. The engine is the product.
