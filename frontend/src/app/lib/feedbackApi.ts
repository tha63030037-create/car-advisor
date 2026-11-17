"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SESSION_STORAGE_KEY = "car_advisor_session_id";
const APP_VERSION = "1.0.0";

/**
 * Returns or creates an anonymous session UUID stored in localStorage.
 * No personal identification is stored.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "ssr-placeholder-session";
  }

  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      sessionId = crypto.randomUUID();
    } else {
      sessionId = "sess-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now();
    }
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export interface FeedbackContext {
  recommended_car_id?: number | null;
  top3?: Array<{ id: number; name: string; score?: number }>;
  match_score?: number | null;
  quiz_answers?: Record<string, any> | null;
  source?: string;
}

export interface RatingPayloadInput {
  rating: number; // 1 for thumbs up, 0 for thumbs down
  reasons?: string[];
  message?: string;
  context?: FeedbackContext;
}

export interface UnclearQuestionInput {
  question_id: string;
  stage: number;
  context?: FeedbackContext;
}

export interface FullFormPayloadInput {
  feedback_type: string;
  rating?: number | null;
  category_ratings?: Record<string, number>;
  message: string;
  purchased_car?: string;
  email?: string;
  consent: boolean;
  context?: FeedbackContext;
}

/**
 * Submit thumbs up / down inline rating
 */
export async function submitRatingFeedback(input: RatingPayloadInput) {
  const sessionId = getOrCreateSessionId();
  const body = {
    kind: "rating",
    session_id: sessionId,
    rating: input.rating,
    reasons: input.reasons || [],
    message: input.message || null,
    recommended_car_id: input.context?.recommended_car_id ?? null,
    top3: input.context?.top3 ?? null,
    match_score: input.context?.match_score ?? null,
    quiz_answers: input.context?.quiz_answers ?? null,
    source: input.context?.source || "recommendation_inline",
    app_version: APP_VERSION,
  };

  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to submit rating");
  }

  return res.json();
}

/**
 * Submit "This question is unclear" flag
 */
export async function submitUnclearQuestion(input: UnclearQuestionInput) {
  const sessionId = getOrCreateSessionId();
  const body = {
    kind: "unclear_question",
    session_id: sessionId,
    question_id: input.question_id,
    stage: input.stage,
    recommended_car_id: input.context?.recommended_car_id ?? null,
    top3: input.context?.top3 ?? null,
    match_score: input.context?.match_score ?? null,
    quiz_answers: input.context?.quiz_answers ?? null,
    source: input.context?.source || `quiz_step_${input.stage}`,
    app_version: APP_VERSION,
  };

  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to submit unclear question flag");
  }

  return res.json();
}

/**
 * Submit full feedback page form
 */
export async function submitFullFeedback(input: FullFormPayloadInput) {
  const sessionId = getOrCreateSessionId();
  const body = {
    kind: "full_form",
    session_id: sessionId,
    feedback_type: input.feedback_type,
    rating: input.rating ?? null,
    category_ratings: input.category_ratings ?? null,
    message: input.message,
    purchased_car: input.purchased_car ? input.purchased_car.trim() : null,
    email: input.email ? input.email.trim() : null,
    consent: input.consent,
    recommended_car_id: input.context?.recommended_car_id ?? null,
    top3: input.context?.top3 ?? null,
    match_score: input.context?.match_score ?? null,
    quiz_answers: input.context?.quiz_answers ?? null,
    source: input.context?.source || "feedback_page",
    app_version: APP_VERSION,
  };

  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to submit feedback form");
  }

  return res.json();
}
