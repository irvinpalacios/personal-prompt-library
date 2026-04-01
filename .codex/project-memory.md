# Project Memory

## Overview

- Project: `personal-prompt-library`
- Type: static frontend app with no build step
- Entry point: [index.html](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\index.html)
- Runtime: browser-only ES modules loaded from [js/main.js](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\js\main.js)
- Styling: single stylesheet at [styles.css](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\styles.css)
- Assets: SVG-only branding and empty-state artwork under [assets](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\assets)

## Product Shape

- Public surface is a searchable prompt catalog.
- Prompts are shown as cards with category, description, snippet, tags, and a copy button.
- Category chips and free-text search filter the visible prompt list.
- Theme toggle switches between dark and light modes.
- There is a hidden admin workspace for managing prompts locally in the browser.

## Data Model

- Seed data lives in [js/data.js](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\js\data.js).
- Seed records contain:
  - `id`
  - `title`
  - `category`
  - `description`
  - `body`
  - `tags`
  - `favorite`
  - `createdAt`
  - `updatedAt`
- Current seed library has 8 prompts across categories like Coding, Writing, Creative, Business, Research, and Marketing.
- `favorite` drives the "Featured" badge in both the public grid and admin list.

## Persistence

- All state is local-only and stored in `localStorage`.
- Storage logic lives in [js/storage.js](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\js\storage.js).
- Keys:
  - `prompt-library.prompts.v1`
  - `prompt-library.theme`
  - `prompt-library.admin-session`
- The app seeds local storage from `seedPrompts` when storage is missing or version-mismatched.
- There is no backend, sync layer, auth service, or file/database persistence.

## Main Modules

- [js/main.js](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\js\main.js)
  - Owns app state, bootstrapping, rendering, and event wiring.
  - Handles search, category selection, copy actions, theme toggling, admin login/logout, CRUD flow, and palette actions.
- [js/ui.js](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\js\ui.js)
  - Centralizes DOM element lookup and all rendering helpers.
  - Uses `innerHTML` rendering with `escapeHtml` for user-controlled text.
- [js/filters.js](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\js\filters.js)
  - Builds category counts and runs case-insensitive text/category filtering.
- [js/admin.js](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\js\admin.js)
  - Verifies the admin password.
  - Creates sanitized prompt records and validates required fields.
- [js/palette.js](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\js\palette.js)
  - Defines palette commands.
  - Currently only supports `new-prompt`.

## Admin Mode

- Hidden shortcut to open admin login: `Ctrl/Cmd + Shift + A`.
- Hidden shortcut to open command palette while admin is active: `Ctrl/Cmd + K`.
- Admin UI includes:
  - add/edit prompt form
  - delete flow with `window.confirm`
  - browser-local session persistence
  - admin-side record list sorted by `updatedAt` descending
- Important: admin protection is only a client-side gate.

## Security / Behavior Notes

- Admin password is hardcoded in client JS as `teal-library` in [js/data.js](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\js\data.js).
- Because the password ships to the browser, this is obfuscation rather than real security.
- All edits are per-browser because data lives in local storage only.
- Copy uses `navigator.clipboard.writeText` with a textarea fallback.
- Duplicate prevention is based on generated `id`, which is derived from the title.
- Editing preserves an existing record `id`; new record ids are slugified from the title and truncated to 60 chars.

## UI / Design Direction

- Fonts: Instrument Sans + Instrument Serif from Google Fonts.
- Visual style: glassmorphism-like panels, teal accent, ambient blurred backgrounds, rounded surfaces.
- Layout:
  - hero section with metrics
  - search bar
  - category chip row
  - 3-column card grid on desktop
  - admin workspace below the public catalog
- Responsive breakpoints at `1040px` and `760px`.

## Operational Notes

- No package manifest or bundler config was present when this memory was written.
- Local serving is expected via simple static hosting.
- [\.codex/environments/environment.toml](C:\Users\ipalacio\Documents\GitHub\personal-prompt-library\.codex\environments\environment.toml) includes a `python -m http.server 4173` run action.
- That run action points to `C:\Users\ipalacio\Documents\Projects\Codex Projects\personalPromptLibrary`, which does not match this repository path and may be stale.

## Likely Improvement Areas

- Replace client-side password gating if admin access needs to be meaningful.
- Add import/export or real persistence if prompts should survive across browsers or machines.
- Add tests around filtering, record creation, and storage migration behavior.
- Consider a README documenting shortcuts, storage model, and how to serve the app locally.
