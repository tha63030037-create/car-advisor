# -*- coding: utf-8 -*-
import datetime
import os
from collections import Counter
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Body, status
from sqlalchemy.orm import Session

from app.feedback_db import get_db, FeedbackModel
from app.feedback_schemas import (
    FeedbackPayload,
    RatingFeedbackPayload,
    UnclearQuestionPayload,
    FullFormFeedbackPayload,
    FeedbackResponse,
    FeedbackSummaryResponse,
    ReasonCount,
    UnclearQuestionCount,
)

router = APIRouter(tags=["feedback"])

def _admin_key():
    """Read at request time so a changed FEEDBACK_ADMIN_KEY takes effect without a code change."""
    return os.getenv("FEEDBACK_ADMIN_KEY", "car-advisor-admin-secret")
RATE_LIMIT_PER_HOUR = 20


@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(
    payload: FeedbackPayload = Body(..., discriminator="kind"),
    db: Session = Depends(get_db),
):

    """
    Submits user feedback (anonymous by default).
    Enforces a rate limit of max 20 submissions per session_id per hour.
    """
    # 1. Check rate limit
    one_hour_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    recent_count = (
        db.query(FeedbackModel)
        .filter(
            FeedbackModel.session_id == payload.session_id,
            FeedbackModel.created_at >= one_hour_ago,
        )
        .count()
    )

    if recent_count >= RATE_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_PER_HOUR} submissions per hour.",
        )

    # 2. Construct DB record
    row = FeedbackModel(
        session_id=payload.session_id,
        kind=payload.kind,
        source=payload.source,
        app_version=payload.app_version or "1.0.0",
        recommended_car_id=payload.recommended_car_id,
        top3=payload.top3,
        match_score=payload.match_score,
        quiz_answers=payload.quiz_answers,
        created_at=datetime.datetime.utcnow(),
    )

    if isinstance(payload, RatingFeedbackPayload):
        row.rating = payload.rating
        row.reasons = payload.reasons or []
        row.message = payload.message
        row.consent = True
    elif isinstance(payload, UnclearQuestionPayload):
        row.reasons = [payload.question_id]
        row.message = str(payload.stage)
        row.consent = True
    elif isinstance(payload, FullFormFeedbackPayload):
        row.reasons = [payload.feedback_type]
        row.rating = payload.rating
        row.message = payload.message
        row.purchased_car = payload.purchased_car
        row.email = payload.email
        row.category_ratings = payload.category_ratings
        row.consent = payload.consent

    db.add(row)
    db.commit()
    db.refresh(row)

    return FeedbackResponse(
        status="success",
        id=row.id,
        message="Thank you for your feedback.",
    )


@router.get("/feedback/summary", response_model=FeedbackSummaryResponse)
def get_feedback_summary(
    api_key: Optional[str] = None,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db),
):
    """
    Returns aggregated feedback metrics for model tuning and UX refinement.
    Supports X-API-Key header or ?api_key= query parameter.
    """
    token = x_api_key or api_key
    if not token or token != _admin_key():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Missing or invalid X-API-Key.",
        )


    rows: List[FeedbackModel] = db.query(FeedbackModel).all()

    total_submissions = len(rows)
    thumbs_up_count = 0
    thumbs_down_count = 0
    full_form_count = 0
    unclear_question_count = 0

    down_reasons_counter = Counter()
    unclear_counter = Counter()

    purchased_answers = 0
    purchased_in_top3_count = 0

    for r in rows:
        if r.kind == "rating":
            if r.rating == 1:
                thumbs_up_count += 1
            elif r.rating == 0:
                thumbs_down_count += 1
                if r.reasons and isinstance(r.reasons, list):
                    for reason in r.reasons:
                        if reason:
                            down_reasons_counter[reason] += 1
        elif r.kind == "unclear_question":
            unclear_question_count += 1
            qid = r.reasons[0] if (r.reasons and len(r.reasons) > 0) else "unknown"
            try:
                stg = int(r.message) if r.message else 1
            except (ValueError, TypeError):
                stg = 1
            unclear_counter[(qid, stg)] += 1
        elif r.kind == "full_form":
            full_form_count += 1

        # Check purchased_car accuracy against top3
        if r.purchased_car and r.purchased_car.strip():
            purchased_answers += 1
            p_name = r.purchased_car.strip().lower()
            top3_names = []
            if r.top3 and isinstance(r.top3, list):
                for item in r.top3:
                    if isinstance(item, dict):
                        top3_names.append(str(item.get("name", "")).lower())
                    elif isinstance(item, str):
                        top3_names.append(item.lower())

            # Check if purchased car matches any top3 car name
            match = False
            for name in top3_names:
                if name and (name in p_name or p_name in name):
                    match = True
                    break
            if match:
                purchased_in_top3_count += 1

    top_down_reasons = [
        ReasonCount(reason=reason, count=count)
        for reason, count in down_reasons_counter.most_common()
    ]

    most_flagged_unclear_questions = [
        UnclearQuestionCount(question_id=qid, stage=stg, count=count)
        for (qid, stg), count in unclear_counter.most_common()
    ]

    pct = (
        round((purchased_in_top3_count / purchased_answers) * 100.0, 1)
        if purchased_answers > 0
        else 0.0
    )

    # Compute 5-category evaluation metrics
    cat_keys = ["accuracy", "tco", "quiz", "checklist", "overall"]
    cat_sums = {k: 0.0 for k in cat_keys}
    cat_counts = {k: 0 for k in cat_keys}

    for r in rows:
        if r.kind == "full_form" and r.category_ratings and isinstance(r.category_ratings, dict):
            for k in cat_keys:
                v = r.category_ratings.get(k)
                if isinstance(v, (int, float)) and 1 <= v <= 5:
                    cat_sums[k] += float(v)
                    cat_counts[k] += 1

    category_averages = {
        k: round(cat_sums[k] / cat_counts[k], 2) if cat_counts[k] > 0 else 0.0
        for k in cat_keys
    }

    return FeedbackSummaryResponse(
        total_submissions=total_submissions,
        thumbs_up_count=thumbs_up_count,
        thumbs_down_count=thumbs_down_count,
        top_down_reasons=top_down_reasons,
        most_flagged_unclear_questions=most_flagged_unclear_questions,
        purchased_in_top3_percentage=pct,
        full_form_count=full_form_count,
        unclear_question_count=unclear_question_count,
        category_averages=category_averages,
        category_counts=cat_counts,
    )


@router.get("/feedback/list")
def list_feedback(
    api_key: Optional[str] = None,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Returns the latest raw feedback submissions for admin inspection.
    Supports ?api_key= query parameter or X-API-Key header.
    """
    token = x_api_key or api_key
    if not token or token != _admin_key():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Missing or invalid API key.",
        )

    rows = (
        db.query(FeedbackModel)
        .order_by(FeedbackModel.created_at.desc())
        .limit(limit)
        .all()
    )

    results = []
    for r in rows:
        results.append({
            "id": r.id,
            "kind": r.kind,
            "session_id": r.session_id,
            "rating": r.rating,
            "reasons": r.reasons,
            "message": r.message,
            "purchased_car": r.purchased_car,
            "email": r.email,
            "recommended_car_id": r.recommended_car_id,
            "match_score": r.match_score,
            "source": r.source,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else None,
            "app_version": r.app_version,
            "quiz_answers": r.quiz_answers,
            "category_ratings": r.category_ratings,
        })

    return results

