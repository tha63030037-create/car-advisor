"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { CarSummary, getJSON, parseCredit, Photo, useCompare } from "../lib/api";

const NAV = [
  { href: "/advisor", label: "หาคันที่ใช่" },
  { href: "/cars", label: "รถทั้งหมด" },
  { href: "/compare", label: "เทียบรถ" },
  { href: "/how-it-works", label: "ระบบคิดยังไง" },
];

export function SiteHeader() {
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <header className="sh">
      <div className="sh-in">
        <Link href="/" className="sh-logo" aria-label="AI Car Advisor หน้าแรก">
          <span className="sh-mark" aria-hidden>AI</span>
          Car Advisor
        </Link>
        <nav className={`sh-nav ${open ? "open" : ""}`} aria-label="เมนูหลัก">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={path.startsWith(n.href) ? "on" : ""}>{n.label}</Link>
          ))}
        </nav>
        <button className="sh-menu" aria-label="เปิดเมนู" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "✕" : "☰"}</button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="sf">
      <div className="wrap sf-in">
        <p>
          AI Car Advisor เป็นงานค้นคว้าอิสระ หลักสูตร MADT สถาบันบัณฑิตพัฒนบริหารศาสตร์ (NIDA) ราคาเป็นราคาขายปกติอย่างเป็นทางการ ณ พฤศจิกายน 2569
          รูปรถส่วนใหญ่เป็นภาพถ่ายจริงจาก Wikimedia Commons ดัดแปลงโดยตัดพื้นหลัง ชื่อผู้ถ่ายและสัญญาอนุญาตอยู่ใต้รูปแต่ละคัน
        </p>
        <p>
          <Link href="/how-it-works">ระบบคิดยังไง</Link> · <Link href="/feedback">ส่งความเห็น</Link>
        </p>
      </div>
    </footer>
  );
}

export function CarPhoto({ photo, alt, className = "car-img", priority = false }: { photo: Photo; alt: string; className?: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/cars/${photo.file}`}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
    />
  );
}

export function PhotoCredit({ credit }: { credit?: string | null }) {
  const c = parseCredit(credit);
  return c.url
    ? <a className="credit" href={c.url} target="_blank" rel="noreferrer" title={c.full}>{c.text}</a>
    : <span className="credit" title={c.full}>{c.text}</span>;
}

export function Stars({ n, program }: { n: number | null | undefined; program?: string }) {
  if (n === null || n === undefined) return <span className="muted small">ยังไม่มีผลทดสอบ</span>;
  return (
    <span className="stars" aria-label={`${program || "ผลทดสอบชน"} ${n} ดาว จาก 5`}>
      {"★".repeat(n)}<span className="off">{"★".repeat(5 - n)}</span>
    </span>
  );
}

/** "ASEAN NCAP" / "ANCAP 2024" / "Euro NCAP 2025" */
export const crashLabel = (t?: { program: string; year: number | null } | null) => (t ? `${t.program}${t.year ? " " + t.year : ""}` : "");

export function CompareButton({ id, compact = false }: { id: number; compact?: boolean }) {
  const cmp = useCompare();
  const on = cmp.has(id);
  const disabled = !on && cmp.full;
  return (
    <button
      className={`btn btn-s ${on ? "btn-dark" : "btn-ghost"}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); cmp.toggle(id); }}
      disabled={disabled}
      aria-pressed={on}
      title={disabled ? "เทียบได้สูงสุด 3 คัน" : undefined}
    >
      {on ? "✓ อยู่ในรายการเทียบ" : compact ? "+ เทียบ" : "+ เพิ่มเข้าเทียบ"}
    </button>
  );
}

let catalogueCache: CarSummary[] | null = null;
export function useCatalogue() {
  const [cars, setCars] = useState<CarSummary[] | null>(catalogueCache);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (catalogueCache) return;
    getJSON<CarSummary[]>("/api/v2/cars")
      .then((c) => { catalogueCache = c; setCars(c); })
      .catch(() => setErr("โหลดรายการรถไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง"));
  }, []);
  return { cars, err };
}

export function CompareTray() {
  const cmp = useCompare();
  const { cars } = useCatalogue();
  const router = useRouter();
  const path = usePathname() || "";
  if (cmp.ids.length === 0 || path.startsWith("/compare")) return null;
  const picked = cmp.ids.map((id) => cars?.find((c) => c.id === id)).filter(Boolean) as CarSummary[];
  return (
    <div className="tray" role="region" aria-label="รถที่เลือกไว้เทียบ">
      <div className="tray-cars">
        {picked.map((c) => (
          <span key={c.id} className="tray-car">
            <CarPhoto photo={c.photo} alt="" className="" />
            {c.name}
            <button aria-label={`เอา ${c.name} ออก`} onClick={() => cmp.remove(c.id)}>×</button>
          </span>
        ))}
        {cmp.ids.length < 2 && <span className="tray-empty">เลือกอีกอย่างน้อย 1 คันเพื่อเทียบ</span>}
      </div>
      <button className="btn btn-primary" disabled={cmp.ids.length < 2} onClick={() => router.push(`/compare?ids=${cmp.ids.join(",")}`)}>
        เทียบ {cmp.ids.length} คัน
      </button>
    </div>
  );
}
