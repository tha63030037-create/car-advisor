"""Owner voices from Pantip: recent thread titles per model (scripts/fetch_pantip.py, weekly).

Only titles, links, dates and comment counts are stored. Themes are counted with a keyword list
so anyone can check why a thread landed in a theme; nothing is invented or paraphrased as a quote.
"""
import json
import os
from datetime import date

PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "pantip_reviews.json")

# theme -> (Thai label, keywords looked up in the lower-cased title)
THEMES = {
    "problem": ("ปัญหา / อาการเสีย", ["ปัญหา", "เสียหาย", "รถเสีย", "เสียบ่อย", "พัง", "อาการ", "ดับ", "ไฟโชว์", "เตือน", "รั่ว", "ร้อน", "error", "บั๊ก", "ค้าง", "สั่น"]),
    "noise": ("เสียงดัง / ช่วงล่าง / ยาง", ["เสียง", "ดังก", "ดังตอน", "ช่วงล่าง", "โช้ค", "กระด้าง", "ยาง"]),
    "service": ("ศูนย์บริการ / อะไหล่", ["ศูนย์", "เซอร์วิส", "service", "อะไหล่", "ซ่อม", "เคลม", "ประกัน", "เช็คระยะ", "เช็กระยะ"]),
    "battery": ("แบตเตอรี่ / ชาร์จ", ["แบต", "ชาร์จ", "charge", "วิ่งได้", "ระยะทาง", "km/kwh", "สถานี"]),
    "economy": ("อัตราสิ้นเปลือง", ["กินน้ำมัน", "อัตราสิ้นเปลือง", "ประหยัด", "กม./ลิตร", "km/l", "ค่าไฟ", "ค่าน้ำมัน"]),
    "buying": ("ซื้อดีไหม / เทียบรุ่น", ["ดีไหม", "ดีมั้ย", "ดีมั๊ย", "เทียบ", "vs", "เลือก", "ลังเล", "แนะนำ", "คุ้ม", "ซื้อ"]),
    "price": ("ราคา / โปรโมชัน / ไฟแนนซ์", ["ราคา", "โปร", "ส่วนลด", "ดาวน์", "ผ่อน", "ไฟแนนซ์", "ดอกเบี้ย", "ขายต่อ", "มือสอง"]),
}

_data = None


def _load():
    global _data
    if _data is None:
        try:
            with open(PATH, encoding="utf-8") as f:
                _data = json.load(f)
        except (OSError, ValueError):
            _data = {"cars": {}}
    return _data


def threads(car_id):
    c = _load()["cars"].get(str(car_id))
    return c["threads"] if c else None


def themes_of(title):
    t = title.lower()
    return [k for k, (_, words) in THEMES.items() if any(w in t for w in words)]


def for_car(car_id, name=None):
    """Recent threads plus theme counts; the search link lets people read beyond what we list."""
    d = _load()
    c = d["cars"].get(str(car_id))
    q = name or (c["name"] if c else "")
    search = "https://pantip.com/search?q=" + q.replace(" ", "+")
    if not c:
        return {"found": False, "fetched": d.get("fetched"), "search_url": search, "threads": [], "themes": []}
    ths = []
    counts = {}
    for t in c["threads"]:
        ks = themes_of(t["title"])
        for k in ks:
            counts[k] = counts.get(k, 0) + 1
        ths.append({**{k: t.get(k) for k in ("id", "title", "date", "when", "comments")},
                    "url": "https://pantip.com/topic/" + t["id"], "themes": ks})
    themes = [{"key": k, "label": THEMES[k][0], "count": n} for k, n in sorted(counts.items(), key=lambda x: -x[1])]
    recent = [t for t in ths if t["date"] and (date.today() - date.fromisoformat(t["date"])).days <= 365]
    return {"found": True, "fetched": d.get("fetched"), "tag": c["tag"], "tag_url": c["tag_url"], "exact_tag": c["exact_tag"],
            "search_url": search, "count": len(ths), "last_year": len(recent), "themes": themes, "threads": ths}
