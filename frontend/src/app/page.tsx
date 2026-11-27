"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CarPhoto, useCatalogue } from "./components/Site";
import { baht, BODY_TH, CARDS, CRIT_COLOR, Key, postJSON, RecommendResponse, Result } from "./lib/api";

/* Example buyers. The hero runs each one through the real scoring engine, so what a visitor
   sees on the first screen is the product working, not a stock photo. */
const PERSONAS: { key: string; label: string; brief: string; criteria: Record<string, unknown> }[] = [
  {
    key: "family", label: "ครอบครัวมีลูกเล็ก", brief: "งบ 1.3 ล้าน · รับส่งลูก ไปทำบุญกับที่บ้าน · เน้นปลอดภัย",
    criteria: { budget: 1300000, lifestyles: ["school_run", "merit_family"], body_preferred: ["suv"], seats_min: 5, priorities: { budget: 2, lifestyle: 3, running_cost: 2, safety: 3, design: 1 } },
  },
  {
    key: "city", label: "ขับในเมือง งบจำกัด", brief: "งบ 7 แสน · ขับไปทำงานทุกวัน · อยากประหยัด",
    criteria: { budget: 700000, lifestyles: ["city"], body_preferred: ["hatchback", "sedan"], priorities: { budget: 3, lifestyle: 2, running_cost: 3, safety: 2, design: 1 } },
  },
  {
    key: "trip", label: "สายเที่ยว แคมปิ้ง", brief: "งบ 1.6 ล้าน · ขับต่างจังหวัดบ่อย · ขนของเยอะ",
    criteria: { budget: 1600000, lifestyles: ["camping", "long_trips"], body_preferred: ["suv", "ppv"], priorities: { budget: 2, lifestyle: 3, running_cost: 1, safety: 2, design: 2 } },
  },
  {
    key: "sedan", label: "ซีดานไฟฟ้า หน้าตาดี", brief: "งบ 1.5 ล้าน · รถไฟฟ้าเท่านั้น · ดีไซน์สำคัญที่สุด",
    criteria: { budget: 1500000, lifestyles: ["city", "long_trips"], fuel_only: ["ev"], body_preferred: ["sedan"], priorities: { budget: 2, lifestyle: 2, running_cost: 2, safety: 2, design: 3 } },
  },
  {
    key: "work", label: "ใช้ทำงาน ขนของ", brief: "งบ 1 ล้าน · บรรทุกของ วิ่งไกล · คุ้มค่าที่สุด",
    criteria: { budget: 1000000, lifestyles: ["work_cargo", "long_trips"], body_preferred: ["pickup"], priorities: { budget: 3, lifestyle: 3, running_cost: 2, safety: 1, design: 1 } },
  },
];

// a representative real photo per body type for the browse tiles
const BODY_PICK: Record<string, number> = { suv: 71, sedan: 130, hatchback: 82, ppv: 12, mpv: 21, pickup: 54, coupe: 105 };

const KEYS: Key[] = ["budget", "lifestyle", "running_cost", "safety", "design"];

function ScoreBar({ r }: { r: Result }) {
  const total = KEYS.reduce((s, k) => s + (r.contribution[k] || 0), 0) || 1;
  return (
    <div className="sbar" role="img" aria-label={KEYS.map((k) => `${CARDS.find((c) => c.key === k)!.short} ${Math.round(r.contribution[k] || 0)}`).join(" · ")}>
      {KEYS.map((k) => (
        <span key={k} style={{ flexGrow: (r.contribution[k] || 0) / total, background: CRIT_COLOR[k] }} />
      ))}
    </div>
  );
}

export default function Home() {
  const { cars } = useCatalogue();
  const [results, setResults] = useState<Record<string, Result[]>>({});
  const [failed, setFailed] = useState(false);
  const [p, setP] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    let live = true;
    PERSONAS.forEach((ps) => {
      postJSON<RecommendResponse>("/api/v2/recommend", { ...ps.criteria, payment: "cash", top_n: 3 })
        .then((d) => live && setResults((m) => ({ ...m, [ps.key]: d.results })))
        .catch(() => live && setFailed(true));
    });
    return () => { live = false; };
  }, []);

  // walk through the buyers until the visitor picks one; never for people who asked for less motion
  useEffect(() => {
    if (!auto) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setP((x) => (x + 1) % PERSONAS.length), 5200);
    return () => clearInterval(t);
  }, [auto]);

  // keep the active buyer chip visible on narrow screens without moving the page itself
  const chips = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = chips.current, el = box?.children[p] as HTMLElement | undefined;
    if (box && el) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [p]);

  const persona = PERSONAS[p];
  const top = results[persona.key];
  const lead = top?.[0];

  const brands = useMemo(() => new Set(cars?.map((c) => c.brand)).size, [cars]);
  const realPhotos = useMemo(() => cars?.filter((c) => !c.photo_is_ai_generated).length ?? 0, [cars]);
  const bodyCounts = useMemo(() => {
    const m: Record<string, number> = {};
    cars?.forEach((c) => (m[c.bodyType] = (m[c.bodyType] || 0) + 1));
    return m;
  }, [cars]);
  const bodyPhoto = (k: string) => cars?.find((c) => c.id === BODY_PICK[k]) || cars?.find((c) => c.bodyType === k && !c.photo_is_ai_generated);

  return (
    <div className="home">
      {/* ------------------------------------------------------------ hero */}
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-head">
            <h1>บอกชีวิตคุณมา<br />เราหาคันที่ใช่ให้</h1>
            <p className="lede">
              จัดอันดับรถ {cars ? cars.length : "กว่า 170"} รุ่นที่ขายในไทยตอนนี้ จากงบ การใช้งาน และเรื่องที่คุณให้น้ำหนัก พร้อมเหตุผลของทุกคะแนน
            </p>
          </div>

          <div className="try">
            <span className="try-q" id="try-q">ถ้าคุณคือ…</span>
            <div className="personas" ref={chips} role="tablist" aria-labelledby="try-q">
              {PERSONAS.map((ps, k) => (
                <button
                  key={ps.key}
                  role="tab"
                  aria-selected={k === p}
                  className={k === p ? "on" : ""}
                  onClick={() => { setP(k); setAuto(false); }}
                >
                  {ps.label}
                  {k === p && auto && <i className="tick" aria-hidden />}
                </button>
              ))}
            </div>
          </div>

          <div className="showroom" aria-live="polite">
            <div className="floor">
              {PERSONAS.map((ps, k) => {
                const c = results[ps.key]?.[0];
                return c ? (
                  <div key={ps.key} className={`car ${k === p ? "on" : ""}`} aria-hidden={k !== p}>
                    <CarPhoto photo={c.photo} alt={c.name} className="car-photo" priority={k === 0} />
                  </div>
                ) : null;
              })}
              {!lead && !failed && <div className="floor-wait" aria-label="กำลังจัดอันดับ" />}
              {failed && !lead && <p className="floor-err">ยังโหลดตัวอย่างไม่ได้ ลองเริ่มหาคันของคุณได้เลย</p>}
            </div>

            {lead && (
              <div className="verdict" key={persona.key}>
                <p className="v-brief">{persona.brief}</p>
                <p className="v-rank">อันดับ 1</p>
                <h2 className="v-name">{lead.name}</h2>
                <p className="v-meta">
                  <span className="num">{baht(lead.price)} บาท</span>
                  <span className="v-match num">เข้ากัน {Math.round(lead.score)}%</span>
                </p>
                <ScoreBar r={lead} />
                <ul className="legend">
                  {KEYS.map((k) => (
                    <li key={k}><i style={{ background: CRIT_COLOR[k] }} />{CARDS.find((c) => c.key === k)!.short}</li>
                  ))}
                </ul>
                <ol className="runners" start={2}>
                  {top!.slice(1, 3).map((r) => (
                    <li key={r.id}>
                      <Link href={`/car/${r.id}`}>
                        <CarPhoto photo={r.photo} alt="" className="r-img" />
                        <span className="r-name">{r.name}</span>
                        <span className="r-score num">{Math.round(r.score)}%</span>
                      </Link>
                    </li>
                  ))}
                </ol>
                <Link href={`/car/${lead.id}`} className="link v-more">ดูรายละเอียด {lead.name}</Link>
              </div>
            )}
          </div>

          <div className="cta">
            <Link href="/advisor?mode=chat" className="btn btn-primary btn-l">หาคันของคุณกับที่ปรึกษา AI</Link>
            <Link href="/advisor?mode=manual" className="btn btn-ghost btn-l">กรอกเงื่อนไขเอง</Link>
            <span className="muted small">ใช้เวลาราว 2 นาที ไม่ต้องสมัครสมาชิก · ผลด้านบนคำนวณสดจากระบบจริงด้วยโจทย์ตัวอย่าง</span>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- the 5 cards */}
      <section className="wrap block">
        <h2 className="h2 big">ตัดสินจาก 5 เรื่อง คุณเป็นคนเรียงว่าเรื่องไหนสำคัญกว่า</h2>
        <p className="muted sub">วางการ์ดลงโซน สำคัญที่สุด สำคัญ หรือไม่ค่อยสำคัญ ระบบแปลงเป็นน้ำหนักทันที อันดับรถเปลี่ยนตามตอนที่คุณขยับการ์ด</p>
        <div className="cards5">
          {CARDS.map((c) => (
            <div key={c.key} className="c5" style={{ ["--c" as string]: CRIT_COLOR[c.key] }}>
              <span className="c5-ic" aria-hidden>{c.icon}</span>
              <span className="c5-l">{c.label}</span>
              <span className="c5-h">{c.hint}</span>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- browse by body */}
      <section className="wrap block">
        <div className="row-head">
          <h2 className="h2 big">ดูตามประเภทรถ</h2>
          <Link href="/cars" className="link">ดูรถทั้งหมด</Link>
        </div>
        <div className="bodies">
          {Object.entries(BODY_TH).filter(([k]) => bodyCounts[k]).map(([k, label]) => {
            const c = bodyPhoto(k);
            return (
              <Link key={k} href={`/cars?body=${k}`} className="body-tile">
                {c && <CarPhoto photo={c.photo} alt="" className="bt-img" />}
                <span className="bt-l">{label}</span>
                <span className="bt-n num">{bodyCounts[k]} รุ่น</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------- steps */}
      <section className="wrap block">
        <h2 className="h2 big">ใช้งานยังไง</h2>
        <ol className="steps">
          <li>
            <b>เล่าความต้องการ</b>
            <span>พิมพ์คุยแบบเล่าให้พนักงานขายฟัง เช่น &quot;มีลูก 2 คน งบ 9 แสน ขับในเมือง&quot; หรือกรอกเงื่อนไขเองก็ได้</span>
          </li>
          <li>
            <b>เรียงการ์ดความสำคัญ</b>
            <span>บอกว่ายอมจ่ายเกินงบได้แค่ไหน ไม่เอาแบรนด์ไหน ต้องนั่งกี่คน รถที่ไม่ผ่านจะถูกตัดออกก่อนให้คะแนน</span>
          </li>
          <li>
            <b>ได้ 3 คันพร้อมเหตุผล</b>
            <span>ดูว่าแต่ละคันได้คะแนนจากเรื่องไหน ค่าใช้จ่ายต่อปีเท่าไร แล้วเลือกมาเทียบกันได้สูงสุด 3 คัน</span>
          </li>
        </ol>
      </section>

      {/* -------------------------------------------------- trust */}
      <section className="wrap block">
        <div className="trust">
          <div><b className="num">{cars ? cars.length : "–"}</b><span>รุ่นที่ยังขายในไทย จาก {brands || "–"} แบรนด์</span></div>
          <div><b>พ.ย. 2569</b><span>ราคาขายปกติจากรายการราคาทางการ ไม่ใช่ราคาโปรโมชัน</span></div>
          <div><b className="num">93</b><span>รุ่นมีผลทดสอบชนจริงจาก ASEAN NCAP, ANCAP และ Euro NCAP</span></div>
          <div><b className="num">{realPhotos || "–"}</b><span>คันใช้ภาพถ่ายจริง พร้อมชื่อผู้ถ่ายและสัญญาอนุญาต</span></div>
        </div>
        <p className="muted small" style={{ marginTop: 14 }}>
          อยากรู้ว่าคะแนนคิดยังไง AI ทำอะไรและไม่ทำอะไร <Link href="/how-it-works" className="link">อ่านวิธีคิดของระบบ</Link>
        </p>
      </section>

      <style jsx>{`
        .home { padding-bottom: 80px; }

        /* hero: the page's one loud moment. The band matches the studio backdrop of the car photos,
           so the car stands on the page itself instead of inside a box. */
        .hero { background: radial-gradient(120% 90% at 60% 55%, #FFFFFF 0%, #F1F3F5 55%, #E4E8EC 100%); border-bottom: 1px solid var(--line); overflow: hidden; }
        .hero-in { padding-top: clamp(36px, 6vw, 72px); padding-bottom: clamp(28px, 4vw, 48px); }
        h1 { font-size: clamp(40px, 7.2vw, 92px); line-height: 1.14; letter-spacing: -0.035em; font-weight: 700; margin: 0; }
        .hero-head { display: grid; grid-template-columns: 1.3fr 1fr; gap: 32px; align-items: end; }
        @media (max-width: 900px) { .hero-head { grid-template-columns: 1fr; gap: 14px; } }
        .lede { font-size: clamp(16px, 1.35vw, 18px); color: var(--ink-2); margin: 0 0 8px; max-width: 30em; }

        .try { display: flex; align-items: center; gap: 14px; margin-top: clamp(24px, 3.5vw, 40px); flex-wrap: wrap; }
        .try-q { font-weight: 600; color: var(--muted); white-space: nowrap; }
        .personas { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 2px; margin: -2px; }
        .personas::-webkit-scrollbar { display: none; }
        .personas button { position: relative; overflow: hidden; flex: none; font: inherit; font-size: 15px; font-weight: 600; color: var(--ink-2); background: rgba(255,255,255,.7); border: 1px solid var(--line); border-radius: 999px; min-height: 42px; padding: 0 18px; cursor: pointer; transition: background .2s, color .2s, border-color .2s; }
        .personas button:hover { border-color: var(--ink-2); }
        .personas button.on { background: var(--ink); border-color: var(--ink); color: #fff; }
        .tick { position: absolute; left: 0; bottom: 0; height: 3px; background: rgba(255,255,255,.55); animation: tick 5.2s linear forwards; }
        @keyframes tick { from { width: 0; } to { width: 100%; } }

        .showroom { display: grid; grid-template-columns: 1.55fr 1fr; gap: clamp(16px, 3vw, 40px); align-items: center; margin-top: 8px; min-height: 380px; }
        @media (max-width: 900px) { .showroom { grid-template-columns: 1fr; min-height: 0; } }
        .floor { position: relative; aspect-ratio: 16 / 9; }
        .car { position: absolute; inset: 0; opacity: 0; transform: translateX(6%) scale(.97); transition: opacity .7s ease, transform .9s cubic-bezier(.2,.7,.2,1); }
        .car.on { opacity: 1; transform: none; }
        .floor :global(.car-photo) { width: 100%; height: 100%; object-fit: contain; display: block; mix-blend-mode: multiply;
          -webkit-mask-image: radial-gradient(ellipse 56% 64% at 50% 54%, #000 64%, transparent 100%); mask-image: radial-gradient(ellipse 56% 64% at 50% 54%, #000 64%, transparent 100%); }
        .floor-wait { position: absolute; inset: 18% 10%; border-radius: 40px; background: linear-gradient(90deg, #e9edf0, #f6f7f9, #e9edf0); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { to { background-position: -200% 0; } }
        .floor-err { position: absolute; inset: 0; display: grid; place-items: center; color: var(--muted); text-align: center; padding: 20px; }

        .verdict { animation: rise .55s cubic-bezier(.2,.7,.2,1); }
        @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .v-brief { color: var(--muted); font-size: 14px; margin: 0 0 14px; }
        .v-rank { margin: 0; font-weight: 700; color: var(--accent); font-size: 15px; }
        .v-name { font-size: clamp(28px, 3.2vw, 40px); line-height: 1.1; letter-spacing: -0.02em; margin: 2px 0 8px; font-weight: 700; }
        .v-meta { display: flex; gap: 14px; align-items: baseline; margin: 0 0 14px; color: var(--ink-2); font-size: 17px; flex-wrap: wrap; }
        .v-match { font-weight: 700; color: var(--ink); }
        :global(.sbar) { display: flex; height: 12px; border-radius: 99px; overflow: hidden; gap: 2px; background: var(--line-soft); }
        :global(.sbar span) { display: block; min-width: 2px; transition: flex-grow .6s ease; }
        .legend { list-style: none; padding: 0; margin: 10px 0 18px; display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 13px; color: var(--muted); }
        .legend i { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 6px; vertical-align: 0; }
        .runners { list-style: none; padding: 0; margin: 0 0 14px; display: grid; gap: 8px; }
        .runners li { counter-increment: none; }
        .runners :global(a) { display: grid; grid-template-columns: 22px 76px 1fr auto; align-items: center; gap: 10px; text-decoration: none; background: rgba(255,255,255,.75); border: 1px solid var(--line); border-radius: 14px; padding: 6px 14px 6px 10px; transition: border-color .15s; }
        .runners :global(a:hover) { border-color: var(--ink-2); }
        .runners li:nth-child(1) :global(a)::before { content: "2"; }
        .runners li:nth-child(2) :global(a)::before { content: "3"; }
        .runners :global(a)::before { font-weight: 700; color: var(--muted); text-align: center; }
        .runners :global(.r-img) { width: 76px; height: 43px; object-fit: cover; border-radius: 8px; mix-blend-mode: multiply; }
        .r-name { font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .r-score { color: var(--muted); font-size: 14px; }
        .verdict :global(.v-more) { font-size: 15px; color: var(--accent); }

        .cta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; margin-top: clamp(20px, 3vw, 32px); }
        .cta :global(.btn-l) { min-height: 54px; padding: 0 26px; font-size: 17px; border-radius: 16px; }
        .cta .small { flex-basis: 100%; }

        .block { margin-top: clamp(56px, 8vw, 104px); }
        .big { font-size: clamp(22px, 2.4vw, 30px); letter-spacing: -0.02em; line-height: 1.25; }
        .sub { margin: -2px 0 22px; max-width: 64ch; }
        .cards5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
        @media (max-width: 900px) { .cards5 { grid-template-columns: repeat(2, 1fr); } }
        .c5 { background: var(--surface); border: 1px solid var(--line); border-top: 4px solid var(--c); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 4px; min-height: 130px; }
        .c5-ic { font-size: 24px; }
        .c5-l { font-weight: 700; font-size: 17px; }
        .c5-h { color: var(--muted); font-size: 14px; }

        .row-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 8px; }
        .bodies { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        @media (max-width: 600px) { .bodies { grid-template-columns: 1fr 1fr; gap: 10px; } .bt-l { font-size: 16px !important; top: 10px !important; left: 12px !important; } .bt-n { top: 12px !important; right: 12px !important; font-size: 12px !important; } }
        .home :global(.body-tile) { position: relative; display: block; text-decoration: none; border-radius: 20px; overflow: hidden; background: radial-gradient(100% 80% at 50% 60%, #fff, #EDF0F3); border: 1px solid var(--line); aspect-ratio: 4 / 3; transition: border-color .2s; }
        .home :global(.body-tile:hover) { border-color: var(--ink-2); }
        .home :global(.bt-img) { position: absolute; left: 0; right: 0; bottom: 4%; width: 100%; height: 72%; object-fit: contain; mix-blend-mode: multiply;
          -webkit-mask-image: radial-gradient(ellipse 60% 70% at 50% 55%, #000 60%, transparent 100%); mask-image: radial-gradient(ellipse 60% 70% at 50% 55%, #000 60%, transparent 100%); transition: transform .5s cubic-bezier(.2,.7,.2,1); }
        .home :global(.body-tile:hover .bt-img) { transform: translateX(3%); }
        .bt-l { position: absolute; top: 14px; left: 18px; font-weight: 700; font-size: 20px; letter-spacing: -0.01em; }
        .bt-n { position: absolute; top: 18px; right: 18px; color: var(--muted); font-size: 14px; }

        .steps { list-style: none; counter-reset: s; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 900px) { .steps { grid-template-columns: 1fr; } }
        .steps li { counter-increment: s; display: flex; flex-direction: column; gap: 6px; padding-top: 48px; position: relative; }
        .steps li::before { content: counter(s); position: absolute; top: 0; left: 0; width: 36px; height: 36px; border-radius: 50%; background: var(--ink); color: #fff; display: grid; place-items: center; font-weight: 700; }
        .steps b { font-size: 18px; }
        .steps span { color: var(--ink-2); }

        .trust { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
        @media (max-width: 900px) { .trust { grid-template-columns: 1fr 1fr; } }
        .trust div { display: flex; flex-direction: column; gap: 4px; padding: 22px 20px 22px 0; }
        .trust b { font-size: clamp(26px, 3vw, 36px); letter-spacing: -0.02em; line-height: 1.1; }
        .trust span { color: var(--muted); font-size: 14px; max-width: 24ch; }
      `}</style>
    </div>
  );
}
