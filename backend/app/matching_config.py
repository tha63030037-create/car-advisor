# -*- coding: utf-8 -*-
"""
Every tunable number of the v2 matching engine lives here, so each one can be
explained to the committee and changed without touching the engine.
"""

# 4.2 Card zones -> points
ZONE_POINTS = {"most": 3, "important": 2, "less": 1}
CRITERIA = ["budget", "lifestyle", "running_cost", "safety", "design"]
CRITERIA_TH = {
    "budget": "งบประมาณ",
    "lifestyle": "ไลฟ์สไตล์และการใช้งาน",
    "running_cost": "ค่าใช้จ่ายระยะยาว",
    "safety": "ความปลอดภัยและเทคโนโลยี",
    "design": "รูปทรงและดีไซน์",
}

# 4.3 Stretchable budget
DEFAULT_STRETCH = 0.15
STRETCH_OPTIONS = {"none": 0.0, "little": 0.10, "worth_it": 0.20}

# 4.4 Lifestyle feature thresholds (sources noted for the committee)
CARGO_OK_L = 400            # ~ a mid SUV boot; fits camping gear / a large dog crate
CARGO_WORK_L = 500          # loading goods without a pickup bed
GROUND_OFFROAD_MM = 200     # common rule of thumb for unpaved camp roads
CITY_ECON_KML = 17          # petrol km/l considered economical in city use
LONG_TRIP_ECON_KML = 16
LOW_MAINT_5Y_THB = 40000    # below this counts as "low maintenance"

LIFESTYLES = ["school_run", "camping", "merit_family", "pets", "city", "long_trips", "work_cargo"]
LIFESTYLE_TH = {
    "school_run": "ส่งลูกไปเรียน",
    "camping": "ครอบครัวสายแคมป์ปิ้ง",
    "merit_family": "ครอบครัวสายทำบุญ พาผู้ใหญ่ไปด้วย",
    "pets": "เลี้ยงสัตว์",
    "city": "ขับในเมืองเป็นหลัก",
    "long_trips": "เดินทางไกลบ่อย",
    "work_cargo": "ใช้ทำงาน ขนของ",
}
FEATURE_TH = {
    "isofix": "จุดยึดเบาะเด็ก",
    "compact": "ตัวรถไม่ใหญ่ จอดง่าย",
    "city_economy": "ประหยัดน้ำมันในเมือง",
    "aeb": "เบรกอัตโนมัติ",
    "ground_clearance": "ใต้ท้องสูง",
    "cargo_large": "ท้ายรถจุเยอะ",
    "roof_rails": "ราวหลังคา",
    "four_wd": "ขับเคลื่อนสี่ล้อ",
    "seven_seats": "7 ที่นั่งขึ้นไป",
    "easy_entry": "ขึ้นลงง่าย",
    "rear_ac": "ช่องแอร์หลัง",
    "fold_flat": "เบาะหลังพับราบ",
    "parking_aid": "ระบบช่วยจอด",
    "adaptive_cruise": "ระบบช่วยขับทางไกล",
    "highway_economy": "ประหยัดนอกเมือง",
    "cargo_work": "ท้ายรถหรือกระบะขนของได้",
    "low_maintenance": "ค่าบำรุงรักษาต่ำ",
    "lane_assist": "ระบบช่วยรักษาเลน",
}
# Feature -> weight inside each lifestyle (revised 26 Nov 2026). The defining feature counts more
# (a pickup bed for work, ground clearance for camping). Fuel economy and maintenance cost were taken
# out of the lifestyles because the running-cost card already scores them: counting them twice made
# every EV win every lifestyle.
LIFESTYLE_FEATURES = {
    "school_run": {"isofix": 1, "compact": 1, "aeb": 1},
    "camping": {"ground_clearance": 2, "cargo_large": 1, "roof_rails": 1, "four_wd": 1},
    "merit_family": {"seven_seats": 2, "easy_entry": 1, "rear_ac": 1},
    "pets": {"cargo_large": 1, "fold_flat": 1, "rear_ac": 1},
    "city": {"compact": 2, "parking_aid": 1},
    "long_trips": {"adaptive_cruise": 1, "lane_assist": 1, "cargo_large": 1},
    "work_cargo": {"cargo_work": 3, "fold_flat": 1},
}

# 4.5 Running cost assumptions
DEFAULT_KM_PER_YEAR = 15000
FUEL_PRICE_THB = {"petrol": 38.0, "hybrid": 38.0, "diesel": 32.0}
EV_PRICE_THB_PER_KWH = 6.0   # home/public charging mix
ADAS_ITEMS = ["aeb", "lane_assist", "adaptive_cruise", "parking_sensors", "camera_360"]
MAX_AIRBAGS = 8              # most in the database; keeps safety scores stable across searches
# ASEAN NCAP crash result, when known, is the strongest safety evidence: it takes this share of the
# safety score and equipment (airbags + ADAS) the rest. Unknown = equipment only (never treated as 0).
NCAP_SHARE = 0.5
NCAP_WARN_MAX_STARS = 2      # at or below this, the result card and the explanation carry a warning

# 4.5 Design: body types treated as "close" to each preference
BODY_SIMILAR = {
    "sedan": ["hatchback", "coupe"],
    "hatchback": ["sedan"],
    "coupe": ["sedan"],
    "suv": ["ppv", "mpv"],
    "ppv": ["suv", "pickup"],
    "mpv": ["suv", "ppv"],
    "pickup": ["ppv"],
}

# 4.4 (revised 26 Nov 2026) continuous feature scales: value at which a feature scores 0 and 1.
# Replaces yes/no thresholds, which put most cars on 0, .33, .67 or 1 and produced ties.
COMPACT_LENGTH_MM = (4750, 4300)     # >= 4.75 m scores 0, <= 4.30 m scores 1 (easy to park in Bangkok)
CITY_COST_PER_KM = (2.6, 1.2)        # energy baht/km: >= 2.6 scores 0, <= 1.2 scores 1
HIGHWAY_COST_PER_KM = (2.6, 1.2)
CARGO_LARGE_L = (250, 500)
CARGO_WORK_L_RANGE = (300, 900)   # a boot never matches a pickup bed (bed = 1)
GROUND_MM = (150, 210)
MAINT_5Y_THB = (60000, 25000)
# Safety: a car with no ASEAN NCAP result is treated as a middle result (3 of 5 stars) — never as 0,
# and never better than a car that was tested and scored 4-5 stars.
NCAP_UNKNOWN_STARS = 3
# Running cost is scored on a fixed scale taken from the whole catalogue (5th-95th percentile of
# yearly cost), so a car's score no longer changes when other cars are filtered in or out.
COST_SCALE_PERCENTILES = (5, 95)

# Monthly income (added 26 Nov 2026; since 26 Nov late evening only asked of buyers who finance and used
# for information only: installment and its share of income, never a filter or a score). Thai car-buying guides put the installment at no more than 30% of
# income (Sanook Auto, Autospinn); lenders rarely approve more than about half of income (Sanook Auto).
# The installment is an estimate with fixed assumptions, not a finance quote.
FIN_DOWN = 0.25          # down payment share (guides suggest 15-25%+)
FIN_YEARS = 5            # 60 monthly payments
FIN_FLAT_RATE = 0.03     # flat interest per year, assumed
INCOME_COMFORT = 0.30    # installment <= 30% of income: comfortable
INCOME_MAX = 0.50        # above 50%: lenders rarely approve -> labelled 'เกินกำลังผ่อน'

MIN_RESULTS = 3
DEFAULT_TOP_N = 10

# After-sales (added 28 Nov 2026, from the empathy map: buyers lean to brands that are "easy to fix,
# cheap parts, easy to resell"). Proxy: how many cars of the brand were registered in Thailand
# Jan-Oct 2569 (Department of Land Transport, compiled by car250.com, 14 Nov 2026). More cars on the
# road means more service points, parts and buyers for a used car. Log scale: <= 300 cars scores 0,
# >= 100,000 scores 1. A brand not in the list scores in the middle (0.5), like an untested car.
AFTERSALES_SHARE = 0.25            # share of the running-cost card; the rest is yearly energy + maintenance
AFTERSALES_REG_RANGE = (300, 100000)
AFTERSALES_UNKNOWN = 0.5
AFTERSALES_SOURCE = "ยอดจดทะเบียนรถใหม่ ม.ค.–ต.ค. 2569 กรมการขนส่งทางบก (รวบรวมโดย car250.com 14 พ.ย. 2569)"
BRAND_REGISTRATIONS_2569 = {
    "Toyota": 208209, "Honda": 64016, "Isuzu": 54912, "BYD": 37721, "Omoda": 29894, "Jaecoo": 29894,
    "MG": 28191, "Mitsubishi": 22538, "GWM": 16895, "GAC": 16515, "Hyptec": 16515, "Geely": 14795,
    "Ford": 13908, "Deepal": 12096, "Tesla": 9732, "Chery": 8526, "BMW": 7850, "Mazda": 7507,
    "Nissan": 6750, "Mercedes-Benz": 6041, "Zeekr": 5951, "Changan": 5672, "XPENG": 5443,
    "Suzuki": 3978, "Hyundai": 2120, "Riddara": 1694, "MINI": 1559, "Volvo": 1503, "Porsche": 1276,
    "Kia": 1238, "AVATR": 1200, "Denza": 1049, "Lexus": 699, "Audi": 360, "Neta": 299, "Subaru": 223,
    "Peugeot": 72,
}
