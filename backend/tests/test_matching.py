# -*- coding: utf-8 -*-
import json
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import matching_config as cfg  # noqa: E402
from app.matching import (CARS_V2, Criteria, Priorities, recommend,  # noqa: E402
                          score_budget, weights_from_priorities)
from app.main import app  # noqa: E402

client = TestClient(app)
PERSONAS = json.load(open(os.path.join(os.path.dirname(__file__), "personas.json"), encoding="utf-8"))["personas"]


# ---- 4.3 the advisor's own example: same 50,000 over, lower budget is hit harder
def test_budget_stretch_advisor_example():
    low = score_budget(550000, 500000, 0.15)
    high = score_budget(950000, 900000, 0.15)
    assert round(low, 2) == 0.33
    assert round(high, 2) == 0.63
    assert low < high


def test_budget_within_and_beyond_ceiling():
    assert score_budget(500000, 500000, 0.15) == 1.0
    assert score_budget(600000, 500000, 0.15) is None
    assert score_budget(510000, 500000, 0.0) is None


# ---- 4.2 weights from card zones
def test_weights_examples_from_spec():
    general = weights_from_priorities(Priorities(budget=3, lifestyle=3, running_cost=2, safety=2, design=1))
    assert round(general["budget"] * 100) == 27
    nobudget = weights_from_priorities(Priorities(budget=1, lifestyle=3, running_cost=1, safety=2, design=3))
    assert round(nobudget["budget"] * 100) == 10
    equal = weights_from_priorities(Priorities(budget=2, lifestyle=2, running_cost=2, safety=2, design=2))
    assert all(abs(v - 0.2) < 1e-9 for v in equal.values())


def test_priority_points_validated():
    with pytest.raises(Exception):
        Priorities(budget=5)


# ---- 4.1 filters never leak
def test_brand_only_is_a_filter():
    res = recommend(Criteria(budget=3000000, brand_only=["Toyota"], top_n=125))
    assert res["results"]
    assert all(r["brand"] == "Toyota" for r in res["results"])


def test_brand_fix_mg_and_mazda_models():
    brands = {c["name"]: c["brand"] for c in CARS_V2}
    assert brands["MG3"] == "MG"
    assert brands["MG4 Electric"] == "MG"
    assert brands["Mazda2 Sedan"] == "Mazda"
    assert brands["Changan Deepal S07"] == "Deepal"


def test_seats_and_ceiling_filters():
    c = Criteria(budget=1200000, budget_stretch=0.15, seats_min=7, top_n=125)
    res = recommend(c)
    assert all(r["seats"] >= 7 for r in res["results"])
    assert all(r["price"] <= 1200000 * 1.15 for r in res["results"])


def test_over_budget_label():
    res = recommend(Criteria(budget=900000, budget_stretch=0.2, top_n=125))
    over = [r for r in res["results"] if r["price"] > 900000]
    assert over
    assert all(r["over_budget"]["label"].startswith("เกินงบ") for r in over)
    assert all(r["over_budget"] is None for r in res["results"] if r["price"] <= 900000)


def test_too_few_results_reports_biggest_filter():
    res = recommend(Criteria(budget=500000, budget_stretch=0.0, brand_only=["Volvo"]))
    assert res["too_few_results"] is True
    assert res["filter_impact"][0]["removed"] >= res["filter_impact"][-1]["removed"]


# ---- ranking behaviour the demo relies on
def test_moving_budget_card_changes_ranking():
    base = dict(budget=800000, budget_stretch=0.2, lifestyles=["city"], top_n=5)
    a = recommend(Criteria(priorities=Priorities(budget=3, lifestyle=2, running_cost=2, safety=2, design=1), **base))
    b = recommend(Criteria(priorities=Priorities(budget=1, lifestyle=2, running_cost=2, safety=3, design=3), **base))
    assert [r["id"] for r in a["results"]] != [r["id"] for r in b["results"]]


def test_deterministic():
    c = Criteria(**PERSONAS[4]["criteria"])
    assert recommend(c)["results"] == recommend(c)["results"]


def test_scores_in_range_and_sorted():
    res = recommend(Criteria(budget=1500000, lifestyles=["camping", "pets"], top_n=125))
    scores = [r["score"] for r in res["results"]]
    assert scores == sorted(scores, reverse=True)
    assert all(0 <= s <= 100 for s in scores)
    for r in res["results"]:
        assert all(v is None or 0 <= v <= 1 for v in r["criteria"].values())


def test_unknown_lifestyle_rejected():
    with pytest.raises(Exception):
        Criteria(budget=500000, lifestyles=["moon_trip"])


# ---- personas: hard rules hold for every result, not just top 3
@pytest.mark.parametrize("p", PERSONAS, ids=[p["id"] for p in PERSONAS])
def test_persona_hard_rules(p):
    res = recommend(Criteria(**dict(p["criteria"], top_n=125)))
    assert len(res["results"]) >= cfg.MIN_RESULTS
    rules = p["hard_rules"]
    for r in res["results"]:
        if "max_price" in rules:
            assert r["price"] <= rules["max_price"]
        if "min_seats" in rules:
            assert r["seats"] >= rules["min_seats"]
        if "brand_only" in rules:
            assert r["brand"] in rules["brand_only"]


# ---- API
def test_api_v2_recommend():
    resp = client.post("/api/v2/recommend", json=PERSONAS[0]["criteria"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["engine"] == "v2" and body["results"]


def test_api_v2_rejects_bad_input():
    assert client.post("/api/v2/recommend", json={"budget": -5}).status_code == 422


def test_api_v2_config_exposes_options():
    body = client.get("/api/v2/options").json()
    assert set(body["lifestyles"]) == set(cfg.LIFESTYLES)
    assert body["criteria"] == cfg.CRITERIA


def test_old_engine_still_available():
    resp = client.post("/api/recommend", json=PERSONAS[0]["old_quiz"])
    assert resp.status_code == 200
