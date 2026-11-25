# -*- coding: utf-8 -*-
"""Regression tests for the 26 Nov 2026 scoring review (results looked arbitrary)."""
from app.matching import CARS_V2, Criteria, recommend, score_safety

BY_NAME = {c["name"]: c for c in CARS_V2}


UI_DEFAULT = dict(budget=3, lifestyle=3, running_cost=2, safety=2, design=1)  # card zones the page starts with


def run(**kw):
    base = dict(budget=900000, lifestyles=["city"], priorities=UI_DEFAULT, top_n=200)
    base.update(kw)
    return recommend(Criteria(**base))


def test_untested_cars_never_beat_a_well_equipped_five_star_car():
    untested = [score_safety(c) for c in CARS_V2 if c.get("asean_ncap_stars") is None]
    best_five = max(score_safety(c) for c in CARS_V2 if c.get("asean_ncap_stars") == 5)
    assert max(untested) < best_five
    assert min(untested) > 0  # unknown is a middle result, never 0


def test_unchosen_criteria_are_left_out_not_given_free_points():
    r = run(lifestyles=[], body_preferred=[])
    assert set(r["inactive_criteria"]) == {"lifestyle", "design"}
    assert r["effective_weights_pct"]["design"] == 0
    for row in r["results"]:
        assert row["criteria"]["lifestyle"] is None and row["criteria"]["design"] is None
        assert "design" not in row["contribution"]


def test_long_sedan_is_not_compact():
    assert BY_NAME["BYD Seal 6"]["_features"]["compact"] < 0.1
    assert BY_NAME["Toyota Yaris Cross"]["_features"]["compact"] > 0.9


def test_work_cargo_puts_pickups_first():
    top3 = run(lifestyles=["work_cargo"])["results"][:3]
    assert all(BY_NAME[x["name"]].get("has_cargo_bed") for x in top3)


def test_running_cost_score_does_not_depend_on_other_filters():
    a = {x["id"]: x["criteria"]["running_cost"] for x in run()["results"]}
    b = {x["id"]: x["criteria"]["running_cost"] for x in run(brand_only=["Toyota"])["results"]}
    assert b and all(a[i] == v for i, v in b.items())


def test_card_order_changes_the_ranking():
    def top5(pr):
        return [x["id"] for x in run(priorities=pr, top_n=5)["results"]]
    life = top5(dict(budget=1, lifestyle=3, running_cost=1, safety=1, design=1))
    cost = top5(dict(budget=1, lifestyle=1, running_cost=3, safety=1, design=1))
    assert life != cost


def test_scores_are_spread_out_not_all_ninety_plus():
    rows = run()["results"]
    assert sum(r["score"] >= 90 for r in rows) <= 5
    assert len({r["score"] for r in rows[:10]}) >= 8
