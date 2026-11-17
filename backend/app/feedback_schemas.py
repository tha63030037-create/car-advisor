# -*- coding: utf-8 -*-
from typing import Union, List, Optional, Dict, Any
from typing_extensions import Annotated, Literal
from pydantic import BaseModel, Field, field_validator


class BaseFeedbackPayload(BaseModel):
    session_id: str = Field(..., description="Anonymous UUID stored in localStorage")
    recommended_car_id: Optional[int] = None
    top3: Optional[List[Any]] = None
    match_score: Optional[float] = None
    quiz_answers: Optional[Dict[str, Any]] = None
    source: Optional[str] = None
    app_version: Optional[str] = "1.0.0"


class RatingFeedbackPayload(BaseFeedbackPayload):
    kind: Literal["rating"] = "rating"
    rating: int = Field(..., ge=0, le=1, description="1 for thumbs up, 0 for thumbs down")
    reasons: Optional[List[str]] = Field(default_factory=list)
    message: Optional[str] = Field(None, max_length=300)


class UnclearQuestionPayload(BaseFeedbackPayload):
    kind: Literal["unclear_question"] = "unclear_question"
    question_id: str = Field(..., min_length=1)
    stage: int = Field(..., ge=1)


class FullFormFeedbackPayload(BaseFeedbackPayload):
    kind: Literal["full_form"] = "full_form"
    feedback_type: str = Field(..., min_length=1)
    rating: Optional[int] = Field(None, ge=1, le=5)
    message: str = Field(..., min_length=10, max_length=1000)
    purchased_car: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    category_ratings: Optional[Dict[str, int]] = Field(None, description="Scores 1-5 for accuracy, tco, quiz, checklist, overall")
    consent: bool = Field(..., description="PDPA consent is required")

    @field_validator("consent")
    @classmethod
    def validate_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("PDPA consent is required to submit feedback.")
        return v


FeedbackPayload = Union[
    RatingFeedbackPayload,
    UnclearQuestionPayload,
    FullFormFeedbackPayload,
]



class FeedbackResponse(BaseModel):
    status: str
    id: int
    message: str


class ReasonCount(BaseModel):
    reason: str
    count: int


class UnclearQuestionCount(BaseModel):
    question_id: str
    stage: int
    count: int


class FeedbackSummaryResponse(BaseModel):
    total_submissions: int
    thumbs_up_count: int
    thumbs_down_count: int
    top_down_reasons: List[ReasonCount]
    most_flagged_unclear_questions: List[UnclearQuestionCount]
    purchased_in_top3_percentage: float
    full_form_count: int
    unclear_question_count: int
    category_averages: Optional[Dict[str, float]] = None
    category_counts: Optional[Dict[str, int]] = None
