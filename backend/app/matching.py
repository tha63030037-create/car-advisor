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
CRASH_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "crash_tests.json")
DIM_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "car_dimensions.json")


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
    # "ชอบ Subaru" is a taste, not a filter: it counts inside the design card and other brands stay in
    brand_preferred: List[str] = []
    seats_min: Optional[int] = Field(None, ge=1, le=15)
    fuel_only: Optional[List[str]] = None
    fuel_exclude: List[str] = []
    body_preferred: List[str] = []
    # opt-in: drop cars whose ASEAN NCAP result is below this; untested cars stay in
    min_ncap_stars: Optional[int] = Field(None, ge=1, le=5)
    lifestyles: List[str] = []
    # monthly income (household, before tax); required by the UI, optional here so old callers still work
    monthly_income: Optional[int] = Field(None, gt=0, le=10000000)
    # loan assumptions the user may change; defaults from matching_config
    down_payment_pct: float = Field(cfg.FIN_DOWN, ge=0, le=0.9)
    loan_years: int = Field(cfg.FIN_YEARS, ge=1, le=8)
    km_per_year: int = Field(cfg.DEFAULT_KM_PER_YEAR, gt=0, le=200000)
    priorities: Priorities = Priorities()
    top_n: int = Field(cfg.DEFAULT_TOP_N, ge=1, le=200)

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
    with open(DIM_PATH, encoding="utf-8") as f:
        dims = json.load(f)
    lengths, verified_len = dims["length_mm"], dims.get("verified", {})
    with open(CRASH_PATH, encoding="utf-8") as f:
        crash = json.load(f)["results"]
    for car in merged:
        # one crash-test result per car: ASEAN NCAP first, then ANCAP / Euro NCAP (see crash_tests.json)
        if car.get("asean_ncap_stars") is not None:
            car["crash_test"] = {"program": "ASEAN NCAP", "stars": car["asean_ncap_stars"], "year": None,
                                 "url": "https://www.aseancap.org/x/results.php", "note": None}
        else:
            car["crash_test"] = crash.get(str(car["id"]))
        car["crash_stars"] = car["crash_test"]["stars"] if car["crash_test"] else None
    for car in merged:
        car["length_mm"] = lengths.get(str(car["id"]))
        if car["length_mm"] is not None and not verified_len.get(str(car["id"])):
            car["estimated"] = list(car.get("estimated", [])) + ["length_mm"]
    return merged


def _scale(x, zero, one):
    """Linear 0-1 between the value that scores 0 and the value that scores 1 (either direction)."""
    if x is None:
        return None
    t = (x - zero) / float(one - zero)
    return round(max(0.0, min(1.0, t)), 4)


def energy_cost_per_km(car):
    econ, fuel = car.get("economy"), car["fuelType"]
    if not econ:
        return None
    if fuel == "ev":
        return cfg.EV_PRICE_THB_PER_KWH / econ
    return cfg.FUEL_PRICE_THB[fuel] / econ


def _features(car):
    """Lifestyle features scored 0-1 for one car; None means unknown (skipped, never 0).
    Measurable ones (length, running cost, boot, ground clearance) are continuous; equipment is yes/no."""
    def opt(x):
        return None if x is None else (1.0 if x else 0.0)

    per_km = energy_cost_per_km(car)
    cargo, bed = car.get("cargo_l"), car.get("has_cargo_bed")
    adas = car.get("adas") or {}
    four = car.get("drivetrain")
    return {
        "isofix": opt(car.get("isofix")),
        "compact": _scale(car.get("length_mm"), *cfg.COMPACT_LENGTH_MM),
        "city_economy": _scale(per_km, *cfg.CITY_COST_PER_KM),
        "aeb": opt(adas.get("aeb")),
        "ground_clearance": _scale(car.get("ground_clearance_mm"), *cfg.GROUND_MM),
        "cargo_large": 1.0 if bed else _scale(cargo, *cfg.CARGO_LARGE_L),
        "roof_rails": opt(car.get("roof_rails")),
        "four_wd": None if four is None else (1.0 if four in ("4WD", "AWD") else 0.0),
        "seven_seats": 1.0 if car["seats"] >= 7 else 0.0,
        "easy_entry": opt(car.get("easy_entry")),
        "rear_ac": opt(car.get("rear_ac_vents")),
        "fold_flat": None if bed else opt(car.get("rear_seat_fold_flat")),  # n/a with a pickup bed
        "parking_aid": opt(adas.get("parking_sensors")),
        "adaptive_cruise": opt(adas.get("adaptive_cruise")),
        "highway_economy": _scale(per_km, *cfg.HIGHWAY_COST_PER_KM),
        "cargo_work": 1.0 if bed else _scale(cargo, *cfg.CARGO_WORK_L_RANGE),
        "low_maintenance": _scale(car.get("maintenance_5y_thb"), *cfg.MAINT_5Y_THB),
        "lane_assist": opt(adas.get("lane_assist")),
    }


def lifestyle_fit(car):
    """0-1 fit per lifestyle = share of known features the car has (spec 4.4)."""
    feats = _features(car)
    fit = {}
    for ls, wts in cfg.LIFESTYLE_FEATURES.items():
        known = {k: w for k, w in wts.items() if feats[k] is not None}
        tw = sum(known.values())
        # weighted mean of the 0-1 feature scores the car has data for
        fit[ls] = round(sum(feats[k] * w for k, w in known.items()) / float(tw), 4) if tw else None
    return fit, feats


CARS_V2 = _load_cars()
# Pre-computed once at import (spec 3: stored, not recomputed per request)
for _c in CARS_V2:
    _c["lifestyle_fit"], _c["_features"] = lifestyle_fit(_c)


def _percentile(vals, q):
    vals = sorted(vals)
    if not vals:
        return 0.0
    k = (len(vals) - 1) * q / 100.0
    lo, hi = int(k), min(int(k) + 1, len(vals) - 1)
    return vals[lo] + (vals[hi] - vals[lo]) * (k - lo)


def cost_scale(km_per_year):
    """Fixed yearly-cost scale over the whole catalogue (not just the cars that passed filters)."""
    totals = [v["total"] for v in (annual_cost(c, km_per_year) for c in CARS_V2) if v is not None]
    p_lo, p_hi = cfg.COST_SCALE_PERCENTILES
    return _percentile(totals, p_lo), _percentile(totals, p_hi)


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


def monthly_installment(price, down=cfg.FIN_DOWN, years=cfg.FIN_YEARS):
    """Estimated monthly installment with a flat interest rate (defaults in matching_config)."""
    financed = price * (1 - down)
    return financed * (1 + cfg.FIN_FLAT_RATE * years) / (12 * years)


def price_for_installment(amount, down=cfg.FIN_DOWN, years=cfg.FIN_YEARS):
    return amount * 12 * years / ((1 - down) * (1 + cfg.FIN_FLAT_RATE * years))


def affordability(price, income, annual_cost_total=None, down=cfg.FIN_DOWN, years=cfg.FIN_YEARS):
    if not income:
        return None
    inst = monthly_installment(price, down, years)
    pct = inst / income
    level = "comfortable" if pct <= cfg.INCOME_COMFORT else ("tight" if pct <= cfg.INCOME_MAX else "over")
    label = {"comfortable": "ผ่อนสบาย", "tight": "ผ่อนตึง", "over": "เกินกำลังผ่อน"}[level]
    running = None if annual_cost_total is None else round(annual_cost_total / 12)
    return {"installment": round(inst), "pct_of_income": round(100 * pct, 1), "level": level, "label": label,
            "running_per_month": running,
            "total_per_month": round(inst + (running or 0)),
            "total_pct_of_income": round(100 * (inst + (running or 0)) / income, 1)}


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
    if c.min_ncap_stars:
        checks.append(("min_ncap_stars", "ไม่เอารถผลทดสอบชนต่ำกว่า %d ดาว (รถที่ยังไม่มีผลทดสอบยังอยู่)" % c.min_ncap_stars,
                       lambda car: car.get("crash_stars") is None or car["crash_stars"] >= c.min_ncap_stars))
    checks.append(("budget_ceiling", "ราคาไม่เกินงบ + ยืดได้ %d%%" % round(c.budget_stretch * 100),
                   lambda car: car["price"] <= ceiling))
    if c.monthly_income:
        cap = price_for_installment(c.monthly_income * cfg.INCOME_MAX, c.down_payment_pct, c.loan_years)
        checks.append(("income_cap", "ค่างวดไม่เกินครึ่งหนึ่งของรายได้ (รถไม่เกิน %s บาท)" % format(int(round(cap, -3)), ","),
                       lambda car: car["price"] <= cap))
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
        return None, []  # not chosen: the criterion is left out, not handed out as free points
    vals, detail = [], []
    for ls in lifestyles:
        f = car["lifestyle_fit"].get(ls)
        keys = cfg.LIFESTYLE_FEATURES[ls]
        feats = car["_features"]
        detail.append({
            "lifestyle": ls,
            "label": cfg.LIFESTYLE_TH[ls],
            "fit": f,
            "has": [cfg.FEATURE_TH[k] for k in keys if feats[k] is not None and feats[k] >= 0.5],
            "missing": [cfg.FEATURE_TH[k] for k in keys if feats[k] is not None and feats[k] < 0.5],
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
    stars = car.get("crash_stars")
    if stars is None:
        stars = cfg.NCAP_UNKNOWN_STARS
    return cfg.NCAP_SHARE * (stars / 5.0) + (1 - cfg.NCAP_SHARE) * equipment


def safety_warning(car):
    stars = car.get("crash_stars")
    if stars is not None and stars <= cfg.NCAP_WARN_MAX_STARS:
        return "ผลทดสอบชน %s %d ดาว (เต็ม 5)" % (car["crash_test"]["program"], stars)
    return None


def score_design(car, preferred, brands=None):
    """Body type match and, when given, brand taste. None when the user stated neither (left out)."""
    parts = []
    if preferred:
        body = car["bodyType"]
        if body in preferred:
            parts.append(1.0)
        elif any(body in cfg.BODY_SIMILAR.get(p, []) for p in preferred):
            parts.append(0.5)
        else:
            parts.append(0.0)
    if brands:
        parts.append(1.0 if _norm_brand(car["brand"]) in {_norm_brand(b) for b in brands} else 0.0)
    return sum(parts) / len(parts) if parts else None


def near_misses(cars, c, limit=4):
    """Cars that fail exactly one filter, so the user hears what they are missing instead of
    getting a list of one. Cars matching a stated brand/body preference come first."""
    checks = _filter_checks(c)
    ceiling = round(c.budget * (1 + c.budget_stretch))
    pref_brands = {_norm_brand(b) for b in (c.brand_preferred or [])}
    out = []
    for car in cars:
        failed = [(name, label) for name, label, fn in checks if not fn(car)]
        if len(failed) != 1:
            continue
        name, label = failed[0]
        if name == "budget_ceiling":
            reason = "ราคาเกินเพดานงบ %s บาท อยู่ %s บาท" % (format(int(ceiling), ","), format(int(car["price"] - ceiling), ","))
        else:
            reason = "ไม่ผ่านเงื่อนไข: " + label
        pref = (_norm_brand(car["brand"]) in pref_brands) + (car["bodyType"] in (c.body_preferred or []))
        out.append((-pref, abs(car["price"] - c.budget), {
            "id": car["id"], "name": car["name"], "price": car["price"], "bodyType": car["bodyType"],
            "photo": car["photo"], "failed_filter": name, "reason": reason,
        }))
    out.sort(key=lambda x: (x[0], x[1]))
    if out and out[0][0] < 0:  # something matches a stated preference: show only those
        out = [x for x in out if x[0] < 0]
    return [x[2] for x in out[:limit]]


BODY_TH = {"sedan": "ซีดาน", "hatchback": "แฮทช์แบ็ก", "suv": "SUV", "ppv": "PPV", "mpv": "MPV / รถตู้",
           "pickup": "กระบะ", "coupe": "คูเป้"}


def preference_notes(cars, rows, c):
    """Tell the user where the brands and body types they asked for ended up, in plain words —
    even when they are not in the top 10, or did not pass the filters at all."""
    notes = []
    ceiling = round(c.budget * (1 + c.budget_stretch))
    checks = _filter_checks(c)
    for b in c.brand_preferred or []:
        mine = [r for r in rows if _norm_brand(r["brand"]) == _norm_brand(b)]
        if mine:
            best = mine[0]
            low = min(((v, k) for k, v in best["criteria"].items() if v is not None and k != "design"), default=None)
            why = (" คะแนนที่ดึงลงคือ%s (%d/100)" % (cfg.CRITERIA_TH[low[1]], round(low[0] * 100))) if low and low[0] < 0.6 else ""
            notes.append({"kind": "brand", "key": b, "car_id": best["id"],
                          "text": "%s ที่เข้ากับคุณที่สุดคือ %s อยู่อันดับ %d เข้ากัน %d%%%s" % (b, best["name"], best["rank"], round(best["score"]), why)})
        else:
            theirs = sorted((x for x in cars if _norm_brand(x["brand"]) == _norm_brand(b)), key=lambda x: x["price"])
            if theirs:
                x = theirs[0]
                failed = [label for _, label, fn in checks if not fn(x)]
                notes.append({"kind": "brand", "key": b, "car_id": x["id"],
                              "text": "%s ไม่มีรุ่นที่ผ่านเงื่อนไข รุ่นที่ถูกที่สุดคือ %s %s บาท (%s)" % (b, x["name"], format(x["price"], ","), ", ".join(failed) or "ไม่ผ่านเงื่อนไข")})
    for body in c.body_preferred or []:
        if any(r["bodyType"] == body for r in rows):
            continue
        theirs = sorted((x for x in cars if x["bodyType"] == body), key=lambda x: x["price"])[:3]
        if theirs:
            notes.append({"kind": "body", "key": body, "car_id": theirs[0]["id"],
                          "text": "ไม่มี%sในงบ (เพดาน %s บาท) รุ่นที่ถูกที่สุดคือ %s" % (BODY_TH.get(body, body), format(ceiling, ","),
                                  ", ".join("%s %s บาท" % (x["name"], format(x["price"], ",")) for x in theirs))})
    return notes


# ------------------------------------------------------------------ main
def recommend(c, cars=None):
    cars = CARS_V2 if cars is None else cars
    weights = weights_from_priorities(c.priorities)
    passed, removed_by = apply_filters(cars, c)

    costs = {car["id"]: annual_cost(car, c.km_per_year) for car in passed}
    lo, hi = cost_scale(c.km_per_year)

    # every card counts once the user has given input for it, even when it does not separate the cars
    body_pref = c.body_preferred

    rows = []
    for car in passed:
        s_budget = score_budget(car["price"], c.budget, c.budget_stretch)
        s_life, life_detail = score_lifestyle(car, c.lifestyles)
        cost = costs[car["id"]]
        if cost is None:
            s_cost = None
        else:
            s_cost = _scale(cost["total"], hi, lo)
        scores = {
            "budget": s_budget,
            "lifestyle": s_life,
            "running_cost": s_cost,
            "safety": score_safety(car),
            "design": score_design(car, body_pref, c.brand_preferred),
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
            "crash_stars": car.get("crash_stars"),
            "crash_test": car.get("crash_test"),
            "safety_warning": safety_warning(car),
            "annual_cost": cost,
            "monthly": affordability(car["price"], c.monthly_income, cost["total"] if cost else None, c.down_payment_pct, c.loan_years),
            "lifestyle_detail": life_detail,
            "estimated_fields": car.get("estimated", []),
        })

    # criteria the user gave no input for (no lifestyle / no body type) are left out for every car
    inactive = [k for k in cfg.CRITERIA if (k == "lifestyle" and not c.lifestyles) or (k == "design" and not body_pref and not c.brand_preferred)]
    active_w = {k: w for k, w in weights.items() if k not in inactive}
    aw = sum(active_w.values()) or 1.0

    rows.sort(key=lambda r: (-r["score"], r["price"]))
    for i, r in enumerate(rows, 1):
        r["rank"] = i

    too_few = len(rows) < cfg.MIN_RESULTS
    return {
        "engine": "v2",
        "weights": {k: round(v, 4) for k, v in weights.items()},
        "weights_pct": {k: round(100 * v) for k, v in weights.items()},
        "inactive_criteria": inactive,
        "effective_weights_pct": {k: (round(100 * active_w[k] / aw) if k in active_w else 0) for k in cfg.CRITERIA},
        "total_cars": len(cars),
        "passed_filters": len(rows),
        "results": rows[: c.top_n],
        # 4.1: never relax filters silently — tell the user which one cut the most
        "too_few_results": too_few,
        "filter_impact": removed_by if too_few else removed_by[:3],
        "near_misses": near_misses(cars, c) if too_few else [],
        "preference_notes": preference_notes(cars, rows, c),
        "affordability": None if not c.monthly_income else {
            "income": c.monthly_income,
            "comfortable_price": int(round(price_for_installment(c.monthly_income * cfg.INCOME_COMFORT, c.down_payment_pct, c.loan_years), -3)),
            "max_price": int(round(price_for_installment(c.monthly_income * cfg.INCOME_MAX, c.down_payment_pct, c.loan_years), -3)),
            "budget_installment": round(monthly_installment(c.budget, c.down_payment_pct, c.loan_years)),
            "budget_pct_of_income": round(100 * monthly_installment(c.budget, c.down_payment_pct, c.loan_years) / c.monthly_income, 1),
            "assumptions": "ดาวน์ %d%% ผ่อน %d ปี ดอกเบี้ย %.1f%% ต่อปีแบบคงที่ (ค่าประมาณ ไม่ใช่ข้อเสนอสินเชื่อ)" % (
                round(c.down_payment_pct * 100), c.loan_years, cfg.FIN_FLAT_RATE * 100),
        },
    }


# ----------------------------------------------------------- catalogue views
FEATURE_TH = {
    "isofix": "จุดยึดคาร์ซีท ISOFIX", "compact": "ตัวรถกะทัดรัด จอดง่าย", "city_economy": "ประหยัดในเมือง",
    "aeb": "เบรกฉุกเฉินอัตโนมัติ (AEB)", "ground_clearance": "ใต้ท้องสูง ลุยได้", "cargo_large": "ที่เก็บของกว้าง",
    "roof_rails": "ราวหลังคา", "four_wd": "ขับเคลื่อน 4 ล้อ", "seven_seats": "7 ที่นั่ง", "easy_entry": "ขึ้นลงง่าย",
    "rear_ac": "แอร์ตอนหลัง", "fold_flat": "เบาะหลังพับราบ", "parking_aid": "เซ็นเซอร์ช่วยจอด",
    "adaptive_cruise": "ครูซคอนโทรลแบบปรับระยะ", "highway_economy": "ประหยัดทางไกล", "cargo_work": "บรรทุกของได้มาก",
    "low_maintenance": "ค่าบำรุงรักษาต่ำ", "lane_assist": "ระบบช่วยรักษาเลน",
}


def car_public(car, full=True):
    """One car for the catalogue / detail / compare screens (no scoring)."""
    base = {k: car.get(k) for k in ("id", "name", "brand", "model", "brand_group", "bodyType", "fuelType", "price",
                                     "seats", "horsepower", "airbags", "warrantyYears", "warrantyKm", "photo",
                                     "asean_ncap_stars", "crash_stars", "crash_test", "photo_is_ai_generated")}
    if not full:
        return base
    feats = car["_features"]
    base.update({k: car.get(k) for k in ("consumption", "economy", "economy_unit", "drivetrain", "doors",
                                          "ground_clearance_mm", "cargo_l", "has_cargo_bed", "adas",
                                          "maintenance_5y_thb", "source", "collected_on", "estimated",
                                          "transmission", "serviceNetwork", "length_mm")})
    base["annual_cost"] = annual_cost(car, cfg.DEFAULT_KM_PER_YEAR)
    base["km_per_year"] = cfg.DEFAULT_KM_PER_YEAR
    base["features_has"] = [FEATURE_TH[k] for k, v in feats.items() if v is not None and v >= 0.5 and k in FEATURE_TH]
    base["features_missing"] = [FEATURE_TH[k] for k, v in feats.items() if v is not None and v < 0.5 and k in FEATURE_TH]
    base["lifestyle_fit"] = {cfg.LIFESTYLE_TH.get(k, k): v for k, v in car["lifestyle_fit"].items()}
    base["safety_warning"] = safety_warning(car)
    return base


def catalogue(full=False):
    return [car_public(c, full) for c in CARS_V2]


def car_by_id(cid):
    for c in CARS_V2:
        if c["id"] == cid:
            return car_public(c, True)
    return None
