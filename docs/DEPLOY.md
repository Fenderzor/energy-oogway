# Deploying Energy Oogway

The app is a PWA (Vite + React). Hosting it on a public HTTPS URL makes it
installable on your phone and usable offline, with no dependency on your laptop
or local Wi-Fi.

## Repo layout
- The Vite app lives in **`app/`** (this is the build root).
- `External Material/` (the textbook) is **git-ignored** — it is copyrighted and
  must never be pushed.

## 1. Push to GitHub
A local git repo is already initialized with an initial commit. To publish it:

```bash
# create an empty repo on github.com first (e.g. energy-oogway), then:
git remote add origin https://github.com/<you>/energy-oogway.git
git branch -M main
git push -u origin main
```

## 2. Deploy on Vercel (free)
1. Sign in to https://vercel.com with your GitHub account.
2. **Add New → Project** and import the `energy-oogway` repo.
3. Set these (the only non-defaults):
   - **Root Directory:** `app`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Deploy.** You get an HTTPS URL like `https://energy-oogway.vercel.app`.

`app/vercel.json` already adds the SPA rewrite so deep links (e.g.
`/practice/exam-problem/ex01`) work on refresh.

Every `git push` to `main` triggers an automatic redeploy.

## 3. Install on your phone
Open the URL → **Add to Home Screen** (iPhone: Safari share menu; Android:
Chrome ⋮ menu). It installs as a standalone, offline-capable app.

### What works offline
- All learning content (decks, library, problems, quizzes, exam) — cached on first visit.
- Progress / XP / streak — stored locally on the phone (IndexedDB).
- The most recently downloaded news briefing — cached (refresh needs connectivity).

## 4. Daily news — cloud cron (end state)
**Goal:** generate and publish the daily briefing without the laptop being on.

**Plan:** a scheduled **GitHub Action** that:
1. runs on a cron (e.g. `0 5 * * *` UTC ≈ 07:00 Amsterdam),
2. calls the Anthropic API (Claude with the web-search tool) to build the
   briefing JSON following `agent/news-briefing.md`,
3. writes `app/public/data/news/<DATE>.json`, runs `tools/update_news_index.py`,
4. commits & pushes → Vercel auto-redeploys → the phone gets fresh news when online.

**Needs:** an `ANTHROPIC_API_KEY` stored as a GitHub repo **secret**
(Settings → Secrets and variables → Actions). The workflow + generation script
will be added once the repo is on GitHub (so it can be tested against real runs).

Until then, the local 7 AM scheduled task still works for generating news; the
`↻ Refresh` button in the app re-pulls the latest published briefing.
