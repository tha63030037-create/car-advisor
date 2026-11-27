"use client";

import React, { useEffect, useState } from "react";
import { getJSON } from "../lib/api";

interface Thread { id: string; title: string; date: string | null; when: string | null; comments: number | null; url: string; themes: string[] }
interface Reviews {
  found: boolean; fetched?: string; tag?: string; tag_url?: string; exact_tag?: boolean; search_url: string;
  count?: number; last_year?: number; themes: { key: string; label: string; count: number }[]; threads: Thread[];
}
interface Checklist { name: string; engine: string; sections: { key: string; title: string; items: string[] }[] }

const thDate = (iso: string | null, raw: string | null) => {
  if (!iso) return raw || "";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

/** Recent Pantip threads about this model: titles and links only, refreshed weekly. */
export function OwnerVoices({ id, name }: { id: number; name: string }) {
  const [d, setD] = useState<Reviews | null>(null);
  const [theme, setTheme] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  useEffect(() => { getJSON<Reviews>(`/api/v2/cars/${id}/reviews`).then(setD).catch(() => setD(null)); }, [id]);
  if (!d) return null;
  const list = d.threads.filter((t) => !theme || t.themes.includes(theme));
  const shown = all ? list : list.slice(0, 6);
  return (
    <section className="panel ov" id="voices">
      <div className="ov-head">
        <h2 className="h2">เสียงจากผู้ใช้จริงใน Pantip</h2>
        {d.fetched && <span className="muted small">อัปเดตทุกสัปดาห์ · ล่าสุด {thDate(d.fetched, null)}</span>}
      </div>
      {!d.found ? (
        <p className="muted">
          ยังไม่พบกระทู้ที่ติดแท็กรุ่นนี้ในหน้าแท็กของ Pantip{" "}
          <a href={d.search_url} target="_blank" rel="noreferrer" className="link">ค้นหา {name} ใน Pantip</a>
        </p>
      ) : (
        <>
          <p className="muted small ov-sub">
            {d.count} กระทู้ล่าสุด{d.exact_tag ? ` จากแท็ก "${d.tag}"` : ` ที่ชื่อกระทู้พูดถึง ${name} (จากแท็ก "${d.tag}")`} · {d.last_year} กระทู้ในปีที่ผ่านมา ·
            เราเก็บเฉพาะชื่อกระทู้และลิงก์ จัดหมวดจากคำในชื่อกระทู้ กดอ่านเนื้อหาเต็มที่ Pantip
          </p>
          {d.themes.length > 0 && (
            <div className="chips ov-themes" role="group" aria-label="กรองตามหัวข้อ">
              <button className={`chip ${!theme ? "on" : ""}`} onClick={() => setTheme(null)}>ทั้งหมด {d.count}</button>
              {d.themes.map((t) => (
                <button key={t.key} className={`chip ${theme === t.key ? "on" : ""}`} onClick={() => setTheme(theme === t.key ? null : t.key)}>
                  {t.label} {t.count}
                </button>
              ))}
            </div>
          )}
          <ul className="threads">
            {shown.map((t) => (
              <li key={t.id}>
                <a href={t.url} target="_blank" rel="noreferrer">{t.title}</a>
                <span className="muted small num">{thDate(t.date, t.when)}{t.comments !== null ? ` · ${t.comments} ความเห็น` : ""}</span>
              </li>
            ))}
          </ul>
          <div className="ov-foot">
            {list.length > 6 && <button className="link" onClick={() => setAll(!all)}>{all ? "แสดงน้อยลง" : `ดูทั้งหมด ${list.length} กระทู้`}</button>}
            {d.tag_url && <a href={d.tag_url} target="_blank" rel="noreferrer" className="link">เปิดแท็กนี้ใน Pantip</a>}
          </div>
        </>
      )}
      <style jsx>{`
        .ov-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .ov-sub { margin: 0 0 12px; }
        .ov-themes { margin-bottom: 10px; }
        .threads { list-style: none; padding: 0; margin: 0; }
        .threads li { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--line-soft); align-items: baseline; }
        .threads li:last-child { border-bottom: 0; }
        .threads a { color: var(--ink); text-decoration: none; font-weight: 500; }
        .threads a:hover { text-decoration: underline; }
        .threads .small { white-space: nowrap; }
        @media (max-width: 600px) { .threads li { flex-direction: column; gap: 2px; } }
        .ov-foot { display: flex; gap: 18px; margin-top: 10px; font-size: 14.5px; }
      `}</style>
    </section>
  );
}

/** What to ask, what to try and what not to pay before visiting a showroom. Ticks stay on this device. */
export function ShowroomPrep({ id, budget }: { id: number; budget?: number | null }) {
  const [d, setD] = useState<Checklist | null>(null);
  const [err, setErr] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const key = `car-advisor:prep:${id}`;
  useEffect(() => {
    getJSON<Checklist>(`/api/v2/cars/${id}/checklist${budget ? `?budget=${budget}` : ""}`).then(setD).catch(() => setErr(true));
    try { setDone(JSON.parse(localStorage.getItem(key) || "{}")); } catch { /* storage unavailable */ }
  }, [id, budget, key]);
  const toggle = (k: string) => {
    const n = { ...done, [k]: !done[k] };
    setDone(n);
    try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* storage unavailable */ }
  };
  if (err) return null;
  const total = d ? d.sections.reduce((s, x) => s + x.items.length, 0) : 0;
  const ticked = Object.values(done).filter(Boolean).length;
  return (
    <section className="panel prep" id="prep">
      <div className="prep-head">
        <h2 className="h2">เตรียมตัวก่อนไปโชว์รูม</h2>
        {d && <span className="muted small num">เช็กแล้ว {Math.min(ticked, total)}/{total}</span>}
      </div>
      <p className="muted small" style={{ margin: "0 0 12px" }}>เข้าโชว์รูมพร้อมคำถาม จะได้ไม่ถูกเร่งให้ตัดสินใจหรือจ่ายเกินงบ ติ๊กเก็บไว้ได้ ระบบจำไว้ในเครื่องนี้</p>
      {!d && <div className="skeleton" style={{ height: 160 }} />}
      {d && (
        <div className="prep-grid">
          {d.sections.map((s) => (
            <div key={s.key} className={`prep-sec ${s.key}`}>
              <h3 className="h3">{s.title}</h3>
              <ul>
                {s.items.map((it, i) => {
                  const k = `${s.key}:${i}`;
                  return (
                    <li key={k}>
                      <label>
                        <input type="checkbox" checked={!!done[k]} onChange={() => toggle(k)} />
                        <span className={done[k] ? "done" : ""}>{it}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
      {d && <button className="btn btn-ghost btn-s no-print" onClick={() => window.print()}>พิมพ์หรือบันทึกเป็น PDF</button>}
      <style jsx>{`
        .prep-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
        .prep-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 28px; margin-bottom: 14px; }
        @media (max-width: 800px) { .prep-grid { grid-template-columns: 1fr; } }
        .prep-sec.tips { grid-column: 1 / -1; background: var(--accent-wash); border-radius: 14px; padding: 12px 14px; }
        .prep-sec ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
        .prep-sec label { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; font-size: 14.5px; line-height: 1.55; }
        .prep-sec input { margin-top: 4px; width: 17px; height: 17px; accent-color: var(--accent); flex: none; }
        .done { color: var(--muted); text-decoration: line-through; }
        @media print { .no-print { display: none; } }
      `}</style>
    </section>
  );
}
