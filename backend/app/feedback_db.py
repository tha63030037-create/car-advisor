# -*- coding: utf-8 -*-
import datetime
import os
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    JSON,
)
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("FEEDBACK_DATABASE_URL", "sqlite:///./feedback.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class FeedbackModel(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    kind = Column(String(30), nullable=False, index=True)  # "rating" | "unclear_question" | "full_form"
    session_id = Column(String(64), nullable=False, index=True)
    rating = Column(Integer, nullable=True)  # 1/0 for inline rating; 1..5 for full form
    reasons = Column(JSON, nullable=True)  # List[str]
    message = Column(Text, nullable=True)  # Reason text or full message
    purchased_car = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    quiz_answers = Column(JSON, nullable=True)
    recommended_car_id = Column(Integer, nullable=True)
    top3 = Column(JSON, nullable=True)
    match_score = Column(Float, nullable=True)
    source = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    app_version = Column(String(30), default="1.0.0")
    consent = Column(Boolean, default=False)
    category_ratings = Column(JSON, nullable=True)  # Dict[str, int] e.g. {"accuracy": 5, "tco": 4, "quiz": 5, "checklist": 4, "overall": 5}


def init_db():
    Base.metadata.create_all(bind=engine)
    # Ensure backward-compatible column addition for SQLite
    try:
        with engine.connect() as conn:
            conn.execute(
                # Use raw SQL to add column if it does not already exist
                __import__("sqlalchemy").text("ALTER TABLE feedback ADD COLUMN category_ratings JSON")
            )
            conn.commit()
    except Exception:
        # Column already exists or table freshly created
        pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
