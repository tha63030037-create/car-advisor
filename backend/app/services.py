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
    reasons = []

    # Budget - 30 points
    budget = state.budget
    price = car['price']
    budget_score = 0
    if price <= budget:
        budget_score = 30  # Removed the cheap car penalty
        reasons.append("ราคาอยู่ในงบประมาณที่ตั้งไว้")
    else:
        over = (price - budget) / budget
        budget_score = max(0, 12 - over * 70)
        reasons.append(f"ราคาเกินงบไปราว {round(over * 100)}%")

    # Lifestyle - 25 points
    lifestyle_score = 0
    overlap = [l for l in car['lifestyle'] if l in active_lifestyle]
    if overlap:
        lifestyle_score = min(25, 15 + (len(overlap) - 1) * 5)
        lbls = [LIFESTYLE_LABEL.get(l, l) for l in overlap]
        reasons.append(f"ตรงกับสาย{ ' + '.join(lbls) }")
    else:
        lifestyle_score = 6

    # Body Type - 20 points
    body_score = 0
    bt = state.bodytype
    if bt == "unsure":
        body_score = 14
    elif car['bodyType'] == bt:
        body_score = 20
        reasons.append(f"เป็นทรง {BODYTYPE_LABEL.get(bt, bt)} ตามที่ชอบ")
    else:
        body_score = 4

    # Fuel / engine - 15 points
    fuel_score = 0
    fuel = state.fuel
    if fuel == "any":
        fuel_score = 9
    elif car['fuelType'] == fuel:
        fuel_score = 15
        reasons.append(f"เครื่องยนต์{FUEL_LABEL.get(fuel, fuel)}ตามที่เลือก")
    else:
        fuel_score = 1

    # Brands - 10 points
    brand_score = 0
    brands = state.brands
    if not brands or len(brands) == 0 or "any" in brands:
        brand_score = 6
    else:
        car_brand = car['name'].split(" ")[0].lower()
        matched = any(b.lower() == car_brand for b in brands)
        if matched:
            brand_score = 10
            reasons.append(f"เป็นแบรนด์ {car['name'].split(' ')[0]} ในดวงใจ")
        else:
            brand_score = 1

    # Apply Priority Multiplier
    prio = getattr(state, "priority", "none")
    if prio == "budget":
        budget_score *= 1.3
    elif prio == "lifestyle":
        lifestyle_score *= 1.3
    elif prio == "bodytype":
        body_score *= 1.3
    elif prio == "brand":
        brand_score *= 1.5
        
    score = budget_score + lifestyle_score + body_score + fuel_score + brand_score

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

def get_reviews(car: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    No owner reviews are shown. The earlier version shipped invented quotes labelled as
    real users; they were removed so every text the app shows can be traced to a source.
    Real reviews can come back only with a citable source per quote.
    """
    return []


def get_complaints(car: Dict[str, Any]) -> List[Dict[str, str]]:
    """Same rule as get_reviews: nothing is shown without a citable source."""
    return []
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
        
    # Sort by score descending and return top 15 recommendations
    results.sort(key=lambda x: x.score, reverse=True)
    return results[:15]
