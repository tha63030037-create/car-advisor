"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { CarPhoto, CompareButton, Stars, useCatalogue } from "../components/Site";
import { baht, BODY_TH, FUEL_TH } from "../lib/api";

type Sort = "price_asc" | "price_desc" | "name";

export default function Cars() {
  const { cars, err } = useCatalogue();
  const [q, setQ] = useState("");
  const [body, setBody] = useState<string | null>(null);
  const [fuel, setFuel] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("price_asc");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("body")) setBody(p.get("body"));
    if (p.get("brand")) setBrand(p.get("brand"));
  }, []);

  const brands = useMemo(() => Array.from(new Set((cars || []).map((c) => c.brand))).sort(), [cars]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = (cars || []).filter((c) =>
      (!t || c.name.toLowerCase().includes(t)) &&
      (!body || c.bodyType === body) &&
      (!fuel || c.fuelType === fuel) &&
      (!brand || c.brand === brand) &&
      (!maxPrice || c.price <= maxPrice));
    return out.sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "price_desc" ? b.price - a.price : a.price - b.price);
  }, [cars, q, body, fuel, brand, maxPrice, sort]);

  const PRICES = [600000, 1000000, 1500000, 2500000];
  const reset = () => { setQ(""); setBody(null); setFuel(null); setBrand(null); setMaxPrice(null); };

  return (
    <div className="wrap page cars">
      <h1 className="page-title">รถทั้งหมด</h1>
      <p className="page-lede">รถ {cars ? cars.length : "–"} รุ่นที่ยังขายในไทย ราคาขายปกติของรุ่นเริ่มต้น กดที่รถเพื่อดูค่าใช้จ่ายต่อปี ความปลอดภัย และที่มาของข้อมูล</p>

      <div className="filters panel">
        <input className="search" type="search" placeholder="ค้นหารุ่น เช่น Civic, Atto 3" value={q} onChange={(e) => setQ(e.target.value)} aria-label="ค้นหารุ่นรถ" />
        <div className="frow">
          <span className="fl">ประเภท</span>
          <div className="chips">
            {Object.entries(BODY_TH).map(([k, v]) => (
              <button key={k} className={`chip ${body === k ? "on" : ""}`} onClick={() => setBody(body === k ? null : k)}>{v}</button>
            ))}
          </div>
        </div>
        <div className="frow">
          <span className="fl">พลังงาน</span>
          <div className="chips">
            {Object.entries(FUEL_TH).map(([k, v]) => (
              <button key={k} className={`chip ${fuel === k ? "on" : ""}`} onClick={() => setFuel(fuel === k ? null : k)}>{v}</button>
            ))}
          </div>
        </div>
        <div className="frow">
          <span className="fl">ราคาไม่เกิน</span>
          <div className="chips">
            {PRICES.map((p) => (
              <button key={p} className={`chip ${maxPrice === p ? "on" : ""}`} onClick={() => setMaxPrice(maxPrice === p ? null : p)}>{p >= 1000000 ? `${p / 1000000} ล้าน` : `${p / 1000}k`}</button>
            ))}
          </div>
        </div>
        <div className="frow">
          <label className="fl" htmlFor="brand">แบรนด์</label>
          <select id="brand" value={brand || ""} onChange={(e) => setBrand(e.target.value || null)}>
            <option value="">ทุกแบรนด์</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <label className="fl" htmlFor="sort" style={{ marginLeft: "auto" }}>เรียง</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="price_asc">ราคาต่ำไปสูง</option>
            <option value="price_desc">ราคาสูงไปต่ำ</option>
            <option value="name">ชื่อ ก–ฮ / A–Z</option>
          </select>
        </div>
      </div>

      {err && <p className="alert">{err}</p>}
      <p className="muted small count">{cars ? `พบ ${list.length} รุ่น` : "กำลังโหลด…"}</p>

      {cars && list.length === 0 && (
        <div className="empty panel">
          <p>ไม่มีรถที่ตรงกับตัวกรองนี้</p>
          <button className="btn btn-s btn-ghost" onClick={reset}>ล้างตัวกรอง</button>
        </div>
      )}

      <div className="grid">
        {!cars && Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: "4 / 3.4" }} />)}
        {list.map((c) => (
          <Link key={c.id} href={`/car/${c.id}`} className="tile">
            <CarPhoto photo={c.photo} alt={c.name} />
            <div className="t-body">
              <div className="t-name">{c.name}</div>
              <div className="t-price num">{baht(c.price)} บาท</div>
              <div className="t-meta">
                <span>{BODY_TH[c.bodyType] || c.bodyType}</span>
                <span>{FUEL_TH[c.fuelType]}</span>
                <span>{c.seats} ที่นั่ง</span>
              </div>
              {c.asean_ncap_stars !== null && <div className="t-ncap small"><Stars n={c.asean_ncap_stars} /> <span className="muted">ASEAN NCAP</span></div>}
              <div className="t-act"><CompareButton id={c.id} compact /></div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .filters { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
        .search { min-height: 46px; border-radius: 13px; border: 1px solid var(--line); padding: 0 14px; font: inherit; font-size: 16px; color: var(--ink); background: var(--surface); }
        .search:focus { outline: 2.5px solid var(--accent); border-color: transparent; }
        .frow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .fl { font-size: 13.5px; color: var(--muted); min-width: 72px; }
        select { min-height: 40px; border-radius: 11px; border: 1px solid var(--line); padding: 0 10px; font: inherit; font-size: 14.5px; color: var(--ink); background: var(--surface); }
        .count { margin: 0 0 12px; }
        .empty { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .empty p { margin: 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
        .cars :global(.tile) { display: flex; flex-direction: column; text-decoration: none; background: var(--surface); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; transition: border-color .15s, box-shadow .15s; }
        .cars :global(.tile:hover) { border-color: #B8C2CD; box-shadow: var(--shadow); }
        .cars :global(.tile .car-img) { border-radius: 0; }
        .t-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .t-name { font-weight: 700; font-size: 16.5px; line-height: 1.35; }
        .t-price { font-weight: 600; color: var(--ink-2); }
        .t-meta { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 13px; color: var(--muted); }
        .t-act { margin-top: auto; padding-top: 8px; }
      `}</style>
    </div>
  );
}
