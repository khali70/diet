# Diet Tracker

Offline-first PWA to follow a fixed Arabic diet plan, log what was actually eaten, and swap foods using a coach-supplied exchange table. Single user, no backend, no account. All data lives in the browser (IndexedDB).

Source of truth for the diet itself: `docs/domain.md`. Source PDFs and their raw text dumps: `docs/source-pdfs/`.

## Hard constraints

1. **Static hosting on GitHub Pages.** No server, no API, no environment secrets at runtime. Everything the app needs ships in the bundle or lives in IndexedDB.
2. **Clean Architecture with a strict dependency rule.** Inner layers never import outer layers.
3. **SOLID.** Concrete rules per layer below.
4. **Tested.** Domain and application layers are unit tested to a high bar. No feature is done without tests.
5. **Arabic first.** All food names are Arabic. UI is RTL.
6. **No invented nutrition data.** The PDFs contain portions and one daily macro total, nothing per item. Never fabricate per-food calories. See `docs/domain.md`.

## Stack

- Vite + React + TypeScript (strict).
- Dexie for IndexedDB.
- `vite-plugin-pwa` for the service worker and manifest.
- Tailwind for styling.
- Vitest + Testing Library for unit and component tests. Playwright for end to end.
- `pnpm` (or `npm` if pnpm is unavailable; pick one and stay with it).

## Layers

```
src/
  domain/          entities, value objects, domain services, ports (interfaces)
  application/     use cases, orchestration, DTOs
  infrastructure/  Dexie repositories, seed loading, export/import, clock
  presentation/    React components, hooks, routes, view models
  main.tsx         composition root: the only place that wires concretes into ports
```

**Dependency rule:** `presentation -> application -> domain` and `infrastructure -> domain`. `domain` imports nothing from the other three. `application` imports nothing from `infrastructure` or `presentation`. Violations are build failures, enforced by an ESLint boundary rule.

**Practical consequences:**

- `domain/` and `application/` contain zero React, zero Dexie, zero `window`, zero `Date.now()`. Time arrives through a `Clock` port.
- Every repository is defined as an interface in `domain/ports/` and implemented in `infrastructure/`.
- Use cases are classes or factory functions that take their ports via constructor or closure. No module-level singletons reaching for a database.
- React components render state and dispatch intents. They do not compute grams, ratios, or remaining portions. That math lives in the domain.

## SOLID, applied here

- **S**: one use case per file, one reason to change. `LogMealEntry`, `SwapPlanItem`, `GetDayProgress` are separate.
- **O**: adding a new food category or a new exchange table must not require editing existing category logic. Categories are data, not switch statements.
- **L**: any `FoodRepository` implementation (Dexie, in-memory fake) is substitutable in every test and at runtime.
- **I**: narrow ports. A use case that only reads gets a read-only port, not a fat repository with write methods.
- **D**: use cases depend on abstractions in `domain/ports/`. Only `main.tsx` knows Dexie exists.

## Testing rules

- `domain/` and `application/`: unit tests, fast, no DOM, no IndexedDB. Use in-memory fakes for ports. This is where coverage must be near total.
- `infrastructure/`: integration tests against `fake-indexeddb`, covering schema migrations and export/import round trips.
- `presentation/`: component tests for behavior a user can observe. Not snapshot spam.
- End to end: a few Playwright flows only, run against the production build with the GitHub Pages base path applied.
- The exchange calculator must be tested against the worked example printed in the exchange PDF itself (100 g rice becomes 435 g potato). That test is non-negotiable.
- A bug fix ships with a regression test unless the defect is unreachable from testable code, in which case say so explicitly.

## GitHub Pages

- The app is served from a subpath (`https://<user>.github.io/diet/`). Vite `base` must be set accordingly, and every asset, route, manifest `start_url`, and service worker `scope` must respect it. Hardcoded absolute paths starting with `/` are a defect.
- Routing uses hash routing, or a `404.html` copy of `index.html` for history routing. Pick one, document it, and cover it with an end to end test.
- Deploy runs from GitHub Actions on push to `main`, building and publishing to Pages. Lint, typecheck, and tests gate the deploy.
- No secrets, no runtime env vars. Anything configurable is a build-time constant or a user setting stored locally.

## Data safety

IndexedDB can be cleared by the browser or by the user at any moment. Manual JSON export and import is a first-class feature, not a nice-to-have. Schema changes ship with a Dexie version bump and a migration, and migrations get tests.

## Style

- No em dash characters anywhere in code, comments, docs, or commit messages. Use a comma, colon, parentheses, or a hyphen.
- Commit messages describe the change. No AI attribution, no co-author trailers, no generated-by footers.
