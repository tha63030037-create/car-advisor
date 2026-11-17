# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
for _k in ("ANTHROPIC_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY"):
    os.environ.pop(_k, None)
from fastapi.testclient import TestClient
from app.main import app
from app.chat import parse_budget, rules_extract, _clean_criteria

client = TestClient(app)


def test_parse_budget_thai_units():
    assert parse_budget("งบ 8 แสน") == 800000
    assert parse_budget("1.2 ล้าน") == 1200000
    assert parse_budget("900,000 บาท") == 900000
    assert parse_budget("ห้าแสน") == 500000


def test_rules_extract_core_fields():
    c = rules_extract("พาพ่อแม่ไปทำบุญ บ้านมี 7 คน ไม่เอารถจีน ห้ามเกินงบ", {})
    assert "merit_family" in c["lifestyles"]
    assert c["seats_min"] == 7
    assert "BYD" in c["brand_exclude"] and "Toyota" not in c["brand_exclude"]
    assert c["budget_stretch"] == 0.0


def test_brand_only_and_relative_budget():
    c = rules_extract("เอาแต่ Honda", {})
    assert c["brand_only"] == ["Honda"]
    c = rules_extract("เพิ่มงบอีก 5 หมื่น", {"budget": 900000})
    assert c["budget"] == 950000


def test_llm_output_is_sanitised():
    out = _clean_criteria({"budget": -5, "lifestyles": ["camping", "moon"], "brand_only": ["Toyota", "Fake"],
                           "priorities": {"budget": 9}})
    assert "budget" not in out and out["lifestyles"] == ["camping"] and out["brand_only"] == ["Toyota"]
    assert "priorities" not in out


def test_chat_endpoint_flow_without_key():
    r = client.post("/api/chat", json={"messages": [], "criteria": {}, "asked": []}).json()
    assert r["engine"] == "rules" and r["ready"] is False and r["quick_replies"]
    r = client.post("/api/chat", json={"messages": [{"role": "user", "content": "งบ 8 แสน ขับในเมือง"}],
                                       "criteria": r["criteria"], "asked": r["asked"]}).json()
    assert r["criteria"]["budget"] == 800000 and r["ready"] is True
    assert "city" in r["criteria"]["lifestyles"]
