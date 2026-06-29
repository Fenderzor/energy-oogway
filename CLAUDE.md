# CLAUDE.md — Energy Oogway

Working notes for any Claude session on this repo. Read this first; deeper running
history is in the memory files (see end).

## What this is
**Energy Oogway** 🐢⚡ — a personal, installable **PWA** for an MSc Energy Science
student (Utrecht; prepping for Energy Conversion Technologies + an energy career).
Two pillars today, expanding to a third:
1. **Daily energy news briefing** (6 sections).
2. **Thermodynamics learning module** (Cengel Ch 1–8) — flashcards, reference
   library, practice problems, quizzes, a full exam, and multi-part exam-style
   problems.
3. **(NEW, planned)** an **Energy Systems & Power Markets** learning track — see
   "Current direction" below.

Owner works **plan-first, easy collaborative pace** ("take it easy, work through it
together"). Prefer a short plan + recommendation, then build. Learning content must
prioritize **how to use equations (rearrangements, when-to-use)** and, for the new
track, **vocabulary + real-world intuition** an energy analyst needs.

## Stack & layout
- Vite + React + TypeScript PWA in **`app/`** (this is the build/deploy root).
- `app/src/routes/` — screens (Today, Learn, Library, Practice, Settings, +
  lazy session screens: StudyDeck, ChapterDoc, ProblemSession, QuizSession,
  ExamProblemSession).
- `app/src/lib/` — `repositories/` (data access), `srs.ts`, `stats.ts`,
  `markdown.ts` (marked + KaTeX + DOMPurify), IndexedDB via `db.ts`.
- `app/public/data/` — **all content as JSON** (the important part, see below).
- `agent/` news-agent prompt · `tools/` Python helpers · `docs/` plan + deploy.
- `External Material/` — Cengel textbook PDF, **git-ignored (copyright)**.
- Node is user-local at `C:\Users\oskar\tools\node`; the preview tool uses
  `app/dev-preview.cmd`. Bash tool: prefix `PATH="/c/Users/oskar/tools/node:$PATH"`.

## Run / verify (do this for any UI-affecting change)
- Type-check: from `app/`, `PATH=...:$PATH node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json`
- Production build: `npm run build` (also regenerates the PWA service worker).
- Preview/verify: use the **preview_* tools** (server name `energy-oogway`,
  port 5173). The screenshot tool is flaky/times out — drive + assert via
  `preview_eval` DOM queries (that's the established pattern here). Always check
  `preview_console_logs` for errors (watch for `<div>`-inside-`<p>` hydration
  warnings — Rich renders a `<div>`, so never wrap it in a `<p>`).
- After interactive tests, wipe test data from IndexedDB (`stats:local`,
  `problems:local`, `quizzes:local`) so the user starts fresh.

## Content architecture (READ THIS before adding learning content)
Everything is **data-driven**: a repo fetches an `index.json`, the screen maps over
it, and per-item JSON files hold the content. To add a "chapter"/topic you add JSON
+ an index entry — **no component changes needed**. The five systems:

| System | Index | Item files | Screen |
|---|---|---|---|
| News | `data/news/index.json` (`{latest, briefings[]}`) | `data/news/<YYYY-MM-DD>.json` | Today |
| Flashcards (SRS) | `data/decks/index.json` | `data/decks/chNN.json` (cards: basic/mcq/numeric) | Learn → StudyDeck |
| Library (reference) | `data/library/index.json` | `data/library/chNN.json` (summary, equations w/ `rearrangements`+`useWhen`, glossary, tips) | Library → ChapterDoc (sub-tabs) |
| Problems | `data/problems/index.json` (`byDifficulty`) | `data/problems/chNN.json` (numeric/mcq/open; difficulty 1–4 ⭐) | Practice → ProblemSession |
| Exam-style (multi-part) | `data/exam-problems/index.json` (single bundle) | (in the bundle) | Practice → ExamProblemSession |
| Quizzes + Full Exam | `data/quizzes/index.json` (`byCategory`) | `data/quizzes/chNN.json` (4 categories: concept/applied/equation/problem) | Practice → QuizSession |

Types live in `app/src/types/index.ts`; repos in `app/src/lib/repositories/`.
Conventions: math in **KaTeX** (`$…$` inline, `$$…$$` display; escape `\\` in JSON);
**difficulty** `1|2|3|4` (⭐–⭐⭐⭐⭐, 4 = Master's); the **Full Exam** samples
6 Q/chapter across all `count>0` quiz chapters; problems/quiz JSON are validated by
ad-hoc node scripts (counts match index, no dup ids, numeric answers present).
**Verify every numeric answer by hand** before writing it.

Current content: Thermo **Ch 1–8** complete across all five systems (Ch 8 = Exergy).
Difficulty target = the Utrecht example exam (multi-part, integrative) — see
`memory/reference-utrecht-exam-style.md`. Two known gaps deliberately deferred
(hard on mobile): qualitative open-reasoning questions, and h-s/T-s diagram
sketching.

## Deployment (done, free)
- GitHub: **`github.com/Fenderzor/energy-oogway`** (public). Local git remote `origin` set.
- Hosted on **Vercel**, **Root Directory = `app`**, build `npm run build`, output
  `dist`; `app/vercel.json` has the SPA rewrite. Auto-redeploys on `git push`.
- It's an installed, **offline-capable** PWA (Workbox precaches all study JSON +
  KaTeX fonts; news excluded → NetworkFirst so it can refresh online).
- **News updates are manual/free** — the user **declined** the paid Anthropic-API
  cloud cron. Don't re-propose it. Fresh news reaches the hosted app only via a
  `git push` of new `data/news/*.json` (local scheduled task generates it for free
  using the Claude subscription; pushing is the missing free step if they want it).
- Commit only when asked; if asked, the user usually runs `git push` themselves
  (credentials are on their machine). Co-author trailer: `Claude Opus 4.8`.

## Current direction (next work)
Expand learning **beyond thermodynamics** into the user's career-critical topics:
**power markets / electricity market design** (merit-order pricing, day-ahead &
wholesale markets, PPAs, capacity & balancing markets), **renewable energy
deployment**, **energy technologies**, **grids** (and the "grid-and-compute"
specialism they're building toward — DNV / Northpool / TenneT-type roles). These
are vocabulary- and intuition-heavy, less equation-heavy than thermo.

**Track structure — DECIDED (2026-06-18).** Non-thermo content uses a lightweight
**`track`** dimension. Each index entry may carry `track?: string` (absent ⇒
default `'thermo'`, so all Cengel content is untouched). Track metadata lives in
`app/src/lib/tracks.ts` (`TRACKS` map: id → label + chip prefix + order;
`trackMeta()`, `groupByTrack()`). Learn / Library / Practice now group their lists
by track with a per-track section header (shown only when >1 track) and a
track-coded chip (thermo `Ch N`, energy-systems `⚡ N`). Page subtitles were made
track-agnostic. ChapterDoc + single-quiz headings are track-aware. The **Full
Exam** is filtered to the thermo track only, so other tracks never leak into the
Utrecht-exam prep.

Track ids so far: `thermo` ("Thermodynamics · Cengel Ch 1–8") and `energy-systems`
("Energy Systems & Power Markets"). Non-thermo module ids use a `pmNN`/`reNN`/etc.
namespace with `chapter` numbered within the track (so the chip reads `⚡ 1`).

**Built (2026-06-18): all four `energy-systems` modules** — each = Library doc +
12-card deck + 16-Q quiz, knowledge-first weighting per
[[feedback-energy-systems-knowledge-first]] (big glossaries, concept/applied-heavy
quizzes 6/6/2/2, only a few light equations):
- `pm01` *Power Markets & Market Design* (chapter 1) — merit order, marginal/pay-as-clear
  pricing, day-ahead/intraday/balancing, spreads, PPAs, negative prices. (26-term
  glossary; 5 eqns — this one is the most equation-heavy.)
- `re01` *Renewable Deployment* (chapter 2) — LCOE, capacity factor, curtailment,
  cannibalization/value factor, auctions/CfD/FiT, grid-and-permit bottlenecks. (26
  glossary; 3 eqns.)
- `et01` *Energy Technologies* (chapter 3) — generation roles (CCGT/OCGT), storage
  (Li-ion/pumped-hydro/H2), power-vs-energy/duration, round-trip efficiency, demand
  response. (26 glossary; 3 eqns.)
- `gr01` *Grids & Grid-and-Compute* (chapter 4) — TSO/DSO (TenneT), frequency/inertia,
  congestion/redispatch, N-1, zonal-vs-nodal, and the data-centre/AI-load
  grid-and-compute thesis. (25 glossary; 2 eqns.)

All type-check, build (132 precache entries), and verified in preview: render as
`⚡ 1–4` under the "Energy Systems & Power Markets" track header in Learn/Library/
Practice; Full Exam still excludes them (thermo-only, 48 Q). Numeric answers
hand-verified. Adding more modules = index + JSON only, no component changes.

**Built (2026-06-18): ALGEBRA track (`algebra`, chip `🔢`, order 2)** — a third
track for an MSc student who struggles with rearrangements. Per
[[feedback-algebra-track]] it is **teach + practice**: each module = a **Library
lesson** (worked-example teaching, the "what to do in each scenario" the user
asked for) + a **Problems set** (graded ⭐–⭐⭐⭐⭐ drills with progressive hints +
worked solutions; mix of numeric solve-for, mcq spot-the-step, open
make-the-subject). NO decks/quizzes for this track. 7 modules, each 12 problems
(byDifficulty 3/3/4/2):
- `al01` Rearranging Formulas (the flagship — golden rule, inverse ops, denominator,
  squares/roots, both-sides), `al02` Fractions/Ratios/Proportions, `al03`
  Powers/Roots/Indices, `al04` Logs & Exponentials, `al05` Linear & Simultaneous
  Equations, `al06` Quadratics, `al07` Rearranging Real Energy Formulas (capstone:
  Q=mcΔT, η=W/Q, Carnot, ideal gas, KE, exergy — bridges to the thermo track).

Wiring: the Practice **"Problems by difficulty"** quick-picker + the
`/practice/level/:level` route are now **scoped to the thermo track only**
(ProblemSession + Practice filter on `track`), so algebra's 84 problems don't
pollute the thermo exam-prep buckets; algebra is practised via the track-grouped
**"Problems by chapter"** section (already sorts easy→hard within each set).
ProblemSession chapter heading is track-aware (`set.track`). Added `track?` to
`ProblemSet`. Build = 146 precache entries; all numerics hand-verified; preview-
verified (🔢 1–7 in Library + Problems-by-chapter; difficulty buckets unchanged at
16/22/23/5 thermo). Chip `🔢` is shared across the track (per-module letter codes
were considered, not done).

## Memory
Persistent notes live in
`C:\Users\oskar\.claude\projects\C--Users-oskar-Documents-dev-Energy-Report-News-Agent\memory\`
(`MEMORY.md` is the index). Key files: `project-energy-companion.md` (full status
log), `user-profile.md`, `feedback-work-style.md`, `feedback-equation-focus.md`,
`reference-utrecht-exam-style.md`.
