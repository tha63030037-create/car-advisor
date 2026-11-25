"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { CarPhoto, CompareButton, PhotoCredit, Stars } from "../../components/Site";
import {
  ADAS_TH, baht, BODY_TH, CarDetail, CARDS, CRIT_COLOR, FUEL_TH, getJSON, loadLastCriteria, parseCredit, postJSON,
  RecommendResponse, Result,
} from "../../lib/api";

const EST_TH: Record<string, string> = {
  economy: "อัตราสิ้นเปลือง", adas: "ระบบช่วยขับ", cargo_l: "ความจุท้ายรถ", ground_clearance_mm: "ความสูงใต้ท้อง",
  maintenance_5y_thb: "ค่าบำรุงรักษา 5 ปี", drivetrain: "ระบบขับเคลื่อน", doors: "จำนวนประตู", isofix: "ISOFIX",
  rear_ac_vents: "แอร์ตอนหลัง", rear_seat_fold_flat: "เบาะหลังพับราบ", roof_rails: "ราวหลังคา", compact: "ขนาดตัวรถ",
  easy_entry: "ความสะดวกขึ้นลง", has_cargo_bed: "กระบะท้าย", year: "ปีรุ่น",
};

const TH_MONTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
function thDate(iso?: string | null) {
  const m = (iso || "").match(/^(\d{4})-(\d{2})/);
  return m ? `${TH_MONTH[Number(m[2]) - 1]} ${Number(m[1]) + 543}` : "พ.ย. 2569";
}

export default function CarPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [car, setCar] = useState<CarDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fit, setFit] = useState<{ r: Result; total: number; weights: RecommendResponse["weights_pct"] } | null>(null);
  const [fitState, setFitState] = useState<"none" | "loading" | "filtered" | "ok">("none");

  useEffect(() => {
    getJSON<CarDetail>(`/api/v2/cars/${id}`)
      .then(setCar)
      .catch((e) => setErr(String(e).includes("404") ? "ไม่พบรถคันนี้ อาจเป็นรุ่นที่เลิกขายแล้ว" : "โหลดข้อมูลรถไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง"));
    // if the visitor came from the advisor, show how this car scores for their criteria
    const c = loadLastCriteria();
    if (!c) return;
    setFitState("loading");
    postJSON<RecommendResponse>("/api/v2/recommend", { ...c, top_n: 200 })
      .then((resp) => {
        const r = resp.results.find((x) => x.id === id);
        if (r) { setFit({ r, total: resp.passed_filters, weights: resp.weights_pct }); setFitState("ok"); }
        else setFitState("filtered");
      })
      .catch(() => setFitState("none"));
  }, [id]);

  if (err) return (
    <div className="wrap page">
      <p className="alert">{err}</p>
      <p style={{ marginTop: 16 }}><Link href="/cars" className="link">ดูรถทั้งหมด</Link></p>
    </div>
  );
  if (!car) return (
    <div className="wrap page">
      <div className="skeleton" style={{ height: 40, width: 320, marginBottom: 20 }} />
      <div className="skeleton" style={{ aspectRatio: "16 / 9", maxWidth: 760 }} />
    </div>
  );

  const est = new Set(car.estimated || []);
  const E = ({ k }: { k: string }) => (est.has(k) ? <span className="est-mark" title="ค่าประมาณ ยังไม่ได้ยืนยันกับสเปกผู้ผลิต">ประมาณ</span> : null);
  const credit = parseCredit(car.photo.credit);
  const priceSrc = (car.source || "").split(" · ")[0].replace(/^Price [\d,]+:\s*/, "ราคา: ");
  const econ = car.economy ? `${car.economy} ${car.economy_unit === "km/kWh" ? "กม./kWh" : "กม./ลิตร"}` : car.consumption;
  const adas = Object.entries(car.adas || {});

  return (
    <div className="wrap page cp">
      <nav className="crumbs small" aria-label="ตำแหน่งหน้า">
        <Link href="/cars">รถทั้งหมด</Link> <span aria-hidden>/</span> <Link href={`/cars?brand=${encodeURIComponent(car.brand)}`}>{car.brand}</Link>
      </nav>

      {/* ------------------------------------------------------------ top */}
      <section className="top">
        <div className="top-img">
          <CarPhoto photo={car.photo} alt={car.name} priority />
          <PhotoCredit credit={car.photo.credit} />
        </div>
        <div className="top-info">
          <h1>{car.name}</h1>
          <p className="price num">{baht(car.price)} <span>บาท</span></p>
          <p className="muted small">ราคาขายปกติของรุ่นเริ่มต้น ณ {thDate(car.collected_on)}</p>
          <div className="tags">
            <span className="badge">{BODY_TH[car.bodyType] || car.bodyType}</span>
            <span className="badge">{FUEL_TH[car.fuelType] || car.fuelType}</span>
            <span className="badge">{car.seats} ที่นั่ง</span>
            {car.drivetrain && <span className="badge">{car.drivetrain}</span>}
            {car.safety_warning && <span className="badge danger">{car.safety_warning}</span>}
          </div>
          <dl className="keys">
            <div><dt>อัตราสิ้นเปลือง</dt><dd className="num">{econ} <E k="economy" /></dd></div>
            <div><dt>กำลัง</dt><dd className="num">{car.horsepower} แรงม้า</dd></div>
            <div><dt>ค่าใช้จ่ายต่อปี</dt><dd className="num">{car.annual_cost ? `~${baht(car.annual_cost.total)} บาท` : "ไม่มีข้อมูล"}</dd></div>
            <div><dt>ผลทดสอบชน</dt><dd><Stars n={car.asean_ncap_stars} /></dd></div>
          </dl>
          <div className="top-acts">
            <CompareButton id={car.id} />
            <Link href="/advisor" className="btn btn-s btn-ghost">กลับไปหน้าผลลัพธ์</Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- personal fit */}
      {fitState !== "none" && (
        <section className="block panel fit">
          <h2 className="h2">เข้ากับสิ่งที่คุณเลือกไว้แค่ไหน</h2>
          {fitState === "loading" && <div className="skeleton" style={{ height: 80 }} />}
          {fitState === "filtered" && (
            <p className="muted">รถคันนี้ไม่ผ่านเงื่อนไขที่คุณตั้งไว้ล่าสุด เช่น เกินเพดานงบ แบรนด์ หรือจำนวนที่นั่ง จึงไม่ถูกนำมาจัดอันดับ</p>
          )}
          {fitState === "ok" && fit && (
            <>
              <div className="fit-head">
                <div><b className="big num">{Math.round(fit.r.score)}%</b><span className="muted"> เข้ากัน</span></div>
                <div className="muted">อันดับ <b className="num">{fit.r.rank}</b> จาก {fit.total} คันที่ผ่านเงื่อนไข</div>
              </div>
              <table className="fit-table">
                <thead><tr><th>เรื่อง</th><th>คะแนนรถคันนี้</th><th>น้ำหนักที่คุณให้</th><th>ได้</th></tr></thead>
                <tbody>
                  {CARDS.map((c) => {
                    const v = fit.r.criteria[c.key];
                    return (
                      <tr key={c.key}>
                        <td><i style={{ background: CRIT_COLOR[c.key] }} />{c.label}</td>
                        <td>
                          {v === null ? <span className="muted">ไม่มีข้อมูล</span> : (
                            <span className="bar"><span style={{ width: `${Math.round(v * 100)}%`, background: CRIT_COLOR[c.key] }} /></span>
                          )}
                        </td>
                        <td className="num">{fit.weights[c.key]}%</td>
                        <td className="num"><b>+{fit.r.contribution[c.key] ?? 0}</b></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {fit.r.over_budget && <p className="note warn">{fit.r.over_budget.label}</p>}
              {fit.r.lifestyle_detail.map((l) => (
                <p key={l.lifestyle} className="small"><b>{l.label}</b>{l.has.length > 0 && <> มี {l.has.join(", ")}</>}{l.missing.length > 0 && <><span className="muted"> · ไม่มี {l.missing.join(", ")}</span></>}</p>
              ))}
            </>
          )}
        </section>
      )}

      <div className="grid2 block">
        {/* -------------------------------------------------------- cost */}
        <section className="panel">
          <h2 className="h2">ค่าใช้จ่ายหลังซื้อ</h2>
          {car.annual_cost ? (
            <>
              <div className="cost-row"><span>{car.fuelType === "ev" ? "ค่าไฟ" : "ค่าน้ำมัน"} ต่อปี</span><b className="num">{car.annual_cost.energy !== null ? `${baht(car.annual_cost.energy)} บาท` : "ไม่มีข้อมูล"}</b></div>
              <div className="cost-row"><span>ค่าบำรุงรักษาต่อปี <E k="maintenance_5y_thb" /></span><b className="num">{car.annual_cost.maintenance !== null ? `${baht(car.annual_cost.maintenance)} บาท` : "ไม่มีข้อมูล"}</b></div>
              <div className="cost-row total"><span>รวมต่อปี</span><b className="num">{baht(car.annual_cost.total)} บาท</b></div>
              <div className="cost-row"><span>รวม 5 ปี</span><b className="num">{baht(car.annual_cost.total * 5)} บาท</b></div>
              <p className="muted small">คิดที่ {baht(car.km_per_year)} กม. ต่อปี น้ำมัน 38 บาท/ลิตร ดีเซล 32 บาท/ลิตร ไฟฟ้า 6 บาท/kWh ไม่รวมประกันและค่าผ่อน</p>
            </>
          ) : <p className="muted">ยังไม่มีข้อมูลพอจะคำนวณ</p>}
        </section>

        {/* ------------------------------------------------------ safety */}
        <section className="panel">
          <h2 className="h2">ความปลอดภัย</h2>
          <div className="cost-row"><span>ASEAN NCAP</span><span><Stars n={car.asean_ncap_stars} /></span></div>
          <div className="cost-row"><span>ถุงลมนิรภัย</span><b className="num">{car.airbags} ใบ</b></div>
          <ul className="checks">
            {adas.map(([k, v]) => (
              <li key={k} className={v ? "yes" : v === false ? "no" : "unk"}>
                <span aria-hidden>{v ? "✓" : v === false ? "–" : "?"}</span>{ADAS_TH[k] || k}
                <span className="sr-only">{v ? "มี" : v === false ? "ไม่มี" : "ไม่ทราบ"}</span>
              </li>
            ))}
          </ul>
          {est.has("adas") && <p className="muted small">รายการระบบช่วยขับเป็นค่าประมาณ ยังไม่ได้ยืนยันกับสเปกผู้ผลิต</p>}
        </section>

        {/* --------------------------------------------------- lifestyle */}
        <section className="panel">
          <h2 className="h2">เหมาะกับการใช้งานแบบไหน</h2>
          {Object.entries(car.lifestyle_fit).map(([label, v]) => (
            <div key={label} className="ls-row">
              <span>{label}</span>
              {v === null ? <span className="muted small">ไม่มีข้อมูล</span> : <span className="bar"><span style={{ width: `${Math.round(v * 100)}%` }} /></span>}
            </div>
          ))}
          <p className="muted small">คิดจากสัดส่วนอุปกรณ์ที่การใช้งานนั้นต้องการซึ่งรถคันนี้มี</p>
        </section>

        {/* ------------------------------------------------------- specs */}
        <section className="panel">
          <h2 className="h2">สเปกที่ใช้คำนวณ</h2>
          <dl className="specs">
            <div><dt>ความจุท้ายรถ</dt><dd className="num">{car.has_cargo_bed ? "กระบะท้าย" : car.cargo_l ? `${car.cargo_l} ลิตร` : "ไม่มีข้อมูล"} <E k="cargo_l" /></dd></div>
            <div><dt>ความสูงใต้ท้องรถ</dt><dd className="num">{car.ground_clearance_mm ? `${car.ground_clearance_mm} มม.` : "ไม่มีข้อมูล"} <E k="ground_clearance_mm" /></dd></div>
            <div><dt>ระบบขับเคลื่อน</dt><dd>{car.drivetrain || "ไม่มีข้อมูล"} <E k="drivetrain" /></dd></div>
            <div><dt>รับประกัน</dt><dd className="num">{car.warrantyYears} ปี{car.warrantyKm && car.warrantyKm < 999999 ? ` / ${baht(car.warrantyKm)} กม.` : " ไม่จำกัดระยะทาง"}</dd></div>
          </dl>
          {car.features_has.length > 0 && <p className="small"><b>มี</b> {car.features_has.join(" · ")}</p>}
          {car.features_missing.length > 0 && <p className="small muted"><b>ไม่มี</b> {car.features_missing.join(" · ")}</p>}
        </section>
      </div>

      {/* --------------------------------------------------------- sources */}
      <section className="block src">
        <h2 className="h2">ที่มาของข้อมูล</h2>
        <p className="small">{priceSrc}</p>
        {est.size > 0 && (
          <p className="small muted">
            ค่าที่ยังเป็นการประมาณ ยังไม่ได้ยืนยันกับผู้ผลิต: {Array.from(est).map((k) => EST_TH[k] || k).join(", ")}
          </p>
        )}
        <p className="small muted">
          รูป: {credit.ai ? credit.full : <>{credit.full.split(" · ")[0]} {credit.url && <a href={credit.url} target="_blank" rel="noreferrer">ดูต้นฉบับ</a>} · ดัดแปลงโดยตัดพื้นหลัง</>}
        </p>
      </section>

      <style jsx>{`
        .crumbs { color: var(--muted); margin-bottom: 14px; }
        .crumbs :global(a) { color: var(--ink-2); text-decoration: none; }
        .crumbs :global(a:hover) { text-decoration: underline; }
        .top { display: grid; grid-template-columns: 1.25fr 1fr; gap: clamp(20px, 3vw, 40px); align-items: start; }
        @media (max-width: 900px) { .top { grid-template-columns: 1fr; } }
        .top-img :global(.car-img) { border-radius: 24px; margin-bottom: 6px; }
        h1 { font-size: clamp(28px, 3.6vw, 42px); line-height: 1.2; letter-spacing: -.6px; margin: 0 0 8px; }
        .price { font-size: 30px; font-weight: 700; margin: 0; letter-spacing: -.4px; }
        .price span { font-size: 16px; font-weight: 500; color: var(--muted); }
        .tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 18px; }
        .keys { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; margin: 0 0 18px; }
        .keys div { background: var(--surface); padding: 12px 14px; }
        dt { font-size: 13px; color: var(--muted); }
        dd { margin: 2px 0 0; font-weight: 600; }
        .top-acts { display: flex; flex-wrap: wrap; gap: 8px; }
        .block { margin-top: 28px; }
        .fit-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
        .big { font-size: 34px; color: var(--accent); letter-spacing: -.5px; }
        .fit-table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
        .fit-table th { text-align: left; font-weight: 500; color: var(--muted); font-size: 13px; padding: 6px 4px; border-bottom: 1px solid var(--line); }
        .fit-table td { padding: 9px 4px; border-bottom: 1px solid var(--line-soft); }
        .fit-table td:first-child { white-space: nowrap; }
        .fit-table i { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 8px; }
        .bar { display: inline-block; width: 100%; max-width: 220px; height: 8px; border-radius: 99px; background: var(--line-soft); overflow: hidden; vertical-align: middle; }
        .bar span { display: block; height: 100%; background: var(--accent); border-radius: 99px; }
        .note { margin: 10px 0 0; font-size: 14px; }
        .note.warn { color: #7A5200; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 800px) { .grid2 { grid-template-columns: 1fr; } }
        .cost-row { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--line-soft); }
        .cost-row.total { font-size: 17px; }
        .cost-row.total b { color: var(--accent); }
        .checks { list-style: none; padding: 0; margin: 10px 0 0; display: grid; gap: 6px; }
        .checks li { display: flex; gap: 10px; align-items: center; font-size: 14.5px; }
        .checks li span:first-child { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 700; }
        .checks .yes span:first-child { background: var(--accent-wash); color: var(--accent-ink); }
        .checks .no span:first-child { background: var(--line-soft); color: var(--muted); }
        .checks .no { color: var(--muted); }
        .checks .unk span:first-child { background: var(--signal-wash); color: #8A5D00; }
        .ls-row { display: grid; grid-template-columns: 1fr 160px; gap: 12px; align-items: center; padding: 7px 0; font-size: 14.5px; }
        .specs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 0 0 12px; }
        .est-mark { font-size: 11px; font-weight: 600; color: #8A5D00; background: var(--signal-wash); border-radius: 6px; padding: 1px 6px; margin-left: 4px; vertical-align: 1px; }
        .src p { margin: 4px 0; max-width: 90ch; overflow-wrap: anywhere; }
      `}</style>
    </div>
  );
}
