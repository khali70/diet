# Diet

Offline first PWA for following a coach written diet plan. Everything lives in the browser: no backend, no account, no network calls after the first load.

- Track what you eat per meal slot and see what is left of the day.
- Swap any planned food for an equivalent portion using the coach's exchange tables.
- Arabic first (RTL) with an English toggle.
- Export and import your log as a JSON file, because IndexedDB is the only copy.

## The tracking model

The source plan gives one whole day total (2705.41 kcal, P 145.05, C 416.34, F 54.69) and nothing per food. So the app tracks **portions, not calories**. No per food nutrition figure is ever invented.

A swap uses the coach's own formula:

```
targetQuantity = plannedQuantity * referenceQuantity(target) / referenceQuantity(source)
```

100 g of rice becomes 435 g of potato. Both sides must be in the same category and the same unit, otherwise the conversion is refused rather than guessed.

## Stack

Vite, React, TypeScript, Dexie (IndexedDB), i18next, Tailwind, vite-plugin-pwa. Tests with Vitest, Testing Library and fake-indexeddb; end to end with Playwright.

## Architecture

Clean Architecture with the dependency rule enforced by ESLint, not by convention:

```
presentation -> application -> domain
infrastructure -> domain
domain -> nothing
```

| Folder | Holds |
| --- | --- |
| `src/domain` | Entities, value objects, the exchange calculator, day progress, ports. No React, no Dexie, no browser APIs. |
| `src/application` | One use case per file, depending only on ports. |
| `src/infrastructure` | Dexie schema, repositories, seed data, clock and id adapters. |
| `src/presentation` | React screens, hooks, i18n, formatting. All rounding lives here. |
| `src/composition` | The only place that knows Dexie exists. Wires everything and mounts the app. |

`eslint-plugin-boundaries` fails the build on a violation, and `no-restricted-imports` blocks React, Dexie and i18next from the inner layers.

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm preview
```

## Deploying to GitHub Pages

Push to `main`. The workflow in `.github/workflows/deploy.yml` runs typecheck, lint and tests, then builds and deploys. A failing gate does not deploy.

**One manual step you have to do yourself:** in the repository, open Settings, Pages, and set **Source** to **GitHub Actions**. This cannot be set from code, and the deploy fails without it.

The build reads `VITE_BASE` for the subpath and the workflow sets it to `/<repository name>/`. If you rename the repository, nothing else needs changing. Locally the default is `/diet/`.

Routing is hash based on purpose. GitHub Pages has no rewrite rules, so a reloaded deep link on a path router would 404. With hashes it cannot.

## Data safety

The log lives only in this browser profile. Clearing site data deletes it. Export from the Settings screen before clearing anything, changing browsers or resetting a device. Import supports merge and replace, and validates the file before touching a single row.

## Source documents

`docs/domain.md` is the transcription of the two PDFs from the coach, kept next to the originals in `docs/source-pdfs/`. Rows whose Arabic came out of the PDF garbled are marked `NEEDS VERIFY` and should be checked against the printed page before being trusted.
