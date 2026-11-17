"use client";

import React, { useState } from "react";
import { submitUnclearQuestion, FeedbackContext } from "../lib/feedbackApi";

interface UnclearQuestionButtonProps {
  questionId: string;
  stage: number;
  context?: FeedbackContext;
}

export const UnclearQuestionButton: React.FC<UnclearQuestionButtonProps> = ({
  questionId,
  stage,
  context,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitUnclearQuestion({
        question_id: questionId,
        stage,
        context: {
          ...context,
          source: `quiz_step_${stage}`,
        },
      });
      setToastMessage("Noted — thanks for letting us know!");
    } catch (err) {
      console.error("Failed to log unclear question", err);
      // Still show gentle acknowledgment to user without blocking
      setToastMessage("Noted — thanks for letting us know!");
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setToastMessage(null);
      }, 2600);
    }
  };

  return (
    <div className="unclear-q-container" style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
      <button
        type="button"
        className="unclear-q-btn"
        onClick={handleClick}
        disabled={submitting}
        title="Click if this question was confusing or lacked options"
        style={{
          background: "none",
          border: "none",
          padding: "6px 10px",
          color: "#94A3B8",
          fontSize: "12px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          borderRadius: "6px",
          transition: "all 0.2s ease",
          minHeight: "44px", // Mobile touch target
        }}
      >
        <span style={{ fontSize: "13px" }}>❓</span>
        <span style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}>
          This question is unclear
        </span>
      </button>

      {/* Accessible Toast Notification */}
      <div
        aria-live="polite"
        className={`unclear-toast ${toastMessage ? "is-visible" : ""}`}
        style={{
          opacity: toastMessage ? 1 : 0,
          transform: toastMessage ? "translateY(0)" : "translateY(4px)",
          transition: "all 0.25s ease",
          fontSize: "12px",
          fontWeight: 600,
          color: "#c9a14a",
          background: "rgba(31, 34, 40, 0.95)",
          border: "1px solid rgba(201, 161, 74, 0.4)",
          padding: "4px 12px",
          borderRadius: "20px",
          pointerEvents: "none",
        }}
      >
        {toastMessage && `✓ ${toastMessage}`}
      </div>
    </div>
  );
};
