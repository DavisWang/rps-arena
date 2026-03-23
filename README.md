# RPS Arena

RPS Arena is a client-only React + TypeScript web app for running Rock Paper Scissors bot matchups and single-elimination tournaments.

Live site: [https://daviswang.github.io/rps-arena/](https://daviswang.github.io/rps-arena/)

## Features

- Quick Match mode for direct bot-vs-bot simulations
- Tournament setup, bracket progression, and final results
- Seeded bots included in the app
- Custom bot import from local JSON manifests
- Worker-based bot execution so long simulations do not freeze the UI
- IndexedDB persistence for imported bots, quick matches, and tournament progress

## Local Development

Requirements:

- Node.js
- npm

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173`.

## Verification

Run tests:

```bash
npm test
```

Build production assets:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## GitHub Pages Deployment

This repo deploys to GitHub Pages through GitHub Actions.

- Workflow file: [.github/workflows/deploy-pages.yml](/Users/davis.wang/Documents/rps-arena/.github/workflows/deploy-pages.yml)
- Deploy source: `main`
- Pages URL: [https://daviswang.github.io/rps-arena/](https://daviswang.github.io/rps-arena/)

Each push to `main` runs tests, builds the app, and deploys the `dist/` output to GitHub Pages.

## Bot Import Format

Imported bots are trusted local JavaScript manifests. Example shape:

```json
{
  "id": "my-bot",
  "name": "My Bot",
  "description": "Optional short description",
  "avatar": { "kind": "emoji", "value": "🎯" },
  "source": "export function decide(context) {\n  return 'rock';\n}"
}
```

The bot source must export `decide(context)` and return one of:

- `rock`
- `paper`
- `scissors`
