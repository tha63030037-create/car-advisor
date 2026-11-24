# -*- coding: utf-8 -*-
"""
Build backend/app/data/car_specs.json — the extra fields the v2 matching
engine needs (spec section 3) for all cars in app/database.py.

Every value produced here by a rule (not from an official spec sheet) is
listed in the car's "estimated" array, so the UI and the AI explanation can
say "ค่าประมาณ". Replace a value with a verified one by editing
data/car_specs_overrides.json (keyed by car id) and re-running this script:
fields set in the overrides file are removed from "estimated" automatically
unless the override itself lists them as estimated.

Run from the backend folder:
    python scripts/build_car_specs.py
"""
import csv
import json
import os
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
sys.path.insert(0, BACKEND)

from app.database import CARS  # noqa: E402

DATA_DIR = os.path.join(BACKEND, "app", "data")
OUT_JSON = os.path.join(DATA_DIR, "car_specs.json")
OVERRIDES = os.path.join(DATA_DIR, "car_specs_overrides.json")
AUDIT_CSV = os.path.join(DATA_DIR, "car_specs_audit.csv")

TODAY = date.today().isoformat()
RULE_SOURCE = "Rule-based estimate v1 (body type, price tier, brand group) — needs verification"

# ---------------------------------------------------------------- brands
MULTIWORD_BRANDS = ["GWM ORA", "GWM Haval", "GWM Tank", "GWM Poer", "MG Maxus", "Changan Deepal"]
BRAND_FIX = {
    "MG3": "MG", "MG4": "MG", "MG5": "MG",
    "Mazda2": "Mazda", "Mazda3": "Mazda",
}
BRAND_GROUP = {
    "Toyota": "japan", "Honda": "japan", "Mazda": "japan", "Nissan": "japan",
    "Isuzu": "japan", "Mitsubishi": "japan", "Suzuki": "japan", "Subaru": "japan",
    "Hyundai": "korea", "Kia": "korea",
    "Volvo": "euro", "BMW": "euro", "Peugeot": "euro", "Mercedes-Benz": "euro", "MINI": "euro",
    "Audi": "euro", "Porsche": "euro", "Lexus": "japan",
    "Tesla": "usa", "Ford": "usa",
}


def brand_of(name):
    first = name.split(" ")[0]
    first = BRAND_FIX.get(first, first)
    if first == "Changan" and "Deepal" in name:
        return "Deepal"
    return first


def model_of(name, brand):
    raw_first = name.split(" ")[0]
    if raw_first in BRAND_FIX:  # "MG3 Hybrid+" -> model "3 Hybrid+"
        return name[len(BRAND_FIX[raw_first]):].strip()
    rest = name.split(" ", 1)[1] if " " in name else name
    if rest.startswith("Deepal "):
        rest = rest[len("Deepal "):]
    return rest


def group_of(brand):
    return BRAND_GROUP.get(brand, "china")


# --------------------------------------------------------- known facts
# Drivetrain with 4WD/AWD available on the variant in the DB (general market knowledge,
# still flagged estimated until checked against the brochure).
FOUR_WD = {
    12, 13,        # Fortuner / Legender (4x4 trims)
    16,            # Hilux Revo Rocco 4x4
    19, 106,       # GR Yaris / GR Corolla
    43,            # Mazda CX-60
    50, 55, 58, 98,  # Terra, MU-X, Pajero Sport, Everest
    54, 57, 100,   # D-Max V-Cross, Triton Athlete, Ranger Raptor
    66,            # Jimny
    68, 112,       # Subaru Forester, Crosstrek
    72,            # Kia EV9
    86,            # AVATR 11 (dual motor)
    91, 113, 121,  # Tank 300, Tank 500, Poer Sahar
    102,           # Volvo XC60 T8
    111,           # Riddara RD6 AWD
    124,           # Santa Fe Hybrid AWD
}
GROUND_OVERRIDE = {66: 210, 68: 220, 112: 220, 91: 224, 113: 224}
NOT_EASY_ENTRY = {66, 91, 113, 18, 105, 81, 45, 107}  # tall off-roaders / low sports cars


def ev(car):
    return car["fuelType"] == "ev"


def economy_value(car):
    try:
        return float(car["consumption"].split()[0])
    except (ValueError, IndexError):
        return None


def derive(car):
    """Return (fields, estimated_field_names) for one car."""
    cid, body, price, seats = car["id"], car["bodyType"], car["price"], car["seats"]
    brand = brand_of(car["name"])
    grp = group_of(brand)
    est = []

    def put(key, value):
        out[key] = value
        est.append(key)

    out = {
        "id": cid,
        "brand": brand,
        "model": model_of(car["name"], brand),
        "brand_group": grp,
        "economy": economy_value(car),
        "economy_unit": "km/kWh" if ev(car) else "km/l",
    }

    put("doors", 2 if (body == "coupe" or (body == "pickup" and seats <= 3))
        else (5 if body in ("hatchback", "suv", "mpv", "ppv") else 4))
    put("drivetrain", "4WD" if cid in FOUR_WD else "2WD")

    gc = {"sedan": 140, "hatchback": 150, "coupe": 125, "suv": 185,
          "ppv": 225, "pickup": 230, "mpv": 175}[body]
    if body == "suv" and ev(car):
        gc = 165
    if body == "mpv" and ev(car):
        gc = 150
    if body == "pickup" and seats <= 3:
        gc = 200
    put("ground_clearance_mm", GROUND_OVERRIDE.get(cid, gc))

    if body == "pickup":
        put("cargo_l", None)
        put("has_cargo_bed", True)
    else:
        cargo = {"hatchback": 300, "sedan": 450, "coupe": 200, "suv": 400,
                 "ppv": 300, "mpv": 300}[body]
        if body == "sedan" and price >= 1000000:
            cargo = 500
        if body == "suv":
            cargo = 350 if price < 850000 else (500 if price >= 1200000 else 400)
        if body == "mpv" and seats >= 8:
            cargo = 600
        put("cargo_l", cargo)
        put("has_cargo_bed", False)

    put("rear_seat_fold_flat", body in ("hatchback", "suv", "mpv", "ppv") and seats >= 4)
    put("rear_ac_vents", body != "coupe" and (seats >= 7 or price >= 950000
                                              or (grp == "china" and price >= 799000)))
    put("roof_rails", (body in ("suv", "ppv") and price >= 800000 and cid != 66) or cid == 60)
    put("isofix", not (body == "pickup" and seats <= 3) and not (body == "coupe" and seats <= 2))
    put("easy_entry", body in ("mpv", "suv") and cid not in NOT_EASY_ENTRY)
    put("compact", body in ("hatchback", "sedan", "suv") and price < 900000 and seats <= 5)

    two_airbag = car["airbags"] <= 2
    aeb = (not two_airbag) and (price >= 850000
                                or (brand in ("Toyota", "Honda") and price >= 580000)
                                or (grp == "china" and price >= 699000))
    acc = (not two_airbag) and (price >= 1000000
                                or (grp == "china" and price >= 799000)
                                or (brand == "Honda" and price >= 839000))
    adas = {
        "aeb": aeb,
        "lane_assist": aeb,
        "adaptive_cruise": acc,
        "parking_sensors": price >= 700000,
        "camera_360": price >= 1100000 or (grp == "china" and price >= 799000),
    }
    put("adas", adas)

    base = {"petrol": 42000, "hybrid": 38000, "diesel": 50000, "ev": 14000}[car["fuelType"]]
    mult = {"euro": 1.8, "china": 0.95}.get(grp, 1.0)
    if cid in (18, 19, 21, 27, 105, 106, 100):  # performance / luxury
        mult *= 1.4
    if body in ("pickup", "ppv") and car["fuelType"] == "diesel":
        mult *= 1.1
    if price > 2000000:
        mult *= 1.3
    put("maintenance_5y_thb", int(round(base * mult / 1000.0)) * 1000)

    out["year"] = 2026
    est.append("year")
    out["photo_is_ai_generated"] = "Wikimedia" not in ((car.get("photo") or {}).get("credit") or "")
    out["source"] = RULE_SOURCE
    out["collected_on"] = TODAY
    return out, est


def main():
    overrides = {}
    if os.path.exists(OVERRIDES):
        with open(OVERRIDES, encoding="utf-8") as f:
            overrides = {int(k): v for k, v in json.load(f).items() if not k.startswith("_")}

    rows = []
    for car in CARS:
        fields, est = derive(car)
        ov = overrides.get(car["id"], {})
        ov_est = set(ov.get("estimated", []))
        for k, v in ov.items():
            if k == "estimated":
                continue
            if k == "adas" and isinstance(v, dict):
                fields["adas"] = dict(fields["adas"], **v)
            else:
                fields[k] = v
            if k in est and k not in ov_est:
                est.remove(k)
        if ov and "source" not in ov:
            fields["source"] = "Mixed: verified overrides + " + RULE_SOURCE
        fields["estimated"] = sorted(set(est) | ov_est)
        rows.append(fields)

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)

    cols = ["id", "brand", "model", "price", "bodyType", "fuelType", "seats", "airbags",
            "economy", "drivetrain", "ground_clearance_mm", "cargo_l", "has_cargo_bed",
            "rear_seat_fold_flat", "rear_ac_vents", "roof_rails", "isofix", "easy_entry",
            "compact", "aeb", "lane_assist", "adaptive_cruise", "parking_sensors",
            "camera_360", "maintenance_5y_thb", "n_estimated", "source"]
    by_id = {c["id"]: c for c in CARS}
    with open(AUDIT_CSV, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for r in rows:
            c = by_id[r["id"]]
            flat = dict(r, **r["adas"])
            flat.update(price=c["price"], bodyType=c["bodyType"], fuelType=c["fuelType"],
                        seats=c["seats"], airbags=c["airbags"], n_estimated=len(r["estimated"]))
            w.writerow([flat.get(k) for k in cols])

    n_est = sum(1 for r in rows if r["estimated"])
    print("wrote %d cars -> %s (%d still have estimated fields)" % (len(rows), OUT_JSON, n_est))


if __name__ == "__main__":
    main()
