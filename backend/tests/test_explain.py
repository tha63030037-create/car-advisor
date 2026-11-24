# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
for _k in ("ANTHROPIC_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY"):
    os.environ.pop(_k, None)
from fastapi.testclient import TestClient
from app.main import app
from app.explain import text_is_grounded, ALL_NAMES

client = TestClient(app)
CRIT = {"budget": 900000, "budget_stretch": 0.15, "lifestyles": ["camping", "pets"],
        "priorities": {"budget": 2, "lifestyle": 3, "running_cost": 2, "safety": 3, "design": 1}}


def test_explain_template_names_exactly_the_top3():
    top = client.post("/api/v2/recommend", json={**CRIT, "top_n": 3}).json()["results"]
    r = client.post("/api/explain", json=CRIT).json()
    assert r["engine"] == "template"
    assert r["ids"] == [c["id"] for c in top]
    for c in top:
        assert c["name"] in r["text"]
    assert text_is_grounded(r["text"], top)


def test_grounding_rejects_other_cars_and_missing_ones():
    top = client.post("/api/v2/recommend", json={**CRIT, "top_n": 3}).json()["results"]
    names = [c["name"] for c in top]
    outsider = next(n for n in ALL_NAMES if n not in names and len(n) >= 6)
    good = " ".join(names)
    assert text_is_grounded(good, top)
    assert not text_is_grounded(good + " ลองดู " + outsider, top)
    assert not text_is_grounded(" ".join(names[:2]), top)


def test_chat_done_flag_and_health():
    r = client.post("/api/chat", json={"messages": [{"role": "user", "content": "งบ 8 แสน ขับในเมือง ห้ามเกินงบ ไม่จำกัดยี่ห้อ ความปลอดภัยสำคัญสุด"}],
                                       "criteria": {}, "asked": ["usage", "lifestyle", "budget", "stretch", "brand"]}).json()
    assert r["ready"] is True
    assert "done" in r
    h = client.get("/api/health").json()
    assert h["llm"].startswith("none")
