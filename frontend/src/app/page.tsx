"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { CarPhoto, useCatalogue } from "./components/Site";
import { baht, BODY_TH, CARDS, CRIT_COLOR } from "./lib/api";

// cars shown in the hero rotation (ids from the catalogue; all real photos)
const HERO_IDS = [83, 25, 158, 3, 174];

export default function Home() {
  const { cars } = useCatalogue();
  const hero = useMemo(() => HERO_IDS.map((id) => cars?.find((c) => c.id === id)).filter(Boolean), [cars]);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (hero.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % hero.length), 3800);
    return () => clearInterval(t);
  }, [hero.length]);

  const brands = useMemo(() => new Set(cars?.map((c) => c.brand)).size, [cars]);
  const realPhotos = useMemo(() => cars?.filter((c) => !c.photo_is_ai_generated).length ?? 0, [cars]);
  const bodyCounts = useMemo(() => {
    const m: Record<string, number> = {};
    cars?.forEach((c) => (m[c.bodyType] = (m[c.bodyType] || 0) + 1));
    return m;
  }, [cars]);

  return (
    <div className="home">
      {/* ---------------------------------------------------------- hero */}
      <section className="wrap hero">
        <div className="hero-copy">
          <h1>บอกว่าอะไรสำคัญกับคุณ แล้วดูว่ารถคันไหนใช่ที่สุด</h1>
          <p className="lede">
            เราจัดอันดับรถ {cars ? cars.length : "กว่า 170"} รุ่นที่ขายในไทยตอนนี้ จากงบ การใช้งาน และเรื่องที่คุณให้น้ำหนัก
            แล้วบอกเหตุผลของทุกคะแนน ไม่มีโฆษณาแฝง
          </p>
          <div className="cta">
            <Link href="/advisor?mode=chat" className="btn btn-primary">คุยกับที่ปรึกษา AI</Link>
            <Link href="/advisor?mode=manual" className="btn btn-ghost">จัดลำดับความสำคัญเอง</Link>
          </div>
          <p className="muted small">ใช้เวลาราว 2 นาที ไม่ต้องสมัครสมาชิก</p>
        </div>

        <div className="stage" aria-live="polite">
          <div className="stage-img">
            {hero.length === 0 && <div className="skeleton" style={{ position: "absolute", inset: 0 }} />}
            {hero.map((c, k) => c && (
              <div key={c.id} className={`slide ${k === i ? "on" : ""}`} aria-hidden={k !== i}>
                <CarPhoto photo={c.photo} alt={c.name} className="slide-img" priority={k === 0} />
              </div>
            ))}
          </div>
          {hero[i] && (
            <div className="stage-cap">
              <span className="cap-name">{hero[i]!.name}</span>
              <span className="cap-price num">{baht(hero[i]!.price)} บาท</span>
            </div>
          )}
          <div className="dots" role="tablist" aria-label="เลือกรถตัวอย่าง">
            {hero.map((c, k) => c && (
              <button key={c.id} role="tab" aria-selected={k === i} aria-label={c.name} className={k === i ? "on" : ""} onClick={() => setI(k)} />
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- the 5 cards */}
      <section className="wrap block">
        <h2 className="h2">ตัดสินจาก 5 เรื่อง แล้วคุณเป็นคนเรียงว่าเรื่องไหนสำคัญกว่า</h2>
        <p className="muted sub">วางการ์ดลงโซน สำคัญที่สุด สำคัญ หรือไม่ค่อยสำคัญ ระบบแปลงเป็นน้ำหนักให้ทันที และอันดับรถเปลี่ยนตามตอนที่คุณขยับการ์ด</p>
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

      {/* ------------------------------------------------------- steps */}
      <section className="wrap block">
        <h2 className="h2">ใช้งานยังไง</h2>
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

      {/* -------------------------------------------------- browse */}
      <section className="wrap block">
        <div className="row-head">
          <h2 className="h2">ดูตามประเภทรถ</h2>
          <Link href="/cars" className="link">ดูรถทั้งหมด</Link>
        </div>
        <div className="bodies">
          {Object.entries(BODY_TH).filter(([k]) => bodyCounts[k]).map(([k, label]) => (
            <Link key={k} href={`/cars?body=${k}`} className="body-link">
              <span>{label}</span>
              <span className="muted small num">{bodyCounts[k]} รุ่น</span>
            </Link>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- trust */}
      <section className="wrap block">
        <div className="trust panel">
          <div><b className="num">{cars ? cars.length : "–"}</b><span>รุ่นที่ยังขายในไทย จาก {brands || "–"} แบรนด์</span></div>
          <div><b>พ.ย. 2569</b><span>ราคาขายปกติจากรายการราคาทางการ ไม่ใช่ราคาโปรโมชัน</span></div>
          <div><b>ผลทดสอบชนจริง</b><span>ASEAN NCAP, ANCAP และ Euro NCAP รวม 93 รุ่น ใช้ในคะแนนความปลอดภัย และเลือกตัดรถคะแนนต่ำออกได้</span></div>
          <div><b className="num">{realPhotos || "–"}</b><span>คันใช้ภาพถ่ายจริง พร้อมชื่อผู้ถ่ายและสัญญาอนุญาต</span></div>
        </div>
        <p className="muted small" style={{ marginTop: 12 }}>
          อยากรู้ว่าคะแนนคิดยังไง AI ทำอะไรและไม่ทำอะไร <Link href="/how-it-works" className="link">อ่านวิธีคิดของระบบ</Link>
        </p>
      </section>

      <style jsx>{`
        .home { padding-bottom: 72px; }
        .hero { display: grid; grid-template-columns: 1fr 1.15fr; gap: clamp(24px, 4vw, 56px); align-items: center; padding-top: clamp(28px, 5vw, 64px); padding-bottom: 24px; }
        @media (max-width: 900px) { .hero { grid-template-columns: 1fr; } }
        h1 { font-size: clamp(32px, 4.6vw, 54px); line-height: 1.18; letter-spacing: -1px; margin: 0 0 18px; font-weight: 700; max-width: 14em; }
        .lede { font-size: clamp(16px, 1.4vw, 18.5px); color: var(--ink-2); margin: 0 0 26px; max-width: 34em; }
        .cta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
        .stage { position: relative; }
        .stage-img { position: relative; aspect-ratio: 16 / 9; border-radius: 28px; overflow: hidden; background: #EEF1F4; box-shadow: var(--shadow); }
        .slide { position: absolute; inset: 0; opacity: 0; transform: scale(1.03); transition: opacity .9s ease, transform 3.8s ease-out; }
        .slide.on { opacity: 1; transform: scale(1); }
        .stage :global(.slide-img) { width: 100%; height: 100%; object-fit: cover; display: block; }
        .stage-cap { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 14px 6px 0; }
        .cap-name { font-weight: 600; font-size: 18px; }
        .cap-price { color: var(--muted); }
        .dots { display: flex; gap: 6px; padding: 10px 6px 0; }
        .dots button { width: 26px; height: 6px; border-radius: 99px; border: 0; background: var(--line); cursor: pointer; padding: 0; }
        .dots button.on { background: var(--ink); }
        .block { margin-top: clamp(48px, 7vw, 88px); }
        .sub { margin: -4px 0 20px; max-width: 64ch; }
        .cards5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
        @media (max-width: 900px) { .cards5 { grid-template-columns: repeat(2, 1fr); } }
        .c5 { background: var(--surface); border: 1px solid var(--line); border-top: 4px solid var(--c); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 4px; min-height: 130px; }
        .c5-ic { font-size: 24px; }
        .c5-l { font-weight: 700; font-size: 17px; }
        .c5-h { color: var(--muted); font-size: 14px; }
        .steps { list-style: none; counter-reset: s; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 900px) { .steps { grid-template-columns: 1fr; } }
        .steps li { counter-increment: s; display: flex; flex-direction: column; gap: 6px; padding-top: 48px; position: relative; }
        .steps li::before { content: counter(s); position: absolute; top: 0; left: 0; width: 36px; height: 36px; border-radius: 50%; background: var(--ink); color: #fff; display: grid; place-items: center; font-weight: 700; }
        .steps b { font-size: 18px; }
        .steps span { color: var(--ink-2); }
        .row-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
        .bodies { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
        .home :global(.body-link) { display: flex; flex-direction: column; gap: 2px; text-decoration: none; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; font-weight: 600; transition: border-color .15s; }
        .home :global(.body-link:hover) { border-color: var(--ink-2); }
        .trust { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        @media (max-width: 900px) { .trust { grid-template-columns: 1fr 1fr; } }
        .trust div { display: flex; flex-direction: column; gap: 4px; }
        .trust b { font-size: 22px; letter-spacing: -.3px; }
        .trust span { color: var(--muted); font-size: 14px; }
      `}</style>
    </div>
  );
}
