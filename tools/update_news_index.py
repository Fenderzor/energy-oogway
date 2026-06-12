"""Rebuild app/public/data/news/index.json from the dated briefing files.

Scans app/public/data/news/ for files named YYYY-MM-DD.json and writes
index.json as { "latest": <newest>, "briefings": [newest .. oldest] }.

Usage:
  python tools/update_news_index.py            # rebuild index (keep up to 60 in list)
  python tools/update_news_index.py --max 90   # keep up to 90 in the list
  python tools/update_news_index.py --prune    # also delete dated files beyond --max
"""
import argparse
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWS_DIR = os.path.join(ROOT, "app", "public", "data", "news")
DATE_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})\.json$")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max", type=int, default=60, help="max briefings to keep in the index list")
    ap.add_argument("--prune", action="store_true", help="delete dated files beyond --max")
    args = ap.parse_args()

    dates = []
    for name in os.listdir(NEWS_DIR):
        m = DATE_RE.match(name)
        if m:
            dates.append(m.group(1))
    dates.sort(reverse=True)

    if not dates:
        print("No briefing files found in", NEWS_DIR)
        return

    keep = dates[: args.max]
    index = {"latest": keep[0], "briefings": keep}
    with open(os.path.join(NEWS_DIR, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2)
        f.write("\n")
    print(f"index.json updated: latest={keep[0]}, {len(keep)} briefing(s) listed")

    if args.prune:
        for d in dates[args.max:]:
            os.remove(os.path.join(NEWS_DIR, f"{d}.json"))
            print("pruned", d)


if __name__ == "__main__":
    main()
