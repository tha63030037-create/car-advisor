"""Collect recent Pantip threads per car model from Pantip's public tag pages.

What it keeps per thread: title, link, date shown on Pantip, comment count. It does not copy
post bodies: the site shows the title and links to the thread, and summaries are written from
titles only (see app/reviews.py). robots.txt allows these pages; requests are spaced out.

Run:  python3 scripts/fetch_pantip.py            (all cars)
      python3 scripts/fetch_pantip.py --ids 93 71
Writes app/data/pantip_reviews.json. A GitHub Action runs it weekly.
"""
import argparse
import html
import json
import os
import re
import sys
import time
import urllib.parse
from datetime import date

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.database import CARS  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), "..", "app", "data", "pantip_reviews.json")
UA = "Mozilla/5.0 (compatible; AICarAdvisor/1.0; NIDA independent study; +https://car-advisor-three.vercel.app)"
DELAY = 1.0  # seconds between requests
TH_MONTHS = {"ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4, "พ.ค.": 5, "มิ.ย.": 6,
             "ก.ค.": 7, "ส.ค.": 8, "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12}

# a few models whose Pantip tag differs from our catalogue name
TAG_HINTS = {
    "GAC AION UT": ["AION UT"], "GAC Aion V": ["AION V"], "GAC Aion Y": ["AION Y Plus", "AION Y"],
    "Toyota Hilux Revo Double Cab": ["Toyota Hilux Revo"], "Toyota Hilux Revo Standard Cab": ["Toyota Hilux Revo"],
    "Isuzu D-Max V-Cross": ["Isuzu D-Max"], "Toyota Fortuner Legender": ["Toyota Fortuner"],
}


BRAND_TAGS = {"GWM": ["Great Wall Motors (GWM)"], "ORA": ["Great Wall Motors (GWM)"], "Mercedes-Benz": ["Mercedes-Benz"],
              "GAC": ["AION (รถยนต์)", "GAC AION"], "MINI": ["MINI (รถยนต์)", "Mini Cooper"]}
_CACHE = {}


def parse_date(s, today=None):
    """'21 ต.ค.' (this year) or '21 ต.ค. 67' (Buddhist 2-digit year) -> ISO date or None."""
    today = today or date.today()
    m = re.match(r"(\d{1,2})\s+(\S+?\.\S*?\.?)\s*(\d{2}|\d{4})?$", s.strip())
    if not m or m.group(2) not in TH_MONTHS:
        return None
    d, mo = int(m.group(1)), TH_MONTHS[m.group(2)]
    if m.group(3):
        y = (int(m.group(3)) if len(m.group(3)) == 4 else 2500 + int(m.group(3))) - 543
    else:
        y = today.year if (mo, d) <= (today.month, today.day) else today.year - 1
    try:
        return date(y, mo, d).isoformat()
    except ValueError:
        return None


def parse_tag_page(s):
    """Topic items on a tag page: id, title, date text, comment count, tags."""
    items = []
    for block in s.split('class="pt-list-item ')[1:]:
        m = re.search(r'href="https://pantip.com/topic/(\d+)"[^>]*>(?:<i[^>]*></i>)?([^<]+)</a></h2>', block)
        if not m:
            continue
        info = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "|", block.split("pt-list-item__info", 1)[-1][:1500]))
        parts = [p.strip() for p in info.split("|") if p.strip()]
        when = next((p for p in parts if re.match(r"^\d{1,2} \S+\.", p)), None)
        comments = None
        if "message" in parts:
            i = parts.index("message")
            if i + 1 < len(parts) and parts[i + 1].isdigit():
                comments = int(parts[i + 1])
        tags = re.findall(r'href="/tag/[^"]+"[^>]*>([^<]+)</a>', block.split("pt-list-item__tag", 1)[-1].split("pt-list-item__info", 1)[0])
        items.append({"id": m.group(1), "title": html.unescape(m.group(2)).strip(), "when": when,
                      "date": parse_date(when) if when else None, "comments": comments, "tags": tags})
    return items


def candidates(name):
    brand, _, model = name.partition(" ")
    # Pantip redirects tag names case-insensitively, so case variants are not needed
    out = list(TAG_HINTS.get(name, [])) + [name, brand + " " + model.split(" ")[0]]
    # Pantip's brand tags look like "BYD (รถยนต์)"; brand-level pages are filtered by model words later
    out += BRAND_TAGS.get(brand, []) + [brand + " (รถยนต์)", brand]
    return [c for c in dict.fromkeys(o.strip() for o in out) if c]


SUFFIX = re.compile(r"\s+(e:hev|hybrid\+?|hev|phev|e-power|electric|dm-i|ev|rs|ultra|premium)$", re.I)


def norm(s):
    return re.sub(r"[^0-9a-z\u0E00-\u0E7F]", "", s.lower())


def core(name):
    """'Honda City e:HEV' -> 'Honda City'; drops powertrain/trim words people often leave out of titles."""
    prev = None
    while prev != name:
        prev, name = name, SUFFIX.sub("", name).strip()
    return name


def title_needle(name):
    """What a thread title must contain (spaces and dashes ignored) to count for this model."""
    brand, _, model = core(name).partition(" ")
    m = norm(model)
    return m if len(m) >= 4 else norm(brand + model)   # 'Zeekr X' needs 'zeekrx', not just 'x'


def fetch_tag(client, tag):
    if tag in _CACHE:  # brand pages are shared by many models
        return _CACHE[tag]
    _CACHE[tag] = _fetch_tag(client, tag)
    return _CACHE[tag]


def _fetch_tag(client, tag):
    url = "https://pantip.com/tag/" + urllib.parse.quote(tag.replace(" ", "_"))
    r = client.get(url)
    time.sleep(DELAY)
    if r.status_code != 200 or "ไม่พบหน้านี้" in r.text[:3000]:
        return None, None
    return str(r.url), parse_tag_page(r.text)


def collect(car, client):
    name = car["name"]
    full, short = norm(core(name)), norm(core(name).partition(" ")[2])
    needle = title_needle(name)
    for tag in candidates(name):
        url, items = fetch_tag(client, tag)
        if not items:
            continue
        canonical = urllib.parse.unquote(url.rsplit("/tag/", 1)[-1]).replace("_", " ")
        exact = norm(canonical) in (full, short, norm(name))
        if not exact:  # a brand or model-family tag: keep only titles that name this model
            items = [i for i in items if needle in norm(i["title"])]
        if items:
            return {"tag": canonical, "tag_url": url, "exact_tag": exact, "threads": items[:30]}
    return None


def _write(cars):
    payload = {"source": "Pantip public tag pages (titles and links only)", "fetched": date.today().isoformat(), "cars": cars}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
        f.write("\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", type=int, nargs="*")
    args = ap.parse_args()
    old = {}
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            old = json.load(f).get("cars", {})
    cars = [c for c in CARS if not args.ids or c["id"] in args.ids]
    out = dict(old)
    with httpx.Client(headers={"User-Agent": UA, "Accept-Language": "th"}, follow_redirects=True, timeout=20) as client:
        for n, car in enumerate(cars, 1):
            try:
                got = collect(car, client)
            except httpx.HTTPError as e:
                print("  !", car["name"], repr(e)[:80])
                continue  # keep last week's data for this car
            if got:
                out[str(car["id"])] = {"name": car["name"], **got}
            else:
                out.pop(str(car["id"]), None)  # no match this week: do not keep an older, looser match
            if n % 10 == 0:
                _write(out)
            print("%3d/%d %-34s %s" % (n, len(cars), car["name"], (got["tag"] + " · %d threads" % len(got["threads"])) if got else "-"))
    _write(out)
    print("cars with threads: %d / %d" % (len(out), len(CARS)))


if __name__ == "__main__":
    main()
