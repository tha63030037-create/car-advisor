"use client";

import Link from "next/link";
import React from "react";
import { CARDS, CRIT_COLOR } from "../lib/api";

const STEPS = [
  { t: "คุณบอกความต้องการ", d: "เล่าให้ที่ปรึกษาฟังเป็นภาษาพูด หรือเรียงการ์ด 5 ใบเองก็ได้ ทั้งสองทางได้ผลเป็นเงื่อนไขชุดเดียวกัน" },
  { t: "AI แปลงเป็นเงื่อนไข", d: "โมเดลภาษาอ่านข้อความแล้วกรอกเป็นข้อมูลโครงสร้าง เช่น งบ 900,000 บาท ใช้ในเมือง ต้องการ 7 ที่นั่ง และลำดับความสำคัญของการ์ด" },
  { t: "กรองรถที่ไม่เข้าเงื่อนไข", d: "ตัดรถที่เกินเพดานงบ ค่างวดเกินครึ่งหนึ่งของรายได้ ที่นั่งไม่พอ แบรนด์หรือพลังงานที่คุณไม่เอา ออกก่อน ไม่มีการให้คะแนน" },
  { t: "ให้คะแนน 5 ด้าน", d: "รถทุกคันที่เหลือได้คะแนน 0–1 ในแต่ละด้านด้วยสูตรเดียวกัน สูตรอยู่ด้านล่าง" },
  { t: "ถ่วงน้ำหนักตามที่คุณจัด", d: "การ์ดในโซนสำคัญที่สุดได้ 3 แต้ม สำคัญ 2 แต้ม ไม่ค่อยสำคัญ 1 แต้ม หารด้วยแต้มรวมเป็นน้ำหนัก แล้วรวมเป็นคะแนนเข้ากัน 0–100% การ์ดที่คุณไม่ได้ให้ข้อมูลจะไม่ถูกนับ" },
  { t: "AI อธิบายผล", d: "ส่งรถ 3 อันดับแรกพร้อมตัวเลขให้ AI เขียนคำอธิบายภาษาไทย ระบบตรวจว่าชื่อรถที่ AI พูดถึงอยู่ในรายการจริงเท่านั้น" },
];

const FORMULAS: { key: string; how: string; detail: string }[] = [
  { key: "budget", how: "ราคาไม่เกินงบได้เต็ม ถ้าเกินงบ คะแนนลดลงตามสัดส่วนที่เกิน จนเป็น 0 เมื่อเกินถึงเพดานที่ยอมรับได้ (ค่าเริ่มต้น 15%)", detail: "1 − ((ราคา − งบ) ÷ งบ) ÷ เพดานที่ยอมเกิน" },
  { key: "lifestyle", how: "แต่ละการใช้งานมีคุณสมบัติที่ต้องการ และให้น้ำหนักกับข้อที่เป็นหัวใจมากกว่า เช่น ใช้ทำงานขนของ กระบะท้ายนับ 3 เท่า ค่าที่วัดได้อย่างความยาวรถหรือความจุท้ายคิดเป็นสัดส่วน ไม่ใช่แค่มีหรือไม่มี ถ้าไม่ได้เลือกไลฟ์สไตล์ เกณฑ์นี้ไม่ถูกนับ", detail: "ค่าเฉลี่ยถ่วงน้ำหนักของคุณสมบัติ เช่น ขับในเมือง = ตัวรถกะทัดรัด ×2 + ระบบช่วยจอด ×1" },
  { key: "running_cost", how: "ค่าน้ำมันหรือค่าไฟบวกค่าบำรุงรักษาต่อปี เทียบบนสเกลคงที่ของรถทั้ง 175 รุ่น คะแนนของรถคันหนึ่งจึงไม่เปลี่ยนตามว่ามีรถคันอื่นผ่านตัวกรองหรือไม่", detail: "สเกลจากเปอร์เซ็นไทล์ที่ 5 (ได้ 1) ถึง 95 (ได้ 0) · น้ำมัน 38 บาท/ลิตร ดีเซล 32 ไฟ 6 บาท/kWh ที่ 15,000 กม./ปี" },
  { key: "safety", how: "รวมผลทดสอบชนกับอุปกรณ์ความปลอดภัย ใช้ผล ASEAN NCAP ก่อน ถ้าไม่มีใช้ ANCAP (รถพวงมาลัยขวาเหมือนไทย) แล้วจึง Euro NCAP รถที่ยังไม่มีผลทดสอบถูกคิดเป็นกลาง ๆ เท่า 3 ดาว จึงไม่ได้ 0 แต่ก็ไม่ชนะรถที่ทดสอบแล้วได้ 4–5 ดาวด้วยอุปกรณ์อย่างเดียว", detail: "NCAP 50% (ไม่มีผล = 3 ดาว) · ถุงลม (เต็มที่ 8 ใบ) และระบบช่วยขับ 5 รายการ 50%" },
  { key: "design", how: "รวมสองเรื่องที่บอกรสนิยม: ทรงรถ (ตรง 1 ใกล้เคียงเช่น SUV กับ PPV 0.5) และแบรนด์ที่ชอบ (ใช่ 1 ไม่ใช่ 0) แบรนด์ที่ชอบไม่ตัดแบรนด์อื่นออก ถ้าไม่ได้บอกทั้งสองเรื่อง เกณฑ์นี้ไม่ถูกนับ", detail: "ค่าเฉลี่ยของทรงรถและแบรนด์ที่ชอบ · ไม่บอกเลย = ไม่นับ · \"เอาเฉพาะแบรนด์\" เป็นตัวกรอง ไม่ใช่คะแนน" },
];

export default function HowItWorks() {
  return (
    <div className="wrap page hiw">
      <h1 className="page-title">ระบบคิดยังไง</h1>
      <p className="page-lede">AI ช่วยสองจุด คือแปลงคำพูดเป็นเงื่อนไข และเขียนคำอธิบายผล ส่วนการเลือกและจัดอันดับรถใช้สูตรคำนวณที่ตรวจสอบได้ทุกขั้น รถคันเดียวกันกับเงื่อนไขเดียวกันจะได้คะแนนเท่ากันทุกครั้ง</p>

      <section className="flow" aria-label="ขั้นตอนการทำงาน">
        <ol>
          {STEPS.map((s, i) => (
            <li key={s.t} className={i === 1 || i === 5 ? "ai" : ""}>
              <span className="n">{i + 1}</span>
              <div>
                <h3>{s.t} {(i === 1 || i === 5) && <span className="badge ai-b">AI</span>}</h3>
                <p>{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="block">
        <h2 className="h2">ตัวอย่างน้ำหนัก</h2>
        <p className="muted">ถ้าวางงบประมาณกับความปลอดภัยไว้ในโซนสำคัญที่สุด ค่าใช้จ่ายระยะยาวในโซนสำคัญ และที่เหลือในโซนไม่ค่อยสำคัญ แต้มรวมคือ 3+3+2+1+1 = 10</p>
        <div className="wex">
          {[["budget", 3], ["safety", 3], ["running_cost", 2], ["lifestyle", 1], ["design", 1]].map(([k, p]) => {
            const c = CARDS.find((x) => x.key === k)!;
            return (
              <div key={k as string} style={{ flex: p as number, background: CRIT_COLOR[c.key], ["--w" as string]: `${(p as number) * 10}%` }}>
                <b>{(p as number) * 10}%</b><span>{c.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="block">
        <h2 className="h2">สูตรคะแนนแต่ละด้าน</h2>
        <div className="formulas">
          {FORMULAS.map((f) => {
            const c = CARDS.find((x) => x.key === f.key)!;
            return (
              <article key={f.key} className="panel f" style={{ borderTopColor: CRIT_COLOR[c.key] }}>
                <h3>{c.label}</h3>
                <p>{f.how}</p>
                <p className="code small">{f.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="block grid2">
        <div className="panel">
          <h2 className="h2">สิ่งที่ AI ทำ</h2>
          <ul>
            <li>อ่านข้อความแล้วกรอกงบ การใช้งาน และลำดับความสำคัญ</li>
            <li>ถามต่อเมื่อข้อมูลยังไม่พอ เช่น ยังไม่ได้บอกงบ</li>
            <li>เขียนคำอธิบายว่าทำไมรถ 3 อันดับแรกถึงเหมาะ โดยอ้างตัวเลขจริง</li>
          </ul>
        </div>
        <div className="panel">
          <h2 className="h2">สิ่งที่ AI ไม่ได้ทำ</h2>
          <ul>
            <li>ไม่ได้เลือกหรือจัดอันดับรถ อันดับมาจากสูตรด้านบนเท่านั้น</li>
            <li>ไม่แต่งชื่อรถหรือสเปกขึ้นมาเอง ชื่อรถทุกคันถูกตรวจกับฐานข้อมูล</li>
            <li>ไม่ได้รับค่าตอบแทนจากแบรนด์ใด ทุกแบรนด์ใช้สูตรเดียวกัน</li>
          </ul>
        </div>
      </section>

      <section className="block panel">
        <h2 className="h2">ข้อมูลและข้อจำกัด</h2>
        <ul>
          <li>รถ 175 รุ่นที่ขายในไทย ราคาขายปกติของรุ่นเริ่มต้นจากเว็บไซต์ผู้ผลิต เก็บข้อมูลเดือนพฤศจิกายน 2569 ไม่ใช่ราคาโปรโมชัน</li>
          <li>ผลทดสอบชนรวม 93 รุ่นจาก 3 แหล่ง: ASEAN NCAP 38 รุ่น, ANCAP 24 รุ่น, Euro NCAP 31 รุ่น ไม่ใช้ผล ANCAP หรือ Euro NCAP ที่เก่ากว่าปี 2020 เพราะทั้งสองโปรแกรมถือว่าผลหมดอายุหลัง 6 ปี รถที่ยังไม่พบผลแสดงว่ายังไม่มีผลทดสอบ และคิดเป็นกลาง ๆ เท่า 3 ดาว ไม่ได้ถือว่าได้ 0 ดาว ผลจากต่างประเทศทดสอบรถสเปกของตลาดนั้น อุปกรณ์อาจต่างจากรุ่นไทยได้</li>
          <li>บางช่อง เช่น ความจุท้ายรถ หรือระบบช่วยขับ ยังเป็นค่าประมาณ หน้ารถแต่ละคันบอกไว้ว่าช่องไหนเป็นการประมาณ</li>
          <li>ค่าใช้จ่ายต่อปีไม่รวมประกัน ค่าผ่อน และค่าเสื่อมราคา ราคาน้ำมันและไฟใช้ค่าคงที่</li>
          <li>ค่างวดเป็นค่าประมาณจากสมมติฐานเดียวกันทุกคัน: ดาวน์ 25% ผ่อน 5 ปี ดอกเบี้ย 3% ต่อปีแบบคงที่ ค่างวดไม่เกิน 30% ของรายได้ถือว่าผ่อนสบายตามคำแนะนำของคู่มือซื้อรถในไทย และไม่แสดงรถที่ค่างวดเกินครึ่งหนึ่งของรายได้ เพราะไฟแนนซ์มักไม่อนุมัติ ไม่ใช่ข้อเสนอสินเชื่อจริง</li>
          <li>ภาษีสรรพสามิตรถไฟฟ้าจะปรับขึ้นในปี 2570 ราคารถ EV อาจเปลี่ยน</li>
        </ul>
      </section>

      <section className="block panel">
        <h2 className="h2">ทดสอบยังไง</h2>
        <p>มีชุดทดสอบอัตโนมัติ 59 กรณี ครอบคลุมสูตรคะแนนทุกด้าน ตัวกรอง การตรวจชื่อรถที่ AI พูดถึง และกรณีที่เคยผิด เช่น รถที่ไม่เคยทดสอบชนต้องไม่ชนะรถ 5 ดาว ใช้ทำงานขนของต้องได้กระบะขึ้นก่อน และสลับการ์ดแล้วอันดับต้องเปลี่ยน รวมถึงผู้ใช้สมมติ 8 แบบ เช่น ครอบครัวมีลูกเล็ก นักศึกษางบจำกัด สายเดินทางต่างจังหวัด เพื่อดูว่าอันดับที่ได้สมเหตุสมผล</p>
      </section>

      <div className="cta">
        <Link href="/advisor" className="btn btn-primary">ลองหาคันที่ใช่</Link>
        <Link href="/cars" className="btn btn-ghost">ดูรถทั้งหมด</Link>
      </div>

      <style jsx>{`
        .flow ol { list-style: none; padding: 0; margin: 8px 0 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; counter-reset: s; }
        @media (max-width: 900px) { .flow ol { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) { .flow ol { grid-template-columns: 1fr; } }
        .flow li { display: flex; gap: 12px; background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 16px; }
        .flow li.ai { border-color: #CFE6DF; background: var(--accent-wash); }
        .n { flex: none; width: 30px; height: 30px; border-radius: 50%; background: var(--ink); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 14px; }
        .flow li.ai .n { background: var(--accent); }
        h3 { margin: 2px 0 4px; font-size: 16px; }
        .flow p { margin: 0; font-size: 14px; color: var(--ink-2); }
        .ai-b { background: var(--accent); color: #fff; border-color: var(--accent); margin-left: 4px; }
        .block { margin-top: 32px; }
        .wex { display: flex; gap: 3px; border-radius: 14px; overflow: hidden; margin-top: 10px; }
        .wex div { color: #fff; padding: 12px 10px; display: flex; flex-direction: column; min-width: 0; }
        .wex b { font-size: 20px; }
        @media (max-width: 560px) {
          .wex { flex-direction: column; border-radius: 0; gap: 6px; }
          .wex div { flex: none !important; width: max(var(--w) * 3, 46%); flex-direction: row; align-items: baseline; gap: 8px; border-radius: 10px; padding: 8px 12px; }
          .wex b { font-size: 16px; }
        }
        .wex span { font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .formulas { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
        .f { border-top: 5px solid; }
        .f p { margin: 0 0 8px; font-size: 14.5px; }
        .code { background: #F3F5F7; border-radius: 8px; padding: 8px 10px; color: var(--ink-2); margin: 0 !important; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 760px) { .grid2 { grid-template-columns: 1fr; } }
        ul { margin: 0; padding-left: 20px; }
        li { margin: 4px 0; }
        .cta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 32px; }
      `}</style>
    </div>
  );
}
