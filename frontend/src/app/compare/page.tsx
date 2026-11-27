"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { CarPhoto, crashLabel, PhotoCredit, Stars, useCatalogue } from "../components/Site";
import { ADAS_TH, baht, BODY_TH, CarDetail, COMPARE_MAX, FUEL_TH, getJSON, useCompare } from "../lib/api";

type Row = {
  label: string;
  get: (c: CarDetail) => number | string | null | undefined | React.ReactNode;
  best?: "min" | "max";
  value?: (c: CarDetail) => number | null | undefined;
  est?: string;
};

const ROWS: { group: string; rows: Row[] }[] = [
  {
    group: "ราคาและค่าใช้จ่าย",
    rows: [
      { label: "ราคาเริ่มต้น", get: (c) => `${baht(c.price)} บาท`, best: "min", value: (c) => c.price },
      { label: "ค่าใช้จ่ายต่อปี", get: (c) => (c.annual_cost ? `~${baht(c.annual_cost.total)} บาท` : null), best: "min", value: (c) => c.annual_cost?.total },
      { label: "ค่าบำรุงรักษา 5 ปี", get: (c) => (c.maintenance_5y_thb ? `${baht(c.maintenance_5y_thb)} บาท` : null), best: "min", value: (c) => c.maintenance_5y_thb, est: "maintenance_5y_thb" },
      { label: "อัตราสิ้นเปลือง", get: (c) => (c.economy ? `${c.economy} ${c.economy_unit === "km/kWh" ? "กม./kWh" : "กม./ลิตร"}` : c.consumption), est: "economy" },
      { label: "รับประกัน", get: (c) => `${c.warrantyYears} ปี`, best: "max", value: (c) => c.warrantyYears },
      { label: "รถแบรนด์นี้ที่จดทะเบียนในไทย (ม.ค.–ต.ค. 69)", get: (c) => (c.aftersales?.registrations ? `${baht(c.aftersales.registrations)} คัน` : null), best: "max", value: (c) => c.aftersales?.registrations },
    ],
  },
  {
    group: "ตัวรถ",
    rows: [
      { label: "ประเภท", get: (c) => BODY_TH[c.bodyType] || c.bodyType },
      { label: "พลังงาน", get: (c) => FUEL_TH[c.fuelType] || c.fuelType },
      { label: "ที่นั่ง", get: (c) => `${c.seats}`, best: "max", value: (c) => c.seats },
      { label: "กำลัง", get: (c) => `${c.horsepower} แรงม้า`, best: "max", value: (c) => c.horsepower },
      { label: "ความจุท้ายรถ", get: (c) => (c.has_cargo_bed ? "กระบะท้าย" : c.cargo_l ? `${c.cargo_l} ลิตร` : null), best: "max", value: (c) => (c.has_cargo_bed ? null : c.cargo_l), est: "cargo_l" },
      { label: "ความสูงใต้ท้อง", get: (c) => (c.ground_clearance_mm ? `${c.ground_clearance_mm} มม.` : null), best: "max", value: (c) => c.ground_clearance_mm, est: "ground_clearance_mm" },
      { label: "ระบบขับเคลื่อน", get: (c) => c.drivetrain, est: "drivetrain" },
    ],
  },
  {
    group: "ความปลอดภัย",
    rows: [
      { label: "ผลทดสอบชน", get: (c) => <><Stars n={c.crash_stars} program={c.crash_test?.program} />{c.crash_test && <span className="muted small"> {crashLabel(c.crash_test)}</span>}</>, best: "max", value: (c) => c.crash_stars },
      { label: "ถุงลมนิรภัย", get: (c) => `${c.airbags} ใบ`, best: "max", value: (c) => c.airbags },
      ...Object.entries(ADAS_TH).map(([k, label]): Row => ({
        label,
        get: (c) => { const v = c.adas?.[k]; return v ? "✓ มี" : v === false ? "– ไม่มี" : null; },
        est: "adas",
      })),
    ],
  },
];

export default function Compare() {
  const cmp = useCompare();
  const { cars: catalogue } = useCatalogue();
  const [ids, setIds] = useState<number[] | null>(null);
  const [cars, setCars] = useState<Record<number, CarDetail>>({});
  const [adding, setAdding] = useState("");

  // ?ids= wins on first load (shareable link); afterwards the shared compare list drives the page
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("ids");
    if (q) cmp.setAll(q.split(",").map(Number).filter((n) => n > 0));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (ready) setIds(cmp.ids); }, [ready, cmp.ids]);

  useEffect(() => {
    (ids || []).filter((id) => !cars[id]).forEach((id) =>
      getJSON<CarDetail>(`/api/v2/cars/${id}`).then((c) => setCars((m) => ({ ...m, [id]: c }))).catch(() => undefined));
    if (ids) window.history.replaceState(null, "", ids.length ? `/compare?ids=${ids.join(",")}` : "/compare");
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = (ids || []).map((id) => cars[id]).filter(Boolean);
  const options = useMemo(() => (catalogue || []).filter((c) => !(ids || []).includes(c.id)), [catalogue, ids]);

  const bestIdx = (r: Row) => {
    if (!r.best || !r.value || list.length < 2) return new Set<number>();
    const vals = list.map((c) => r.value!(c));
    const known = vals.filter((v): v is number => typeof v === "number");
    if (known.length < 2 || new Set(known).size === 1) return new Set<number>();
    const target = r.best === "min" ? Math.min(...known) : Math.max(...known);
    return new Set(vals.map((v, i) => (v === target ? i : -1)).filter((i) => i >= 0));
  };

  return (
    <div className="wrap page cmp">
      <h1 className="page-title">เทียบรถ</h1>
      <p className="page-lede">เทียบได้สูงสุด {COMPARE_MAX} คัน ค่าที่ดีที่สุดในแต่ละแถวมีพื้นสีเขียว ช่องที่มีคำว่าประมาณคือข้อมูลที่ยังไม่ได้ยืนยันกับผู้ผลิต</p>

      {ids !== null && ids.length === 0 && (
        <div className="panel empty">
          <p className="h3">ยังไม่ได้เลือกรถมาเทียบ</p>
          <p className="muted">กด &quot;เทียบ&quot; ที่รถในหน้าผลลัพธ์หรือหน้ารถทั้งหมด หรือเลือกรถจากรายการด้านล่างได้เลย</p>
        </div>
      )}

      {(ids || []).length < COMPARE_MAX && catalogue && (
        <div className="add">
          <label htmlFor="add" className="muted small">เพิ่มรถ</label>
          <select id="add" value={adding} onChange={(e) => { const v = Number(e.target.value); if (v) cmp.toggle(v); setAdding(""); }}>
            <option value="">เลือกรุ่น…</option>
            {options.map((c) => <option key={c.id} value={c.id}>{c.name} · {baht(c.price)} บาท</option>)}
          </select>
        </div>
      )}

      {list.length > 1 && <p className="swipe muted small">เลื่อนตารางไปทางขวาเพื่อดูคันอื่น</p>}
      {list.length > 0 && (
        <div className="scroller">
          <table className="ct" style={{ ["--n" as string]: list.length }}>
            <thead>
              <tr>
                <th className="corner" />
                {list.map((c) => (
                  <th key={c.id} className="head">
                    <Link href={`/car/${c.id}`}><CarPhoto photo={c.photo} alt={c.name} /></Link>
                    <PhotoCredit credit={c.photo.credit} />
                    <Link href={`/car/${c.id}`} className="cname">{c.name}</Link>
                    <button className="link small" onClick={() => cmp.remove(c.id)}>เอาออก</button>
                  </th>
                ))}
              </tr>
            </thead>
            {ROWS.map((g) => (
              <tbody key={g.group}>
                <tr className="grp"><th colSpan={list.length + 1}>{g.group}</th></tr>
                {g.rows.map((r) => {
                  const best = bestIdx(r);
                  return (
                    <tr key={r.label}>
                      <th scope="row">{r.label}</th>
                      {list.map((c, i) => {
                        const v = r.get(c);
                        const isEst = r.est && (c.estimated || []).includes(r.est);
                        return (
                          <td key={c.id} className={best.has(i) ? "best" : ""}>
                            {v === null || v === undefined || v === "" ? <span className="muted">ไม่มีข้อมูล</span> : v}
                            {isEst && v !== null && v !== undefined && <span className="est-mark">ประมาณ</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
      )}

      <style jsx>{`
        .empty { margin-bottom: 16px; }
        .empty p { margin: 0 0 4px; }
        .swipe { display: none; margin: 0 0 8px; }
        @media (max-width: 700px) {
          .swipe { display: block; }
          .ct { min-width: calc(108px + var(--n) * 150px); font-size: 13.5px; }
          .ct th, .ct td { padding: 9px 10px; }
          .ct tbody th[scope="row"] { width: 108px; }
          .cmp :global(.cname) { font-size: 14.5px; }
        }
        .add label { white-space: nowrap; }
        .add { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        select { min-height: 42px; border-radius: 12px; border: 1px solid var(--line); padding: 0 10px; font: inherit; font-size: 15px; color: var(--ink); background: var(--surface); max-width: 100%; }
        .scroller { overflow-x: auto; background: var(--surface); border: 1px solid var(--line); border-radius: 22px; }
        .ct { width: 100%; min-width: calc(150px + var(--n) * 220px); border-collapse: separate; border-spacing: 0; font-size: 14.5px; }
        .ct th, .ct td { padding: 11px 14px; text-align: left; vertical-align: middle; border-bottom: 1px solid var(--line-soft); }
        .ct tbody th[scope="row"] { color: var(--muted); font-weight: 500; width: 150px; position: sticky; left: 0; background: var(--surface); z-index: 1; }
        .corner { position: sticky; left: 0; background: var(--surface); z-index: 2; }
        .head { vertical-align: top; font-weight: 400; }
        .head :global(.car-img) { border-radius: 12px; margin-bottom: 4px; }
        .cmp :global(.cname) { display: block; font-weight: 700; font-size: 16px; color: var(--ink); text-decoration: none; margin: 6px 0 2px; }
        .grp th { background: #F7F9FB; font-size: 13px; font-weight: 700; color: var(--ink-2); padding: 8px 14px; position: sticky; left: 0; }
        td.best { background: var(--accent-wash); font-weight: 600; color: var(--accent-ink); }
        .est-mark { font-size: 11px; font-weight: 600; color: #8A5D00; background: var(--signal-wash); border-radius: 6px; padding: 1px 6px; margin-left: 6px; }
      `}</style>
    </div>
  );
}
