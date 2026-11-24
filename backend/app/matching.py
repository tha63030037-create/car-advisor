# -*- coding: utf-8 -*-
"""
v2 matching engine (IS spec section 4).

Two stages:
  1. Filters (4.1) remove cars the user would never accept.
  2. Scoring ranks what is left with *this user's* weights (4.2) over five
     criteria scored 0-1 (4.3-4.5), combined into a 0-100 match score (4.6).

The engine is deterministic and has no AI in it: the same criteria always
give the same ranking. The old fixed-weight engine (services.py) is kept
untouched as the comparison baseline.
"""
import json
import os
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator

from app import matching_config as cfg
from app.database import CARS

DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "car_specs.json")


# ------------------------------------------------------------------ models
class Priorities(BaseModel):
    """Card zone points per criterion: 3 = most important, 2 = important, 1 = less."""
    budget: int = 2
    lifestyle: int = 2
    running_cost: int = 2
    safety: int = 2
    design: int = 2

    @field_validator("*")
    @classmethod
    def _points(cls, v):
        if v not in (1, 2, 3):
            raise ValueError("priority points must be 1, 2 or 3")
        return v


class Criteria(BaseModel):
    """Shared by quiz and chat (spec 5.2). Unknown values stay null — never guessed."""
    budget: int = Field(..., gt=0)
    budget_stretch: float = Field(cfg.DEFAULT_STRETCH, ge=0, le=0.5)
    brand_only: List[str] = []
    brand_exclude: List[str] = []
    seats_min: Optional[int] = Field(None, ge=1, le=15)
    fuel_only: Optional[List[str]] = None
    fuel_exclude: List[str] = []
    body_preferred: List[str] = []
    lifestyles: List[str] = []
    km_per_year: int = Field(cfg.DEFAULT_KM_PER_YEAR, gt=0, le=200000)
    priorities: Priorities = Priorities()
    top_n: int = Field(cfg.DEFAULT_TOP_N, ge=1, le=125)

    @field_validator("lifestyles")
    @classmethod
    def _known_lifestyles(cls, v):
        bad = [x for x in v if x not in cfg.LIFESTYLES]
        if bad:
            raise ValueError("unknown lifestyles: %s" % ", ".join(bad))
        return v


# -------------------------------------------------------------------- data
def _load_cars():
    with open(DATA_PATH, encoding="utf-8") as f:
        specs = {s["id"]: s for s in json.load(f)}
    merged = []
    for car in CARS:
        s = specs.get(car["id"])
        if s is None:
            raise RuntimeError("car_specs.json is missing car id %s — run scripts/build_car_specs.py" % car["id"])
        merged.append(dict(car, **{k: v for k, v in s.items() if k != "id"}))
    return merged


def _features(car):
    """Boolean lifestyle features for one car; None means unknown (skipped, never 0)."""
    def opt(x):
        return None if x is None else bool(x)

    econ, fuel = car.get("economy"), car["fuelType"]
    if econ is None:
        city_econ = hwy_econ = None
    elif fuel == "ev":
        city_econ = hwy_econ = True
    else:
        city_econ = fuel == "hybrid" or econ >= cfg.CITY_ECON_KML
        hwy_econ = econ >= cfg.LONG_TRIP_ECON_KML
    cargo, bed = car.get("cargo_l"), car.get("has_cargo_bed")
    cargo_large = True if bed else (None if cargo is None else cargo >= cfg.CARGO_OK_L)
    cargo_work = True if bed else (None if cargo is None else cargo >= cfg.CARGO_WORK_L)
    adas = car.get("adas") or {}
    gc = car.get("ground_clearance_mm")
    m5 = car.get("maintenance_5y_thb")
    return {
        "isofix": opt(car.get("isofix")),
        "compact": opt(car.get("compact")),
        "city_economy": city_econ,
        "aeb": opt(adas.get("aeb")),
        "ground_clearance": None if gc is None else gc >= cfg.GROUND_OFFROAD_MM,
        "cargo_large": cargo_large,
        "roof_rails": opt(car.get("roof_rails")),
        "four_wd": None if car.get("drivetrain") is None else car["drivetrain"] in ("4WD", "AWD"),
        "seven_seats": car["seats"] >= 7,
        "easy_entry": opt(car.get("easy_entry")),
        "rear_ac": opt(car.get("rear_ac_vents")),
        "fold_flat": opt(car.get("rear_seat_fold_flat")),
        "parking_aid": opt(adas.get("parking_sensors")),
        "adaptive_cruise": opt(adas.get("adaptive_cruise")),
        "highway_economy": hwy_econ,
        "cargo_work": cargo_work,
        "low_maintenance": None if m5 is None else m5 <= cfg.LOW_MAINT_5Y_THB,
    }


def lifestyle_fit(car):
    """0-1 fit per lifestyle = share of known features the car has (spec 4.4)."""
    feats = _features(car)
    fit = {}
    for ls, keys in cfg.LIFESTYLE_FEATURES.items():
        known = [feats[k] for k in keys if feats[k] is not None]
        fit[ls] = round(sum(known) / float(len(known)), 4) if known else None
    return fit, feats


CARS_V2 = _load_cars()
# Pre-computed once at import (spec 3: stored, not recomputed per request)
for _c in CARS_V2:
    _c["lifestyle_fit"], _c["_features"] = lifestyle_fit(_c)


# ----------------------------------------------------------------- helpers
def weights_from_priorities(p):
    pts = {k: getattr(p, k) for k in cfg.CRITERIA}
    total = float(sum(pts.values()))
    return {k: v / total for k, v in pts.items()}


def annual_cost(car, km_per_year):
    econ, fuel = car.get("economy"), car["fuelType"]
    if not econ:
        energy = None
    elif fuel == "ev":
        energy = km_per_year / econ * cfg.EV_PRICE_THB_PER_KWH
    else:
        energy = km_per_year / econ * cfg.FUEL_PRICE_THB[fuel]
    m5 = car.get("maintenance_5y_thb")
    maint = None if m5 is None else m5 / 5.0
    if energy is None and maint is None:
        return None
    return {
        "energy": None if energy is None else round(energy),
        "maintenance": None if maint is None else round(maint),
        "total": round((energy or 0) + (maint or 0)),
    }


def _norm_brand(b):
    return b.strip().lower()


def _fuels(car):
    return {car["fuelType"]}


# ----------------------------------------------------------------- filters
def _filter_checks(c):
    """Each filter as (name, Thai label, predicate). Order is the order shown to users."""
    ceiling = c.budget * (1 + c.budget_stretch)
    only = {_norm_brand(b) for b in c.brand_only}
    excl = {_norm_brand(b) for b in c.brand_exclude}
    checks = []
    if only:
        checks.append(("brand_only", "เอาเฉพาะแบรนด์ " + ", ".join(c.brand_only),
                       lambda car: _norm_brand(car["brand"]) in only))
    if excl:
        checks.append(("brand_exclude", "ไม่เอาแบรนด์ " + ", ".join(c.brand_exclude),
                       lambda car: _norm_brand(car["brand"]) not in excl))
    if c.seats_min:
        checks.append(("seats_min", "ต้องนั่งได้อย่างน้อย %d คน" % c.seats_min,
                       lambda car: car["seats"] >= c.seats_min))
    if c.fuel_only:
        fo = set(c.fuel_only)
        checks.append(("fuel_only", "เชื้อเพลิง: " + ", ".join(c.fuel_only),
                       lambda car: bool(_fuels(car) & fo)))
    if c.fuel_exclude:
        fx = set(c.fuel_exclude)
        checks.append(("fuel_exclude", "ไม่เอาเชื้อเพลิง: " + ", ".join(c.fuel_exclude),
                       lambda car: not (_fuels(car) & fx)))
    checks.append(("budget_ceiling", "ราคาไม่เกินงบ + ยืดได้ %d%%" % round(c.budget_stretch * 100),
                   lambda car: car["price"] <= ceiling))
    return checks


def apply_filters(cars, c):
    checks = _filter_checks(c)
    passed = [car for car in cars if all(fn(car) for _, _, fn in checks)]
    removed_by = []
    for name, label, fn in checks:
        n = sum(1 for car in cars if not fn(car))
        removed_by.append({"filter": name, "label": label, "removed": n})
    removed_by.sort(key=lambda x: -x["removed"])
    return passed, removed_by


# ----------------------------------------------------------------- scores
def score_budget(price, budget, m):
    """4.3: full marks within budget, linear penalty by % over budget, cut beyond ceiling."""
    if price <= budget:
        return 1.0
    if m <= 0:
        return None  # filtered out
    over = (price - budget) / float(budget)
    if over > m:
        return None
    return max(0.0, 1 - over / m)


def score_lifestyle(car, lifestyles):
    if not lifestyles:
        return 1.0, []
    vals, detail = [], []
    for ls in lifestyles:
        f = car["lifestyle_fit"].get(ls)
        keys = cfg.LIFESTYLE_FEATURES[ls]
        feats = car["_features"]
        detail.append({
            "lifestyle": ls,
            "label": cfg.LIFESTYLE_TH[ls],
            "fit": f,
            "has": [cfg.FEATURE_TH[k] for k in keys if feats[k] is True],
            "missing": [cfg.FEATURE_TH[k] for k in keys if feats[k] is False],
            "unknown": [cfg.FEATURE_TH[k] for k in keys if feats[k] is None],
        })
        if f is not None:
            vals.append(f)
    return (sum(vals) / len(vals) if vals else None), detail


def score_safety(car):
    adas = car.get("adas") or {}
    known = [bool(adas[k]) for k in cfg.ADAS_ITEMS if adas.get(k) is not None]
    parts = [min(1.0, car["airbags"] / float(cfg.MAX_AIRBAGS))]
    if known:
        parts.append(sum(known) / float(len(known)))
    equipment = sum(parts) / len(parts)
    stars = car.get("asean_ncap_stars")
    if stars is None:
        return equipment
    return cfg.NCAP_SHARE * (stars / 5.0) + (1 - cfg.NCAP_SHARE) * equipment


def safety_warning(car):
    stars = car.get("asean_ncap_stars")
    if stars is not None and stars <= cfg.NCAP_WARN_MAX_STARS:
        return "ผลทดสอบชน ASEAN NCAP %d ดาว (เต็ม 5)" % stars
    return None


def score_design(car, preferred):
    if not preferred:
        return 1.0
    body = car["bodyType"]
    if body in preferred:
        return 1.0
    for p in preferred:
        if body in cfg.BODY_SIMILAR.get(p, []):
            return 0.5
    return 0.0


# ------------------------------------------------------------------ main
def recommend(c, cars=None):
    cars = CARS_V2 if cars is None else cars
    weights = weights_from_priorities(c.priorities)
    passed, removed_by = apply_filters(cars, c)

    costs = {car["id"]: annual_cost(car, c.km_per_year) for car in passed}
    known_totals = [v["total"] for v in costs.values() if v is not None]
    lo, hi = (min(known_totals), max(known_totals)) if known_totals else (0, 0)

    rows = []
    for car in passed:
        s_budget = score_budget(car["price"], c.budget, c.budget_stretch)
        s_life, life_detail = score_lifestyle(car, c.lifestyles)
        cost = costs[car["id"]]
        if cost is None:
            s_cost = None
        elif hi == lo:
            s_cost = 1.0
        else:
            s_cost = 1 - (cost["total"] - lo) / float(hi - lo)
        scores = {
            "budget": s_budget,
            "lifestyle": s_life,
            "running_cost": s_cost,
            "safety": score_safety(car),
            "design": score_design(car, c.body_preferred),
        }
        # A criterion with unknown data is skipped for this car: re-normalise the remaining weights.
        usable = {k: w for k, w in weights.items() if scores[k] is not None}
        wsum = sum(usable.values()) or 1.0
        contrib = {k: (usable[k] / wsum) * scores[k] for k in usable}
        total = 100 * sum(contrib.values())

        over = None
        if car["price"] > c.budget:
            amt = car["price"] - c.budget
            over = {"amount": amt, "pct": round(100.0 * amt / c.budget, 1),
                    "label": "เกินงบ %.1f%% (+%s บาท)" % (100.0 * amt / c.budget, format(amt, ","))}

        top2 = sorted(contrib, key=lambda k: -contrib[k])[:2]
        rows.append({
            "id": car["id"],
            "name": car["name"],
            "brand": car["brand"],
            "price": car["price"],
            "bodyType": car["bodyType"],
            "fuelType": car["fuelType"],
            "seats": car["seats"],
            "photo": car["photo"],
            "score": round(total, 1),
            "match_label": "เข้ากัน %d%%" % round(total),
            "criteria": {k: (None if v is None else round(v, 3)) for k, v in scores.items()},
            "contribution": {k: round(100 * v, 1) for k, v in contrib.items()},
            "top_criteria": [{"key": k, "label": cfg.CRITERIA_TH[k]} for k in top2],
            "over_budget": over,
            "asean_ncap_stars": car.get("asean_ncap_stars"),
            "safety_warning": safety_warning(car),
            "annual_cost": cost,
            "lifestyle_detail": life_detail,
            "estimated_fields": car.get("estimated", []),
        })

    rows.sort(key=lambda r: (-r["score"], r["price"]))
    for i, r in enumerate(rows, 1):
        r["rank"] = i

    too_few = len(rows) < cfg.MIN_RESULTS
    return {
        "engine": "v2",
        "weights": {k: round(v, 4) for k, v in weights.items()},
        "weights_pct": {k: round(100 * v) for k, v in weights.items()},
        "total_cars": len(cars),
        "passed_filters": len(rows),
        "results": rows[: c.top_n],
        # 4.1: never relax filters silently — tell the user which one cut the most
        "too_few_results": too_few,
        "filter_impact": removed_by if too_few else removed_by[:3],
    }
