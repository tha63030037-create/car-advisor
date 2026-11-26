"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ types */
export type Key = "budget" | "lifestyle" | "running_cost" | "safety" | "design";
export type Zone = 3 | 2 | 1;

export interface Photo { file: string; credit?: string | null }

export interface LifestyleDetail {
  lifestyle: string;
  label: string;
  fit: number | null;
  has: string[];
  missing: string[];
  unknown: string[];
}

export interface Result {
  id: number;
  rank: number;
  name: string;
  brand: string;
  price: number;
  bodyType: string;
  fuelType: string;
  seats: number;
  photo: Photo;
  score: number;
  match_label: string;
  criteria: Record<Key, number | null>;
  contribution: Partial<Record<Key, number>>;
  top_criteria: { key: Key; label: string }[];
  over_budget: { amount: number; pct: number; label: string } | null;
  safety_warning?: string | null;
  annual_cost: { energy: number | null; maintenance: number | null; total: number } | null;
  monthly?: { installment: number; pct_of_income: number; level: "comfortable" | "tight" | "over"; label: string; running_per_month: number | null; total_per_month: number; total_pct_of_income: number } | null;
  lifestyle_detail: LifestyleDetail[];
  estimated_fields: string[];
}

export interface RecommendResponse {
  weights_pct: Record<Key, number>;
  /** criteria the user gave no input for (no lifestyle / no body type); left out of every score */
  inactive_criteria?: Key[];
  effective_weights_pct?: Record<Key, number>;
  total_cars: number;
  passed_filters: number;
  results: Result[];
  too_few_results: boolean;
  filter_impact: { filter: string; label: string; removed: number }[];
  near_misses?: { id: number; name: string; price: number; bodyType: string; reason: string }[];
  affordability?: { income: number; comfortable_price: number; max_price: number; budget_installment: number; budget_pct_of_income: number; budget_above_income?: boolean; assumptions: string } | null;
  preference_notes?: { kind: "brand" | "body"; key: string; car_id: number; text: string }[];
}

export interface CarSummary {
  id: number;
  name: string;
  brand: string;
  model: string;
  brand_group: string;
  bodyType: string;
  fuelType: string;
  price: number;
  seats: number;
  horsepower: number;
  airbags: number;
  warrantyYears: number;
  warrantyKm: number;
  photo: Photo;
  asean_ncap_stars: number | null;
  crash_stars?: number | null;
  crash_test?: { program: string; stars: number; year: number | null; url: string; note: string | null } | null;
  photo_is_ai_generated: boolean;
}

export interface CarDetail extends CarSummary {
  consumption: string;
  economy: number | null;
  economy_unit: string | null;
  drivetrain: string | null;
  doors: number | null;
  ground_clearance_mm: number | null;
  cargo_l: number | null;
  has_cargo_bed: boolean | null;
  adas: Record<string, boolean | null> | null;
  maintenance_5y_thb: number | null;
  source: string | null;
  collected_on: string | null;
  estimated: string[] | null;
  transmission: string;
  serviceNetwork: string;
  annual_cost: { energy: number | null; maintenance: number | null; total: number } | null;
  km_per_year: number;
  features_has: string[];
  features_missing: string[];
  lifestyle_fit: Record<string, number | null>;
  safety_warning: string | null;
}

/* -------------------------------------------------------------- constants */
export const CARDS: { key: Key; label: string; short: string; icon: string; hint: string }[] = [
  { key: "budget", label: "งบประมาณ", short: "งบ", icon: "💰", hint: "ราคาอยู่ในงบแค่ไหน" },
  { key: "lifestyle", label: "ไลฟ์สไตล์", short: "ไลฟ์สไตล์", icon: "🧳", hint: "เข้ากับชีวิตประจำวัน" },
  { key: "running_cost", label: "ค่าใช้จ่ายระยะยาว", short: "ค่าใช้จ่าย", icon: "⛽", hint: "ค่าน้ำมันหรือค่าไฟ และค่าซ่อมบำรุง" },
  { key: "safety", label: "ความปลอดภัย", short: "ปลอดภัย", icon: "🛡️", hint: "ผลทดสอบชน ถุงลม ระบบช่วยขับ" },
  { key: "design", label: "รูปทรงดีไซน์", short: "ดีไซน์", icon: "✨", hint: "ตรงทรงที่ชอบ" },
];

export const CRIT_COLOR: Record<Key, string> = {
  budget: "#D8930F",
  lifestyle: "#0F9D74",
  running_cost: "#2A7FD4",
  safety: "#6D4AD6",
  design: "#D9467A",
};

export const FUEL_TH: Record<string, string> = { petrol: "เบนซิน", diesel: "ดีเซล", hybrid: "ไฮบริด", ev: "ไฟฟ้า" };
export const BODY_TH: Record<string, string> = {
  sedan: "ซีดาน", hatchback: "แฮทช์แบ็ก", suv: "SUV", ppv: "PPV", mpv: "MPV / รถตู้", pickup: "กระบะ", coupe: "คูเป้",
};
export const ADAS_TH: Record<string, string> = {
  aeb: "เบรกฉุกเฉินอัตโนมัติ",
  lane_assist: "ช่วยรักษาเลน",
  adaptive_cruise: "ครูซคอนโทรลแบบปรับระยะ",
  parking_sensors: "เซ็นเซอร์ช่วยจอด",
  camera_360: "กล้องรอบคัน 360 องศา",
};

export const baht = (n: number) => n.toLocaleString("th-TH");

export function apiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const local = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return local ? "http://127.0.0.1:8000" : "/api/backend";
}

export async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const postJSON = <T,>(path: string, body: unknown) =>
  getJSON<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

/* ------------------------------------------------- per-viewer browser state */
function readStore<T>(k: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStore(k: string, v: unknown) {
  try { window.localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ }
}

const COMPARE_KEY = "car-advisor:compare";
const COMPARE_EVENT = "car-advisor:compare-changed";
export const COMPARE_MAX = 3;

/** Up to 3 cars picked for side-by-side comparison, shared across pages. */
export function useCompare() {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    const sync = () => setIds(readStore<number[]>(COMPARE_KEY, []));
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const save = (next: number[]) => {
    writeStore(COMPARE_KEY, next);
    setIds(next);
    window.dispatchEvent(new Event(COMPARE_EVENT));
  };
  return {
    ids,
    has: (id: number) => ids.includes(id),
    toggle: (id: number) => save(ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= COMPARE_MAX ? ids : [...ids, id]),
    remove: (id: number) => save(ids.filter((x) => x !== id)),
    clear: () => save([]),
    setAll: (next: number[]) => save(Array.from(new Set(next)).slice(0, COMPARE_MAX)),
    full: ids.length >= COMPARE_MAX,
  };
}

const CRITERIA_KEY = "car-advisor:last-criteria";
export const saveLastCriteria = (c: unknown) => writeStore(CRITERIA_KEY, c);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loadLastCriteria = (): any | null => (typeof window === "undefined" ? null : readStore(CRITERIA_KEY, null));

/** Short, one-line photo credit from the stored "ภาพ: <author> / Wikimedia Commons (<licence>) · …|<url>" string. */
export function parseCredit(credit?: string | null): { text: string; full: string; url?: string; ai: boolean } {
  if (credit && credit.includes("Wikimedia")) {
    const [full, url] = credit.split("|");
    const m = full.match(/^ภาพ: (.*?) \/ Wikimedia Commons \(([^)]+)\)/);
    return { text: m ? `ภาพ ${m[1]} · ${m[2]}` : full, full, url, ai: false };
  }
  return { text: "ภาพประกอบจาก AI", full: "ภาพประกอบที่สร้างด้วย AI เพราะยังไม่มีภาพถ่ายโฉมที่ขายในไทยที่ใช้ได้ฟรี", ai: true };
}
