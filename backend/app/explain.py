# -*- coding: utf-8 -*-
"""
Salesperson-style explanation of the top 3 (IS spec 5.4).

The ranking is recomputed here from the criteria, so the text can only talk about
cars the matching engine actually picked. The LLM gets those 3 cars' database
fields and nothing else; its answer is rejected if it names a car outside the top 3
or leaves one of them out. Without a key, or when the LLM output fails the check,
a template built from the same numbers is returned, so the page never goes blank.
"""
import json
import re
from typing import Any, Dict, List

from app import matching_config as cfg
from app.chat import _call_llm, pick_provider
from app.database import CARS
from app.matching import Criteria, recommend

EXPLAIN_PROMPT = """คุณคือพนักงานขายรถที่อธิบายผลการจับคู่ให้ลูกค้าฟัง ใช้ภาษาสุภาพเป็นกันเอง ลงท้ายด้วย "ค่ะ"

คุณจะได้รับ: เงื่อนไขของลูกค้า และรถ 3 คันพร้อมข้อมูลจากฐานข้อมูลและคะแนนรายเกณฑ์ เรียงตามอันดับแล้ว

สิ่งที่ต้องเขียน
- เหตุผลของแต่ละคัน 2–3 ประโยค โยงกับสิ่งที่ลูกค้าบอกว่าสำคัญที่สุด ขึ้นต้นแต่ละคันด้วย "อันดับ N <ชื่อรุ่นตามที่ให้มา>"
- ถ้าคันใดเกินงบ ให้บอกตรง ๆ ว่าเกินเท่าไร และได้อะไรเพิ่มมา
- บอกข้อด้อยของแต่ละคันอย่างน้อย 1 ข้อ
- ปิดท้ายด้วย 1 ย่อหน้า เปรียบเทียบค่าใช้จ่ายต่อปี (พลังงาน + บำรุงรักษา) ของทั้ง 3 คัน

กติกา
- ใช้เฉพาะตัวเลขและคุณสมบัติที่อยู่ในข้อมูลที่ส่งมา ห้ามใช้ความรู้อื่นเกี่ยวกับรถรุ่นนั้น
- ค่าที่อยู่ใน estimated_fields ต้องบอกว่าเป็นค่าประมาณ
- ห้ามเปลี่ยนลำดับของรถ และห้ามพูดถึงรถรุ่นอื่นนอกจาก 3 คันนี้
- ห้ามพูดเรื่องไฟแนนซ์
- ตอบเป็นข้อความธรรมดา ไม่ใช้ markdown ไม่เกิน 220 คำ"""

ALL_NAMES = sorted({c["name"] for c in CARS}, key=len, reverse=True)


def _baht(n):
    return format(int(round(n)), ",")


def _facts(r: Dict[str, Any]) -> Dict[str, Any]:
    """Only the fields the explanation may use."""
    return {
        "rank": r["rank"], "name": r["name"], "price": r["price"], "match_pct": round(r["score"]),
        "fuel": r.get("fuelType"), "seats": r.get("seats"),
        "criteria_scores_0_100": {cfg.CRITERIA_TH[k]: (None if v is None else round(v * 100))
                                  for k, v in r["criteria"].items()},
        "best_at": [t["label"] for t in r["top_criteria"]],
        "over_budget": r["over_budget"],
        "annual_cost": r["annual_cost"],
        "lifestyle": [{"lifestyle": l["label"], "has": l["has"], "missing": l["missing"]}
                      for l in r["lifestyle_detail"]],
        "estimated_fields": r["estimated_fields"],
    }


def _weakness(r):
    if r["over_budget"]:
        return "ราคาเกินงบ %s" % r["over_budget"]["label"].replace("เกินงบ ", "")
    for l in r["lifestyle_detail"]:
        if l["missing"]:
            return "ยังไม่มี %s สำหรับ%s" % (", ".join(l["missing"][:2]), l["label"])
    scored = [(v, k) for k, v in r["criteria"].items() if v is not None]
    if scored:
        v, k = min(scored)
        return "คะแนน%sต่ำสุดในทุกเกณฑ์ของคันนี้ (%d/100)" % (cfg.CRITERIA_TH[k], round(v * 100))
    return "ข้อมูลบางส่วนยังไม่ครบ"


def template_text(top: List[Dict[str, Any]]) -> str:
    parts = []
    for r in top:
        s = "อันดับ %d %s เข้ากับคุณ %d%% ราคา %s บาท" % (r["rank"], r["name"], round(r["score"]), _baht(r["price"]))
        if r["top_criteria"]:
            s += " เด่นเรื่อง" + " และ".join(t["label"] for t in r["top_criteria"])
        s += " ข้อที่ต้องรู้: " + _weakness(r)
        if r["estimated_fields"]:
            s += " (ข้อมูลบางส่วนเป็นค่าประมาณ)"
        parts.append(s + " ค่ะ")
    costs = [r for r in top if r["annual_cost"]]
    if costs:
        cheap = min(costs, key=lambda r: r["annual_cost"]["total"])
        line = " · ".join("%s ~%s บาท/ปี" % (r["name"], _baht(r["annual_cost"]["total"])) for r in costs)
        parts.append("ค่าใช้จ่ายต่อปี (พลังงาน + บำรุงรักษา): %s — %s ประหยัดที่สุดค่ะ" % (line, cheap["name"]))
    return "\n\n".join(parts)


def text_is_grounded(text: str, top: List[Dict[str, Any]]) -> bool:
    """Every top-3 name appears, and no other car in the database is named."""
    allowed = {r["name"] for r in top}
    if not all(n in text for n in allowed):
        return False
    rest = text
    for n in allowed:
        rest = rest.replace(n, " ")
    return not any(n in rest for n in ALL_NAMES if n not in allowed and len(n) >= 6)


def explain(criteria: Criteria) -> Dict[str, Any]:
    c = criteria.model_copy(update={"top_n": 3})
    res = recommend(c)
    top = res["results"][:3]
    if not top:
        return {"text": "ยังไม่มีรถที่ผ่านเงื่อนไขค่ะ ลองผ่อนเงื่อนไขดูนะคะ", "engine": "template", "ids": []}
    provider, key = pick_provider()
    if provider:
        payload = {"criteria": c.model_dump(exclude={"top_n"}), "cars": [_facts(r) for r in top]}
        msgs = [{"role": "user", "content": json.dumps(payload, ensure_ascii=False)}]
        try:
            text = _call_llm(provider, key, EXPLAIN_PROMPT, msgs).strip()
            text = re.sub(r"[*#`]", "", text)
            # small models sometimes emit a stray glyph from another script inside Thai words
            text = re.sub(r"[^\u0000-\u024F\u0E00-\u0E7F\u2000-\u206F\u20AC\u0E3F]", "", text)[:2500]
            if text and text_is_grounded(text, top):
                return {"text": text, "engine": "llm:" + provider, "ids": [r["id"] for r in top]}
            print("[explain] LLM text failed the grounding check, using template")
        except Exception as e:
            print("[explain] LLM failed, using template:", repr(e)[:400])
    return {"text": template_text(top), "engine": "template", "ids": [r["id"] for r in top]}
