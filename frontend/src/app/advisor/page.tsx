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
/* ------------------------------------------------------------------- page */
export default function Advisor() {
  const { cars } = useCatalogue();
  const BRANDS = useMemo(() => Array.from(new Set((cars || []).map((c) => c.brand))).sort((x, y) => x.localeCompare(y)), [cars]);
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
      // send what the controls show now, so manual edits and chat stay in sync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r: any = await postJSON("/api/chat", { messages: msgs, criteria: { ...criteria, priorities: zones }, asked });
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
  }, [criteria]);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const moveTo = (z: Zone) => {
    if (!picked) return;
    setZones({ ...zones, [picked]: z });
    setPicked(null);
  };

  return (
    <div className="v2 wrap">
      <header className="hero">
        <h1>หาคันที่ใช่</h1>
        <p>{mode === "chat"
          ? "เล่าให้ที่ปรึกษาฟังว่าจะใช้รถยังไง งบเท่าไร ระบบจะกรอกเงื่อนไขและจัดอันดับรถให้ทันที"
          : "เรียงการ์ด 5 ใบตามความสำคัญ แล้วตั้งงบและเงื่อนไข อันดับรถทางขวาเปลี่ยนตามทุกครั้งที่คุณขยับ"}</p>
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
                    <CompareButton id={r.id} compact />
                  </div>
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
          <p className="foot">คะแนนคำนวณจากสูตรเดียวกันทุกคัน AI ไม่ได้เลือกรถเอง <Link href="/how-it-works" className="link">ดูวิธีคิดคะแนน</Link></p>
        </section>
      </div>

      {mode === "chat" && !resultsInView && data && data.results.length > 0 && (
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
        @media (max-width: 640px) {
          .res { grid-template-columns: 30px 1fr 64px; gap: 10px 12px; }
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
        .excl { margin-top: 12px; font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      `}</style>
    </div>
  );
}
