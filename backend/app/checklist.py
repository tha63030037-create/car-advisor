"""Showroom prep checklist (POV: buyers distrust sales staff and fear being pushed past budget).

Built from the car's own data by rules, so every item can be traced to a fact we hold. When an
LLM key is set, the model may add up to three car-specific tips, but only from the same facts
(and the Pantip thread titles); if it fails, the rules-only list is returned.
"""
import json
import re

from app.chat import _call_llm, pick_provider
from app.matching import car_by_id
from app import reviews

BAHT = lambda n: f"{int(n):,}"  # noqa: E731


def _rules(car, budget=None):
    price, fuel, body = car["price"], car["fuelType"], car["bodyType"]
    est = set(car.get("estimated") or [])
    ask, drive, money = [], [], []

    # --- what to ask the salesperson
    ask.append(f"ราคาขายปกติรุ่นเริ่มต้นคือ {BAHT(price)} บาท ขอใบเสนอราคาเป็นลายลักษณ์อักษร แยกราคารถ ของแถม และค่าใช้จ่ายอื่น")
    ask.append(f"ยืนยันการรับประกัน {car['warrantyYears']} ปี / {BAHT(car['warrantyKm'])} กม. และสิ่งที่ไม่ครอบคลุม")
    if fuel == "ev":
        ask += ["รับประกันแบตเตอรี่กี่ปีหรือกี่กิโลเมตร เปลี่ยนให้เมื่อความจุเหลือต่ำกว่ากี่เปอร์เซ็นต์",
                "แถมเครื่องชาร์จที่บ้านพร้อมติดตั้งไหม ต้องขอเพิ่มมิเตอร์ไฟหรือไม่ ค่าใช้จ่ายใครจ่าย"]
    elif fuel == "hybrid":
        ask.append("รับประกันแบตเตอรี่ไฮบริดกี่ปี และค่าเปลี่ยนแบตหลังหมดประกันราว ๆ เท่าไร")
    if car.get("serviceNetwork") == "growing":
        ask.append("ศูนย์บริการที่ใกล้บ้านและที่ทำงานอยู่ที่ไหน รออะไหล่นานแค่ไหนถ้าเกิดอุบัติเหตุ")
    if car.get("maintenance_5y_thb"):
        note = " (ตัวเลขนี้เป็นค่าประมาณของเรา)" if "maintenance_5y_thb" in est else ""
        ask.append(f"ขอตารางค่าบำรุงรักษาตามระยะ 5 ปี เทียบกับที่เราประเมินไว้ราว {BAHT(car['maintenance_5y_thb'])} บาท{note}")
    if car.get("crash_test"):
        t = car["crash_test"]
        ask.append(f"รถคันที่ขายในไทยเป็นโฉมเดียวกับที่ทดสอบ {t['program']} ได้ {t['stars']} ดาวหรือไม่")
    else:
        ask.append("รุ่นนี้ยังไม่มีผลทดสอบชนจากสถาบันอิสระที่เราพบ ถามว่ามีผลทดสอบจากที่ไหนบ้าง")
    adas = car.get("adas") or {}
    if "adas" in est or not adas:
        ask.append("รุ่นย่อยที่ราคานี้มีระบบเบรกฉุกเฉินอัตโนมัติ (AEB) และระบบช่วยรักษาเลนหรือไม่ (ข้อมูลส่วนนี้ของเรายังไม่ยืนยัน)")

    # --- what to try on the test drive
    drive.append("ขับทั้งช่วงรถติดและทางด่วน ฟังเสียงลมและเสียงยางที่ความเร็ว 100 กม./ชม.")
    drive.append("ลองถอยจอดเข้าช่อง ดูกล้องและเซ็นเซอร์ ว่ามองเห็นรอบคันพอไหม")
    if car.get("seats", 5) >= 7:
        drive.append("ลองนั่งแถวสามจริง ๆ และลองพับเบาะ ดูว่าคนในบ้านขึ้นลงสะดวกไหม")
    else:
        drive.append("ให้คนที่จะนั่งประจำลองนั่งเบาะหลัง ดูที่วางขาและช่องแอร์หลัง")
    if body == "pickup":
        drive.append("ถามน้ำหนักบรรทุกที่รับได้ และลองขับตอนกระบะเปล่า ดูอาการท้ายเต้น")
    elif car.get("cargo_l"):
        drive.append(f"เปิดท้ายดูของจริง ท้ายรถราว {car['cargo_l']} ลิตร ลองนึกว่าของที่ขนประจำใส่ได้ไหม")
    if fuel == "ev":
        drive.append("ดูว่าตัวเลขระยะทางที่เหลือลดลงเร็วแค่ไหนตอนเปิดแอร์ และลองระบบเบรกชาร์จไฟคืน (regen)")
    if car.get("ground_clearance_mm") and car["ground_clearance_mm"] < 150:
        drive.append(f"ใต้ท้องสูง {car['ground_clearance_mm']} มม. ค่อนข้างเตี้ย ลองขับขึ้นทางลาดหรือลูกระนาด")
    drive.append("ลองเชื่อมมือถือ (CarPlay / Android Auto) และสั่งงานเมนูภาษาไทย ว่าใช้ง่ายจริงไหม")

    # --- money
    money.append(f"ไม่ควรจ่ายเกินราคาขายปกติ {BAHT(price)} บาทสำหรับรุ่นเริ่มต้น ถ้ามีบวกเพิ่ม ให้ถามว่าเป็นค่าอะไร")
    if budget and price > budget:
        money.append(f"รถคันนี้เกินงบที่คุณตั้งไว้ {BAHT(price - budget)} บาท ตัดสินใจไว้ก่อนเข้าโชว์รูมว่าจะยอมจ่ายเพิ่มได้ถึงเท่าไร")
    money += ["ของแถม (ฟิล์ม ประกันชั้นหนึ่ง พรม) ขอให้คิดเป็นส่วนลดเงินสดแทนได้ไหม เทียบกันง่ายกว่า",
              "ถ้าผ่อน ขอดอกเบี้ยแบบอัตราต่อปีที่แท้จริง ไม่ใช่แค่ค่างวด และถามค่าปิดบัญชีก่อนกำหนด",
              "อย่าวางเงินจองในวันแรก กลับไปเทียบใบเสนอราคาอย่างน้อย 2 โชว์รูม"]
    return [{"key": "ask", "title": "ถามพนักงานขาย", "items": ask},
            {"key": "drive", "title": "ตอนทดลองขับ", "items": drive},
            {"key": "money", "title": "เรื่องเงิน", "items": money}]


CHECK_PROMPT = """ตอบเป็นภาษาไทยเท่านั้น คุณช่วยผู้ซื้อรถเตรียมตัวก่อนไปโชว์รูมในไทย เขียนเคล็ดลับเฉพาะรุ่นนี้ไม่เกิน 3 ข้อ แต่ละข้อไม่เกิน 30 คำ
ใช้เฉพาะข้อมูลใน JSON ที่ให้ (สเปก และหัวข้อกระทู้ Pantip ที่คนถามบ่อย) ห้ามแต่งตัวเลขหรือปัญหาที่ไม่มีในข้อมูล
ถ้าหัวข้อกระทู้บอกเรื่องที่คนกังวล ให้แปลงเป็นคำถามที่ควรถามเซลส์ ห้ามคัดลอกหัวข้อกระทู้ตรง ๆ
ตอบเป็น JSON เท่านั้น: {"tips": ["...", "..."]}"""


def checklist(car_id, budget=None):
    car = car_by_id(car_id)
    if car is None:
        return None
    sections = _rules(car, budget)
    tips, engine = [], "rules"
    provider, key = pick_provider()
    if provider:
        facts = {k: car.get(k) for k in ("name", "price", "fuelType", "bodyType", "seats", "warrantyYears", "warrantyKm",
                                         "crash_test", "ground_clearance_mm", "cargo_l", "serviceNetwork", "consumption")}
        facts["pantip_titles"] = [t["title"] for t in (reviews.threads(car_id) or [])[:15]]
        try:
            text = _call_llm(provider, key, CHECK_PROMPT, [{"role": "user", "content": json.dumps(facts, ensure_ascii=False)}], json_mode=True)
            m = re.search(r"\{.*\}", text, re.S)
            got = json.loads(m.group(0)).get("tips", []) if m else []
            tips = [re.sub(r"[*#`]", "", str(t)).strip()[:200] for t in got if str(t).strip()]
            # keep Thai tips only: the model sometimes answers in English
            tips = [t for t in tips if len(re.findall(r"[\u0E00-\u0E7F]", t)) >= len(t) * 0.4]
            # drop a tip that carries a number we never gave the model (e.g. an invented tyre size)
            given = re.sub(r"[,\s]", "", json.dumps(facts, ensure_ascii=False))
            tips = [t for t in tips if all(n in given for n in re.findall(r"\d+(?:\.\d+)?", t.replace(",", "")))][:3]
            engine = "llm:" + provider if tips else "rules"
        except Exception as e:  # rules list is complete on its own
            print("[checklist] LLM failed:", repr(e)[:200])
    if tips:
        sections.insert(0, {"key": "tips", "title": "เฉพาะรุ่นนี้ (AI สรุปจากข้อมูลรถและกระทู้ Pantip)", "items": tips})
    return {"car_id": car_id, "name": car["name"], "engine": engine, "sections": sections}
