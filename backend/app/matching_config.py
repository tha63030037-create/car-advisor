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
}
LIFESTYLE_FEATURES = {
    "school_run": ["isofix", "compact", "city_economy", "aeb"],
    "camping": ["ground_clearance", "cargo_large", "roof_rails", "four_wd"],
    "merit_family": ["seven_seats", "easy_entry", "rear_ac"],
    "pets": ["fold_flat", "cargo_large", "rear_ac"],
    "city": ["compact", "city_economy", "parking_aid"],
    "long_trips": ["adaptive_cruise", "highway_economy", "cargo_large"],
    "work_cargo": ["cargo_work", "fold_flat", "low_maintenance"],
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

MIN_RESULTS = 3
DEFAULT_TOP_N = 10
