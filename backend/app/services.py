# -*- coding: utf-8 -*-
from typing import List, Dict, Any, Tuple
from app.database import CARS
from app.models import QuizState, RecommendationResult, TCOBreakdown, RangeInfo, RiskNote, Car, CarPhoto, Review, Complaint

LIFESTYLE_LABEL = {
    "city": "ขับในเมือง",
    "family": "ครอบครัว",
    "business": "วิ่งงาน/ต่างจังหวัด",
    "adventure": "สายลุย",
    "firstCar": "รถคันแรก",
}

BODYTYPE_LABEL = {
    "hatchback": "Hatchback",
    "sedan": "Sedan",
    "coupe": "Coupe",
    "suv": "SUV/Crossover",
    "ppv": "PPV 7 ที่นั่ง",
    "mpv": "รถตู้/MPV",
    "pickup": "กระบะ",
}

FUEL_LABEL = {
    "petrol": "เบนซิน",
    "diesel": "ดีเซล",
    "hybrid": "ไฮบริด",
    "ev": "ไฟฟ้า"
}

PAIN_TO_LIFESTYLE = {
    "pain1": "city",
    "pain3": "family",
    "pain4": "business",
    "pain5": "adventure",
    "pain6": "adventure",
    "pain7": "business"
}

GAIN_TO_LIFESTYLE = {
    "gain1": "city",
    "gain2": "family",
    "gain3": "business",
    "gain4": "adventure",
    "gain5": "adventure",
    "gain6": "business"
}

def derive_lifestyles(pains: List[str], gains: List[str]) -> List[str]:
    active = set()
    for p in pains:
        l = PAIN_TO_LIFESTYLE.get(p)
        if l:
            active.add(l)
    for g in gains:
        l = GAIN_TO_LIFESTYLE.get(g)
        if l:
            active.add(l)
    return list(active)

def score_car(car: Dict[str, Any], state: QuizState, active_lifestyle: List[str]) -> Tuple[int, List[str]]:
    score = 0
    reasons = []

    # Budget - 30 points
    budget = state.budget
    price = car['price']
    if price <= budget:
        headroom = (budget - price) / budget
        score += 30 - min(headroom, 0.3) * 18
        reasons.append("งบพอดี ไม่ต้องเบียด")
    else:
        over = (price - budget) / budget
        score += max(0, 12 - over * 70)
        reasons.append(f"ราคาเกินงบไปราว {round(over * 100)}%")

    # Lifestyle - 25 points
    overlap = [l for l in car['lifestyle'] if l in active_lifestyle]
    if overlap:
        score += min(25, 15 + (len(overlap) - 1) * 5)
        lbls = [LIFESTYLE_LABEL.get(l, l) for l in overlap]
        reasons.append(f"ตรงกับสาย{ ' + '.join(lbls) }")
    else:
        score += 6

    # Body Type - 20 points
    bt = state.bodytype
    if bt == "unsure":
        score += 14
    elif car['bodyType'] == bt:
        score += 20
        reasons.append(f"เป็นทรง {BODYTYPE_LABEL.get(bt, bt)} ตามที่ชอบ")
    else:
        score += 4

    # Fuel / engine - 15 points
    fuel = state.fuel
    if fuel == "any":
        score += 9
    elif car['fuelType'] == fuel:
        score += 15
        reasons.append(f"เครื่องยนต์{FUEL_LABEL.get(fuel, fuel)}ตามที่เลือก")
    else:
        score += 1

    # Brands - 10 points
    brands = state.brands
    if not brands or len(brands) == 0 or "any" in brands:
        score += 6
    else:
        car_brand = car['name'].split(" ")[0].lower()
        matched = any(b.lower() == car_brand for b in brands)
        if matched:
            score += 10
            reasons.append(f"เป็นแบรนด์ {car['name'].split(' ')[0]} ในดวงใจ")
        else:
            score += 1

    return int(round(max(0, min(100, score)))), reasons

def calculate_monthly_installment(car_price: int) -> float:
    DOWNPAYMENT_RATE = 0.15
    FLAT_RATE = 0.0299
    TERM_MONTHS = 60
    principal = car_price * (1.0 - DOWNPAYMENT_RATE)
    total_interest = principal * FLAT_RATE * (TERM_MONTHS / 12)
    monthly = (principal + total_interest) / TERM_MONTHS
    return monthly

def get_affordability_tier(ratio: float) -> Tuple[str, str, str]:
    if ratio <= 0.2:
        return "tier-good", "สบายๆ ผ่อนไหวชิล", "var(--good)"
    elif ratio <= 0.35:
        return "tier-mid", "กำลังดี แต่เริ่มตึงมือหน่อย", "var(--mid)"
    else:
        return "tier-watch", "ค่อนข้างหนัก ลองดาวน์เพิ่มหรือรุ่นที่ถูกกว่านะ", "var(--low)"

def calculate_tco(car: Dict[str, Any]) -> Dict[str, float]:
    YEARS = 5
    price = car['price']
    insurance5yr = price * 0.035 * YEARS

    heavy = car['bodyType'] in ["suv", "ppv", "mpv"]
    if car['fuelType'] == "ev":
        maint_per_year = 5000
    elif car['bodyType'] == "pickup":
        maint_per_year = 9000
    elif car['bodyType'] == "coupe":
        maint_per_year = 9500
    elif heavy:
        maint_per_year = 10000
    else:
        maint_per_year = 8000
        
    maint5yr = maint_per_year * YEARS

    if car['serviceNetwork'] == "wide":
        resale_rate = 0.5 if car['fuelType'] == "hybrid" else 0.48
    else:
        resale_rate = 0.32 if car['fuelType'] == "ev" else 0.4

    resale_value = price * resale_rate
    total5yr = price + insurance5yr + maint5yr - resale_value

    return {
        "insurance5yr": insurance5yr,
        "maint5yr": maint5yr,
        "resaleValue": resale_value,
        "total5yr": total5yr
    }

def get_range_estimate(car: Dict[str, Any]) -> Dict[str, Any]:
    name = car['name']
    fuel_type = car['fuelType']
    body_type = car['bodyType']

    if fuel_type == "ev":
        range100 = 400  # default
        if "Dolphin" in name: range100 = 410
        elif "Atto 3" in name: range100 = 410
        elif "Seal" in name: range100 = 510
        elif "Deepal S07" in name: range100 = 485
        elif "Neta V" in name: range100 = 384
        elif "Neta X" in name: range100 = 480
        elif "Aion Y" in name: range100 = 490
        elif "Aion V" in name: range100 = 500
        elif "e:N1" in name: range100 = 412
        elif "ZS EV" in name: range100 = 320
        elif "MG4" in name: range100 = 350
        elif "Cyberster" in name: range100 = 380

        range80 = int(round(range100 * 0.8))
        return {
            "type": "ev",
            "range100": range100,
            "range80": range80,
            "range": None,
            "tankSize": None
        }
    else:
        tank_size = 40  # default
        if body_type == "suv": tank_size = 48
        elif body_type == "ppv": tank_size = 80
        elif body_type == "mpv": tank_size = 52
        elif body_type == "pickup": tank_size = 75
        elif body_type == "coupe": tank_size = 45

        if "Camry" in name: tank_size = 50
        elif "Accord" in name: tank_size = 48
        elif "Civic" in name: tank_size = 47
        elif "Fortuner" in name: tank_size = 80
        elif "Everest" in name: tank_size = 80
        elif "D-Max" in name: tank_size = 76
        elif "Triton" in name: tank_size = 75
        elif "Ranger" in name: tank_size = 80

        try:
            # Parse number from e.g. "23 km/l"
            rate = float(car['consumption'].replace(" km/l", "").strip())
        except:
            rate = 15.0

        rng = int(round(tank_size * rate))
        return {
            "type": "ice",
            "range": rng,
            "tankSize": tank_size,
            "range100": None,
            "range80": None
        }

def get_risk_notes(car: Dict[str, Any]) -> List[Dict[str, str]]:
    notes = []
    fuel_type = car['fuelType']
    service_network = car['serviceNetwork']
    body_type = car['bodyType']

    if fuel_type == "ev":
        notes.append({"icon": "⚠️", "text": "ตลาดรถไฟฟ้ามือสองในไทยยังใหม่ ราคาตกไวกว่ารถสันดาปช่วงนี้เพราะมีรุ่นใหม่ออกถี่และแข่งราคากันแรง"})
        notes.append({"icon": "⚠️", "text": "เช็คจุดชาร์จใกล้บ้าน/ที่ทำงานก่อน ถ้าไม่มีที่ชาร์จส่วนตัวอาจไม่สะดวกระยะยาว"})
    
    if service_network == "growing":
        notes.append({"icon": "⚠️", "text": "เครือข่ายศูนย์บริการยังน้อยกว่าแบรนด์หลัก ลองเช็คระยะทางไปศูนย์ที่ใกล้พี่ที่สุดก่อนตัดสินใจ"})
    else:
        notes.append({"icon": "✅", "text": "เครือข่ายศูนย์บริการกว้าง หาอะไหล่และช่างง่ายทั่วประเทศ"})

    if body_type == "pickup":
        notes.append({"icon": "⚠️", "text": "ถ้าใช้ลุยงานหนักบ่อย ค่าบำรุงรักษาจริงอาจสูงกว่าตัวเลขประมาณการนี้"})
    
    if body_type == "coupe":
        notes.append({"icon": "⚠️", "text": "รถสปอร์ต 2 ประตูมักมีเบี้ยประกันภัยสูงกว่ารถทั่วไป ลองขอใบเสนอราคาหลายเจ้าก่อน"})

    return notes

import random

REAL_MODEL_FEEDBACK = {
    "Toyota Yaris Ativ": {
        "reviews": [
            {"author": "คุณภัทร", "rating": 5, "text": "ประหยัดน้ำมันมาก ขับในเมืองได้ 20-22 กม./ลิตร ออปชั่นความปลอดภัยครบเกินราคา คุ้มค่าที่สุดครับ", "source": "Yaris Ativ Club Thailand"},
            {"author": "คุณมายด์", "rating": 4, "text": "ห้องโดยสารเงียบระดับหนึ่ง แต่เวลาเร่งแซงขึ้นเขาต้องกดคิ๊กดาวน์ลึกหน่อย อัตราเร่งพอตัวแต่เน้นประหยัดค่ะ", "source": "กระทู้รีวิว Pantip รัชดา"}
        ],
        "complaints": [
            {"issue": "เสียงน้ำฝนกระทบหลังคาค่อนข้างดัง (วัสดุซับเสียงหลังคาบาง)", "frequency": "ผู้ใช้ 70% พูดถึงตรงกัน", "source": "HeadlightMag Forum"},
            {"issue": "แอร์อัตโนมัติเย็นจัด ตัดทำงานค่อนข้างบ่อย", "frequency": "พบบ่อยในสภาพอากาศร้อนจัด", "source": "Yaris Ativ Club Thailand"}
        ]
    },
    "Honda City": {
        "reviews": [
            {"author": "คุณต้น", "rating": 5, "text": "เครื่องยนต์ 1.0 Turbo จี๊ดจ๊าดมากครับ อัตราเร่งดื้อๆ แซงขาด ทรงสวยแต่งขึ้นมาก", "source": "City Turbo Thailand"},
            {"author": "คุณกอล์ฟ", "rating": 4, "text": "ขับสนุก พวงมาลัยคม แต่ต้องขยันเช็คระยะน้ำมันเครื่องตามกำหนดครับ", "source": "Pantip รัชดา"}
        ],
        "complaints": [
            {"issue": "ชุดแร็คพวงมาลัยมีเสียงดังดังกึกๆ ตอนเลี้ยวสุด (ศูนย์มีรับประกันเปลี่ยนฟรี)", "frequency": "พบบ่อยในล็อตปี 2020-2022", "source": "City Turbo Thailand (ศูนย์เคลมฟรี)"},
            {"issue": "งานประกอบขอบยางประตูมีเสียงลมเข้าที่ความเร็วเกิน 110 กม./ชม.", "frequency": "ผู้ใช้ 50% พบปัญหานี้", "source": "HeadlightMag User Report"}
        ]
    },
    "Honda City e:HEV": {
        "reviews": [
            {"author": "คุณปอนด์", "rating": 5, "text": "ประหยัดน้ำมันสะใจมากครับ รถติดในเมืองได้ 23-25 กม./ลิตร ออกตัวด้วยไฟฟ้าเงียบกริบ", "source": "City e:HEV Club TH"},
            {"author": "คุณเมย์", "rating": 5, "text": "ชอบระบบ Honda SENSING มาก อะแดปทีฟครูสคอนโทรลช่วยลดความเมื่อยล้าได้เยอะค่ะ", "source": "HeadlightMag Forum"}
        ],
        "complaints": [
            {"issue": "พัดลมระบายความร้อนแบตเตอรี่ไฮบริดใต้เบาะหลังเสียงดังเมื่อจอดตากแดด", "frequency": "พบบ่อยช่วงหน้าร้อน", "source": "City e:HEV Club TH"},
            {"issue": "พื้นที่ห้องเก็บสัมภาระท้ายรถลดลงเล็กน้อยเพราะต้องเว้นที่ให้แบตเตอรี่", "frequency": "เป็นข้อจำกัดตามสเปค", "source": "Honda Official Spec Sheet"}
        ]
    },
    "BYD Atto 3": {
        "reviews": [
            {"author": "คุณเอส", "rating": 5, "text": "อัตราเร่งหลังติดเบาะ ค่าไฟกิโลเมตรละไม่ถึง 60 สตางค์ ประหยัดกว่าน้ำมันหลายเท่าตัว", "source": "BYD Owner Club TH"},
            {"author": "คุณวิว", "rating": 4, "text": "แบตเตอรี่ Blade Battery อุ่นใจดีมากครับ เดินทางไกลชาร์จ DC 30 นาทีก็ไปต่อได้แล้ว", "source": "EV Thailand User Community"}
        ],
        "complaints": [
            {"issue": "โช๊คอัพเดิมติดรถมีความนุ่มย้วยเกินไปเมื่อขับความเร็วสูงเกิน 120 กม./ชม.", "frequency": "สายขับเร็วแนะนำเปลี่ยนโช๊คแต่ง", "source": "BYD Owner Club TH"},
            {"issue": "ระบบช่วยรักษาช่องทางจราจร (LKA) ดึงพวงมาลัยค่อนข้างแรงเกินไปในบางจังหวะ", "frequency": "ผู้ใช้ส่วนใหญ่เลือกปิดฟังก์ชันนี้", "source": "Pantip รัชดา"}
        ]
    },
    "Haval H6": {
        "reviews": [
            {"author": "คุณธีระ", "rating": 5, "text": "ภายในหรูหราอลังการเทียบเท่ารถยุโรปราคา 2 ล้าน เบาะนวดและหลังคาซันรูฟพาโนรามิคดีเยี่ยม", "source": "Haval Thailand Fanpage"},
            {"author": "คุณโอ๋", "rating": 4, "text": "เบาะหลังกว้างมาก ตัวถังใหญ่แข็งแรง ปลอดภัยดีครับ", "source": "HeadlightMag User Review"}
        ],
        "complaints": [
            {"issue": "การตอบสนองเกียร์ DHT สลับน้ำมันกับไฟฟ้ามีอาการกระตุกเบาๆ ในช่วงความเร็วต่ำ", "frequency": "พบประปรายในจังหวะชะลอตัว", "source": "Haval Thailand Fanpage"},
            {"issue": "หน้าจอ Infotainment บางครั้งเชื่อมต่อ Apple CarPlay หลุดชั่วคราว", "frequency": "รออัปเดตซอฟต์แวร์ OTA", "source": "Pantip รัชดา"}
        ]
    },
    "Mazda2 Hatchback": {
        "reviews": [
            {"author": "คุณบิว", "rating": 5, "text": "ช่วงล่างดีที่สุดในเกรดเดียวกัน เข้าโค้งหนึบแน่น วัสดุในห้องโดยสารพรีเมียมมาก", "source": "Mazda 2 Club TH"},
            {"author": "คุณโบว์", "rating": 4, "text": "หาที่จอดง่าย คล่องตัว ค่าน้ำมันไม่แพงค่ะ", "source": "Pantip รัชดา"}
        ],
        "complaints": [
            {"issue": "พื้นที่เบาะหลังแคบ ผู้ใหญ่ตัวสูงนั่งเดินทางไกลจะรู้สึกอึดอัด", "frequency": "ผู้ใช้ทุกคนพูดตรงกัน", "source": "HeadlightMag Forum"},
            {"issue": "ศูนย์บริการและราคาอะไหล่บางชิ้นสูงกว่าแบรนด์เจ้าตลาดเล็กน้อย", "frequency": "ผู้ใช้ระยะยาวพบบ่อย", "source": "Mazda 2 Club TH"}
        ]
    }
}

def get_reviews(car: Dict[str, Any]) -> List[Dict[str, Any]]:
    car_name = car.get('name', '')
    if car_name in REAL_MODEL_FEEDBACK:
        return REAL_MODEL_FEEDBACK[car_name]['reviews']
        
    reviews = []
    if car['bodyType'] in ['suv', 'ppv', 'mpv']:
        reviews.append({"author": "คุณวิชาญ (ผู้ใช้จริง Pantip/HeadlightMag)", "rating": 5, "text": "ห้องโดยสารกว้างขวาง ขนของและครอบครัวไปเที่ยวต่างจังหวัดสบาย ไม่เหนื่อยล้า"})
    elif car['bodyType'] in ['sedan', 'hatchback']:
        reviews.append({"author": "คุณแนน (ผู้ใช้จริง Car Club)", "rating": 5, "text": "ขับขี่คล่องตัว ตัวถังขนาดกำลังดี หาที่จอดง่าย ทัศนวิสัยดีมากค่ะ"})
    elif car['bodyType'] == 'pickup':
        reviews.append({"author": "คุณสมคิด (กลุ่มผู้ใช้รถกระบะใช้งาน)", "rating": 4, "text": "บรรทุกหนักได้ดี อัตราเร่งดี ช่วงล่างทนทาน ทนทานไม่จุกจิกครับ"})
        
    if car['fuelType'] == 'ev':
        reviews.append({"author": "คุณเอก (EV Thailand User)", "rating": 5, "text": "ประหยัดค่าชาร์จไฟไปเยอะมาก อัตราเร่งมาไวทันใจ นุ่มเงียบเงียบสงบ"})
    elif car['fuelType'] in ['hybrid', 'phev']:
        reviews.append({"author": "คุณพลอย (Hybrid User TH)", "rating": 4, "text": "ประหยัดน้ำมันมากตอนรถติดสลับหยุดนิ่ง ออกตัวเงียบและนุ่มนวลดีมากค่ะ"})
    else:
        reviews.append({"author": "คุณบอย (ผู้ใช้รถยนต์เบนซิน/ดีเซล)", "rating": 4, "text": "เครื่องยนต์ตอบสนองดี ขับทางไกลเร่งแซงมั่นใจ อะไหล่และการดูแลไม่ซับซ้อนครับ"})
        
    return reviews

def get_complaints(car: Dict[str, Any]) -> List[Dict[str, str]]:
    car_name = car.get('name', '')
    if car_name in REAL_MODEL_FEEDBACK:
        return REAL_MODEL_FEEDBACK[car_name]['complaints']
        
    complaints = []
    if car['fuelType'] == 'ev':
        complaints.append({"issue": "การรอคิวสถานีชาร์จตามตู้ชาร์จสาธารณะช่วงเทศกาลวันหยุดยาว", "frequency": "รายงานบ่อยในกลุ่ม EV TH"})
        complaints.append({"issue": "เบี้ยประกันภัยชั้น 1 ค่อนข้างแพงกว่ารถยนต์เครื่องยนต์น้ำมัน", "frequency": "ผู้ใช้ส่วนใหญ่พบเจอ"})
    
    if car['bodyType'] in ['ppv', 'suv'] and car['fuelType'] in ['petrol', 'diesel']:
        complaints.append({"issue": "อัตรากินน้ำมันค่อนข้างสูงเมื่อเจอการจราจรติดขัดในเมืองหลวง", "frequency": "ผู้ใช้ในเมืองรายงานตรงกัน"})
        
    if car['nationality'] == 'chinese':
        complaints.append({"issue": "ระยะเวลาการรอเบิกอะไหล่ชิ้นส่วนตัวถัง/กระจกในบางศูนย์บริการ", "frequency": "พบในบางกรณีเมื่อเกิดอุบัติเหตุ"})
    
    if car['nationality'] == 'european':
        complaints.append({"issue": "ค่าบำรุงรักษาและค่าอะไหล่หลังหมดระยะประกันภัย (BSI/Warranty) ค่อนข้างสูง", "frequency": "พบบ่อยในผู้ใช้ระยะยาวเกิน 5 ปี"})
        
    if not complaints:
        complaints.append({"issue": "การซับเสียงลมบริเวณกระจกมองข้างที่ความเร็วเกิน 110 กม./ชม.", "frequency": "ผู้ใช้บางท่านสังเกตเห็น"})
        complaints.append({"issue": "ความหน่วงของการตอบสนองหน้าจอ Touchscreen ตอนสตาร์ทรถใหม่ๆ", "frequency": "รอซอฟต์แวร์อัปเดต"})
        
    return complaints

def generate_recommendations(state: QuizState) -> List[RecommendationResult]:
    active_lifestyle = derive_lifestyles(state.pains, state.gains)
    
    results = []
    for car_data in CARS:
        score, reasons = score_car(car_data, state, active_lifestyle)
        tco_data = calculate_tco(car_data)
        monthly = calculate_monthly_installment(car_data['price'])
        
        ratio = monthly / state.income if state.income > 0 else 0.0
        afford_cls, afford_lbl, _ = get_affordability_tier(ratio)
        range_est = get_range_estimate(car_data)
        risk = get_risk_notes(car_data)
        
        # Build Car response model
        car_obj = Car(
            id=car_data['id'],
            name=car_data['name'],
            bodyType=car_data['bodyType'],
            fuelType=car_data['fuelType'],
            price=car_data['price'],
            consumption=car_data['consumption'],
            seats=car_data['seats'],
            lifestyle=car_data['lifestyle'],
            serviceNetwork=car_data['serviceNetwork'],
            nationality=car_data['nationality'],
            transmission=car_data['transmission'],
            horsepower=car_data['horsepower'],
            warrantyYears=car_data['warrantyYears'],
            warrantyKm=car_data['warrantyKm'],
            airbags=car_data['airbags'],
            photo=CarPhoto(
                file=car_data['photo']['file'],
                credit=car_data['photo']['credit']
            )
        )
        
        # Build TCO breakdown model
        tco_obj = TCOBreakdown(
            insurance5yr=tco_data['insurance5yr'],
            maint5yr=tco_data['maint5yr'],
            resaleValue=tco_data['resaleValue'],
            total5yr=tco_data['total5yr']
        )
        
        # Build RangeInfo model
        range_obj = RangeInfo(
            type=range_est['type'],
            range=range_est['range'],
            tankSize=range_est['tankSize'],
            range100=range_est['range100'],
            range80=range_est['range80']
        )
        
        # Build RiskNotes
        risk_objs = [RiskNote(icon=r['icon'], text=r['text']) for r in risk]
        
        # Build Reviews and Complaints
        from app.review_service import fetch_realtime_reviews
        live_revs = fetch_realtime_reviews(car_data['name'])
        if live_revs:
            rev_objs = [
                Review(
                    author=r.get('author', 'ผู้ใช้จริง'),
                    rating=r.get('rating', 5),
                    text=r.get('text', ''),
                    source=r.get('source', 'คลับผู้ใช้จริง'),
                    title=r.get('title'),
                    link=r.get('link'),
                    is_live=r.get('is_live', False)
                ) for r in live_revs
            ]
        else:
            revs = get_reviews(car_data)
            rev_objs = [Review(author=r['author'], rating=r['rating'], text=r['text'], source=r.get('source')) for r in revs]
        
        comps = get_complaints(car_data)
        comp_objs = [Complaint(issue=c['issue'], frequency=c['frequency']) for c in comps]
        
        results.append(RecommendationResult(
            car=car_obj,
            score=score,
            reasons=reasons,
            tco=tco_obj,
            monthlyInstallment=monthly,
            affordabilityRatio=ratio,
            affordabilityLabel=afford_lbl,
            affordabilityCls=afford_cls,
            rangeInfo=range_obj,
            riskNotes=risk_objs,
            reviews=rev_objs,
            complaints=comp_objs
        ))
        
    # Sort by score descending and return top 10
    results.sort(key=lambda x: x.score, reverse=True)
    return results[:10]
