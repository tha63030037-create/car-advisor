"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { submitFullFeedback } from "../lib/feedbackApi";

const FEEDBACK_TYPES = [
  "Recommendation quality",
  "Bug",
  "Missing car model",
  "Suggestion",
  "Other",
];

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [purchasedCar, setPurchasedCar] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  // Form submission states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation errors
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isMessageValid = message.trim().length >= 10 && message.trim().length <= 1000;
  const isTypeValid = feedbackType.length > 0;
  const isConsentValid = consent === true;
  const isEmailValid = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const isFormValid = isTypeValid && isMessageValid && isConsentValid && isEmailValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      type: true,
      message: true,
      consent: true,
      email: true,
    });

    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitFullFeedback({
        feedback_type: feedbackType,
        rating: rating,
        message: message.trim(),
        purchased_car: purchasedCar.trim() || undefined,
        email: email.trim() || undefined,
        consent: consent,
      });

      setIsSuccess(true);
    } catch (err: any) {
      console.error("Feedback submission error", err);
      setSubmitError(err.message || "Failed to submit feedback. Please check your connection and retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFeedbackType("");
    setRating(null);
    setMessage("");
    setPurchasedCar("");
    setEmail("");
    setConsent(false);
    setTouched({});
    setIsSuccess(false);
    setSubmitError(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121419",
        color: "#f5f1e8",
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "24px 16px 60px",
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          maxWidth: "760px",
          margin: "0 auto 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#c9a14a",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            minHeight: "44px", // Tap target
          }}
        >
          <span>←</span> Back to Car Advisor
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              background: "#c9a14a",
              color: "#121419",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 800,
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: "1px",
            }}
          >
            FEEDBACK
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "760px", margin: "0 auto" }}>
        {isSuccess ? (
          /* SUCCESS SCREEN */
          <div
            style={{
              background: "#1f2228",
              border: "1px solid rgba(201, 161, 74, 0.4)",
              borderRadius: "16px",
              padding: "48px 24px",
              textAlign: "center",
              position: "relative",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Cyber Corner Accents */}
            <span style={{ position: "absolute", top: "8px", left: "10px", color: "#c9a14a", fontSize: "14px" }}>⌜</span>
            <span style={{ position: "absolute", top: "8px", right: "10px", color: "#c9a14a", fontSize: "14px" }}>⌝</span>
            <span style={{ position: "absolute", bottom: "8px", left: "10px", color: "#c9a14a", fontSize: "14px" }}>⌞</span>
            <span style={{ position: "absolute", bottom: "8px", right: "10px", color: "#c9a14a", fontSize: "14px" }}>⌟</span>

            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(201, 161, 74, 0.15)",
                border: "2px solid #c9a14a",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "20px",
                color: "#c9a14a",
              }}
            >
              ✓
            </div>

            <h1
              style={{
                fontFamily: "'Oswald', sans-serif",
                textTransform: "uppercase",
                fontSize: "28px",
                letterSpacing: "1px",
                marginBottom: "12px",
                color: "#f5f1e8",
              }}
            >
              THANK YOU FOR YOUR FEEDBACK
            </h1>

            <p style={{ color: "#94A3B8", maxWidth: "480px", margin: "0 auto 28px", lineHeight: 1.6, fontSize: "15px" }}>
              Your feedback has been anonymously registered and will help our team calibrate the car recommendation algorithms and improve the experience for all drivers.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/"
                style={{
                  minHeight: "44px",
                  padding: "12px 28px",
                  background: "#c9a14a",
                  color: "#121419",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Back to my results
              </Link>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  minHeight: "44px",
                  padding: "12px 20px",
                  background: "transparent",
                  color: "#94A3B8",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Submit another response
              </button>
            </div>
          </div>
        ) : (
          /* FORM SCREEN */
          <div
            style={{
              background: "#1f2228",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              padding: "32px 24px",
              position: "relative",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Corner Bracket Details */}
            <span style={{ position: "absolute", top: "8px", left: "10px", color: "#c9a14a", fontSize: "14px" }}>⌜</span>
            <span style={{ position: "absolute", top: "8px", right: "10px", color: "#c9a14a", fontSize: "14px" }}>⌝</span>
            <span style={{ position: "absolute", bottom: "8px", left: "10px", color: "#c9a14a", fontSize: "14px" }}>⌞</span>
            <span style={{ position: "absolute", bottom: "8px", right: "10px", color: "#c9a14a", fontSize: "14px" }}>⌟</span>

            <div style={{ marginBottom: "28px" }}>
              <p
                style={{
                  color: "#c9a14a",
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: "13px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                COMMUNITY DRIVEN
              </p>
              <h1
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  textTransform: "uppercase",
                  fontSize: "28px",
                  letterSpacing: "1px",
                  margin: "0 0 8px",
                  color: "#f5f1e8",
                }}
              >
                HELP IMPROVE AI CAR ADVISOR
              </h1>
              <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                Every suggestion helps us fine-tune vehicle matching parameters, budget formulas, and market accuracy.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* 1. FEEDBACK TYPE (REQUIRED) */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "'Oswald', sans-serif",
                    textTransform: "uppercase",
                    fontSize: "13px",
                    letterSpacing: "1px",
                    color: "#f5f1e8",
                    marginBottom: "10px",
                  }}
                >
                  1. Feedback Type <span style={{ color: "#f87171" }}>*</span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {FEEDBACK_TYPES.map((type) => {
                    const isSelected = feedbackType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setFeedbackType(type);
                          setTouched((prev) => ({ ...prev, type: true }));
                        }}
                        style={{
                          minHeight: "44px", // 44px tap target
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
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
                        {isSelected ? `✓ ${type}` : type}
                      </button>
                    );
                  })}
                </div>
                {touched.type && !isTypeValid && (
                  <p style={{ color: "#f87171", fontSize: "12px", marginTop: "6px" }}>
                    Please select a feedback category.
                  </p>
                )}
              </div>

              {/* 2. OVERALL RATING (OPTIONAL 1-5 STARS) */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "'Oswald', sans-serif",
                    textTransform: "uppercase",
                    fontSize: "13px",
                    letterSpacing: "1px",
                    color: "#f5f1e8",
                    marginBottom: "8px",
                  }}
                >
                  2. Overall Advisor Rating (Optional)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating ?? rating ?? 0) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(rating === star ? null : star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        aria-label={`${star} star rating`}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "26px",
                          color: isFilled ? "#c9a14a" : "rgba(255, 255, 255, 0.2)",
                          minWidth: "44px",
                          minHeight: "44px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "transform 0.15s ease",
                        }}
                      >
                        ★
                      </button>
                    );
                  })}
                  {rating && (
                    <span style={{ fontSize: "13px", color: "#c9a14a", fontWeight: 600, marginLeft: "4px" }}>
                      {rating} / 5 Stars
                    </span>
                  )}
                </div>
              </div>

              {/* 3. MESSAGE (REQUIRED, 10-1000 CHARS) */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                  <label
                    htmlFor="feedback-message"
                    style={{
                      fontFamily: "'Oswald', sans-serif",
                      textTransform: "uppercase",
                      fontSize: "13px",
                      letterSpacing: "1px",
                      color: "#f5f1e8",
                    }}
                  >
                    3. Your Message <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <span
                    style={{
                      fontSize: "12px",
                      color: message.length < 10 ? "#94A3B8" : message.length > 1000 ? "#f87171" : "#c9a14a",
                    }}
                  >
                    {message.length} / 1000 characters (min 10)
                  </span>
                </div>
                <textarea
                  id="feedback-message"
                  rows={4}
                  value={message}
                  maxLength={1000}
                  onBlur={() => setTouched((prev) => ({ ...prev, message: true }))}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you liked, what wasn't accurate, or which cars you'd love to see added..."
                  style={{
                    width: "100%",
                    background: "#121419",
                    border: touched.message && !isMessageValid
                      ? "1px solid #f87171"
                      : "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "8px",
                    color: "#f5f1e8",
                    padding: "12px 14px",
                    fontSize: "14px",
                    fontFamily: "'Space Grotesk', sans-serif",
                    lineHeight: 1.5,
                    resize: "vertical",
                    outline: "none",
                  }}
                />
                {touched.message && !isMessageValid && (
                  <p style={{ color: "#f87171", fontSize: "12px", marginTop: "6px" }}>
                    Please enter at least 10 characters so we understand your feedback.
                  </p>
                )}
              </div>

              {/* 4. WHICH CAR DID YOU END UP BUYING? (OPTIONAL) */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  htmlFor="purchased-car"
                  style={{
                    display: "block",
                    fontFamily: "'Oswald', sans-serif",
                    textTransform: "uppercase",
                    fontSize: "13px",
                    letterSpacing: "1px",
                    color: "#f5f1e8",
                    marginBottom: "4px",
                  }}
                >
                  4. Which car did you end up buying? (Optional)
                </label>
                <p style={{ color: "#94A3B8", fontSize: "12px", margin: "0 0 8px" }}>
                  Helps our engineers calibrate recommendation accuracy against real purchasing choices.
                </p>
                <input
                  id="purchased-car"
                  type="text"
                  value={purchasedCar}
                  onChange={(e) => setPurchasedCar(e.target.value)}
                  placeholder="e.g. Honda City e:HEV, BYD Dolphin, Toyota Yaris Cross..."
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    background: "#121419",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "8px",
                    color: "#f5f1e8",
                    padding: "0 14px",
                    fontSize: "14px",
                    fontFamily: "'Space Grotesk', sans-serif",
                    outline: "none",
                  }}
                />
              </div>

              {/* 5. EMAIL (OPTIONAL) */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  htmlFor="feedback-email"
                  style={{
                    display: "block",
                    fontFamily: "'Oswald', sans-serif",
                    textTransform: "uppercase",
                    fontSize: "13px",
                    letterSpacing: "1px",
                    color: "#f5f1e8",
                    marginBottom: "4px",
                  }}
                >
                  5. Email Address (Optional)
                </label>
                <p style={{ color: "#94A3B8", fontSize: "12px", margin: "0 0 8px" }}>
                  Only provide your email if you'd like our team to reply to your inquiry.
                </p>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    background: "#121419",
                    border: touched.email && !isEmailValid
                      ? "1px solid #f87171"
                      : "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "8px",
                    color: "#f5f1e8",
                    padding: "0 14px",
                    fontSize: "14px",
                    fontFamily: "'Space Grotesk', sans-serif",
                    outline: "none",
                  }}
                />
                {touched.email && !isEmailValid && (
                  <p style={{ color: "#f87171", fontSize: "12px", marginTop: "6px" }}>
                    Please enter a valid email address.
                  </p>
                )}
              </div>

              {/* 6. PDPA CONSENT (REQUIRED) */}
              <div
                style={{
                  marginBottom: "28px",
                  padding: "14px 16px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: touched.consent && !isConsentValid
                    ? "1px solid #f87171"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    cursor: "pointer",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setTouched((prev) => ({ ...prev, consent: true }));
                    }}
                    style={{
                      width: "18px",
                      height: "18px",
                      accentColor: "#c9a14a",
                      cursor: "pointer",
                      marginTop: "2px",
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    I agree that AI Car Advisor may store this feedback to improve the service. No personal data is shared.{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPrivacyModal(true);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#c9a14a",
                        textDecoration: "underline",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      Read privacy note
                    </button>
                  </span>
                </label>
                {touched.consent && !isConsentValid && (
                  <p style={{ color: "#f87171", fontSize: "12px", marginTop: "8px", margin: "8px 0 0 28px" }}>
                    PDPA consent is required to submit feedback.
                  </p>
                )}
              </div>

              {/* Submit Error Banner */}
              {submitError && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(248, 113, 113, 0.15)",
                    border: "1px solid #f87171",
                    borderRadius: "8px",
                    color: "#f87171",
                    fontSize: "13px",
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>⚠️ {submitError}</span>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    style={{
                      background: "#f87171",
                      color: "#121419",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    minHeight: "48px",
                    padding: "12px 32px",
                    background: isFormValid ? "#c9a14a" : "rgba(201, 161, 74, 0.4)",
                    color: "#121419",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: 700,
                    fontFamily: "'Oswald', sans-serif",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    cursor: isFormValid && !submitting ? "pointer" : "not-allowed",
                    transition: "all 0.2s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {submitting && (
                    <span
                      style={{
                        display: "inline-block",
                        width: "14px",
                        height: "14px",
                        border: "2px solid #121419",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  )}
                  {submitting ? "SUBMITTING..." : "SUBMIT FEEDBACK"}
                </button>

                <Link
                  href="/"
                  style={{
                    color: "#94A3B8",
                    textDecoration: "none",
                    fontSize: "14px",
                    padding: "10px 16px",
                  }}
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* PRIVACY & PDPA MODAL */}
      {showPrivacyModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            style={{
              background: "#1f2228",
              border: "1px solid #c9a14a",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "100%",
              padding: "28px 24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: "20px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "#c9a14a",
                  margin: 0,
                }}
              >
                🔒 PRIVACY &amp; PDPA STATEMENT
              </h2>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: "14px", lineHeight: 1.6, color: "#CBD5E1" }}>
              <p>
                <strong>AI Car Advisor</strong> takes your privacy seriously:
              </p>
              <ul style={{ paddingLeft: "20px", margin: "12px 0" }}>
                <li><strong>Strictly Anonymous:</strong> Feedback is indexed using an anonymous session UUID stored only in your browser's localStorage.</li>
                <li><strong>No Personal Identifiers:</strong> We NEVER collect, record, or store your name, telephone number, IP address, or location.</li>
                <li><strong>Optional Email:</strong> Your email address is stored ONLY if you voluntarily provide it for a team response, and is never shared with third parties or advertisers.</li>
                <li><strong>Model Improvement:</strong> All submitted ratings and comments are used solely to calibrate machine learning scoring and improve questionnaire clarity.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              style={{
                marginTop: "16px",
                width: "100%",
                padding: "12px",
                background: "#c9a14a",
                border: "none",
                borderRadius: "8px",
                color: "#121419",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
