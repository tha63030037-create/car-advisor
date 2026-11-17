import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Use a test SQLite database
os.environ["FEEDBACK_DATABASE_URL"] = "sqlite:///./test_feedback.db"
os.environ["FEEDBACK_ADMIN_KEY"] = "test-secret-key"

from app.feedback_db import init_db, engine, Base

from app.main import app


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()  # release the pooled SQLite connection before deleting the file
    if os.path.exists("./test_feedback.db"):
        try:
            os.remove("./test_feedback.db")
        except Exception:
            pass


client = TestClient(app)


def test_submit_thumbs_up_rating():
    payload = {
        "kind": "rating",
        "session_id": "sess-uuid-001",
        "rating": 1,
        "reasons": [],
        "recommended_car_id": 1,
        "match_score": 92.5,
        "top3": [{"id": 1, "name": "Toyota Yaris Ativ"}, {"id": 2, "name": "Honda City"}],
        "source": "recommendation_inline",
        "quiz_answers": {"budget": 600000, "income": 30000},
    }
    response = client.post("/api/feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "id" in data


def test_submit_thumbs_down_rating_with_reasons():
    payload = {
        "kind": "rating",
        "session_id": "sess-uuid-002",
        "rating": 0,
        "reasons": ["Too expensive", "Wrong body type", "Other"],
        "message": "Prefer an electric station wagon under 800k",
        "recommended_car_id": 5,
        "source": "recommendation_inline",
    }
    response = client.post("/api/feedback", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_submit_unclear_question():
    payload = {
        "kind": "unclear_question",
        "session_id": "sess-uuid-003",
        "question_id": "step1_budget_income",
        "stage": 1,
        "source": "quiz_step_1",
    }
    response = client.post("/api/feedback", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_full_form_validation():
    # 1. Message too short (< 10 chars)
    bad_payload = {
        "kind": "full_form",
        "session_id": "sess-uuid-004",
        "feedback_type": "Bug",
        "message": "Short",
        "consent": True,
    }
    res = client.post("/api/feedback", json=bad_payload)
    assert res.status_code == 422

    # 2. Consent False
    bad_consent = {
        "kind": "full_form",
        "session_id": "sess-uuid-004",
        "feedback_type": "Suggestion",
        "message": "This is a detailed feedback message with enough characters.",
        "consent": False,
    }
    res2 = client.post("/api/feedback", json=bad_consent)
    assert res2.status_code == 422

    # 3. Valid submission
    valid_payload = {
        "kind": "full_form",
        "session_id": "sess-uuid-004",
        "feedback_type": "Recommendation quality",
        "rating": 4,
        "message": "Great advice, but I'd like more EV charging info included.",
        "purchased_car": "BYD Dolphin",
        "email": "user@example.com",
        "consent": True,
        "top3": [{"id": 10, "name": "BYD Dolphin"}],
    }
    res3 = client.post("/api/feedback", json=valid_payload)
    assert res3.status_code == 200
    assert res3.json()["status"] == "success"


def test_rate_limiting_max_20_per_hour():
    session_id = "heavy-user-session-999"

    # Submit 20 times (allowed)
    for i in range(20):
        res = client.post(
            "/api/feedback",
            json={
                "kind": "rating",
                "session_id": session_id,
                "rating": 1,
            },
        )
        assert res.status_code == 200, f"Submission {i+1} failed"

    # 21st submission should trigger 429 Too Many Requests
    res21 = client.post(
        "/api/feedback",
        json={
            "kind": "rating",
            "session_id": session_id,
            "rating": 1,
        },
    )
    assert res21.status_code == 429
    assert "Rate limit exceeded" in res21.json()["detail"]


def test_admin_summary_endpoint():
    # 1. Unauthorized without header
    unauth_res = client.get("/api/feedback/summary")
    assert unauth_res.status_code == 401

    # 2. Unauthorized with wrong header
    wrong_key_res = client.get("/api/feedback/summary", headers={"X-API-Key": "wrong"})
    assert wrong_key_res.status_code == 401

    # Seed data
    client.post(
        "/api/feedback",
        json={
            "kind": "rating",
            "session_id": "user-a",
            "rating": 1,
        },
    )
    client.post(
        "/api/feedback",
        json={
            "kind": "rating",
            "session_id": "user-b",
            "rating": 0,
            "reasons": ["Too expensive", "Want an EV"],
        },
    )
    client.post(
        "/api/feedback",
        json={
            "kind": "unclear_question",
            "session_id": "user-c",
            "question_id": "step2_pains",
            "stage": 1,
        },
    )
    client.post(
        "/api/feedback",
        json={
            "kind": "full_form",
            "session_id": "user-d",
            "feedback_type": "Recommendation quality",
            "message": "I ended up buying the recommended car! Very accurate.",
            "purchased_car": "Honda City",
            "consent": True,
            "top3": [{"id": 3, "name": "Honda City e:HEV"}],
        },
    )

    # 3. Authorized request
    headers = {"X-API-Key": "test-secret-key"}
    summary_res = client.get("/api/feedback/summary", headers=headers)
    assert summary_res.status_code == 200
    data = summary_res.json()

    assert data["total_submissions"] == 4
    assert data["thumbs_up_count"] == 1
    assert data["thumbs_down_count"] == 1
    assert len(data["top_down_reasons"]) >= 2
    assert any(r["reason"] == "Too expensive" for r in data["top_down_reasons"])
    assert data["most_flagged_unclear_questions"][0]["question_id"] == "step2_pains"
    assert data["purchased_in_top3_percentage"] == 100.0


def test_5_category_ratings_submission_and_summary():
    headers = {"X-API-Key": "test-secret-key"}

    # Submit feedback with 5-category scores
    payload = {
        "kind": "full_form",
        "session_id": "eval-user-1",
        "feedback_type": "5-dimension evaluation",
        "rating": 5,
        "category_ratings": {
            "accuracy": 5,
            "tco": 4,
            "quiz": 5,
            "checklist": 4,
            "overall": 5,
        },
        "message": "ระบบช่วยให้เห็นค่าใช้จ่าย 5 ปีชัดเจนมาก อยากให้เพิ่มรถ EV อีก",
        "purchased_car": "BYD Dolphin",
        "consent": True,
        "source": "stage6_final_evaluation",
    }
    res = client.post("/api/feedback", json=payload)
    assert res.status_code == 200

    # Check summary contains category averages
    summary_res = client.get("/api/feedback/summary", headers=headers)
    assert summary_res.status_code == 200
    sdata = summary_res.json()
    assert "category_averages" in sdata
    assert sdata["category_averages"]["accuracy"] == 5.0
    assert sdata["category_averages"]["tco"] == 4.0
    assert sdata["category_averages"]["quiz"] == 5.0
    assert sdata["category_averages"]["checklist"] == 4.0
    assert sdata["category_averages"]["overall"] == 5.0

    # Check list returns category_ratings
    list_res = client.get("/api/feedback/list", headers=headers)
    assert list_res.status_code == 200
    ldata = list_res.json()
    assert len(ldata) >= 1
    found = next((item for item in ldata if item["session_id"] == "eval-user-1"), None)
    assert found is not None
    assert found["category_ratings"]["accuracy"] == 5
