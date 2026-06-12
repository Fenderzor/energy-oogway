# Energy Oogway 🐢⚡

A personal study PWA: a daily energy-sector **news briefing** plus a
**thermodynamics learning module** (flashcards, problems, quizzes, and a full
exam) built from Cengel *Thermodynamics: An Engineering Approach*, Ch. 1–8.

## Structure
| Path | What it is |
|------|------------|
| `app/` | The Vite + React + TypeScript PWA (build root) |
| `app/public/data/` | Content: news, decks, library, problems, quizzes, exam-style problems |
| `agent/` | The daily news-briefing agent prompt |
| `tools/` | Python helpers (news index, icon generation) |
| `docs/` | Project plan and deployment guide |

## Develop locally
```bash
cd app
npm install
npm run dev -- --host   # then open the printed Network URL on your phone
```

## Deploy
See **[docs/DEPLOY.md](docs/DEPLOY.md)** — hosts on Vercel as an installable,
offline-capable PWA.

> Note: `External Material/` (the textbook) is git-ignored and not part of this repo.
