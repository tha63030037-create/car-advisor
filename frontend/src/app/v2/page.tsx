"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ types */
type Key = "budget" | "lifestyle" | "running_cost" | "safety" | "design";
type Zone = 3 | 2 | 1;

interface LifestyleDetail {
  lifestyle: string;
  label: string;
  fit: number | null;
  has: string[];
  missing: string[];
  unknown: string[];
}
interface Result {
  id: number;
  rank: number;
  name: string;
  brand: string;
  price: number;
  bodyType: string;
  fuelType: string;
  seats: number;
  photo: { file: string; credit?: string | null };
  score: number;
  match_label: string;
  criteria: Record<Key, number | null>;
  contribution: Partial<Record<Key, number>>;
  top_criteria: { key: Key; label: string }[];
  over_budget: { amount: number; pct: number; label: string } | null;
  safety_warning?: string | null;
  annual_cost: { energy: number | null; maintenance: number | null; total: number } | null;
  lifestyle_detail: LifestyleDetail[];
  estimated_fields: string[];
}
interface Resp {
  weights_pct: Record<Key, number>;
  total_cars: number;
  passed_filters: number;
  results: Result[];
  too_few_results: boolean;
  filter_impact: { filter: string; label: string; removed: number }[];
}

/* -------------------------------------------------------------- constants */
const CARDS: { key: Key; label: string; icon: string; hint: string }[] = [
  { key: "budget", label: "งบประมาณ", icon: "💰", hint: "ราคาอยู่ในงบแค่ไหน" },
  { key: "lifestyle", label: "ไลฟ์สไตล์", icon: "🧳", hint: "เข้ากับชีวิตประจำวัน" },
  { key: "running_cost", label: "ค่าใช้จ่ายระยะยาว", icon: "⛽", hint: "ค่าน้ำมัน/ไฟ + ซ่อมบำรุง" },
  { key: "safety", label: "ความปลอดภัย", icon: "🛡️", hint: "ถุงลม + ระบบช่วยขับ" },
  { key: "design", label: "รูปทรงดีไซน์", icon: "✨", hint: "ตรงทรงที่ชอบ" },
];
const ZONES: { z: Zone; label: string }[] = [
  { z: 3, label: "สำคัญที่สุด" },
  { z: 2, label: "สำคัญ" },
  { z: 1, label: "ไม่ค่อยสำคัญ" },
];
const LIFESTYLES: { key: string; label: string; icon: string }[] = [
  { key: "school_run", label: "ส่งลูกไปเรียน", icon: "🎒" },
  { key: "camping", label: "แคมป์ปิ้ง", icon: "🏕️" },
  { key: "merit_family", label: "พาผู้ใหญ่ไปทำบุญ", icon: "🛕" },
  { key: "pets", label: "เลี้ยงสัตว์", icon: "🐕" },
  { key: "city", label: "ขับในเมือง", icon: "🏙️" },
  { key: "long_trips", label: "เดินทางไกลบ่อย", icon: "🛣️" },
  { key: "work_cargo", label: "ใช้งาน ขนของ", icon: "📦" },
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
const BRANDS = ["Toyota", "Honda", "Mazda", "Nissan", "Isuzu", "Mitsubishi", "Suzuki", "Subaru",
  "Hyundai", "Kia", "MG", "BYD", "GWM", "Neta", "GAC", "Deepal", "Changan", "Zeekr", "XPENG",
  "Tesla", "Ford", "Volvo", "BMW", "Peugeot"];
const FUEL_TH: Record<string, string> = { petrol: "เบนซิน", diesel: "ดีเซล", hybrid: "ไฮบริด", ev: "ไฟฟ้า" };
const CRIT_COLOR: Record<Key, string> = {
  budget: "#F59E0B", lifestyle: "#10B981", running_cost: "#06B6D4", safety: "#8B5CF6", design: "#EC4899",
};

const baht = (n: number) => n.toLocaleString("th-TH");

function apiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const local = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return local ? "http://127.0.0.1:8000" : "/api/backend";
}

/* ------------------------------------------------------------------- page */
export default function MatchV2() {
  const [zones, setZones] = useState<Record<Key, Zone>>({
    budget: 3, lifestyle: 3, running_cost: 2, safety: 2, design: 1,
  });
  const [picked, setPicked] = useState<Key | null>(null);
  const [budgetK, setBudgetK] = useState(800);
  const [stretch, setStretch] = useState(0.15);
  const [lifestyles, setLifestyles] = useState<string[]>(["city"]);
  const [bodies, setBodies] = useState<string[]>([]);
  const [brandOnly, setBrandOnly] = useState<string[]>([]);
  const [seatsMin, setSeatsMin] = useState<number | null>(null);
  const [noEv, setNoEv] = useState(false);
  const [ncapMin, setNcapMin] = useState(false);
  const [brandExclude, setBrandExclude] = useState<string[]>([]);

  // chat (spec 5): the bot fills these same controls, so both modes drive one engine
  const [mode, setMode] = useState<"chat" | "manual">("chat");
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
  const weights = useMemo(() => {
    const total = CARDS.reduce((s, c) => s + zones[c.key], 0);
    return Object.fromEntries(CARDS.map((c) => [c.key, Math.round((100 * zones[c.key]) / total)])) as Record<Key, number>;
  }, [zones]);

  const criteria = useMemo(() => ({
    budget: budgetK * 1000,
    budget_stretch: stretch,
    brand_only: brandOnly,
    brand_exclude: brandExclude,
    seats_min: seatsMin,
    fuel_only: null,
    fuel_exclude: noEv ? ["ev"] : [],
    min_ncap_stars: ncapMin ? 3 : null,
    body_preferred: bodies,
    lifestyles,
    km_per_year: 15000,
    priorities: zones,
    top_n: 10,
  }), [budgetK, stretch, brandOnly, brandExclude, seatsMin, noEv, bodies, lifestyles, zones, ncapMin]);

  // ---------------------------------------------------------------- chat
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyChatCriteria = (c: any) => {
    if (c.budget) setBudgetK(Math.round(c.budget / 1000));
    if (typeof c.budget_stretch === "number") setStretch(c.budget_stretch);
    if (Array.isArray(c.lifestyles)) setLifestyles(c.lifestyles);
    if (Array.isArray(c.body_preferred)) setBodies(c.body_preferred);
    if (Array.isArray(c.brand_only)) setBrandOnly(c.brand_only);
    if (Array.isArray(c.brand_exclude)) setBrandExclude(c.brand_exclude);
    if (c.seats_min !== undefined) setSeatsMin(c.seats_min ?? null);
    if (Array.isArray(c.fuel_exclude)) setNoEv(c.fuel_exclude.includes("ev"));
    if (c.min_ncap_stars !== undefined) setNcapMin(!!c.min_ncap_stars);
    if (c.priorities) setZones(c.priorities);
  };

  const sendChat = async (text: string | null) => {
    const msgs = text ? [...chatMsgs, { role: "user" as const, content: text }] : chatMsgs;
    if (text) setChatMsgs(msgs);
    setChatInput("");
    setQuick([]);
    setChatBusy(true);
    try {
      const res = await fetch(`${apiBase()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send what the controls show now, so manual edits and chat stay in sync
        body: JSON.stringify({ messages: msgs, criteria: { ...criteria, priorities: zones }, asked }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r = await res.json();
      setChatMsgs([...msgs, { role: "assistant", content: r.reply }]);
      setAsked(r.asked);
      setQuick(r.quick_replies || []);
      setChatEngine(r.engine);
      if (r.done) setChatDone(true);
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
        const res = await fetch(`${apiBase()}/api/explain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(criteria),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const r = await res.json();
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
    const t = setTimeout(async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${apiBase()}/api/v2/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(criteria),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: Resp = await res.json();
        setPrevRank(lastRanks.current);
        lastRanks.current = Object.fromEntries(json.results.map((r) => [r.id, r.rank]));
        setData(json);
      } catch (e) {
        setErr("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (" + (e as Error).message + ")");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [criteria]);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const moveTo = (z: Zone) => {
    if (!picked) return;
    setZones({ ...zones, [picked]: z });
    setPicked(null);
  };

  return (
    <main className="v2">
      <header className="hero">
        <div className="tag">ทดลองเครื่องจับคู่ v2</div>
        <h1>จัดลำดับสิ่งที่สำคัญกับคุณ แล้วดูอันดับรถเปลี่ยนตามทันที</h1>
        <p>แตะการ์ด แล้วแตะโซนที่ต้องการวาง หรือลากวางก็ได้ ทุกการเปลี่ยนแปลงจะจัดอันดับรถใหม่อัตโนมัติ</p>
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
                        <span className="pr">#{r.rank}</span>
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
              <p className="hint">ที่ปรึกษาจะกรอกเงื่อนไขให้ในแท็บ &quot;ตั้งค่าเอง&quot; และจัดอันดับรถให้ทันที {chatEngine === "rules" && "· โหมดอ่านคำสำคัญ (ยังไม่ได้เชื่อม AI)"}</p>
              <div className="mini">
                <div className="wbar" aria-label="น้ำหนักแต่ละเกณฑ์">
                  {CARDS.map((c) => (
                    <div key={c.key} style={{ width: `${weights[c.key]}%`, background: CRIT_COLOR[c.key] }} title={`${c.label} ${weights[c.key]}%`} />
                  ))}
                </div>
                <div className="legend">{CARDS.map((c) => <span key={c.key}><i style={{ background: CRIT_COLOR[c.key] }} />{c.label} {weights[c.key]}%</span>)}</div>
              </div>
            </div>
          )}

          {mode === "manual" && (<>
          <h2>1. จัดการ์ดความสำคัญ</h2>
          <div className="zones">
            {ZONES.map(({ z, label }) => (
              <div
                key={z}
                className={`zone z${z} ${picked ? "armed" : ""}`}
                onClick={() => moveTo(z)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const k = e.dataTransfer.getData("text") as Key;
                  if (k) setZones({ ...zones, [k]: z });
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
                      <span className="cw" style={{ color: CRIT_COLOR[c.key] }}>{weights[c.key]}%</span>
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

          <h2>2. งบประมาณ</h2>
          <div className="budget">
            <input type="range" min={300} max={3500} step={10} value={budgetK} onChange={(e) => setBudgetK(+e.target.value)} />
            <div className="bval">{baht(budgetK * 1000)} บาท</div>
          </div>
          <div className="chips">
            {STRETCH.map((s) => (
              <button key={s.v} className={`chip ${stretch === s.v ? "on" : ""}`} onClick={() => setStretch(s.v)}>{s.label}</button>
            ))}
          </div>

          <h2>3. ไลฟ์สไตล์ <small>(เลือกได้หลายข้อ)</small></h2>
          <div className="chips">
            {LIFESTYLES.map((l) => (
              <button key={l.key} className={`chip ${lifestyles.includes(l.key) ? "on" : ""}`} onClick={() => toggle(lifestyles, l.key, setLifestyles)}>
                {l.icon} {l.label}
              </button>
            ))}
          </div>

          <h2>4. เงื่อนไขบังคับ <small>(ตัดทิ้ง ไม่ใช่แค่หักคะแนน)</small></h2>
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

          <h2>5. ทรงที่ชอบ <small>(ใช้กับการ์ดดีไซน์)</small></h2>
          <div className="chips">
            {BODIES.map((b) => (
              <button key={b.key} className={`chip ${bodies.includes(b.key) ? "on" : ""}`} onClick={() => toggle(bodies, b.key, setBodies)}>{b.label}</button>
            ))}
          </div>
          {brandExclude.length > 0 && (
            <div className="excl">
              ไม่เอาแบรนด์: {brandExclude.join(", ")}
              <button className="chip" onClick={() => setBrandExclude([])}>ล้าง</button>
            </div>
          )}
          </>)}
        </section>

        {/* ------------------------------------------------ right: results */}
        <section className="results" ref={resultsTop}>
          <div className="rhead">
            <h2>ผลการจับคู่</h2>
            {mode === "chat" && <button className="back-chat" onClick={() => scrollTo(chatTop.current)}>↑ กลับไปคุยต่อ</button>}
            {data && <span className="count">ผ่านเงื่อนไข {data.passed_filters} จาก {data.total_cars} คัน {loading && "· กำลังจัดอันดับ…"}</span>}
          </div>

          {err && <div className="alert">{err}</div>}

          {data?.too_few_results && (
            <div className="alert warn">
              เหลือรถไม่ถึง 3 คัน — เงื่อนไขที่ตัดรถออกมากที่สุดคือ <b>{data.filter_impact[0]?.label}</b> ({data.filter_impact[0]?.removed} คัน) ลองผ่อนเงื่อนไขนี้ไหม?
            </div>
          )}

          {data?.results.map((r) => {
            const prev = prevRank[r.id];
            const delta = prev ? prev - r.rank : null;
            return (
              <article key={r.id} className={`res ${r.rank <= 3 ? "top" : ""}`}>
                <div className="rank">#{r.rank}
                  {delta !== null && delta !== 0 && <span className={delta > 0 ? "up" : "down"}>{delta > 0 ? `▲${delta}` : `▼${-delta}`}</span>}
                  {delta === null && Object.keys(prevRank).length > 0 && <span className="new">ใหม่</span>}
                </div>
                <img src={`/cars/${r.photo.file}`} alt={r.name} onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
                <div className="info">
                  <div className="name">{r.name}</div>
                  <div className="meta">{baht(r.price)} บาท · {FUEL_TH[r.fuelType] || r.fuelType} · {r.seats} ที่นั่ง</div>
                  <PhotoCredit credit={r.photo.credit} />
                  {r.over_budget && <div className="over">⚠️ {r.over_budget.label}</div>}
                  {r.safety_warning && <div className="over">⚠️ {r.safety_warning}</div>}
                  <div className="stack" title="คะแนนที่ได้จากแต่ละเกณฑ์">
                    {CARDS.map((c) => (r.contribution[c.key] ? (
                      <div key={c.key} style={{ width: `${r.contribution[c.key]}%`, background: CRIT_COLOR[c.key] }} />
                    ) : null))}
                  </div>
                  <div className="why">เด่นเรื่อง: {r.top_criteria.map((t) => t.label).join(" · ")}</div>
                  <button className="more" onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? "ซ่อนที่มาคะแนน" : "ดูที่มาคะแนน"}</button>
                  {open === r.id && (
                    <div className="detail">
                      <table>
                        <tbody>
                          {CARDS.map((c) => (
                            <tr key={c.key}>
                              <td>{c.icon} {c.label}</td>
                              <td>{r.criteria[c.key] === null ? "ไม่มีข้อมูล" : `${Math.round((r.criteria[c.key] as number) * 100)}/100`}</td>
                              <td>น้ำหนัก {weights[c.key]}%</td>
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
          <p className="foot">รูปรถ 156 คันเป็นภาพถ่ายจริงจาก Wikimedia Commons (ชื่อผู้ถ่ายและสัญญาอนุญาตอยู่ใต้ชื่อรถ) ดัดแปลงโดยตัดพื้นหลังและวางบนฉากสตูดิโอ เผยแพร่ภายใต้สัญญาอนุญาตเดียวกับต้นฉบับ รุ่นที่ยังไม่มีภาพถ่ายใช้ภาพประกอบจาก AI</p>
        </section>
      </div>

      {mode === "chat" && !resultsInView && data && data.results.length > 0 && (
        <button className="jump" onClick={() => scrollTo(resultsTop.current)}>
          ดูผล: #{data.results[0].rank} {data.results[0].name} {Math.round(data.results[0].score)}%
        </button>
      )}

      <style jsx>{`
        .v2 { min-height: 100vh; background: var(--ink, #0b0f19); color: var(--cream, #f8fafc); font-family: 'Prompt', sans-serif; padding: 24px clamp(12px, 3vw, 40px) 60px; }
        .hero { max-width: 1200px; margin: 0 auto 20px; }
        .tag { display: inline-block; font-size: 12px; padding: 4px 10px; border-radius: 999px; background: rgba(139,92,246,.18); color: #c084fc; border: 1px solid rgba(139,92,246,.4); }
        h1 { font-size: clamp(22px, 3vw, 32px); margin: 10px 0 6px; line-height: 1.3; }
        .hero p { color: #94a3b8; margin: 0; }
        .layout { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: minmax(320px, 440px) 1fr; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
        .panel, .results { background: rgba(17,24,39,.75); border: 1px solid rgba(255,255,255,.08); border-radius: 18px; padding: 18px; }
        .panel { position: sticky; top: 12px; max-height: calc(100vh - 24px); overflow: auto; }
        @media (max-width: 900px) { .panel { position: static; max-height: none; } }
        h2 { font-size: 16px; margin: 18px 0 10px; }
        h2:first-child { margin-top: 0; }
        h2 small { color: #64748b; font-weight: 400; font-size: 12px; }
        .zones { display: grid; gap: 8px; }
        .zone { border: 1.5px dashed rgba(255,255,255,.14); border-radius: 14px; padding: 10px; min-height: 64px; transition: .15s; }
        .zone.armed { border-color: #c084fc; background: rgba(139,92,246,.08); cursor: pointer; }
        .zone.z3 .zone-head span:first-child { color: #fbbf24; }
        .zone-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #cbd5e1; }
        .pts { color: #64748b; }
        .zone-cards { display: flex; flex-wrap: wrap; gap: 8px; }
        .empty { color: #475569; font-size: 12px; padding: 8px 0; }
        .card { display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 6px 12px; border-radius: 12px; background: rgba(30,41,59,.9); border: 1.5px solid; color: inherit; font: inherit; font-size: 14px; cursor: grab; transition: transform .12s; }
        .card:hover { transform: translateY(-1px); }
        .card.picked { box-shadow: 0 0 0 3px rgba(192,132,252,.6); transform: scale(1.04); }
        .cw { font-weight: 700; font-size: 12px; }
        .wbar { display: flex; height: 10px; border-radius: 999px; overflow: hidden; margin-top: 10px; gap: 2px; }
        .wbar div { transition: width .3s; }
        .budget { display: flex; align-items: center; gap: 12px; }
        .budget input { flex: 1; accent-color: #8b5cf6; }
        .bval { font-family: 'Space Grotesk', sans-serif; font-weight: 700; min-width: 130px; text-align: right; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .chip { min-height: 36px; padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.14); background: transparent; color: #cbd5e1; font: inherit; font-size: 13px; cursor: pointer; }
        .chip.on { background: rgba(139,92,246,.25); border-color: #8b5cf6; color: #fff; }
        .chips.small .chip { min-height: 30px; padding: 3px 10px; font-size: 12px; }
        .sub { display: block; font-size: 12px; color: #94a3b8; margin-top: 10px; }
        .rhead { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; }
        .rhead h2 { margin: 0; }
        .count { font-size: 13px; color: #94a3b8; }
        .alert { margin-top: 12px; padding: 10px 14px; border-radius: 12px; background: rgba(248,113,113,.12); border: 1px solid rgba(248,113,113,.4); font-size: 14px; }
        .alert.warn { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.4); }
        .res { display: grid; grid-template-columns: 56px 120px 1fr 80px; gap: 12px; align-items: start; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,.06); animation: fade .35s ease; }
        @keyframes fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @media (max-width: 600px) { .res { grid-template-columns: 44px 1fr 64px; } .res img { display: none; } }
        .res.top .num { color: #c084fc; }
        .rank { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 20px; display: flex; flex-direction: column; gap: 2px; }
        .rank span { font-size: 11px; font-weight: 600; }
        .up { color: #34d399; } .down { color: #f87171; } .new { color: #38bdf8; }
        .res img { width: 120px; height: 72px; object-fit: contain; border-radius: 8px; background: rgba(255,255,255,.03); }
        .name { font-weight: 600; font-size: 16px; }
        .meta { font-size: 13px; color: #94a3b8; }
        .over { display: inline-block; margin-top: 4px; font-size: 12px; padding: 2px 8px; border-radius: 6px; background: rgba(245,158,11,.15); color: #fbbf24; border: 1px solid rgba(245,158,11,.4); }
        .stack { display: flex; height: 8px; border-radius: 999px; overflow: hidden; background: rgba(255,255,255,.06); margin: 8px 0 4px; gap: 1px; }
        .stack div { transition: width .3s; }
        .why { font-size: 12px; color: #94a3b8; }
        .more { margin-top: 6px; background: none; border: none; color: #c084fc; font: inherit; font-size: 13px; cursor: pointer; padding: 4px 0; }
        .detail { font-size: 13px; color: #cbd5e1; background: rgba(30,41,59,.6); border-radius: 12px; padding: 10px 12px; margin-top: 6px; }
        .detail table { width: 100%; border-collapse: collapse; }
        .detail td { padding: 3px 4px; border-bottom: 1px solid rgba(255,255,255,.05); }
        .detail p { margin: 6px 0 0; }
        .est { color: #f59e0b; font-size: 12px; }
        .score { text-align: right; }
        .num { font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 700; }
        .lbl { font-size: 12px; color: #94a3b8; }
        .foot { font-size: 12px; color: #64748b; margin-top: 14px; }
        .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: rgba(30,41,59,.7); padding: 4px; border-radius: 12px; margin-bottom: 14px; }
        .tabs button { min-height: 40px; border: 0; border-radius: 9px; background: transparent; color: #94a3b8; font: inherit; font-size: 14px; cursor: pointer; }
        .tabs button.on { background: rgba(139,92,246,.3); color: #fff; }
        .chat { display: flex; flex-direction: column; gap: 10px; }
        .msgs { display: flex; flex-direction: column; gap: 8px; max-height: 46vh; min-height: 200px; overflow-y: auto; padding-right: 4px; }
        .bubble { max-width: 88%; padding: 10px 13px; border-radius: 14px; font-size: 14px; line-height: 1.55; white-space: pre-wrap; }
        .bubble.assistant { align-self: flex-start; background: rgba(30,41,59,.95); border: 1px solid rgba(255,255,255,.08); border-bottom-left-radius: 4px; }
        .bubble.user { align-self: flex-end; background: linear-gradient(135deg, #7c3aed, #6d28d9); border-bottom-right-radius: 4px; }
        .typing { display: flex; gap: 4px; }
        .typing span { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; animation: blink 1.2s infinite; }
        .typing span:nth-child(2) { animation-delay: .2s; } .typing span:nth-child(3) { animation-delay: .4s; }
        @keyframes blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
        .quick { margin-top: 0; }
        .ask { display: flex; gap: 8px; }
        .ask input { flex: 1; min-width: 0; font-size: 16px !important; min-height: 44px; border-radius: 12px; border: 1px solid rgba(255,255,255,.14); background: rgba(15,23,42,.8); color: inherit; font: inherit; padding: 0 12px; }
        .ask input:focus { outline: 2px solid #8b5cf6; }
        .ask button { min-height: 44px; padding: 0 18px; border-radius: 12px; border: 0; background: #8b5cf6; color: #fff; font: inherit; cursor: pointer; }
        .ask button:disabled { opacity: .45; cursor: default; }
        .hint { font-size: 12px; color: #64748b; margin: 0; }
        .legend { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 11px; color: #94a3b8; margin-top: 6px; }
        .legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; }
        .picks { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; padding: 10px; border-radius: 14px; border: 1px solid rgba(192,132,252,.35); background: rgba(139,92,246,.08); }
        .picks-head { font-size: 13px; color: #c084fc; font-weight: 600; }
        .pick { display: grid; grid-template-columns: 34px 1fr auto; gap: 8px; align-items: center; min-height: 48px; padding: 6px 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,.08); background: rgba(15,23,42,.7); color: inherit; font: inherit; text-align: left; cursor: pointer; }
        .pr { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #c084fc; }
        .pn { font-size: 14px; font-weight: 600; display: flex; flex-direction: column; }
        .pn small { font-weight: 400; font-size: 12px; color: #94a3b8; }
        .ps { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; }
        .explain { max-width: 100%; }
        .see-all { align-self: flex-start; background: none; border: 0; color: #c084fc; font: inherit; font-size: 13px; padding: 6px 0; cursor: pointer; min-height: 36px; }
        .back-chat, .jump { display: none; }
        @media (max-width: 900px) {
          .msgs { max-height: 62dvh; }
          .back-chat { display: inline-block; background: none; border: 1px solid rgba(255,255,255,.14); color: #cbd5e1; border-radius: 999px; padding: 6px 12px; font: inherit; font-size: 13px; min-height: 36px; }
          .jump { display: block; position: fixed; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 20; min-height: 48px; border: 0; border-radius: 14px; background: #8b5cf6; color: #fff; font: inherit; font-size: 15px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 16px; }
          .v2 { padding-bottom: 90px; }
        }
        .excl { margin-top: 12px; font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      `}</style>
    </main>
  );
}

function PhotoCredit({ credit }: { credit?: string | null }) {
  if (credit && credit.includes("Wikimedia")) {
    const [text, url] = credit.split("|");
    return (
      <div className="credit" style={{ fontSize: 11, opacity: 0.6 }}>
        {url ? <a href={url} target="_blank" rel="noreferrer">{text}</a> : text}
      </div>
    );
  }
  return <div className="credit" style={{ fontSize: 11, opacity: 0.6 }}>ภาพประกอบจาก AI</div>;
}
