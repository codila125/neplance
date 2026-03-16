# Frontend Architecture

## Folder map

- `src/app`

  - Next.js App Router entrypoints only.
  - Keep pages and layouts server-first.
  - Route files should stay thin and delegate UI to `features`.

- `src/features`

  - Product-facing UI grouped by feature.
  - Each feature owns its route clients, local hooks, and local view components.
  - Example: `jobs`, `profile`, `proposals`, `marketing`.

- `src/lib`

  - Framework and data plumbing.
  - `api/server.js` is for server-side requests.
  - `server/*` contains server-side data helpers for pages and layouts.
  - `actions/*` contains server actions for mutations.
  - `api/*` should stay low-level and server-facing.

- `src/shared`

  - Cross-feature building blocks.
  - `components` for reusable UI used across multiple features.
  - `constants` for app-wide enums and static lists.
  - `utils` for pure formatting and helper functions.
  - `validation.js` for shared schema validation.

- `src/styles`
  - Global CSS layers and design tokens.

## Conventions

- Default to server pages in `app`.
- Add `"use client"` only to interactive feature components.
- Pages call helpers from `lib/server`.
- Mutations should go through `lib/actions` first.
- Client components should mostly manage UI state, not own data fetching or auth logic.
- Shared code belongs in `shared` only if it is used across multiple features.
- If code belongs to one product area, keep it inside that feature.
