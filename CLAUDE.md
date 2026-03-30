# CLAUDE.md — Personal Prompt Library

## Project Goal

A fully static, single-page web application hosted on GitHub Pages. It serves as a personal AI prompt management system — allowing the owner to browse, search, and manage a collection of AI prompts. The owner can create, edit, and delete prompts via a hidden admin mode that writes back to GitHub via the GitHub Contents API (using a Personal Access Token stored in `localStorage`).

## Architecture

**Zero-build. No frameworks. No package.json. No Node required.**

Three files + one JSON data source:

| File | Role |
|------|------|
| `index.html` | All markup — sidebar, modals, forms, overlays |
| `app.js` | State management, rendering, event handlers, GitHub API calls |
| `styles.css` | All styling — layout, themes, glassmorphism, animations |
| `prompts.json` | The data source — array of prompt objects |
| `reference/promptOS.html` | Earlier design iteration (reference only, not in use) |

Local dev: `python -m http.server 8000` (must use a local server — fetch won't work on `file://`)

## Prompt Data Schema

```json
{
  "id": "unique-id",
  "title": "Prompt title",
  "description": "Short description",
  "body": "Full prompt text",
  "tags": ["tag1", "tag2"],
  "category": "Work",
  "shortcut": "/shortcut",
  "dateAdded": "YYYY-MM-DD",
  "lastUpdated": "YYYY-MM-DD"
}
```

## Key Features

- **Filtering**: Search (title, description, shortcut, category, tags), category sidebar, tag chips — all compound
- **Command Palette**: Ctrl+K — real-time prompt search, top 6 results, click to open
- **Theming**: Light/dark toggle + 3 color palettes (Indigo, Ember, Teal) via CSS variables on `data-palette`
- **Deep Linking**: `?prompt=<id>` in URL auto-opens that prompt's modal
- **Copy to Clipboard**: On every card and modal, with "Copied!" feedback
- **Toast Notifications**: Auto-dismiss success/error/warning messages

## Admin Mode

- Triggered by holding **Shift+A+M** simultaneously
- Password prompt: `"shift-am-owner"` (client-side obscurity only — real security is the GitHub PAT)
- State stored in `sessionStorage` (clears on tab close)
- When unlocked: admin badge shows, "New Prompt" + "GitHub Config" buttons appear, edit/delete icons on cards/modals

## GitHub Integration (CRUD)

All writes use the GitHub Contents API:
- `GET /repos/{owner}/{repo}/contents/{path}` — fetch prompts on load
- `PUT /repos/{owner}/{repo}/contents/{path}` — create/update/delete (requires current file SHA)
- Auth: Bearer token (PAT) stored in `localStorage` via GitHub Config modal
- Content is base64-encoded before sending

## State Object (app.js)

```js
state = {
  prompts,           // Array of prompt objects
  search,            // Current search string
  selectedCategory,  // Active category filter
  selectedTag,       // Active tag filter
  selectedPromptId,  // Currently open prompt
  adminUnlocked,     // Boolean (sessionStorage)
  githubConfig,      // { token, owner, repo, branch, filePath } (localStorage)
  theme,             // 'light' | 'dark' (localStorage)
  palette,           // 'indigo' | 'ember' | 'teal' (localStorage)
  commandResults,    // Results for command palette
  keySequence        // For detecting Shift+A+M
}
```

## Deployment

GitHub Pages — push files to repo root on `main`, enable Pages in repo settings. `.nojekyll` file prevents Jekyll processing.

## Security Notes

- GitHub PAT is never committed — lives only in browser `localStorage`
- Admin password is client-side only (anyone can read the JS) — real protection is the PAT needing write permissions
- Static site = no server attack surface; HTTPS via GitHub Pages
