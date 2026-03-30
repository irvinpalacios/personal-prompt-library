# My Prompt Library

A fully static personal prompt library built for GitHub Pages. The site reads prompt data from a local `prompts.json` file and includes hidden browser-only admin tools for creating, editing, and deleting prompts by writing back to GitHub through the Contents API.

## Features

- Single-page static app with zero build step
- Grid and list layouts for browsing prompts
- Search, tag filters, category filter, and command palette
- Light and dark mode plus three color palettes
- Shareable prompt URLs with `?prompt=<id>`
- Hidden admin mode with local GitHub PAT storage
- CRUD writes to `prompts.json` using the GitHub Contents API

## Files

- `index.html`: app markup
- `styles.css`: visual design, palettes, themes, modal styles, responsive layout
- `app.js`: state, rendering, keyboard shortcuts, admin flow, GitHub API integration
- `prompts.json`: prompt data source

## Local Use

Because the app fetches `prompts.json`, use a simple static server during local development instead of opening the file directly in some browsers.

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages Deployment

1. Create a GitHub repository and add these files at the repo root.
2. Commit and push to your default branch, usually `main`.
3. In GitHub, open `Settings` > `Pages`.
4. Set the source to deploy from your branch root.
5. Save and wait for GitHub Pages to publish the site.

## Admin Unlock

Admin mode is intentionally hidden from the public UI.

1. Hold `Shift`, `A`, and `M` together.
2. Enter the admin password when prompted.
3. On first unlock, fill in the GitHub configuration modal:
   - Personal Access Token
   - repository owner
   - repository name
   - branch
   - prompts file path, usually `prompts.json`

The unlock state is stored in `sessionStorage`, so it resets when the tab closes.

## GitHub PAT Setup

Use a GitHub token that can read and update repository contents for this repo.

- Fine-grained token: grant repository access and enable `Contents: Read and write`
- Classic token: use the minimum `repo` capability required for private repos, or the minimum contents-writing capability appropriate for your setup

The token is stored only in `localStorage` in the current browser. It is never hardcoded into the repository.

## Security Note

The hidden admin password in `app.js` is client-side only. That makes it an obscurity gate, not real security. Anyone inspecting the shipped JavaScript can discover it. The actual write protection comes from the GitHub PAT remaining local to the owner’s browser.

## Prompt Schema

Each prompt entry in `prompts.json` uses this shape:

```json
{
  "id": "unique-id",
  "title": "Prompt title",
  "description": "Short description",
  "body": "Full prompt text",
  "tags": ["project-management", "meetings"],
  "category": "Work",
  "shortcut": "/meetingnotes",
  "dateAdded": "2026-03-30",
  "lastUpdated": "2026-03-30"
}
```
