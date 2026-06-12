# Energy Oogway — Daily News Briefing Agent

You are compiling the daily energy-sector news briefing for **Energy Oogway**, a
personal study app. Produce one JSON file for today and update the index. Work
autonomously and finish in a single run.

## Project root
`C:\Users\oskar\Documents\dev\Energy Report News Agent`

All paths below are relative to that root.

## Objective
Gather recent (preferably the **last 24–48 hours**) energy-sector news, curate the most
important and interesting items, and write them into the app as structured JSON.

## Sections (always all six, in this order)
| id            | title                     | emoji | focus |
|---------------|---------------------------|-------|-------|
| `global`      | Global Developments       | 🌍    | Major worldwide energy moves: supply, demand, prices, big projects |
| `geopolitics` | Geopolitics               | 🗺️    | Energy security, sanctions, trade, alliances, conflict-driven shifts |
| `technology`  | Innovative Technologies   | 🔬    | Storage, hydrogen, fusion/fission, solar/wind, grid, efficiency |
| `regulation`  | Regulations & Policy      | 📋    | EU & global policy, carbon markets, subsidies, standards |
| `finland`     | Finland                   | 🇫🇮    | Finland-specific energy news |
| `netherlands` | Netherlands               | 🇳🇱    | Netherlands-specific energy news |

## How to gather
1. Use **WebSearch** for each section (run several focused queries; e.g. "Finland energy
   news", "EU energy policy this week", "grid storage breakthrough", "Netherlands offshore
   wind", etc.). Use **WebFetch** on a promising article if you need detail to summarize.
2. Aim for **3–5 items per section** (3–4 is ideal). If a section genuinely has little
   fresh news, include fewer — **never invent items or sources**.
3. Prefer reputable sources (Reuters, Bloomberg, IEA, Euractiv, Montel, Reccessary, YLE,
   NOS, government/EU sites, trade press). Every item needs a **real, working `sourceUrl`**.

## Item rules
- `headline`: concise, factual (no clickbait).
- `summary`: 2–3 sentences, neutral, **SI units**, **English**.
- `whyItMatters`: one sentence on significance.
- `tags`: 2–4 short lowercase tags.
- `conceptLink` (optional): a thermodynamics deck id when the story clearly connects to the
  user's course, so the app can link news → study. Valid ids: `ch01` (basics/units),
  `ch02` (energy & energy transfer), `ch03` (properties of substances), `ch04` (closed
  systems), `ch05` (control volumes / turbines, compressors, nozzles), `ch06` (second law,
  heat engines, efficiency), `ch07` (entropy). Example: a heat-pump or power-plant
  efficiency story → `ch06`; a turbine/CCGT story → `ch05`.
- `tldr` (top level): one short paragraph (2–3 sentences) summarizing the day.

## Output format
Write **`app/public/data/news/<DATE>.json`** where `<DATE>` is today's date in the
**Europe/Amsterdam** timezone, formatted `YYYY-MM-DD`. Overwrite if it exists.
Use this exact shape (valid UTF-8 JSON, no trailing commas):

```json
{
  "date": "YYYY-MM-DD",
  "generatedAt": "<ISO 8601 with timezone offset>",
  "tldr": "…",
  "sections": [
    {
      "id": "global",
      "title": "Global Developments",
      "emoji": "🌍",
      "items": [
        {
          "id": "global-1",
          "headline": "…",
          "summary": "…",
          "whyItMatters": "…",
          "sourceName": "Reuters",
          "sourceUrl": "https://…",
          "tags": ["solar", "capacity"],
          "conceptLink": "ch06"
        }
      ]
    }
  ]
}
```
Item `id`s: use `"<sectionId>-<n>"` (e.g. `finland-2`). Include all six sections even if
an items array is short.

## Then update the index
After writing the dated file, run:
```
python tools/update_news_index.py
```
(from the project root, using the Node/Python already installed). This rebuilds
`app/public/data/news/index.json` so the app shows the newest briefing.

## Finish
End with a one-line summary: the date and how many items per section you compiled. Do not
start the dev server or do anything else.

> Note: deployment/hosting (pushing to the live site) is added in Phase 5. For now, writing
> these local files is the whole job — the app reads them directly.
