# -*- coding: utf-8 -*-
"""
AI sales-advisor chat (IS spec section 5).

The chat only turns what the user types into the shared criteria JSON (5.2) and
asks the next question. It NEVER picks cars — ranking stays in matching.py.

Two engines behind one endpoint:
  * "llm"   — any of three providers, picked by which key is set:
                GEMINI_API_KEY  -> Google Gemini (free tier via AI Studio)
                GROQ_API_KEY    -> Groq (free tier)
                ANTHROPIC_API_KEY -> Claude
              CHAT_MODEL overrides the model. Output is validated; one retry on bad JSON.
  * "rules" — a Thai keyword extractor used when no key is set or the LLM fails,
              so the demo never dies (spec 2: the system must work without AI).
"""
import json
import os
import re
from typing import Any, Dict, List, Optional

import httpx
import time
from pydantic import BaseModel, Field

from app import matching_config as cfg

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
# OpenAI-compatible chat endpoints (Gemini and Groq both offer one)
OPENAI_COMPAT = {
    "gemini": ("GEMINI_API_KEY", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", "gemini-3.5-flash-lite"),
    "groq": ("GROQ_API_KEY", "https://api.groq.com/openai/v1/chat/completions", "openai/gpt-oss-120b"),
}

# tried in order after CHAT_MODEL / the default when a model is busy or closed
GEMINI_FALLBACKS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"]


def pick_provider():
    """First provider whose key is set: (name, key) or (None, None)."""
    for name, (env, _, _) in OPENAI_COMPAT.items():
        if os.getenv(env):
            return name, os.getenv(env)
    if os.getenv("ANTHROPIC_API_KEY"):
        return "anthropic", os.getenv("ANTHROPIC_API_KEY")
    return None, None
MAX_HISTORY = 16  # messages sent to the model (cost control, spec 5.6)


# ------------------------------------------------------------------ models
class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., max_length=2000)


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    criteria: Dict[str, Any] = {}
    asked: List[str] = []   # topics already asked, so the bot never repeats itself


class ChatResponse(BaseModel):
    reply: str
    criteria: Dict[str, Any]
    missing: List[str]
    ready: bool
    next_topic: Optional[str]
    asked: List[str]
    quick_replies: List[str]
    engine: str
    done: bool = False   # every topic covered: the frontend shows the top 3 in the chat


# Conversation order (spec 5.5). budget is the only hard requirement to show results.
TOPICS = ["usage", "lifestyle", "income", "budget", "stretch", "brand", "priorities"]
QUESTIONS = {
    "income": ("ขอถามเรื่องรายได้หน่อยนะคะ รายได้ต่อเดือนประมาณเท่าไรคะ (รวมของคนที่ช่วยผ่อนด้วยก็ได้) จะได้แนะนำรถที่ผ่อนไหวจริง ๆ ค่ะ",
               ["รายได้ 2 หมื่น", "รายได้ 3 หมื่น", "รายได้ 5 หมื่น", "รายได้ 1 แสน"]),
    "usage": ("สวัสดีค่ะ เล่าให้ฟังหน่อยว่าจะใช้รถทำอะไรเป็นหลักคะ เช่น ขับไปทำงานในเมือง พาครอบครัวเที่ยว หรือใช้ขนของ",
              ["ขับในเมืองไปทำงาน", "พาครอบครัวเที่ยวต่างจังหวัด", "ใช้ขนของทำงาน"]),
    "lifestyle": ("ปกติใครนั่งประจำบ้างคะ มีเด็ก ผู้ใหญ่ หรือสัตว์เลี้ยงไปด้วยไหม วันหยุดชอบไปไหน",
                  ["ส่งลูกไปโรงเรียน", "พาพ่อแม่ไปทำบุญ", "มีหมาไปด้วย", "ชอบไปแคมป์ปิ้ง"]),
    "budget": ("งบที่ตั้งไว้ประมาณเท่าไหร่คะ", ["5 แสน", "8 แสน", "1 ล้าน", "1.5 ล้าน"]),
    "stretch": ("ถ้าเจอคันที่คุ้มกว่าแต่เกินงบนิดหน่อย รับได้แค่ไหนคะ",
                ["ห้ามเกินเลย", "เกินได้นิดหน่อย", "เกินได้ถ้าคุ้มจริง"]),
    "brand": ("มียี่ห้อที่อยากได้เป็นพิเศษ หรือยี่ห้อที่ไม่เอาไหมคะ",
              ["ไม่จำกัดยี่ห้อ", "เอาแต่ Toyota", "ไม่เอารถจีน"]),
    "priorities": ("ข้อสุดท้ายค่ะ ระหว่าง งบ / การใช้งาน / ค่าใช้จ่ายระยะยาว / ความปลอดภัย / ดีไซน์ เรื่องไหนสำคัญที่สุดคะ (หรือแตะแท็บ “ตั้งค่าเอง” เพื่อจัดการ์ดเองก็ได้นะคะ)",
                   ["ความปลอดภัยสำคัญสุด", "งบสำคัญสุด", "ค่าใช้จ่ายระยะยาวสำคัญสุด", "ดีไซน์สำคัญสุด"]),
}

SYSTEM_PROMPT = """คุณคือที่ปรึกษาการเลือกรถของ AI Car Advisor พูดคุยเหมือนพนักงานขายรถที่เก่งและจริงใจ ใช้ภาษาสุภาพเป็นกันเอง ลงท้ายด้วย "ค่ะ"

หน้าที่
- ถามให้รู้การใช้ชีวิตจริงของลูกค้า แล้วสรุปเป็นเงื่อนไขตามโครง JSON ที่กำหนด
- ถามทีละ 1 ข้อ สั้น เป็นกันเอง ไม่ใช้ศัพท์เทคนิค
- ข้อมูลที่ต้องได้ก่อนแนะนำ: รายได้ต่อเดือน (ต้องถามทุกครั้ง ถ้าลูกค้าไม่อยากบอกให้ขอเป็นช่วงคร่าว ๆ), งบ, จำนวนคนที่นั่งประจำ, การใช้งานหลัก, แบรนด์ที่เจาะจงหรือไม่เอา, ลำดับความสำคัญของ 5 เรื่อง
- แบรนด์: "ชอบ X" หรือ "ชอบ X ที่สุด" ใส่ใน brand_preferred (ยังดูแบรนด์อื่นด้วย) ; ใส่ brand_only เฉพาะเมื่อลูกค้าพูดชัดว่า "เอาแค่ X", "เฉพาะ X" หรือ "ไม่เอาแบรนด์อื่น" เท่านั้น
- ถามเรื่องงบให้รู้ว่ายืดได้แค่ไหน: ไม่ยืดเลย (0) ยืดได้นิดหน่อย (0.1) หรือยืดได้ถ้าคุ้ม (0.2)

ข้อห้าม
- ห้ามแนะนำรุ่นรถหรือบอกราคาเอง ระบบจะคัดรถให้เมื่อข้อมูลครบ
- ห้ามเดาค่าที่ลูกค้าไม่ได้บอก ให้ใส่ null และระบุใน missing
- lifestyles ใส่เฉพาะกิจกรรมที่ลูกค้าพูดถึงจริง เช่น "ชอบแคมป์ปิ้ง" = camping; มีลูกหรือครอบครัวใหญ่ไม่ได้แปลว่า merit_family หรือ school_run จนกว่าลูกค้าจะพูดถึงการพาผู้ใหญ่ไปทำบุญหรือการรับส่งลูก
- body_preferred ใส่เฉพาะเมื่อลูกค้าบอกตัวถังที่อยากได้เอง ห้ามเลือกให้
- ห้ามคุยเรื่องไฟแนนซ์ ถ้าลูกค้าถาม ให้บอกว่ามีลิงก์ไปผู้ให้บริการในหน้าผลลัพธ์
- ถ้าลูกค้าคุยเรื่องอื่นที่ไม่เกี่ยวกับการเลือกรถ ให้พากลับมาอย่างสุภาพ

โครง criteria (ส่งกลับทุกช่อง ค่าที่ไม่รู้ให้เป็น null):
{"monthly_income": int|null, "budget": int|null, "budget_stretch": 0|0.1|0.15|0.2|null, "brand_only": [str], "brand_exclude": [str], "brand_preferred": [str],
 "seats_min": int|null, "fuel_exclude": [str], "min_ncap_stars": 3|null, "body_preferred": [str], "lifestyles": [str], "km_per_year": int|null,
 "priorities": {"budget":1-3,"lifestyle":1-3,"running_cost":1-3,"safety":1-3,"design":1-3}|null}
lifestyles ใช้ได้เฉพาะ: school_run, camping, merit_family, pets, city, long_trips, work_cargo
body_preferred ใช้ได้เฉพาะ: sedan, hatchback, suv, ppv, mpv, pickup, coupe
fuel_exclude ใช้ได้เฉพาะ: petrol, diesel, hybrid, ev
min_ncap_stars ใส่ 3 เฉพาะเมื่อลูกค้าบอกเองว่าไม่เอารถที่ผลทดสอบชนต่ำ/ต้องการรถที่ผ่านการทดสอบชน ไม่งั้นเป็น null
priorities: 3 = สำคัญที่สุด 2 = สำคัญ 1 = ไม่ค่อยสำคัญ

ตอบเป็น JSON อย่างเดียว ไม่มีข้อความอื่น: {"reply": "ข้อความถึงลูกค้า", "criteria": {...}, "quick_replies": ["ปุ่มตอบด่วนสั้น ๆ 2-4 ปุ่ม"]}"""


# ------------------------------------------------------------ rules engine
BRANDS = ["Toyota", "Honda", "Mazda", "Nissan", "Isuzu", "Mitsubishi", "Suzuki", "Subaru", "Hyundai",
          "Kia", "MG", "BYD", "GWM", "Neta", "GAC", "Deepal", "Changan", "Zeekr", "XPENG", "Tesla",
          "Ford", "Volvo", "BMW", "Peugeot", "AVATR", "Hyptec", "Riddara",
          "Geely", "Chery", "Omoda", "Jaecoo", "Denza", "Mercedes-Benz", "MINI", "Lexus", "Audi", "Porsche"]
BRAND_TH = {"โตโยต้า": "Toyota", "ฮอนด้า": "Honda", "มาสด้า": "Mazda", "นิสสัน": "Nissan", "อีซูซุ": "Isuzu",
            "มิตซู": "Mitsubishi", "ซูซูกิ": "Suzuki", "ซูบารุ": "Subaru", "ฮุนได": "Hyundai", "เกีย": "Kia",
            "เอ็มจี": "MG", "บีวายดี": "BYD", "จีลี่": "Geely", "เบนซ์": "Mercedes-Benz", "benz": "Mercedes-Benz", "Benz": "Mercedes-Benz", "บีเอ็ม": "BMW", "มินิ": "MINI", "เล็กซัส": "Lexus", "อาวดี้": "Audi", "ปอร์เช่": "Porsche", "เชอรี่": "Chery", "โอโมดา": "Omoda", "ฟอร์ด": "Ford", "วอลโว่": "Volvo", "เทสล่า": "Tesla"}
CHINESE = ["MG", "BYD", "GWM", "Neta", "GAC", "Deepal", "Changan", "Zeekr", "XPENG", "AVATR", "Hyptec", "Riddara",
           "Geely", "Chery", "Omoda", "Jaecoo", "Denza"]
LIFESTYLE_WORDS = {
    "school_run": ["ลูก", "โรงเรียน", "ส่งเด็ก"],
    "camping": ["แคมป์", "แค้มป์", "เข้าป่า", "ลุย", "ภูเขา", "ทางลูกรัง"],
    "merit_family": ["ทำบุญ", "วัด", "พ่อแม่", "ผู้ใหญ่", "ยาย", "ปู่", "ย่า", "ตา "],
    "pets": ["หมา", "แมว", "สุนัข", "สัตว์เลี้ยง"],
    "city": ["ในเมือง", "รถติด", "ไปทำงาน", "กรุงเทพ", "จอดยาก"],
    "long_trips": ["ต่างจังหวัด", "ทางไกล", "เดินทางไกล", "กลับบ้านต่างจังหวัด", "เที่ยว"],
    "work_cargo": ["ขนของ", "ค้าขาย", "บรรทุก", "ส่งของ"],
}
BODY_WORDS = {"suv": ["suv", "เอสยูวี", "ครอสโอเวอร์"], "pickup": ["กระบะ", "pickup"],
              "sedan": ["ซีดาน", "เก๋ง", "sedan"], "hatchback": ["แฮทช์", "hatchback", "อีโค่คาร์"],
              "mpv": ["รถตู้", "mpv"], "ppv": ["ppv"], "coupe": ["คูเป้", "สปอร์ต"]}
PRIORITY_WORDS = {"budget": ["งบ", "ราคา", "ถูก"], "lifestyle": ["การใช้งาน", "ไลฟ์สไตล์"],
                  "running_cost": ["ค่าใช้จ่ายระยะยาว", "ประหยัด", "ค่าน้ำมัน", "ค่าซ่อม", "บำรุงรักษา"],
                  "safety": ["ปลอดภัย", "ความปลอดภัย"], "design": ["ดีไซน์", "สวย", "หน้าตา", "ทรง"]}
THAI_NUM = {"หนึ่ง": 1, "สอง": 2, "สาม": 3, "สี่": 4, "ห้า": 5, "หก": 6, "เจ็ด": 7, "แปด": 8, "เก้า": 9}


def _num(s):
    s = s.replace(",", "")
    return THAI_NUM.get(s, None) if not re.match(r"^\d+(\.\d+)?$", s) else float(s)


def parse_budget(t):
    t = t.replace(",", "")
    m = re.search(r"(\d+(?:\.\d+)?|" + "|".join(THAI_NUM) + r")\s*(ล้าน|แสน|หมื่น|k|K|พัน)", t)
    if m:
        n = _num(m.group(1))
        mult = {"ล้าน": 1000000, "แสน": 100000, "หมื่น": 10000, "k": 1000, "K": 1000, "พัน": 1000}[m.group(2)]
        if n:
            return int(n * mult)
    m = re.search(r"\b(\d{6,7})\b", t)
    return int(m.group(1)) if m else None


def rules_extract(text, crit):
    t = text.lower()
    c = dict(crit)
    # "เงินเดือน 3 หมื่น" / "รายได้ 50,000" is income, not the car budget
    inc = re.search(r"(?:เงินเดือน|รายได้(?:ต่อเดือน)?|ได้เดือนละ)\s*(?:ประมาณ|ราว ?ๆ?|ก็|อยู่ที่|คือ)?\s*"
                    r"((?:\d[\d,\.]*|" + "|".join(THAI_NUM) + r")\s*(?:ล้าน|แสน|หมื่น|k|K|พัน)?)", text)
    if inc:
        v = parse_budget(inc.group(1))
        if v is None:
            digits = re.sub(r"[^\d]", "", inc.group(1))
            v = int(digits) if digits else None
        if v and 3000 <= v <= 10000000:
            c["monthly_income"] = v
        text = text[:inc.start()] + " " + text[inc.end():]
    b = parse_budget(text)
    rel = re.search(r"(เพิ่ม|ลด)งบ", text)
    if rel and b and c.get("budget"):
        # "เพิ่มงบอีก 5 หมื่น" adjusts the current budget instead of replacing it (spec 5.5 step 7)
        c["budget"] = max(100000, c["budget"] + (b if rel.group(1) == "เพิ่ม" else -b))
    elif b and 100000 <= b <= 20000000:
        c["budget"] = b
    if re.search(r"ห้ามเกิน|ไม่ยืด|ไม่เกินงบ|เกินไม่ได้", text):
        c["budget_stretch"] = 0.0
    elif re.search(r"เกินได้นิด|นิดหน่อย", text):
        c["budget_stretch"] = 0.1
    elif re.search(r"ถ้าคุ้ม|เกินได้", text):
        c["budget_stretch"] = 0.2
    num = r"(\d+|" + "|".join(THAI_NUM) + r")"
    # riders, not people mentioned in passing: "บ้านมี 6 คน", "นั่ง 5 คน", "7 ที่นั่ง", "ครอบครัว 4 คน"
    m = re.search(r"(?:บ้านมี|ครอบครัว|นั่ง(?:ประจำ)?|ไปด้วยกัน|ทั้งหมด)\s*" + num + r"\s*คน", text) or \
        re.search(num + r"\s*ที่นั่ง", text)
    if m and _num(m.group(1)):
        c["seats_min"] = int(_num(m.group(1)))
    else:
        kids = re.search(r"ลูก\s*" + num + r"\s*คน", text)
        if kids and _num(kids.group(1)):
            # n kids + 2 parents, unless we already know a bigger number
            c["seats_min"] = max(c.get("seats_min") or 0, int(_num(kids.group(1))) + 2)
    if "7 ที่นั่ง" in text or "เจ็ดที่นั่ง" in text:
        c["seats_min"] = 7

    ls = set(c.get("lifestyles") or [])
    for k, words in LIFESTYLE_WORDS.items():
        if any(w in text for w in words):
            ls.add(k)
    if ls:
        c["lifestyles"] = sorted(ls)

    bodies = set(c.get("body_preferred") or [])
    for k, words in BODY_WORDS.items():
        if any(w in t for w in words):
            bodies.add(k)
    if bodies:
        c["body_preferred"] = sorted(bodies)

    fx = set(c.get("fuel_exclude") or [])
    if re.search(r"ไม่เอา(รถ)?(ไฟฟ้า|ev)", t):
        fx.add("ev")
    if re.search(r"ไม่เอา(รถ)?ดีเซล", t):
        fx.add("diesel")
    c["fuel_exclude"] = sorted(fx)
    if re.search(r"(ทดสอบชน|ncap|ดาวความปลอดภัย|ผลชน)", t):
        c["min_ncap_stars"] = 3

    def brands_in(s):
        found = [b for b in BRANDS if re.search(r"\b" + b.lower() + r"\b", s.lower())]
        found += [v for k, v in BRAND_TH.items() if k in s]
        return list(dict.fromkeys(found))

    excl_part = re.findall(r"ไม่เอา([^,\.]*)", text)
    excl = set(c.get("brand_exclude") or [])
    for part in excl_part:
        excl.update(brands_in(part))
        if "จีน" in part:
            excl.update(CHINESE)
    c["brand_exclude"] = sorted(excl)
    only_part = re.findall(r"(?:เอาแต่|เฉพาะ|ต้องเป็น)([^,\.]*)", text)
    only = set(c.get("brand_only") or [])
    for part in only_part:
        only.update(brands_in(part))
    if "ไม่จำกัดยี่ห้อ" in text or "ยี่ห้อไหนก็ได้" in text:
        only = set()
    c["brand_only"] = sorted(only)
    liked = set(c.get("brand_preferred") or [])
    for part in re.findall(r"ชอบ([^,\.]*)", text):
        liked.update(b for b in brands_in(part) if b not in only)
    c["brand_preferred"] = sorted(liked)

    if re.search(r"สำคัญ(ที่)?สุด|เน้น|มาก่อน", text):
        pr = dict(c.get("priorities") or {k: 2 for k in cfg.CRITERIA})
        for k, words in PRIORITY_WORDS.items():
            if any(w in text for w in words):
                pr[k] = 3
        c["priorities"] = pr
    return c


def next_topic(c, asked):
    """First topic not yet asked and not already answered by what the user volunteered."""
    for t in TOPICS:
        if t in asked:
            continue
        if t == "usage" and c.get("lifestyles"):
            continue
        if t == "lifestyle" and c.get("lifestyles") and c.get("seats_min"):
            continue
        if t == "income" and c.get("monthly_income"):
            continue
        if t == "budget" and c.get("budget"):
            continue
        if t == "stretch" and c.get("budget_stretch") is not None:
            continue
        if t == "priorities" and c.get("priorities"):
            continue
        return t
    return None


def summarize(c):
    parts = []
    if c.get("monthly_income"):
        parts.append("รายได้ %s บาท/เดือน" % format(c["monthly_income"], ","))
    if c.get("budget"):
        s = "งบ %s บาท" % format(c["budget"], ",")
        if c.get("budget_stretch") is not None:
            s += " (ยืดได้ %d%%)" % round(c["budget_stretch"] * 100)
        parts.append(s)
    if c.get("seats_min"):
        parts.append("นั่ง %d คนขึ้นไป" % c["seats_min"])
    if c.get("lifestyles"):
        parts.append("ใช้งาน: " + ", ".join(cfg.LIFESTYLE_TH[x] for x in c["lifestyles"]))
    if c.get("brand_only"):
        parts.append("เอาเฉพาะ " + ", ".join(c["brand_only"]))
    if c.get("brand_preferred"):
        parts.append("ชอบ " + ", ".join(c["brand_preferred"]))
    if c.get("brand_exclude"):
        parts.append("ไม่เอา " + ", ".join(c["brand_exclude"][:4]) + ("…" if len(c["brand_exclude"]) > 4 else ""))
    if c.get("fuel_exclude"):
        fuel_th = {"ev": "ไฟฟ้า", "diesel": "ดีเซล", "petrol": "เบนซิน", "hybrid": "ไฮบริด"}
        parts.append("ไม่เอารถ" + ", ".join(fuel_th.get(f, f) for f in c["fuel_exclude"]))
    if c.get("min_ncap_stars"):
        parts.append("ไม่เอารถผลทดสอบชนต่ำกว่า %d ดาว" % c["min_ncap_stars"])
    if c.get("priorities"):
        top = [cfg.CRITERIA_TH[k] for k, v in c["priorities"].items() if v == 3]
        if top:
            parts.append("สำคัญที่สุด: " + ", ".join(top))
    return " · ".join(parts)


def rules_turn(req):
    c = dict(req.criteria)
    last_user = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
    if last_user:
        c = rules_extract(last_user, c)
    asked = list(req.asked)
    nt = next_topic(c, asked)
    if nt:
        q, quick = QUESTIONS[nt]
        asked.append(nt)
        got = summarize(c)
        reply = (("รับทราบค่ะ ตอนนี้เข้าใจว่า " + got + "\n\n") if got and last_user else "") + q
    else:
        reply = "สรุปที่เข้าใจนะคะ: " + (summarize(c) or "ยังไม่มีเงื่อนไข") + \
                "\n\nจัดอันดับรถให้แล้วค่ะ อยากปรับอะไรพิมพ์ต่อได้เลย เช่น \"ถ้าเพิ่มงบอีก 5 หมื่นล่ะ\""
        quick = ["เพิ่มงบอีก 5 หมื่น", "ไม่เอารถไฟฟ้า", "ต้องนั่งได้ 7 คน"]
    return c, reply, nt, asked, quick


# --------------------------------------------------------------- LLM engine
def _clean_criteria(raw):
    """Keep only valid keys/values (spec 5.6: validate everything the AI returns)."""
    out = {}
    if not isinstance(raw, dict):
        raise ValueError("criteria is not an object")
    mi = raw.get("monthly_income")
    if isinstance(mi, (int, float)) and 3000 <= mi <= 10000000:
        out["monthly_income"] = int(mi)
    b = raw.get("budget")
    if isinstance(b, (int, float)) and b > 0:
        out["budget"] = int(b)
    s = raw.get("budget_stretch")
    if isinstance(s, (int, float)) and 0 <= s <= 0.5:
        out["budget_stretch"] = float(s)
    for k, allowed in (("lifestyles", cfg.LIFESTYLES),
                       ("body_preferred", list(cfg.BODY_SIMILAR)),
                       ("fuel_exclude", ["petrol", "diesel", "hybrid", "ev"])):
        v = raw.get(k) or []
        if isinstance(v, list):
            out[k] = [x for x in v if x in allowed]
    for k in ("brand_only", "brand_exclude", "brand_preferred"):
        v = raw.get(k) or []
        if isinstance(v, list):
            out[k] = [x for x in v if isinstance(x, str) and x in BRANDS]
    ns = raw.get("min_ncap_stars")
    if isinstance(ns, int) and 1 <= ns <= 5:
        out["min_ncap_stars"] = ns
    sm = raw.get("seats_min")
    if isinstance(sm, int) and 1 <= sm <= 15:
        out["seats_min"] = sm
    km = raw.get("km_per_year")
    if isinstance(km, int) and 0 < km <= 200000:
        out["km_per_year"] = km
    pr = raw.get("priorities")
    if isinstance(pr, dict) and all(pr.get(k) in (1, 2, 3) for k in cfg.CRITERIA):
        out["priorities"] = {k: pr[k] for k in cfg.CRITERIA}
    return out


def _extract_json(text):
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        raise ValueError("no JSON in reply")
    return json.loads(m.group(0))


def _call_llm(provider, api_key, system, history):
    if provider == "anthropic":
        body = {"model": os.getenv("CHAT_MODEL", "claude-haiku-5-5"), "max_tokens": 700, "temperature": 0,
                "system": system, "messages": history}
        headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
        r = httpx.post(ANTHROPIC_URL, json=body, headers=headers, timeout=25)
        r.raise_for_status()
        return "".join(p.get("text", "") for p in r.json().get("content", []))
    _, url, default_model = OPENAI_COMPAT[provider]
    models = [os.getenv("CHAT_MODEL", default_model)]
    if provider == "gemini":
        # free-tier Gemini models return 503 "high demand" in bursts and older ones get closed
        # to new keys (2.5-flash in Nov 2026): walk a short list instead of failing on one
        models += [m for m in GEMINI_FALLBACKS if m not in models]
    last = None
    for model in models:
        body = {"model": model, "temperature": 0, "max_tokens": 1200,
                "messages": [{"role": "system", "content": system}] + history}
        if provider == "gemini":
            # thinking tokens count against max_tokens and slow the reply; keep them low
            body["max_tokens"] = 4096
            body["reasoning_effort"] = "low"
        r = None
        for attempt in range(2):
            try:
                r = httpx.post(url, json=body, headers={"Authorization": "Bearer " + api_key},
                               timeout=float(os.getenv("LLM_TIMEOUT", "18")))
            except httpx.TimeoutException:
                r = None
                break  # a slow model: try the next one instead of waiting
            if r.status_code == 400 and "reasoning" in r.text.lower() and "reasoning_effort" in body:
                body.pop("reasoning_effort")  # model without thinking control
                continue
            if r.status_code in (429, 503) and attempt == 0:
                time.sleep(1.5)
                continue
            break
        if r is None:
            last = "%s/%s timed out" % (provider, model)
            print("[llm]", last)
            continue
        if r.status_code < 400:
            content = r.json()["choices"][0]["message"].get("content") or ""
            if content.strip():
                print("[llm] answered by %s/%s" % (provider, model))
                return content
            last = "%s/%s returned an empty answer" % (provider, model)
            continue
        # status + the provider's own error text (never the key) so failures show in Vercel logs
        last = "%s/%s HTTP %d: %s" % (provider, model, r.status_code, r.text[:200])
        print("[llm]", last)
        if r.status_code not in (404, 429, 503):
            break
    raise RuntimeError(last or "%s failed" % provider)


def llm_turn(req, provider, api_key):
    history = [{"role": m.role, "content": m.content} for m in req.messages[-MAX_HISTORY:]]
    if not history or history[0]["role"] != "user":
        history.insert(0, {"role": "user", "content": "สวัสดีค่ะ"})
    # temperature 0 everywhere (spec 5.6: same message -> same criteria)
    system = SYSTEM_PROMPT + "\n\nเงื่อนไขที่เก็บได้แล้ว (อัปเดตต่อจากนี้): " + json.dumps(req.criteria, ensure_ascii=False)
    last_err = None
    for _ in range(2):  # one retry on malformed output (spec 5.6)
        text = _call_llm(provider, api_key, system, history)
        try:
            data = _extract_json(text)
            crit = dict(req.criteria)
            crit.update(_clean_criteria(data.get("criteria", {})))
            reply = re.sub(r"[^\u0000-\u024F\u0E00-\u0E7F\u2000-\u206F\u0E3F]", "",
                           str(data.get("reply", ""))).strip()[:1500]
            quick = [str(q)[:40] for q in (data.get("quick_replies") or [])][:4]
            if not reply:
                raise ValueError("empty reply")
            return crit, reply, quick
        except (ValueError, json.JSONDecodeError) as e:
            last_err = e
    raise RuntimeError("LLM returned invalid JSON twice: %s" % last_err)


EXCLUSIVE_BRAND = re.compile(r"เฉพาะ|เอาแต่|เท่านั้น|แค่(ยี่ห้อ|แบรนด์)?\s*[A-Za-zก-๙]|ต้องเป็น|ไม่เอา(ยี่ห้อ|แบรนด์)อื่น|ไม่ดู(ยี่ห้อ|แบรนด์)อื่น")


def _brands_in(s):
    found = [b for b in BRANDS if re.search(r"\b" + re.escape(b.lower()) + r"\b", s.lower())]
    found += [v for k, v in BRAND_TH.items() if k in s]
    return list(dict.fromkeys(found))


def guard_brand_only(req, crit):
    """The model sometimes turns "ชอบ Subaru" into a hard brand filter, which can leave one car.
    A brand only becomes a filter when the user's own words say so; otherwise it is a preference."""
    before = set(req.criteria.get("brand_only") or [])
    new = [b for b in (crit.get("brand_only") or []) if b not in before]
    last_user = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
    if new and not EXCLUSIVE_BRAND.search(last_user):
        crit = dict(crit)
        crit["brand_only"] = [b for b in crit["brand_only"] if b in before]
        crit["brand_preferred"] = sorted(set(crit.get("brand_preferred") or []) | set(new))
    # the model sometimes drops "ชอบ X" entirely; read it from the user's words as well
    liked = []
    for part in re.findall(r"ชอบ([^,\.\n]*)", last_user):
        liked += _brands_in(part)
    liked = [b for b in liked if b not in (crit.get("brand_only") or []) and b not in (crit.get("brand_exclude") or [])]
    if liked:
        crit = dict(crit)
        crit["brand_preferred"] = sorted(set(crit.get("brand_preferred") or []) | set(liked))
    return crit


# --------------------------------------------------------------------- API
def chat_turn(req):
    provider, api_key = pick_provider()
    engine = "rules"
    asked = list(req.asked)
    if provider:
        try:
            crit, reply, quick = llm_turn(req, provider, api_key)
            crit = guard_brand_only(req, crit)
            engine = "llm:" + provider
            nt = next_topic(crit, asked)
            if nt:
                asked.append(nt)
        except Exception as e:
            print("[chat] LLM failed, using rules:", repr(e)[:400])
            crit, reply, nt, asked, quick = rules_turn(req)
    else:
        crit, reply, nt, asked, quick = rules_turn(req)

    if not (reply or "").strip():  # the model occasionally returns an empty reply
        reply = ("ได้ข้อมูลครบแล้วค่ะ สรุปที่เข้าใจคือ %s กำลังจัดอันดับรถให้นะคะ" % summarize(crit)) if nt is None and crit.get("budget") \
            else (QUESTIONS[nt][0] if nt in QUESTIONS else "ขอข้อมูลเพิ่มอีกนิดนะคะ")
    missing = [k for k in ("budget",) if not crit.get("budget")]
    return ChatResponse(
        reply=reply, criteria=crit, missing=missing, ready=not missing,
        next_topic=nt, asked=asked, quick_replies=quick, engine=engine,
        done=bool(crit.get("budget")) and bool(crit.get("monthly_income")) and nt is None,
    )
