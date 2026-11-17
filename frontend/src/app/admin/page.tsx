"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface FeedbackItem {
  id: number;
  kind: string;
  session_id: string;
  rating: number | null;
  reasons: string[] | null;
  message: string | null;
  purchased_car: string | null;
  email: string | null;
  recommended_car_id: number | null;
  match_score: number | null;
  source: string | null;
  created_at: string | null;
  app_version: string | null;
  quiz_answers?: any;
  category_ratings?: Record<string, number> | null;
}

interface SummaryData {
  total_submissions: number;
  thumbs_up_count: number;
  thumbs_down_count: number;
  top_down_reasons: Array<{ reason: string; count: number }>;
  most_flagged_unclear_questions: Array<{ question_id: string; stage: number; count: number }>;
  purchased_in_top3_percentage: number;
  full_form_count: number;
  unclear_question_count: number;
  category_averages?: Record<string, number> | null;
  category_counts?: Record<string, number> | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminDashboardPage() {
  const [apiKey, setApiKey] = useState("car-advisor-admin-secret");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "rating" | "unclear_question" | "full_form">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Summary
      const sumRes = await fetch(`${API_BASE}/api/feedback/summary`, {
        headers: { "X-API-Key": apiKey },
      });
      if (!sumRes.ok) {
        throw new Error(`Summary API returned ${sumRes.status}: Check API key`);
      }
      const sumData = await sumRes.json();
      setSummary(sumData);

      // 2. Fetch Raw List
      const listRes = await fetch(`${API_BASE}/api/feedback/list?limit=200`, {
        headers: { "X-API-Key": apiKey },
      });
      if (!listRes.ok) {
        throw new Error(`List API returned ${listRes.status}`);
      }
      const listData = await listRes.json();
      setItems(listData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load feedback records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = items.filter((item) => {
    if (activeTab !== "all" && item.kind !== activeTab) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchMsg = item.message?.toLowerCase().includes(q);
      const matchReasons = item.reasons?.some((r) => r.toLowerCase().includes(q));
      const matchCar = item.purchased_car?.toLowerCase().includes(q);
      const matchSess = item.session_id.toLowerCase().includes(q);
      return matchMsg || matchReasons || matchCar || matchSess;
    }
    return true;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e1014",
        color: "#f5f1e8",
        fontFamily: "'Space Grotesk', sans-serif",
        padding: "24px 20px 80px",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
            paddingBottom: "16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/"
              style={{
                color: "#c9a14a",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              ← Back to App
            </Link>
            <span style={{ color: "#64748B" }}>|</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span
                style={{
                  background: "#c9a14a",
                  color: "#121419",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 800,
                  fontFamily: "'Oswald', sans-serif",
                }}
              >
                ADMIN
              </span>
              <h1
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontFamily: "'Oswald', sans-serif",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "#f5f1e8",
                }}
              >
                User Feedback Dashboard
              </h1>
            </div>
          </div>

          {/* API KEY & REFRESH */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Admin API Key"
              title="Admin API Key"
              style={{
                padding: "8px 12px",
                background: "#181b20",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#f5f1e8",
                fontSize: "12px",
                fontFamily: "monospace",
                width: "200px",
              }}
            />
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              style={{
                padding: "8px 16px",
                background: "#c9a14a",
                color: "#121419",
                border: "none",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>↻</span>
              <span>{loading ? "Loading..." : "Refresh Data"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "14px 18px",
              background: "rgba(248, 113, 113, 0.15)",
              border: "1px solid #f87171",
              borderRadius: "8px",
              color: "#f87171",
              fontSize: "13.5px",
              marginBottom: "24px",
            }}
          >
            ⚠️ {error} — Ensure FastAPI backend is running on {API_BASE}
          </div>
        )}

        {/* METRICS OVERVIEW CARDS */}
        {summary && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                background: "#181b20",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase" }}>
                Total Submissions
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#f5f1e8", marginTop: "4px" }}>
                {summary.total_submissions}
              </div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                {summary.full_form_count} full forms · {summary.unclear_question_count} unclear flags
              </div>
            </div>

            <div
              style={{
                background: "#181b20",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase" }}>
                Thumbs Up / Down
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px", display: "flex", gap: "14px" }}>
                <span style={{ color: "#34D399" }}>👍 {summary.thumbs_up_count}</span>
                <span style={{ color: "#F87171" }}>👎 {summary.thumbs_down_count}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                {summary.thumbs_up_count + summary.thumbs_down_count > 0
                  ? `${Math.round(
                      (summary.thumbs_up_count / (summary.thumbs_up_count + summary.thumbs_down_count)) * 100
                    )}% positive ratio`
                  : "No inline ratings yet"}
              </div>
            </div>

            <div
              style={{
                background: "#181b20",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase" }}>
                Purchased in Top 3
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#c9a14a", marginTop: "4px" }}>
                {summary.purchased_in_top3_percentage}%
              </div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                Model recommendation accuracy
              </div>
            </div>

            <div
              style={{
                background: "#181b20",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase" }}>
                Top 👎 Reason
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#f87171", marginTop: "6px" }}>
                {summary.top_down_reasons.length > 0
                  ? `${summary.top_down_reasons[0].reason} (${summary.top_down_reasons[0].count})`
                  : "None reported"}
              </div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                Primary user friction point
              </div>
            </div>
          </div>
        )}

        {/* 5-DIMENSION EVALUATION SCORECARD */}
        {summary && summary.category_averages && (
          <div
            style={{
              background: "#181b20",
              border: "1px solid rgba(201, 161, 74, 0.35)",
              borderRadius: "14px",
              padding: "22px 24px",
              marginBottom: "28px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "18px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                paddingBottom: "12px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: "12px",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "#c9a14a",
                  }}
                >
                  DIAGNOSTIC REPORT · ผลคะแนนประเมิน 5 ด้าน
                </span>
                <h3 style={{ fontSize: "18px", margin: "4px 0 0", color: "#f5f1e8" }}>
                  คะแนนเฉลี่ยแยกตามมิติ (5 Evaluation Dimensions Breakdown)
                </h3>
              </div>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                สเกล 1.0 – 5.0 (เป้าหมาย ≥ 4.0)
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "14px",
              }}
            >
              {[
                { key: "accuracy", icon: "🎯", label: "ความแม่นยำผลลัพธ์", desc: "รถที่แนะนำตรงใจ" },
                { key: "tco", icon: "💰", label: "ความชัดเจนต้นทุน 5 ปี", desc: "TCO & ค่างวดการเงิน" },
                { key: "quiz", icon: "📝", label: "ความง่ายของแบบสอบถาม", desc: "กระชับ ตรงประเด็น" },
                { key: "checklist", icon: "📋", label: "ประโยชน์ Checklist", desc: "ตรวจรับรถที่โชว์รูม" },
                { key: "overall", icon: "⭐", label: "ความเชื่อมั่นในภาพรวม", desc: "ยินดีแนะนำผู้อื่น" },
              ].map((dim) => {
                const score = summary.category_averages ? summary.category_averages[dim.key] || 0 : 0;
                const count = summary.category_counts ? summary.category_counts[dim.key] || 0 : 0;
                const pct = (score / 5) * 100;
                const statusColor = score >= 4.0 ? "#34D399" : score >= 3.0 ? "#c9a14a" : score > 0 ? "#F87171" : "#64748B";
                const statusLabel = score >= 4.0 ? "🟢 ดีมาก (จุดเด่น)" : score >= 3.0 ? "🟡 ปานกลาง" : score > 0 ? "🔴 ควรปรับปรุงเร่งด่วน" : "ยังไม่มีข้อมูล";

                return (
                  <div
                    key={dim.key}
                    style={{
                      background: "rgba(18, 20, 25, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#f5f1e8" }}>
                        <span>{dim.icon}</span>
                        <span>{dim.label}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                        {dim.desc}
                      </div>
                    </div>

                    <div style={{ marginTop: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                        <span style={{ fontSize: "22px", fontWeight: 800, color: statusColor }}>
                          {score > 0 ? score.toFixed(1) : "—"}
                          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 400 }}> / 5.0</span>
                        </span>
                        <span style={{ fontSize: "10.5px", color: "#64748B" }}>
                          {count} คนตอบ
                        </span>
                      </div>

                      {/* Score Bar */}
                      <div
                        style={{
                          height: "6px",
                          width: "100%",
                          background: "rgba(255, 255, 255, 0.08)",
                          borderRadius: "3px",
                          overflow: "hidden",
                          marginBottom: "8px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: statusColor,
                            borderRadius: "3px",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>

                      <div style={{ fontSize: "10.5px", fontWeight: 600, color: statusColor }}>
                        {statusLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTROLS & SEARCH */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: "all", label: `All (${items.length})` },
              { id: "full_form", label: `Full Forms & Stage 6` },
              { id: "rating", label: `Inline Rating (👍/👎)` },
              { id: "unclear_question", label: `Unclear Flags (❓)` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "6px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: activeTab === tab.id ? "#c9a14a" : "rgba(255, 255, 255, 0.05)",
                  color: activeTab === tab.id ? "#121419" : "#94A3B8",
                  border: "none",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search message, reason, car, session..."
            style={{
              padding: "8px 14px",
              background: "#181b20",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "6px",
              color: "#f5f1e8",
              fontSize: "13px",
              width: "280px",
              outline: "none",
            }}
          />
        </div>

        {/* FEEDBACK LIST TABLE / CARDS */}
        {filteredItems.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              background: "#181b20",
              borderRadius: "12px",
              color: "#64748B",
            }}
          >
            {loading ? "Loading feedback entries..." : "No feedback records found matching filter."}
          </div>
        ) : (
          <div
            style={{
              background: "#181b20",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <th style={{ padding: "12px 16px", color: "#94A3B8", fontWeight: 600 }}>Time</th>
                    <th style={{ padding: "12px 16px", color: "#94A3B8", fontWeight: 600 }}>Type</th>
                    <th style={{ padding: "12px 16px", color: "#94A3B8", fontWeight: 600 }}>Rating</th>
                    <th style={{ padding: "12px 16px", color: "#94A3B8", fontWeight: 600 }}>Feedback / Message</th>
                    <th style={{ padding: "12px 16px", color: "#94A3B8", fontWeight: 600 }}>Reasons / Tags</th>
                    <th style={{ padding: "12px 16px", color: "#94A3B8", fontWeight: 600 }}>Purchased Car</th>
                    <th style={{ padding: "12px 16px", color: "#94A3B8", fontWeight: 600 }}>Origin</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        verticalAlign: "top",
                      }}
                    >
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap", color: "#94A3B8", fontSize: "12px" }}>
                        {item.created_at || "—"}
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background:
                              item.kind === "rating"
                                ? "rgba(56, 189, 248, 0.15)"
                                : item.kind === "unclear_question"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(201, 161, 74, 0.2)",
                            color:
                              item.kind === "rating"
                                ? "#38BDF8"
                                : item.kind === "unclear_question"
                                ? "#F59E0B"
                                : "#c9a14a",
                          }}
                        >
                          {item.kind}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        {item.kind === "rating" ? (
                          item.rating === 1 ? (
                            <span style={{ color: "#34D399", fontWeight: 700 }}>👍 Yes</span>
                          ) : (
                            <span style={{ color: "#F87171", fontWeight: 700 }}>👎 No</span>
                          )
                        ) : item.rating ? (
                          <span style={{ color: "#c9a14a", fontWeight: 700 }}>
                            {"★".repeat(item.rating)} ({item.rating}/5)
                          </span>
                        ) : (
                          <span style={{ color: "#64748B" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", maxWidth: "340px", wordBreak: "break-word" }}>
                        <div style={{ color: "#f5f1e8", lineHeight: 1.45 }}>
                          {item.message || <span style={{ color: "#64748B", fontStyle: "italic" }}>No typed message</span>}
                        </div>
                        {item.category_ratings && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                            {Object.entries(item.category_ratings).map(([k, v]) => {
                              const labels: Record<string, string> = {
                                accuracy: "🎯 แม่นยำ",
                                tco: "💰 TCO",
                                quiz: "📝 คำถาม",
                                checklist: "📋 เช็กลิสต์",
                                overall: "⭐ ภาพรวม",
                              };
                              return (
                                <span
                                  key={k}
                                  style={{
                                    fontSize: "10.5px",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    background: v >= 4 ? "rgba(52, 211, 153, 0.15)" : v >= 3 ? "rgba(201, 161, 74, 0.15)" : "rgba(248, 113, 113, 0.15)",
                                    color: v >= 4 ? "#34D399" : v >= 3 ? "#c9a14a" : "#F87171",
                                    border: `1px solid ${v >= 4 ? "rgba(52, 211, 153, 0.3)" : v >= 3 ? "rgba(201, 161, 74, 0.3)" : "rgba(248, 113, 113, 0.3)"}`,
                                  }}
                                >
                                  {labels[k] || k}: {v}/5
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {item.email && (
                          <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
                            ✉️ {item.email}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", maxWidth: "220px" }}>
                        {item.reasons && item.reasons.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {item.reasons.map((r, i) => (
                              <span
                                key={i}
                                style={{
                                  background: "rgba(255, 255, 255, 0.06)",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  color: "#CBD5E1",
                                }}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#64748B" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap", color: "#c9a14a", fontWeight: 600 }}>
                        {item.purchased_car || <span style={{ color: "#64748B", fontWeight: 400 }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap", color: "#94A3B8", fontSize: "11px" }}>
                        <div>{item.source || "—"}</div>
                        <div style={{ color: "#64748B", fontSize: "10px", marginTop: "2px" }}>
                          ID: {item.session_id.substring(0, 10)}...
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
