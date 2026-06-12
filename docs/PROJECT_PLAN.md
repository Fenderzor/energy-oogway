# Energy Oogway — Project Plan

> *"Yesterday is history, tomorrow is a mystery, but today is a gift — that is why it is
> called the present."* Your wise turtle mentor for energy news and the science behind it.

> A personal, installable phone app (PWA) that (1) delivers a daily energy-sector
> news briefing and (2) teaches the science of energy — thermodynamics first —
> through flashcards and Duolingo-style lessons built from your own textbook.
>
> **Status:** Draft v1 for your review. No application code will be written until
> you approve this plan.
> **Author:** Claude · **Date:** 2026-06-04

---

## 1. Why we're building this

You're about to start an **MSc in Energy Science at Utrecht University** and want to
(a) stay current with the energy landscape and (b) get ahead on the science before
your **Energy Conversion Technologies** course. You already liked the daily energy
news briefings in Cowork; we're discontinuing those (the old scheduled briefings)
and folding that value into a single app you control on your phone, plus a serious
learning module.

**Primary user:** you. **v1 is single-user and local-first** (your progress stays on your
device, no accounts needed yet). But you may grow it into a **shared tool for classmates**
— accounts, cross-device sync, and shareable flashcard decks. So we architect for that
from day one (see §3.9) while keeping v1 simple and private.

---

## 2. What it does (feature scope)

### 2A. Daily News Briefing ("Today")
A compiled daily digest across six sections:

| Section | Focus |
|---|---|
| 🌍 **Global Developments** | Major energy-sector moves worldwide (supply, demand, prices, big projects) |
| 🗺️ **Geopolitics** | Energy security, sanctions, trade, alliances, conflict-driven energy shifts |
| 🔬 **Innovative Technologies** | Breakthroughs: storage, hydrogen, fusion/fission, solar/wind, grid, efficiency |
| 📋 **Regulations & Policy** | EU and global policy, carbon markets, subsidies, standards |
| 🇫🇮 **Finland** | Country-specific energy news |
| 🇳🇱 **Netherlands** | Country-specific energy news (your study base) |

Each item: headline · 2–3 sentence summary · **"why it matters"** · source name + link ·
tags. A short **TL;DR** at the top. Optional educational bridge: where a story touches a
concept in your course (e.g. "this gas-turbine plant → Brayton cycle, Ch. 9"), link to the
relevant lesson.

### 2B. Learning Module ("Learn")
Built from *Cengel, Boles & Kanoglu — Thermodynamics: An Engineering Approach* (your book).

- **Flashcards with spaced repetition** (Anki-style, SM-2 algorithm). Cards carry
  definitions, concepts, equations, and worked-reasoning prompts.
- **Duolingo-style lessons**: a guided path of short units with multiple question types
  (multiple choice, type-the-answer, cloze/fill-the-blank, numeric with tolerance for
  calculation questions, matching). **XP, daily streak, daily goal.**
- **Chapter summaries & formula sheets** — quick-reference per chapter.
- **Math rendering** for equations (KaTeX), e.g. \(\eta_{th}=1-\frac{Q_{out}}{Q_{in}}\).
- **Progress dashboard**: streak, cards due, mastery per chapter.

**Scope: chapters 1–7** — the thermodynamics foundations — in study order:
1. **Ch 1** Introduction & Basic Concepts → units, properties, pressure, temperature
2. **Ch 2** Energy, Energy Transfer & General Energy Analysis → forms of energy, heat, work
3. **Ch 3** Properties of Pure Substances → phases, property tables, ideal-gas behaviour
4. **Ch 4** Energy Analysis of Closed Systems → boundary work, first law (closed systems)
5. **Ch 5** Mass & Energy Analysis of Control Volumes → flow work, steady-flow devices
6. **Ch 6** The Second Law of Thermodynamics → heat engines, Carnot, efficiency
7. **Ch 7** Entropy → entropy balance, isentropic processes

> Chapters 8–11 (exergy; gas, vapor/combined and refrigeration cycles) are the natural
> next step for Energy Conversion Technologies and can be added later as a stretch goal.

---

## 3. Architecture

### 3.1 Tech approach — **Node + Vite + React + TypeScript** (decided)

Because you may grow this into a shared, multi-user app (classmates, accounts, cloud sync,
shareable decks), we build on the standard scalable web foundation from day one:

- **Vite** — dev server + bundler (fast, modern, minimal config)
- **React + TypeScript** — component UI that stays organised as features grow, with
  type-checked data models (cards, SRS state, news, decks)
- **vite-plugin-pwa (Workbox)** — auto-generated, auto-versioned service worker, so offline
  caching and update handling "just work" (no manual cache versioning)
- **IndexedDB** (via `idb`/Dexie) — local-first storage for progress, decks, cached news

One-time cost: I install Node.js during Phase 0. From then on there's a `node_modules`
folder and a build step — clearly worth it for a project meant to scale. The **data layer
stays framework-free and portable** (plain schemas + the SM-2 algorithm in standalone
modules) so it survives any future UI change or move to React Native.

### 3.2 Stack
- **Framework:** React + TypeScript, built with **Vite**.
- **Routing:** a small client router for the Today / Learn / Library / Settings views.
- **Styling:** mobile-first CSS, dark mode (Tailwind vs. CSS modules decided at Phase 0).
- **Storage (local-first):** **IndexedDB** behind a **repository layer** (see §3.9), so a
  cloud backend can be added later without touching feature code.
- **Math:** **KaTeX** for equation rendering.
- **Offline/PWA:** **vite-plugin-pwa** generates the service worker + precache manifest;
  `manifest.webmanifest` + icons make it installable ("Add to Home Screen").
- **Backend:** none in v1 (local-first). Planned later: **Supabase** (Postgres + Auth +
  row-level security + realtime) for accounts, cross-device sync, and shared decks —
  chosen because it delivers multi-user features with minimal backend code. See §3.9 & Phase 6.

### 3.3 The News Agent (the "agentic" part)
A **scheduled daily task** (recreated through Cowork's scheduler) that:
1. Uses web search to gather news across the six sections (last ~24–48 h).
2. Curates and synthesizes into the briefing **JSON schema** (one item set per section).
3. Writes `app/data/news/YYYY-MM-DD.json` and updates `app/data/news/index.json`.
4. If the app is hosted from a Git repo, commits & pushes so the deployed PWA updates;
   the app fetches the newest file and caches it.

The agent's instructions live in `agent/news-briefing.md` so they're versioned and editable.

### 3.4 The Deck Builder (book → learning content)
A repeatable process (run by me now, and re-runnable as a task later):
1. `tools/extract_chapter.py` pulls a chapter's text from the PDF (Python + pypdf, already
   working).
2. From that text, generate a deck JSON (cards) + a chapter summary + a quiz, written to
   `app/data/decks/`. Instructions live in `agent/deck-builder.md`.

### 3.5 Directory layout
```
Energy Report News Agent/
├─ External Material/                 # your textbook (source, read-only)
├─ docs/
│  └─ PROJECT_PLAN.md                 # this document
├─ app/                               # the PWA — deployable as static files
│  ├─ index.html
│  ├─ manifest.webmanifest
│  ├─ service-worker.js
│  ├─ assets/icons/…
│  ├─ css/styles.css
│  ├─ js/
│  │  ├─ main.js                      # bootstrap + router
│  │  ├─ views/ today.js · learn.js · study.js · library.js · settings.js
│  │  ├─ lib/  srs.js · storage.js · router.js · math.js · news.js
│  │  └─ vendor/ katex/ · idb-keyval
│  └─ data/
│     ├─ news/ index.json · YYYY-MM-DD.json
│     └─ decks/ ch01.json · ch02.json · …
├─ agent/
│  ├─ news-briefing.md                # daily news-compiler prompt (scheduled task)
│  └─ deck-builder.md                 # book→deck generation prompt
├─ scripts/
│  └─ serve.py                        # local dev server (python http.server wrapper)
└─ tools/
   └─ extract_chapter.py              # extract chapter text from the PDF
```

### 3.6 Data schemas (sketch)
**News briefing** (`app/data/news/2026-06-04.json`):
```json
{
  "date": "2026-06-04",
  "generatedAt": "2026-06-04T06:00:00+02:00",
  "tldr": "One-paragraph overview of the day.",
  "sections": [
    { "id": "global", "title": "Global Developments",
      "items": [
        { "headline": "…", "summary": "…", "whyItMatters": "…",
          "sourceName": "…", "sourceUrl": "https://…",
          "tags": ["storage"], "conceptLink": "ch09" }
      ] }
  ]
}
```
**Deck** (`app/data/decks/ch01.json`):
```json
{
  "deckId": "ch01", "title": "Ch 1 — Introduction & Basic Concepts",
  "source": "Cengel et al., Ch. 1",
  "cards": [
    { "id": "ch01-001", "type": "basic", "front": "Define a thermodynamic system.",
      "back": "A quantity of matter or a region in space chosen for study.",
      "hint": "vs. surroundings/boundary", "tags": ["systems"], "level": "intro" }
  ]
}
```
**SRS progress** (in IndexedDB, per card): `{ cardId, ease, intervalDays, dueDate, reps, lapses, lastReviewed }` updated by the SM-2 algorithm on each review.

### 3.7 Hosting & install
- **Dev:** `npm run dev` (Vite) on your laptop; open it on your phone over home Wi-Fi (LAN)
  to test as you go.
- **Deploy (recommended):** a **private GitHub repo** + free deploy on **Vercel or Netlify**
  (auto-deploys on push). Install the PWA from that HTTPS URL → "Add to Home Screen". The
  daily news agent pushes JSON → the site auto-updates.
- **Backend (when we add multi-user):** **Supabase** free tier for auth, database, and
  sync — see §3.9 and Phase 6.

### 3.8 Notifications (later phase)
"New briefing ready" + study reminders via Web Push. Note: iOS supports push only for
**installed** PWAs (iOS 16.4+); Android is fully supported. We can also lean on the
scheduled task to notify. Treated as a Phase-5 nice-to-have.

### 3.9 Designing for scale (local-first now, sync-ready)
To support the "share with classmates" goal *without over-building v1*, we bake in cheap
seams now and add the backend later:
- **Repository layer.** Feature code talks to `ProgressRepo`, `DeckRepo`, `NewsRepo`
  interfaces. v1 implements them on IndexedDB; later a Supabase-backed implementation syncs
  the same data — **no feature rewrites**.
- **Sync-friendly IDs & metadata.** Everything gets a **UUID**, an **`updatedAt`** timestamp,
  and a **`userId`** field from the start — `"local"` for the single anonymous user now, a
  real account id later. This makes eventual sync and conflict handling straightforward.
- **Decks as portable, forkable data.** A deck carries `deckId`, `owner`, `version`, and (when
  forked) a `forkedFrom` reference. Forking = copy with a new owner + parent link. Works
  locally now; becomes "share a deck with a classmate" once the backend exists.
- **Auth abstraction.** A single `currentUser` concept (anonymous-local now) so adding real
  sign-in later is a swap, not a refactor.

---

## 4. Phased roadmap

Each phase ends with something you can actually see/use. We do **one phase at a time**;
I'll check in before moving on.

**Phase 0 — Scaffold & foundations**
- Create directory structure, app shell (tab nav: Today · Learn · Library · Settings),
  manifest, service worker, theming, sample news + sample deck so the app runs end-to-end.
- *Deliverable:* an installable, navigable empty-but-real app served locally.

**Phase 1 — News Briefing module**
- "Today" screen renders a briefing from JSON: TL;DR, six sections, article cards, source
  links, offline caching. Build the **news agent** prompt and do one real daily compile.
- *Deliverable:* working daily briefing in the app, with a repeatable agent to refresh it.

**Phase 2 — Flashcards + spaced repetition**
- Deck list, study session UI, SM-2 scheduling, IndexedDB progress, KaTeX math.
- Seed decks: **Ch 1 + Ch 2** generated from the book.
- *Deliverable:* you can study real thermo flashcards and they schedule themselves.

**Phase 3 — Duolingo-style lessons & gamification**
- Lesson path, XP, streaks, daily goal, multiple question types, per-chapter quizzes.
- *Deliverable:* a gamified learning path on top of the card content.

**Phase 4 — Content expansion**
- Generate decks/lessons/summaries for **Ch 3–7**, plus a per-chapter formula sheet.
- *Deliverable:* full coverage of the chapters 1–7 foundations.

**Phase 5 — Deploy & polish**
- Hosting (GitHub + Vercel/Netlify), real app icons, notifications, progress export/backup,
  accessibility & dark-mode polish.
- *Deliverable:* the app live on your phone's home screen, updating daily.

**Phase 6 — Accounts, sync & shared decks (the "scale up" step)**
- Add **Supabase**: sign-in, cloud sync of progress across devices, and shared/forkable
  decks so classmates can use it. Swap the local repositories for synced ones — the seams
  from §3.9 make this **additive, not a rewrite**.
- *Deliverable:* multiple people can sign in, sync across devices, and share decks.

**Phase 7 — Stretch goals (optional)**
- Extend learning content into **Ch 8–11** (exergy; gas, vapor/combined & refrigeration
  cycles) — the energy-conversion core.
- "Ask the book" Q&A (LLM over the textbook), concept search & glossary, energy-unit
  calculators, revision schedule synced to your course calendar, news↔concept linking,
  re-introduce an optional "Energy Markets/Investment" subsection if you want it back.

---

## 5. Open decisions (need your input)

1. **Build approach** — ✅ **Decided: Node + Vite + React + TypeScript** (scalable
   foundation for the "share with classmates" goal). I install Node in Phase 0.
2. **Hosting** — GitHub + Vercel/Netlify (auto-updating, install anywhere); start by testing
   locally over Wi-Fi. Multi-user backend (Supabase) arrives in Phase 6.
3. **App name** — ✅ **Decided: "Energy Oogway"**.
4. **Briefing cadence** — daily at a set time (e.g. 07:00 Europe/Amsterdam)? How many
   items per section (default: 3–5)?
5. **Units & language** — default **SI units**, **English** throughout (matches book &
   course). Confirm.
6. **Investment news** — you asked to discontinue it. Keep it gone, or later add an
   optional "Energy Markets" subsection focused on energy investing? (Default: leave out.)

---

## 6. Risks & constraints
- **iOS PWA limits:** push notifications only when installed; the OS can evict storage if
  the device is very low on space (mitigated by keeping decks small + optional export).
- **News quality** depends on web-search results and source curation — the agent prompt
  will include a trusted-source list and recency filters.
- **Copyright:** textbook content is used solely for your personal study; decks paraphrase
  concepts. Not for redistribution.
- **Agent upkeep:** the daily compile runs while the Claude app is open (or on next launch
  if it was closed) — same behavior as your old briefings.

---

## 7. Immediate next step
Review this plan. Tell me what to change, or say **"go"** and I'll start **Phase 0**
(scaffold). If you're happy with my recommendations on the open decisions (build-less PWA,
start local then host later, SI/English, drop investment news, pick a name), just say so
and I'll proceed with those defaults.
