"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { CarPhoto, CompareButton, PhotoCredit, useCatalogue } from "../components/Site";
import { baht, CARDS, CRIT_COLOR, FUEL_TH, Key, postJSON, RecommendResponse as Resp, saveLastCriteria, Zone } from "../lib/api";

const ZONES: { z: Zone; label: string }[] = [
  { z: 3, label: "สำคัญที่สุด" },
  { z: 2, label: "สำคัญ" },
  { z: 1, label: "ไม่ค่อยสำคัญ" },
];
const LIFESTYLES: { key: string; label: string; icon: string }[] = [
  { key: "city", label: "ขับในเมือง รถติด จอดบ่อย", icon: "🏙️" },
  { key: "long_trips", label: "ขับทางไกล ต่างจังหวัดบ่อย", icon: "🛣️" },
  { key: "offroad", label: "ทางลุย ลูกรัง ขึ้นเขา น้ำท่วม", icon: "⛰️" },
  { key: "cargo", label: "บรรทุกของ ใช้ทำงาน", icon: "📦" },
  { key: "people", label: "พาคนเยอะ ผู้สูงอายุ", icon: "👨‍👩‍👧‍👦" },
  { key: "kids", label: "มีเด็กเล็ก", icon: "🧒" },
  { key: "bulky", label: "ขนของใหญ่ สัตว์เลี้ยง จักรยาน", icon: "🐕" },
];
const LEGACY: Record<string, string[]> = { school_run: ["kids", "city"], camping: ["offroad", "bulky"], merit_family: ["people"], pets: ["bulky"], work_cargo: ["cargo"] };
const FUELS: { key: string; label: string }[] = [
  { key: "petrol", label: "น้ำมัน" }, { key: "diesel", label: "ดีเซล" }, { key: "hybrid", label: "ไฮบริด" }, { key: "ev", label: "ไฟฟ้า" }, { key: "any", label: "ไม่สนใจ" },
];
const STRETCH = [
  { v: 0, label: "ไม่ยืดเลย" },
  { v: 0.1, label: "ยืดนิดหน่อย (10%)" },
  { v: 0.15, label: "ค่าตั้งต้น (15%)" },
  { v: 0.2, label: "ยืดได้ถ้าคุ้ม (20%)" },
];
const BODIES = [
  { key: "sedan", label: "ซีดาน" },
  { key: "hatchback", label: "แฮทช์แบ็ก" },
  { key: "suv", label: "SUV" },
  { key: "ppv", label: "PPV" },
  { key: "mpv", label: "MPV/รถตู้" },
  { key: "pickup", label: "กระบะ" },
  { key: "coupe", label: "คูเป้" },
];
/* ------------------------------------------------------------------- page */
export default function Advisor() {
  const { cars } = useCatalogue();
  const BRANDS = useMemo(() => Array.from(new Set((cars || []).map((c) => c.brand))).sort((x, y) => x.localeCompare(y)), [cars]);
  const [zones, setZones] = useState<Record<Key, Zone>>({
    budget: 3, lifestyle: 3, running_cost: 2, safety: 2, design: 1, powertrain: 2,
  });
  const [picked, setPicked] = useState<Key | null>(null);
  const [budgetK, setBudgetK] = useState(800);
  const [stretch, setStretch] = useState(0.15);
  const [lifestyles, setLifestyles] = useState<string[]>([]);
  const [budgetSet, setBudgetSet] = useState(false);
  const [budgetText, setBudgetText] = useState("");
  const [income, setIncome] = useState<number | null>(null);
  const [incomeText, setIncomeText] = useState("");
  const [payment, setPayment] = useState<"cash" | "finance" | null>(null);
  const [down, setDown] = useState(0.25);
  const [years, setYears] = useState(5);
  const digits = (t: string) => Number(t.replace(/[^\d]/g, "")) || 0;
  const setBudgetFrom = (t: string) => {
    const n = digits(t);
    setBudgetText(n ? baht(n) : "");
    if (n >= 50000) { setBudgetK(n / 1000); setBudgetSet(true); } else setBudgetSet(false);
  };
  const setIncomeFrom = (t: string) => {
    const n = digits(t);
    setIncomeText(n ? baht(n) : "");
    setIncome(n >= 3000 ? n : null);
  };
  // which answers came from the visitor (not defaults) — the chat must still ask about the rest
  const [stretchSet, setStretchSet] = useState(false);
  const [zonesSet, setZonesSet] = useState(false);
  // results stay hidden until the visitor has answered everything (chat done, or manual form submitted)
  const [revealed, setRevealed] = useState(false);
  const [bodies, setBodies] = useState<string[]>([]);
  const [brandOnly, setBrandOnly] = useState<string[]>([]);
  const [brandPref, setBrandPref] = useState<string[]>([]);
  const [seatsMin, setSeatsMin] = useState<number | null>(null);
  const [noEv, setNoEv] = useState(false);
  const [fuelPref, setFuelPref] = useState<string[]>([]);
  const toggleFuel = (k: string) => setFuelPref((cur) => k === "any" ? (cur.includes("any") ? [] : ["any"]) : (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur.filter((x) => x !== "any"), k]));
  const [ncapMin, setNcapMin] = useState(false);
  const [brandExclude, setBrandExclude] = useState<string[]>([]);

  // chat (spec 5): the bot fills these same controls, so both modes drive one engine
  const [mode, setMode] = useState<"chat" | "manual">("chat");
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode");
    if (m === "manual") setMode("manual");
  }, []);
  const [chatMsgs, setChatMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [asked, setAsked] = useState<string[]>([]);
  const [quick, setQuick] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatEngine, setChatEngine] = useState<string>("");
  const [chatDone, setChatDone] = useState(false);
  const [explainText, setExplainText] = useState<string>("");
  const [explainBusy, setExplainBusy] = useState(false);
  const chatEnd = useRef<HTMLDivElement | null>(null);
  const chatTop = useRef<HTMLDivElement | null>(null);
  const resultsTop = useRef<HTMLElement | null>(null);

  const [data, setData] = useState<Resp | null>(null);
  const [prevRank, setPrevRank] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const lastRanks = useRef<Record<number, number>>({});

  // live weights preview (same formula as the backend: points / total)
  // a card the visitor gave no input for (no lifestyle / no body type) is left out, same as the backend
  const inactive = useMemo(() => {
    const out: Key[] = [];
    if (lifestyles.length === 0) out.push("lifestyle");
    if (bodies.length === 0 && brandPref.length === 0) out.push("design");
    return out;
  }, [lifestyles, bodies, brandPref]);
  const weights = useMemo(() => {
    const total = CARDS.reduce((s, c) => s + (inactive.includes(c.key) ? 0 : zones[c.key]), 0) || 1;
    return Object.fromEntries(CARDS.map((c) => [c.key, inactive.includes(c.key) ? 0 : Math.round((100 * zones[c.key]) / total)])) as Record<Key, number>;
  }, [zones, inactive]);
  const wLabel = (k: Key) => (inactive.includes(k) ? "ไม่นับ" : `${weights[k]}%`);

  const criteria = useMemo(() => ({
    budget: Math.round(budgetK * 1000),
    payment,
    monthly_income: payment === "finance" ? income : null,
    down_payment_pct: down,
    loan_years: years,
    budget_stretch: stretch,
    brand_only: brandOnly,
    brand_preferred: brandPref,
    brand_exclude: brandExclude,
    seats_min: seatsMin,
    fuel_only: null,
    fuel_exclude: noEv ? ["ev"] : [],
    fuel_preferred: fuelPref,
    min_ncap_stars: ncapMin ? 3 : null,
    body_preferred: bodies,
    lifestyles,
    km_per_year: 15000,
    priorities: zones,
    top_n: 10,
  }), [budgetK, payment, income, down, years, stretch, brandOnly, brandPref, brandExclude, seatsMin, noEv, fuelPref, bodies, lifestyles, zones, ncapMin]);

  // ---------------------------------------------------------------- chat
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyChatCriteria = (c: any) => {
    if (c.budget) { setBudgetK(c.budget / 1000); setBudgetSet(true); setBudgetText(baht(c.budget)); }
    if (c.payment === "cash" || c.payment === "finance") setPayment(c.payment);
    if (c.monthly_income) { setIncome(c.monthly_income); setIncomeText(baht(c.monthly_income)); }
    if (typeof c.budget_stretch === "number") { setStretch(c.budget_stretch); setStretchSet(true); }
    if (Array.isArray(c.lifestyles)) setLifestyles(Array.from(new Set((c.lifestyles as string[]).flatMap((x) => LEGACY[x] || [x]))));
    if (Array.isArray(c.fuel_preferred) && c.fuel_preferred.length) setFuelPref(c.fuel_preferred);
    if (Array.isArray(c.body_preferred)) setBodies(c.body_preferred);
    if (Array.isArray(c.brand_only)) setBrandOnly(c.brand_only);
    if (Array.isArray(c.brand_preferred)) setBrandPref(c.brand_preferred);
    if (Array.isArray(c.brand_exclude)) setBrandExclude(c.brand_exclude);
    if (c.seats_min !== undefined) setSeatsMin(c.seats_min ?? null);
    if (Array.isArray(c.fuel_exclude)) setNoEv(c.fuel_exclude.includes("ev"));
    if (c.min_ncap_stars !== undefined) setNcapMin(!!c.min_ncap_stars);
    if (c.priorities) { setZones({ powertrain: 2, ...c.priorities }); setZonesSet(true); }
  };

  const sendChat = async (text: string | null) => {
    const msgs = text ? [...chatMsgs, { role: "user" as const, content: text }] : chatMsgs;
    if (text) setChatMsgs(msgs);
    setChatInput("");
    setQuick([]);
    setChatBusy(true);
    try {
      // send what the controls show now, so manual edits and chat stay in sync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // defaults the visitor never chose are sent as null, so the advisor still asks about them
      const sent = { ...criteria, payment, monthly_income: payment === "finance" ? income : null, budget: budgetSet ? criteria.budget : null, budget_stretch: stretchSet ? stretch : null, priorities: zonesSet ? zones : null };
      const r: any = await postJSON("/api/chat", { messages: msgs, criteria: sent, asked });
      setChatMsgs([...msgs, { role: "assistant", content: r.reply }]);
      setAsked(r.asked);
      setQuick(r.quick_replies || []);
      setChatEngine(r.engine);
      if (r.done) { setChatDone(true); setRevealed(true); }
      applyChatCriteria(r.criteria);
    } catch {
      setChatMsgs([...msgs, { role: "assistant", content: "ขอโทษค่ะ ตอนนี้ที่ปรึกษาตอบไม่ได้ ลองพิมพ์ใหม่ หรือสลับไปแท็บ \"ตั้งค่าเอง\" ได้เลยค่ะ" }]);
    } finally {
      setChatBusy(false);
    }
  };

  // greet once when the chat tab first opens
  useEffect(() => {
    if (mode === "chat" && chatMsgs.length === 0 && !chatBusy) sendChat(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [chatMsgs, chatBusy, explainText]);

  // once the chat has covered every topic, the advisor explains the top 3 in the chat (spec 5.4)
  // and re-explains whenever the user changes something afterwards
  useEffect(() => {
    if (!chatDone || !data || data.results.length === 0) return;
    const t = setTimeout(async () => {
      setExplainBusy(true);
      try {
        const r = await postJSON<{ text: string }>("/api/explain", criteria);
        setExplainText(r.text);
      } catch {
        setExplainText("");
      } finally {
        setExplainBusy(false);
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatDone, data]);

  // the phone "see results" button hides while the results are already on screen
  const [resultsInView, setResultsInView] = useState(false);
  useEffect(() => {
    const el = resultsTop.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setResultsInView(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: "smooth", block: "start" });

  // re-rank automatically whenever anything changes — the demo moment in spec 6
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(async () => {
      setLoading(true);
      setErr(null);
      try {
        const json = await postJSON<Resp>("/api/v2/recommend", criteria);
        saveLastCriteria(criteria);
        setPrevRank(lastRanks.current);
        lastRanks.current = Object.fromEntries(json.results.map((r) => [r.id, r.rank]));
        setData(json);
      } catch (e) {
        setErr("ตอนนี้ดึงผลการจัดอันดับไม่ได้ (" + (e as Error).message + ") ลองเปลี่ยนเงื่อนไขอีกครั้ง หรือรีเฟรชหน้านี้");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [criteria, revealed]);

  const manualMissing = [
    !payment && "เลือกซื้อเงินสดหรือผ่อน",
    payment === "finance" && !income && "กรอกรายได้ต่อเดือน",
    !budgetSet && "กรอกงบซื้อรถ",
    lifestyles.length === 0 && "เลือกการใช้งานอย่างน้อย 1 ข้อ",
    fuelPref.length === 0 && "เลือกขุมพลังที่อยากได้ (หรือไม่สนใจ)",
    bodies.length === 0 && brandPref.length === 0 && "เลือกทรงหรือแบรนด์ที่ชอบอย่างน้อย 1 อย่าง",
  ].filter(Boolean) as string[];
  // same estimate as the backend: 25% down, 5 years, 3% flat — shown live under the budget box
  const inst = (price: number) => (price * (1 - down) * (1 + 0.03 * years)) / (12 * years);
  const afford = payment === "finance" && income && budgetSet ? {
    inst: Math.round(inst(budgetK * 1000)),
    pct: Math.round((1000 * inst(budgetK * 1000)) / income) / 10,
    comfortable: Math.round((income * 0.3 * 12 * years) / ((1 - down) * (1 + 0.03 * years)) / 1000) * 1000,
    level: inst(budgetK * 1000) / income <= 0.3 ? "ok" : inst(budgetK * 1000) / income <= 0.5 ? "tight" : "over",
  } : null;
  const reveal = () => { setRevealed(true); setTimeout(() => scrollTo(resultsTop.current), 350); };
  const TOPIC_TH: Record<string, string> = { usage: "การใช้งาน", lifestyle: "ใครนั่ง ขนอะไร", payment: "ซื้อเงินสดหรือผ่อน", income: "รายได้ (ถ้าผ่อน)", budget: "งบประมาณ", stretch: "งบยืดได้แค่ไหน", brand: "แบรนด์", fuel: "ขุมพลังที่อยากได้", design: "ทรงรถที่ชอบ", priorities: "เรื่องที่สำคัญ" };
  const answered = chatDone ? Object.keys({ usage: 1, lifestyle: 1, payment: 1, income: 1, budget: 1, stretch: 1, fuel: 1, brand: 1, design: 1, priorities: 1 }) : asked.slice(0, -1);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const moveTo = (z: Zone) => {
    if (!picked) return;
    setZones({ ...zones, [picked]: z }); setZonesSet(true);
    setPicked(null);
  };

  return (
    <div className="v2 wrap">
      <header className="hero">
        <h1>หาคันที่ใช่</h1>
        <p>{mode === "chat"
          ? "ตอบคำถามของที่ปรึกษาสักครู่ พอได้ข้อมูลครบ ระบบจะจัดอันดับรถที่เหมาะกับคุณที่สุด"
          : "เรียงการ์ด 6 ใบตามความสำคัญ ตั้งงบและการใช้งาน แล้วกดดูรถที่เหมาะกับคุณ หลังจากนั้นอันดับจะเปลี่ยนตามทุกครั้งที่คุณขยับ"}</p>
      </header>

      <div className="layout">
        {/* ------------------------------------------------ left: controls */}
        <section className="panel">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={mode === "chat"} className={mode === "chat" ? "on" : ""} onClick={() => setMode("chat")}>💬 คุยกับที่ปรึกษา</button>
            <button role="tab" aria-selected={mode === "manual"} className={mode === "manual" ? "on" : ""} onClick={() => setMode("manual")}>🎛️ ตั้งค่าเอง</button>
          </div>

          {mode === "chat" && (
            <div className="chat" ref={chatTop}>
              <div className="msgs" aria-live="polite">
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`bubble ${m.role}`}>{m.content}</div>
                ))}
                {chatBusy && <div className="bubble assistant typing"><span /><span /><span /></div>}
                {chatDone && data && data.results.length > 0 && (
                  <div className="picks" aria-label="รถ 3 อันดับแรก">
                    <div className="picks-head">รถ 3 อันดับแรกสำหรับคุณ</div>
                    {data.results.slice(0, 3).map((r) => (
                      <button key={r.id} className="pick" onClick={() => { setOpen(r.id); scrollTo(resultsTop.current); }}>
                        <span className="pr">{r.rank}</span>
                        <span className="pn">{r.name}<small>{baht(r.price)} บาท{r.over_budget ? ` · ${r.over_budget.label}` : ""}{r.safety_warning ? ` · ⚠️ ${r.safety_warning}` : ""}</small></span>
                        <span className="ps">{Math.round(r.score)}%</span>
                      </button>
                    ))}
                    {explainBusy && !explainText && <div className="bubble assistant typing"><span /><span /><span /></div>}
                    {explainText && <div className="bubble assistant explain">{explainText}</div>}
                    <button className="see-all" onClick={() => scrollTo(resultsTop.current)}>ดูที่มาคะแนนและอันดับ 4–10 ↓</button>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              {quick.length > 0 && !chatBusy && (
                <div className="chips quick">
                  {quick.map((q) => <button key={q} className="chip" onClick={() => sendChat(q)}>{q}</button>)}
                </div>
              )}
              <form className="ask" onSubmit={(e) => { e.preventDefault(); if (chatInput.trim() && !chatBusy) sendChat(chatInput.trim()); }}>
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="พิมพ์เล่าได้เลย เช่น มีลูก 2 คน งบ 9 แสน" maxLength={500} aria-label="ข้อความถึงที่ปรึกษา" enterKeyHint="send" autoComplete="off" />
                <button type="submit" disabled={chatBusy || !chatInput.trim()}>ส่ง</button>
              </form>
              <p className="hint">{revealed ? "อยากปรับอะไร พิมพ์บอกได้เลย อันดับจะเปลี่ยนตาม" : "ตอบครบแล้วรถที่เหมาะกับคุณจะขึ้นทันที"} {chatEngine === "rules" && "· โหมดอ่านคำสำคัญ (ยังไม่ได้เชื่อม AI)"}</p>
              {(zonesSet || revealed) && <div className="mini">
                <div className="wbar" aria-label="น้ำหนักแต่ละเกณฑ์">
                  {CARDS.map((c) => (
                    <div key={c.key} style={{ width: `${weights[c.key]}%`, background: CRIT_COLOR[c.key] }} title={`${c.label} ${weights[c.key]}%`} />
                  ))}
                </div>
                <div className="legend">{CARDS.map((c) => <span key={c.key}><i style={{ background: CRIT_COLOR[c.key] }} />{c.label} {wLabel(c.key)}</span>)}</div>
              </div>}
            </div>
          )}

          {mode === "manual" && (<>
          <h2>1. งบและการจ่าย</h2>
          <label className="sub" htmlFor="budget">งบซื้อรถ <b className="req">จำเป็น</b></label>
          <div className="money">
            <input id="budget" inputMode="numeric" autoComplete="off" placeholder="เช่น 900,000" value={budgetText} onChange={(e) => setBudgetFrom(e.target.value)} />
            <span>บาท</span>
          </div>
          <div className="chips small">
            {[500000, 800000, 1000000, 1500000, 2000000, 3000000, 5000000].map((v) => (
              <button key={v} className={`chip ${budgetSet && budgetK * 1000 === v ? "on" : ""}`} onClick={() => setBudgetFrom(String(v))}>{v >= 1000000 ? `${v / 1000000} ล้าน` : `${v / 100000} แสน`}</button>
            ))}
          </div>
          <label className="sub">ซื้อเงินสดหรือผ่อน <b className="req">จำเป็น</b></label>
          <div className="tabs pay">
            <button className={payment === "cash" ? "on" : ""} onClick={() => setPayment("cash")}>ซื้อเงินสด</button>
            <button className={payment === "finance" ? "on" : ""} onClick={() => setPayment("finance")}>ผ่อน</button>
          </div>
          {payment === "finance" && (<>
          <label className="sub" htmlFor="income">รายได้ต่อเดือน (รวมคนที่ช่วยผ่อน) <b className="req">จำเป็น</b> <span className="muted">ใช้บอกค่างวดเท่านั้น ไม่มีผลกับคะแนน</span></label>
          <div className="money">
            <input id="income" inputMode="numeric" autoComplete="off" placeholder="เช่น 35,000" value={incomeText} onChange={(e) => setIncomeFrom(e.target.value)} />
            <span>บาท/เดือน</span>
          </div>
          <div className="chips small">
            {[20000, 30000, 50000, 80000, 150000].map((v) => (
              <button key={v} className={`chip ${income === v ? "on" : ""}`} onClick={() => setIncomeFrom(String(v))}>{baht(v)}</button>
            ))}
          </div>
          <div className="loan">
            <div>
              <label className="sub" htmlFor="down">เงินดาวน์</label>
              <select id="down" value={down} onChange={(e) => setDown(+e.target.value)}>
                {[0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5].map((v) => <option key={v} value={v}>{Math.round(v * 100)}%</option>)}
              </select>
            </div>
            <div>
              <label className="sub" htmlFor="years">ผ่อนกี่ปี</label>
              <select id="years" value={years} onChange={(e) => setYears(+e.target.value)}>
                {[3, 4, 5, 6, 7, 8].map((v) => <option key={v} value={v}>{v} ปี</option>)}
              </select>
            </div>
          </div>
          {afford && (
            <p className={`afford ${afford.level}`}>
              งบนี้ผ่อนราว {baht(afford.inst)} บาท/เดือน = {afford.pct}% ของรายได้ · คู่มือซื้อรถแนะนำค่างวดไม่เกิน 30% คือรถราคาราว {baht(afford.comfortable)} บาท (ดอกเบี้ยสมมติ 3% ต่อปี)
            </p>
          )}
          </>)}
          <label className="sub">ยอมเกินงบได้แค่ไหน</label>
          <div className="chips">
            {STRETCH.map((s) => (
              <button key={s.v} className={`chip ${stretch === s.v ? "on" : ""}`} onClick={() => { setStretch(s.v); setStretchSet(true); }}>{s.label}</button>
            ))}
          </div>

          <h2>2. การใช้งาน <small>(เลือกได้หลายข้อ)</small></h2>
          <div className="chips">
            {LIFESTYLES.map((l) => (
              <button key={l.key} className={`chip ${lifestyles.includes(l.key) ? "on" : ""}`} onClick={() => toggle(lifestyles, l.key, setLifestyles)}>
                {l.icon} {l.label}
              </button>
            ))}
          </div>

          <h2>3. เงื่อนไขบังคับ <small>(ตัดทิ้ง ไม่ใช่แค่หักคะแนน)</small></h2>
          <label className="sub">เอาเฉพาะแบรนด์</label>
          <div className="chips small">
            {BRANDS.map((b) => (
              <button key={b} className={`chip ${brandOnly.includes(b) ? "on" : ""}`} onClick={() => toggle(brandOnly, b, setBrandOnly)}>{b}</button>
            ))}
          </div>
          <label className="sub">ต้องนั่งได้อย่างน้อย</label>
          <div className="chips">
            {[null, 5, 7].map((s) => (
              <button key={String(s)} className={`chip ${seatsMin === s ? "on" : ""}`} onClick={() => setSeatsMin(s)}>{s ? `${s} ที่นั่ง` : "ไม่จำกัด"}</button>
            ))}
            <button className={`chip ${noEv ? "on" : ""}`} onClick={() => setNoEv(!noEv)}>🚫⚡ ไม่เอารถไฟฟ้า</button>
            <button className={`chip ${ncapMin ? "on" : ""}`} onClick={() => setNcapMin(!ncapMin)} title="รถที่ยังไม่มีผลทดสอบจะยังแสดงอยู่">🛡️ ไม่เอารถผลทดสอบชนต่ำกว่า 3 ดาว</button>
          </div>

          <h2>4. ทรงและแบรนด์ที่ชอบ <b className="req">จำเป็น</b> <small>(ใช้กับการ์ดดีไซน์ ไม่ตัดรถคันอื่น)</small></h2>
          <div className="chips">
            {BODIES.map((b) => (
              <button key={b.key} className={`chip ${bodies.includes(b.key) ? "on" : ""}`} onClick={() => toggle(bodies, b.key, setBodies)}>{b.label}</button>
            ))}
          </div>
          <label className="sub">แบรนด์ที่ชอบ (ได้คะแนนดีไซน์เพิ่ม แต่ยังเห็นแบรนด์อื่น)</label>
          <div className="chips small">
            {BRANDS.map((b) => (
              <button key={b} className={`chip ${brandPref.includes(b) ? "on" : ""}`} onClick={() => toggle(brandPref, b, setBrandPref)}>{b}</button>
            ))}
          </div>
          <h2>5. ขุมพลังที่อยากได้ <b className="req">จำเป็น</b> <small>(ใช้กับการ์ดขุมพลัง ไม่ตัดรถคันอื่น)</small></h2>
          <div className="chips">
            {FUELS.map((f) => (
              <button key={f.key} className={`chip ${fuelPref.includes(f.key) ? "on" : ""}`} onClick={() => toggleFuel(f.key)}>{f.label}</button>
            ))}
          </div>
          <p className="muted small" style={{ margin: "6px 0 0" }}>ตรงที่เลือกได้เต็ม · แบบใกล้เคียงได้ครึ่ง (ไฮบริดใกล้กับน้ำมันและไฟฟ้า, น้ำมันใกล้กับดีเซล) · ไม่สนใจ = ทุกคันได้เท่ากัน</p>
          <h2>6. จัดการ์ดความสำคัญ <small>(ทำท้ายสุด ใช้ลำดับตั้งต้นก็ได้)</small></h2>
          <div className="zones">
            {ZONES.map(({ z, label }) => (
              <div
                key={z}
                className={`zone z${z} ${picked ? "armed" : ""}`}
                onClick={() => moveTo(z)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const k = e.dataTransfer.getData("text") as Key;
                  if (k) { setZones({ ...zones, [k]: z }); setZonesSet(true); }
                }}
              >
                <div className="zone-head">
                  <span>{label}</span>
                  <span className="pts">{z} แต้ม</span>
                </div>
                <div className="zone-cards">
                  {CARDS.filter((c) => zones[c.key] === z).map((c) => (
                    <button
                      key={c.key}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text", c.key)}
                      onClick={(e) => { e.stopPropagation(); setPicked(picked === c.key ? null : c.key); }}
                      className={`card ${picked === c.key ? "picked" : ""}`}
                      style={{ borderColor: CRIT_COLOR[c.key] }}
                    >
                      <span className="ic">{c.icon}</span>
                      <span className="cl">{c.label}</span>
                      <span className="cw" style={{ color: inactive.includes(c.key) ? "var(--muted)" : CRIT_COLOR[c.key] }} title={inactive.includes(c.key) ? (c.key === "design" ? "ยังไม่ได้เลือกทรงรถในข้อ 4 จึงไม่นับเกณฑ์นี้" : "ยังไม่ได้เลือกการใช้งาน จึงไม่นับเกณฑ์นี้") : undefined}>{wLabel(c.key)}</span>
                    </button>
                  ))}
                  {CARDS.every((c) => zones[c.key] !== z) && <span className="empty">วางการ์ดที่นี่</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="wbar" aria-label="น้ำหนักแต่ละเกณฑ์">
            {CARDS.map((c) => (
              <div key={c.key} style={{ width: `${weights[c.key]}%`, background: CRIT_COLOR[c.key] }} title={`${c.label} ${weights[c.key]}%`} />
            ))}
          </div>

          {brandExclude.length > 0 && (
            <div className="excl">
              ไม่เอาแบรนด์: {brandExclude.join(", ")}
              <button className="chip" onClick={() => setBrandExclude([])}>ล้าง</button>
            </div>
          )}
          {!revealed && (
            <div className="submit">
              <button className="go" disabled={manualMissing.length > 0} onClick={reveal}>ดูรถที่เหมาะกับคุณ</button>
              <p className="hint">{manualMissing.length > 0 ? `ยังขาด: ${manualMissing.join(" และ ")}` : "พร้อมแล้ว ข้อ 3 ไม่ตอบก็ได้ ข้อ 5 ใช้ลำดับตั้งต้นได้"}</p>
            </div>
          )}
          </>)}
        </section>

        {/* ------------------------------------------------ right: results */}
        <section className={`results ${revealed ? "" : "waiting"}`} ref={resultsTop}>
          {!revealed ? (
            <div className="wait">
              <h2>รถที่เหมาะกับคุณจะขึ้นตรงนี้</h2>
              {mode === "chat" ? (
                <>
                  <p className="muted">ที่ปรึกษาจะถามประมาณ 9–10 เรื่อง ตอบครบแล้วระบบจะจัดอันดับจากรถ 175 รุ่นให้ทันที</p>
                  <ul className="todo">
                    {Object.entries(TOPIC_TH).map(([k, v]) => (
                      <li key={k} className={answered.includes(k) ? "ok" : asked[asked.length - 1] === k ? "now" : ""}>
                        <span aria-hidden>{answered.includes(k) ? "✓" : ""}</span>{v}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className="muted">กรอกงบ เลือกเงินสดหรือผ่อน เลือกการใช้งาน ขุมพลัง และทรงหรือแบรนด์ที่ชอบทางซ้าย แล้วกด &quot;ดูรถที่เหมาะกับคุณ&quot;</p>
                  <ul className="todo">
                    <li className="ok"><span aria-hidden>✓</span>ลำดับการ์ด (ใช้ตั้งต้นได้)</li>
                    <li className={payment && (payment === "cash" || income) ? "ok" : ""}><span aria-hidden>{payment && (payment === "cash" || income) ? "✓" : ""}</span>ซื้อเงินสดหรือผ่อน (ถ้าผ่อน กรอกรายได้)</li>
                    <li className={budgetSet ? "ok" : ""}><span aria-hidden>{budgetSet ? "✓" : ""}</span>งบประมาณ</li>
                    <li className={lifestyles.length ? "ok" : ""}><span aria-hidden>{lifestyles.length ? "✓" : ""}</span>การใช้งาน</li>
                    <li className={fuelPref.length ? "ok" : ""}><span aria-hidden>{fuelPref.length ? "✓" : ""}</span>ขุมพลังที่อยากได้</li>
                    <li className={bodies.length || brandPref.length ? "ok" : ""}><span aria-hidden>{bodies.length || brandPref.length ? "✓" : ""}</span>ทรงหรือแบรนด์ที่ชอบ</li>
                  </ul>
                </>
              )}
            </div>
          ) : (<>
          <div className="rhead">
            <h2>ผลการจับคู่</h2>
            {mode === "chat" && <button className="back-chat" onClick={() => scrollTo(chatTop.current)}>↑ กลับไปคุยต่อ</button>}
            {data && <span className="count">ผ่านเงื่อนไข {data.passed_filters} จาก {data.total_cars} คัน {loading && "· กำลังจัดอันดับ…"}</span>}
          </div>

          {err && <div className="alert">{err}</div>}

          {data?.too_few_results && (
            <div className="alert warn">
              เหลือรถ {data.passed_filters} คัน เงื่อนไขที่ตัดรถออกมากที่สุดคือ <b>{data.filter_impact[0]?.label}</b> ({data.filter_impact[0]?.removed} คัน) ลองผ่อนเงื่อนไขนี้ไหม
              {data.near_misses && data.near_misses.length > 0 && (
                <ul className="nm">{data.near_misses.map((m) => <li key={m.id}><Link href={`/car/${m.id}`}>{m.name}</Link> {baht(m.price)} บาท · {m.reason}</li>)}</ul>
              )}
            </div>
          )}
          {data?.affordability?.budget_above_income && (
            <div className="alert warn">
              งบ {baht(Math.round(budgetK * 1000))} บาท ผ่อนราว {baht(data.affordability.budget_installment)} บาท/เดือน คิดเป็น {data.affordability.budget_pct_of_income}% ของรายได้ ซึ่งเกิน 30% ที่แนะนำ
              ลองเพิ่มเงินดาวน์ ผ่อนนานขึ้น หรือดูรถราคาไม่เกินราว {baht(data.affordability.comfortable_price)} บาท (คะแนนและอันดับไม่ได้เปลี่ยนตามรายได้)
            </div>
          )}
          {data?.affordability && (
            <p className="aff-note">รายได้ {baht(data.affordability.income)} บาท/เดือน: ผ่อนสบายถ้ารถไม่เกินราว {baht(data.affordability.comfortable_price)} บาท · {data.affordability.assumptions}</p>
          )}
          {data?.preference_notes && data.preference_notes.length > 0 && (
            <div className="prefs">
              {data.preference_notes.map((n) => <p key={n.kind + n.key}><Link href={`/car/${n.car_id}`}>{n.kind === "brand" ? "แบรนด์ที่คุณชอบ" : "ทรงที่คุณอยากได้"}</Link> · {n.text}</p>)}
            </div>
          )}

          {data?.results.map((r) => {
            const prev = prevRank[r.id];
            const delta = prev ? prev - r.rank : null;
            return (
              <article key={r.id} className={`res ${r.rank <= 3 ? "top" : ""} ${r.rank === 1 ? "lead" : ""}`}>
                <div className="rank">{r.rank}
                  {delta !== null && delta !== 0 && <span className={delta > 0 ? "up" : "down"}>{delta > 0 ? `▲${delta}` : `▼${-delta}`}</span>}
                  {delta === null && Object.keys(prevRank).length > 0 && <span className="new">ใหม่</span>}
                </div>
                <Link href={`/car/${r.id}`} className="res-img" aria-label={`ดูรายละเอียด ${r.name}`}>
                  <CarPhoto photo={r.photo} alt={r.name} className="res-photo" />
                </Link>
                <div className="info">
                  <Link href={`/car/${r.id}`} className="name">{r.name}</Link>
                  <div className="meta">{baht(r.price)} บาท · {FUEL_TH[r.fuelType] || r.fuelType} · {r.seats} ที่นั่ง</div>
                  {r.monthly && (
                    <div className={`mo ${r.monthly.level}`}>ผ่อนราว {baht(r.monthly.installment)} บาท/เดือน ({r.monthly.pct_of_income}% ของรายได้) · {r.monthly.label}</div>
                  )}
                  <PhotoCredit credit={r.photo.credit} />
                  {(r.over_budget || r.safety_warning) && (
                    <div className="flags">
                      {r.over_budget && <span className="badge warn">{r.over_budget.label}</span>}
                      {r.safety_warning && <span className="badge danger">{r.safety_warning}</span>}
                    </div>
                  )}
                  <div className="stack" title="คะแนนที่ได้จากแต่ละเกณฑ์">
                    {CARDS.map((c) => (r.contribution[c.key] ? (
                      <div key={c.key} style={{ width: `${r.contribution[c.key]}%`, background: CRIT_COLOR[c.key] }} />
                    ) : null))}
                  </div>
                  <div className="why">เด่นเรื่อง: {r.top_criteria.map((t) => t.label).join(" · ")}</div>
                  <div className="acts">
                    <button className="link" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>{open === r.id ? "ซ่อนที่มาคะแนน" : "ดูที่มาคะแนน"}</button>
                    <Link href={`/car/${r.id}`} className="link">รายละเอียดรถ</Link>
                    <Link href={`/car/${r.id}#prep`} className="link">เตรียมตัวไปโชว์รูม</Link>
                    <CompareButton id={r.id} compact />
                  </div>
                  {open === r.id && (
                    <div className="detail">
                      <table>
                        <tbody>
                          {CARDS.map((c) => (
                            <tr key={c.key}>
                              <td>{c.icon} {c.label}</td>
                              <td>{inactive.includes(c.key) ? "ไม่ได้เลือก" : r.criteria[c.key] === null ? "ไม่มีข้อมูล" : `${Math.round((r.criteria[c.key] as number) * 100)}/100`}</td>
                              <td>น้ำหนัก {wLabel(c.key)}</td>
                              <td><b>+{r.contribution[c.key] ?? 0}</b></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {r.annual_cost && (
                        <p>ค่าใช้จ่ายต่อปี ~{baht(r.annual_cost.total)} บาท (พลังงาน {baht(r.annual_cost.energy || 0)} + บำรุงรักษา {baht(r.annual_cost.maintenance || 0)})</p>
                      )}
                      {r.lifestyle_detail.map((l) => (
                        <p key={l.lifestyle}>
                          <b>{l.label}</b>: {l.has.length > 0 && <>มี {l.has.join(", ")}</>}
                          {l.missing.length > 0 && <> · ไม่มี {l.missing.join(", ")}</>}
                        </p>
                      ))}
                      {r.estimated_fields.length > 0 && <p className="est">* ข้อมูลบางส่วนของรถคันนี้เป็นค่าประมาณ ยังไม่ได้ยืนยันกับสเปกผู้ผลิต</p>}
                    </div>
                  )}
                </div>
                <div className="score">
                  <div className="num">{Math.round(r.score)}%</div>
                  <div className="lbl">เข้ากัน</div>
                </div>
              </article>
            );
          })}
          <p className="foot">คะแนนคำนวณจากสูตรเดียวกันทุกคัน AI ไม่ได้เลือกรถเอง <Link href="/how-it-works" className="link">ดูวิธีคิดคะแนน</Link></p>
          </>)}
        </section>
      </div>

      {mode === "chat" && revealed && !resultsInView && data && data.results.length > 0 && (
        <button className="jump" onClick={() => scrollTo(resultsTop.current)}>
          ดูผล: อันดับ 1 {data.results[0].name} เข้ากัน {Math.round(data.results[0].score)}%
        </button>
      )}

      <style jsx>{`
        .v2 { padding-top: 28px; padding-bottom: 96px; }
        .hero { margin-bottom: 20px; }
        h1 { font-size: clamp(26px, 3.2vw, 36px); margin: 0 0 6px; letter-spacing: -.5px; line-height: 1.25; }
        .hero p { color: var(--muted); margin: 0; max-width: 62ch; }
        .layout { display: grid; grid-template-columns: minmax(330px, 430px) 1fr; gap: 20px; align-items: start; }
        @media (max-width: 960px) { .layout { grid-template-columns: 1fr; } }
        .panel, .results { background: var(--surface); border: 1px solid var(--line); border-radius: 22px; padding: 18px; }
        .panel { position: sticky; top: 80px; max-height: calc(100vh - 96px); overflow: auto; }
        @media (max-width: 960px) { .panel { position: static; max-height: none; } }
        h2 { font-size: 16px; margin: 22px 0 10px; font-weight: 700; }
        h2:first-child { margin-top: 0; }
        h2 small { color: var(--muted); font-weight: 400; font-size: 13px; }
        .zones { display: grid; gap: 8px; }
        .zone { border: 1.5px dashed var(--line); border-radius: 14px; padding: 10px; min-height: 66px; transition: .15s; background: #FAFBFC; }
        .zone.armed { border-color: var(--accent); background: var(--accent-wash); cursor: pointer; }
        .zone.z3 { background: #F6FAF9; }
        .zone-head { display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 8px; color: var(--ink-2); font-weight: 600; }
        .pts { color: var(--muted); font-weight: 400; }
        .zone-cards { display: flex; flex-wrap: wrap; gap: 8px; }
        .empty { color: var(--muted); font-size: 13px; padding: 8px 0; }
        .card { display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 6px 12px; border-radius: 12px; background: var(--surface); border: 1.5px solid; border-left-width: 5px; color: var(--ink); font: inherit; font-size: 14.5px; cursor: grab; transition: transform .12s, box-shadow .12s; box-shadow: 0 1px 2px rgba(20,33,61,.06); }
        .card:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(20,33,61,.08); }
        .card.picked { box-shadow: 0 0 0 3px var(--accent); transform: scale(1.03); }
        .cw { font-weight: 700; font-size: 12.5px; font-variant-numeric: tabular-nums; }
        .wbar { display: flex; height: 10px; border-radius: 999px; overflow: hidden; margin-top: 12px; gap: 2px; }
        .wbar div { transition: width .3s; }
        .budget { display: flex; align-items: center; gap: 12px; }
        .budget input { flex: 1; accent-color: var(--accent); }
        .bval { font-weight: 700; min-width: 130px; text-align: right; font-variant-numeric: tabular-nums; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .chip { min-height: 36px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); color: var(--ink-2); font: inherit; font-size: 13.5px; cursor: pointer; }
        .chip:hover { border-color: var(--ink-2); }
        .chip.on { background: var(--ink); border-color: var(--ink); color: #fff; }
        .chips.small .chip { min-height: 32px; padding: 0 10px; font-size: 12.5px; }
        .sub { display: block; font-size: 13px; color: var(--muted); margin-top: 12px; }
        .rhead { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
        .rhead h2 { margin: 0; font-size: 18px; }
        .count { font-size: 13.5px; color: var(--muted); }
        .alert { margin-top: 12px; padding: 12px 14px; border-radius: 12px; background: var(--danger-wash); color: var(--danger); font-size: 14px; }
        .alert.warn { background: var(--signal-wash); color: #7A5200; }
        .res { display: grid; grid-template-columns: 34px 200px 1fr 76px; gap: 16px; align-items: start; padding: 18px 0; border-bottom: 1px solid var(--line-soft); animation: fade .35s ease; }
        .res:last-of-type { border-bottom: 0; }
        @keyframes fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .rank { font-weight: 700; font-size: 22px; display: flex; flex-direction: column; gap: 2px; font-variant-numeric: tabular-nums; color: var(--ink); }
        .res:not(.top) .rank { color: var(--muted); font-size: 18px; }
        .rank span { font-size: 11.5px; font-weight: 600; }
        .up { color: var(--accent); } .down { color: var(--danger); } .new { color: #2A7FD4; }
        .v2 :global(.res-img) { display: block; border-radius: 14px; overflow: hidden; }
        .v2 :global(.res-photo) { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: #EEF1F4; transition: transform .3s ease; }
        .v2 :global(.res-img:hover .res-photo) { transform: scale(1.04); }
        .info { min-width: 0; }
        .v2 :global(.name) { font-weight: 700; font-size: 17.5px; text-decoration: none; color: var(--ink); display: inline-block; }
        .v2 :global(.name:hover) { text-decoration: underline; }
        .meta { font-size: 14px; color: var(--ink-2); margin-bottom: 2px; }
        .flags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .stack { display: flex; height: 8px; border-radius: 999px; overflow: hidden; background: var(--line-soft); margin: 10px 0 4px; gap: 1px; }
        .stack div { transition: width .3s; }
        .why { font-size: 13px; color: var(--muted); }
        .acts { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; margin-top: 10px; font-size: 14px; }
        .detail { font-size: 13.5px; color: var(--ink-2); background: #F7F9FB; border: 1px solid var(--line-soft); border-radius: 12px; padding: 10px 12px; margin-top: 10px; }
        .detail table { width: 100%; border-collapse: collapse; }
        .detail td { padding: 4px; border-bottom: 1px solid var(--line-soft); }
        .detail p { margin: 6px 0 0; }
        .est { color: #8A5D00; font-size: 12.5px; }
        .score { text-align: right; }
        .num { font-size: 28px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -.5px; }
        .res.top .num { color: var(--accent); }
        .lbl { font-size: 12.5px; color: var(--muted); }
        /* the #1 car gets the showroom treatment: full-width photo on the studio backdrop */
        .res.lead { grid-template-columns: 34px 1fr 90px; padding-top: 10px; }
        .res.lead :global(.res-img) { order: -1; grid-column: 1 / -1; border-radius: 22px; background: radial-gradient(110% 90% at 50% 58%, #fff 0%, #F1F3F5 60%, #E4E8EC 100%); border: 1px solid var(--line-soft); }
        .res.lead :global(.res-photo) { aspect-ratio: 2 / 1; object-fit: cover; background: transparent; mix-blend-mode: multiply;
          -webkit-mask-image: radial-gradient(ellipse 58% 66% at 50% 54%, #000 64%, transparent 100%); mask-image: radial-gradient(ellipse 58% 66% at 50% 54%, #000 64%, transparent 100%); }
        .res.lead :global(.res-img:hover .res-photo) { transform: translateX(2%); }
        .res.lead .rank { font-size: 28px; }
        .res.lead :global(.name) { font-size: clamp(22px, 2.4vw, 28px); letter-spacing: -0.02em; }
        .res.lead .meta { font-size: 15.5px; }
        .res.lead .stack { height: 12px; }
        .res.lead .num { font-size: 44px; letter-spacing: -1px; }
        @media (max-width: 640px) {
          .res { grid-template-columns: 30px 1fr 64px; gap: 10px 12px; }
          .res.lead { grid-template-columns: 30px 1fr 72px; }
          .res.lead .num { font-size: 32px; }
          .v2 :global(.res-img) { order: -1; grid-column: 1 / -1; }
          .num { font-size: 24px; }
        }
        .foot { font-size: 13px; color: var(--muted); margin: 16px 0 0; }
        .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: var(--line-soft); padding: 4px; border-radius: 13px; margin-bottom: 14px; }
        .tabs button { min-height: 42px; border: 0; border-radius: 10px; background: transparent; color: var(--ink-2); font: inherit; font-size: 14.5px; cursor: pointer; }
        .tabs button.on { background: var(--surface); color: var(--ink); font-weight: 600; box-shadow: 0 1px 3px rgba(20,33,61,.12); }
        .chat { display: flex; flex-direction: column; gap: 10px; }
        .msgs { display: flex; flex-direction: column; gap: 8px; max-height: 48vh; min-height: 220px; overflow-y: auto; padding-right: 4px; }
        .bubble { max-width: 88%; padding: 10px 14px; border-radius: 16px; font-size: 14.5px; line-height: 1.6; white-space: pre-wrap; }
        .bubble.assistant { align-self: flex-start; background: #F1F4F7; border-bottom-left-radius: 5px; }
        .bubble.user { align-self: flex-end; background: var(--ink); color: #fff; border-bottom-right-radius: 5px; }
        .typing { display: flex; gap: 4px; }
        .typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: blink 1.2s infinite; }
        .typing span:nth-child(2) { animation-delay: .2s; } .typing span:nth-child(3) { animation-delay: .4s; }
        @keyframes blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
        .quick { margin-top: 0; }
        .ask { display: flex; gap: 8px; }
        .ask input { flex: 1; min-width: 0; font-size: 16px; min-height: 46px; border-radius: 13px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font-family: inherit; padding: 0 14px; }
        .ask input:focus { outline: 2.5px solid var(--accent); outline-offset: 0; border-color: transparent; }
        .ask button { min-height: 46px; padding: 0 20px; border-radius: 13px; border: 0; background: var(--accent); color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
        .ask button:disabled { opacity: .4; cursor: default; }
        .hint { font-size: 12.5px; color: var(--muted); margin: 0; }
        .legend { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: var(--muted); margin-top: 6px; }
        .legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; }
        .picks { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; padding: 12px; border-radius: 16px; border: 1px solid #CFE6DF; background: var(--accent-wash); }
        .picks-head { font-size: 13.5px; color: var(--accent-ink); font-weight: 700; }
        .pick { display: grid; grid-template-columns: 26px 1fr auto; gap: 8px; align-items: center; min-height: 50px; padding: 6px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
        .pick:hover { border-color: var(--accent); }
        .pr { font-weight: 700; color: var(--accent); }
        .pn { font-size: 14.5px; font-weight: 600; display: flex; flex-direction: column; }
        .pn small { font-weight: 400; font-size: 12.5px; color: var(--muted); }
        .ps { font-weight: 700; font-size: 18px; font-variant-numeric: tabular-nums; }
        .explain { max-width: 100%; background: var(--surface) !important; }
        .see-all { align-self: flex-start; background: none; border: 0; color: var(--accent); font: inherit; font-weight: 600; font-size: 14px; padding: 6px 0; cursor: pointer; min-height: 36px; }
        .back-chat, .jump { display: none; }
        @media (max-width: 960px) {
          .msgs { max-height: 60dvh; }
          .back-chat { display: inline-block; background: var(--surface); border: 1px solid var(--line); color: var(--ink-2); border-radius: 999px; padding: 6px 12px; font: inherit; font-size: 13px; min-height: 36px; }
          .jump { display: block; position: fixed; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 45; min-height: 50px; border: 0; border-radius: 16px; background: var(--accent); color: #fff; font: inherit; font-size: 15px; font-weight: 600; box-shadow: 0 10px 28px rgba(15,110,90,.35); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 16px; }
        }
        .nm { margin: 8px 0 0; padding-left: 18px; }
        .nm li { margin: 2px 0; }
        .v2 :global(.nm a), .v2 :global(.prefs a) { color: inherit; font-weight: 600; }
        .prefs { margin-top: 12px; padding: 10px 14px; border-radius: 12px; background: #EEF4FB; color: #1D4F86; font-size: 14px; }
        .prefs p { margin: 2px 0; }
        .req { color: var(--danger); font-weight: 600; font-size: 12px; margin-left: 4px; }
        .money { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
        .money input { flex: 1; min-width: 0; min-height: 46px; border-radius: 12px; border: 1px solid var(--line); padding: 0 14px; font: inherit; font-size: 18px; font-weight: 600; color: var(--ink); background: var(--surface); font-variant-numeric: tabular-nums; }
        .money input:focus { outline: 2.5px solid var(--accent); border-color: transparent; }
        .money span { color: var(--muted); font-size: 14px; white-space: nowrap; }
        .pay { margin-top: 6px; margin-bottom: 4px; }
        .loan { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .loan select { width: 100%; margin-top: 6px; min-height: 42px; border-radius: 11px; border: 1px solid var(--line); padding: 0 10px; font: inherit; font-size: 15px; color: var(--ink); background: var(--surface); }
        .afford { margin: 10px 0 0; font-size: 13.5px; padding: 8px 12px; border-radius: 10px; }
        .afford.ok { background: var(--accent-wash); color: var(--accent-ink); }
        .afford.tight { background: var(--signal-wash); color: #7A5200; }
        .afford.over { background: var(--danger-wash); color: var(--danger); }
        .mo { font-size: 13px; margin-top: 2px; font-weight: 600; }
        .mo.comfortable { color: var(--accent-ink); }
        .mo.tight { color: #8A5D00; }
        .mo.over { color: var(--danger); }
        .aff-note { font-size: 13px; color: var(--muted); margin: 8px 0 0; }
        .unset { color: var(--muted); font-weight: 500; font-size: 14px; }
        .submit { position: sticky; bottom: -18px; margin: 20px -18px -18px; padding: 14px 18px 18px; background: linear-gradient(rgba(255,255,255,0), var(--surface) 30%); }
        .go { width: 100%; min-height: 50px; border: 0; border-radius: 14px; background: var(--accent); color: #fff; font: inherit; font-size: 16px; font-weight: 600; cursor: pointer; }
        .go:disabled { background: #B9C6CF; cursor: default; }
        .submit .hint { margin-top: 6px; text-align: center; }
        .results.waiting { border-style: dashed; background: #FAFBFC; }
        .wait { padding: 24px 8px; max-width: 420px; }
        .wait h2 { font-size: 18px; margin: 0 0 6px; }
        .todo { list-style: none; padding: 0; margin: 14px 0 0; display: grid; gap: 8px; }
        .todo li { display: flex; align-items: center; gap: 10px; font-size: 14.5px; color: var(--muted); }
        .todo li span { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid var(--line); display: grid; place-items: center; font-size: 12px; font-weight: 700; flex: none; }
        .todo li.ok { color: var(--ink); }
        .todo li.ok span { background: var(--accent); border-color: var(--accent); color: #fff; }
        .todo li.now { color: var(--ink); font-weight: 600; }
        .todo li.now span { border-color: var(--accent); }
        @media (max-width: 960px) { .results.waiting { display: none; } }
        .excl { margin-top: 12px; font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      `}</style>
    </div>
  );
}
