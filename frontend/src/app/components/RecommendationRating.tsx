"use client";

import React, { useState } from "react";
import { submitRatingFeedback, FeedbackContext } from "../lib/feedbackApi";

interface RecommendationRatingProps {
  carId: number;
  carName: string;
  context?: FeedbackContext;
}

const REASON_OPTIONS = [
  "Too expensive",
  "Wrong body type",
  "Don't like the look",
  "Want an EV",
  "Too small",
  "Too big",
  "Other",
];

export const RecommendationRating: React.FC<RecommendationRatingProps> = ({
  carId,
  carName,
  context,
}) => {
  const [currentRating, setCurrentRating] = useState<number | null>(null); // 1 = 👍, 0 = 👎
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherText, setOtherText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toggle reason chip
  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  // Handle clicking 👍
  const handleThumbsUp = async () => {
    setCurrentRating(1);
    setIsExpanded(false);
    setSelectedReasons([]);
    setOtherText("");
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await submitRatingFeedback({
        rating: 1,
        reasons: [],
        context: {
          ...context,
          recommended_car_id: carId,
          source: "top_recommendation_inline",
        },
      });
      setSubmittedMessage("Thanks — this helps us improve.");
    } catch (err: any) {
      console.error("Thumbs up error", err);
      setErrorMessage("Could not record rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle clicking 👎
  const handleThumbsDown = () => {
    setCurrentRating(0);
    setSubmittedMessage(null);
    setErrorMessage(null);
    setIsExpanded(true);
  };

  // Submit 👎 reasons
  const handleSubmitReasons = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (selectedReasons.length === 0) {
      setErrorMessage("Please select at least one reason.");
      return;
    }

    if (selectedReasons.includes("Other") && !otherText.trim()) {
      setErrorMessage("Please specify details in the text box.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await submitRatingFeedback({
        rating: 0,
        reasons: selectedReasons,
        message: selectedReasons.includes("Other") ? otherText.trim() : undefined,
        context: {
          ...context,
          recommended_car_id: carId,
          source: "top_recommendation_inline",
        },
      });

      setSubmittedMessage("Thanks — this helps us improve.");
      setIsExpanded(false);
    } catch (err: any) {
      console.error("Thumbs down submit error", err);
      setErrorMessage(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rec-rating-card"
      style={{
        marginTop: "14px",
        padding: "16px 20px",
        background: "#1f2228",
        border: "1px solid rgba(201, 161, 74, 0.35)",
        borderRadius: "14px",
        color: "#f5f1e8",
        position: "relative",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {/* Cyber/Luxury Corner Brackets */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "4px",
          left: "6px",
          color: "#c9a14a",
          fontSize: "11px",
          opacity: 0.7,
        }}
      >
        ⌜
      </span>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "4px",
          right: "6px",
          color: "#c9a14a",
          fontSize: "11px",
          opacity: 0.7,
        }}
      >
        ⌟
      </span>

      {/* Main Prompt and Buttons Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🎯</span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#f5f1e8",
              letterSpacing: "0.2px",
            }}
          >
            Was this recommendation right for you?
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleThumbsUp}
            disabled={submitting}
            aria-label="Yes, good recommendation"
            title="Yes, this recommendation is right"
            style={{
              minWidth: "48px",
              minHeight: "44px", // 44px tap target
              padding: "8px 14px",
              borderRadius: "8px",
              background:
                currentRating === 1
                  ? "rgba(201, 161, 74, 0.25)"
                  : "rgba(255, 255, 255, 0.05)",
              border:
                currentRating === 1
                  ? "1px solid #c9a14a"
                  : "1px solid rgba(255, 255, 255, 0.15)",
              color: currentRating === 1 ? "#c9a14a" : "#f5f1e8",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
          >
            <span>👍</span>
            <span>Yes</span>
          </button>

          <button
            type="button"
            onClick={handleThumbsDown}
            disabled={submitting}
            aria-label="No, not right for me"
            title="No, this recommendation is not right"
            style={{
              minWidth: "48px",
              minHeight: "44px", // 44px tap target
              padding: "8px 14px",
              borderRadius: "8px",
              background:
                currentRating === 0
                  ? "rgba(248, 113, 113, 0.2)"
                  : "rgba(255, 255, 255, 0.05)",
              border:
                currentRating === 0
                  ? "1px solid #f87171"
                  : "1px solid rgba(255, 255, 255, 0.15)",
              color: currentRating === 0 ? "#f87171" : "#f5f1e8",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
          >
            <span>👎</span>
            <span>No</span>
          </button>
        </div>
      </div>

      {/* Success Acknowledgment Banner */}
      {submittedMessage && !isExpanded && (
        <div
          role="status"
          style={{
            marginTop: "12px",
            padding: "8px 14px",
            background: "rgba(201, 161, 74, 0.12)",
            border: "1px solid rgba(201, 161, 74, 0.4)",
            borderRadius: "8px",
            color: "#c9a14a",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>✓ {submittedMessage}</span>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            style={{
              background: "none",
              border: "none",
              color: "#f5f1e8",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Change feedback
          </button>
        </div>
      )}

      {/* Expanded Reason Chips Form (on 👎) */}
      {isExpanded && (
        <form onSubmit={handleSubmitReasons} style={{ marginTop: "16px" }}>
          <p
            style={{
              fontSize: "13px",
              color: "#c9a14a",
              fontWeight: 600,
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            What didn't fit? (Select all that apply)
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            {REASON_OPTIONS.map((reason) => {
              const isSelected = selectedReasons.includes(reason);
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => toggleReason(reason)}
                  style={{
                    minHeight: "44px", // Tap target
                    padding: "8px 14px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    background: isSelected
                      ? "rgba(201, 161, 74, 0.2)"
                      : "rgba(255, 255, 255, 0.04)",
                    color: isSelected ? "#c9a14a" : "#f5f1e8",
                    border: isSelected
                      ? "1px solid #c9a14a"
                      : "1px solid rgba(255, 255, 255, 0.12)",
                    transition: "all 0.18s ease",
                  }}
                >
                  {isSelected ? `✓ ${reason}` : reason}
                </button>
              );
            })}
          </div>

          {/* Short Text Field if "Other" is selected */}
          {selectedReasons.includes("Other") && (
            <div style={{ marginBottom: "14px" }}>
              <label
                htmlFor={`rec-rating-other-${carId}`}
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#94A3B8",
                  marginBottom: "4px",
                }}
              >
                Please specify (max 300 characters):
              </label>
              <textarea
                id={`rec-rating-other-${carId}`}
                value={otherText}
                maxLength={300}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Tell us what was missing or what you expected..."
                rows={2}
                style={{
                  width: "100%",
                  background: "#121419",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: "8px",
                  color: "#f5f1e8",
                  padding: "10px",
                  fontSize: "13px",
                  fontFamily: "'Space Grotesk', sans-serif",
                  resize: "vertical",
                  outline: "none",
                }}
              />
              <div
                style={{
                  textAlign: "right",
                  fontSize: "11px",
                  color: otherText.length >= 300 ? "#f87171" : "#64748B",
                  marginTop: "3px",
                }}
              >
                {otherText.length}/300
              </div>
            </div>
          )}

          {errorMessage && (
            <p
              style={{
                color: "#f87171",
                fontSize: "12px",
                marginBottom: "12px",
                fontWeight: 600,
              }}
            >
              ⚠️ {errorMessage}
            </p>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              style={{
                minHeight: "44px",
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                color: "#94A3B8",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                minHeight: "44px",
                padding: "8px 20px",
                background: "#c9a14a",
                border: "none",
                borderRadius: "8px",
                color: "#121419",
                fontSize: "13px",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
