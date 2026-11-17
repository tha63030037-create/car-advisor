# -*- coding: utf-8 -*-
"""
Run the 8 test personas through the OLD engine (fixed weights, budget 30 pts)
and the NEW v2 engine, then write evidence files for spec section 7:

  docs/evaluation/persona_results.md   human-readable comparison
  docs/evaluation/persona_results.csv  one row per persona x engine x rank
  docs/evaluation/blind_sheet.csv      for the 3 evaluators: sets shown as A/B
                                       in a fixed random order, engine hidden
  docs/evaluation/blind_key.csv        which of A/B is which engine (keep private)

Run from the backend folder:
    python scripts/run_personas.py
"""
import csv
import json
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
ROOT = os.path.dirname(BACKEND)
sys.path.insert(0, BACKEND)

from app.matching import Criteria, recommend, CARS_V2  # noqa: E402
from app.models import QuizState  # noqa: E402
from app.services import generate_recommendations  # noqa: E402

PERSONAS = os.path.join(BACKEND, "tests", "personas.json")
OUT = os.path.join(ROOT, "docs", "evaluation")
BY_ID = {c["id"]: c for c in CARS_V2}


def check_hard_rules(rules, car):
    bad = []
    if "max_price" in rules and car["price"] > rules["max_price"]:
        bad.append("price %s > %s" % (car["price"], rules["max_price"]))
    if "min_seats" in rules and car["seats"] < rules["min_seats"]:
        bad.append("seats %s < %s" % (car["seats"], rules["min_seats"]))
    if "brand_only" in rules and car["brand"].lower() not in [b.lower() for b in rules["brand_only"]]:
        bad.append("brand %s" % car["brand"])
    return bad


def main():
    with open(PERSONAS, encoding="utf-8") as f:
        personas = json.load(f)["personas"]
    os.makedirs(OUT, exist_ok=True)

    rows, md = [], ["# ผลผู้ใช้สมมติ 8 คน: ระบบเดิม vs ระบบใหม่ (v2)", "",
                    "สร้างอัตโนมัติจาก `backend/scripts/run_personas.py` — อย่าแก้มือ", ""]
    blind, key = [], []
    rng = random.Random(20261217)
    total_violations = {"old": 0, "v2": 0}

    for p in personas:
        old = generate_recommendations(QuizState(**p["old_quiz"]))[:3]
        new = recommend(Criteria(**p["criteria"]))
        new3 = new["results"][:3]

        old_cars = [BY_ID[r.car.id] for r in old]
        new_cars = [BY_ID[r["id"]] for r in new3]
        v_old = sum(len(check_hard_rules(p["hard_rules"], c)) > 0 for c in old_cars)
        v_new = sum(len(check_hard_rules(p["hard_rules"], c)) > 0 for c in new_cars)
        total_violations["old"] += v_old
        total_violations["v2"] += v_new

        md += ["## %s — %s" % (p["id"], p["name"]), "",
               "ทดสอบ: %s  " % p["tests"], "เรื่องเล่า: %s" % p["story"], "",
               "น้ำหนักที่ระบบใหม่ใช้: " + ", ".join("%s %d%%" % (k, v) for k, v in new["weights_pct"].items()),
               "", "| อันดับ | ระบบเดิม | คะแนน | ระบบใหม่ | คะแนน | ป้ายเกินงบ |",
               "|---|---|---|---|---|---|"]
        for i in range(3):
            o = old[i] if i < len(old) else None
            n = new3[i] if i < len(new3) else None
            md.append("| %d | %s | %s | %s | %s | %s |" % (
                i + 1,
                ("%s (%s฿)" % (o.car.name, format(o.car.price, ","))) if o else "-",
                o.score if o else "-",
                ("%s (%s฿)" % (n["name"], format(n["price"], ","))) if n else "-",
                n["score"] if n else "-",
                (n["over_budget"]["label"] if n and n["over_budget"] else "") if n else ""))
            for eng, item in (("old", o), ("v2", n)):
                if item is None:
                    continue
                car = BY_ID[item.car.id if eng == "old" else item["id"]]
                rows.append([p["id"], eng, i + 1, car["name"], car["price"],
                             item.score if eng == "old" else item["score"],
                             "; ".join(check_hard_rules(p["hard_rules"], car))])
        md += ["", "รถผิดกฎบังคับใน 3 อันดับแรก: ระบบเดิม %d คัน, ระบบใหม่ %d คัน" % (v_old, v_new), ""]
        if new["too_few_results"]:
            md += ["> ระบบใหม่เหลือรถน้อยกว่า 3 คัน — ตัวกรองที่ตัดมากที่สุด: %s" % new["filter_impact"][0]["label"], ""]

        sets = [("old", [c["name"] for c in old_cars]), ("v2", [c["name"] for c in new_cars])]
        rng.shuffle(sets)
        blind.append([p["id"], p["story"], " / ".join(sets[0][1]), " / ".join(sets[1][1]), "", ""])
        key.append([p["id"], sets[0][0], sets[1][0]])

    md += ["## สรุป", "", "รถผิดกฎบังคับรวม (8 คน × 3 อันดับ): ระบบเดิม %d คัน, ระบบใหม่ %d คัน"
           % (total_violations["old"], total_violations["v2"]), ""]

    with open(os.path.join(OUT, "persona_results.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")
    with open(os.path.join(OUT, "persona_results.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["persona", "engine", "rank", "car", "price", "score", "hard_rule_violations"])
        w.writerows(rows)
    with open(os.path.join(OUT, "blind_sheet.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["persona", "เรื่องของผู้ใช้", "ชุด A (3 อันดับแรก)", "ชุด B (3 อันดับแรก)",
                    "ชุดที่เหมาะกว่า (A/B)", "เหตุผลสั้น ๆ"])
        w.writerows(blind)
    with open(os.path.join(OUT, "blind_key.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["persona", "A", "B"])
        w.writerows(key)

    print("violations old=%(old)d v2=%(v2)d" % total_violations)
    print("wrote", OUT)
    return total_violations


if __name__ == "__main__":
    main()
