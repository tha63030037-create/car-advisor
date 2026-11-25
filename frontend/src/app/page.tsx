"use client";

import React, { useState, useEffect } from "react";
import { CarConfiguratorModal } from "./CarConfiguratorModal";
import { CarCardColorBar } from "./CarCardColorBar";
import { CarColorOption } from "./carColors";
import Link from "next/link";
import { RecommendationRating } from "./components/RecommendationRating";
import { UnclearQuestionButton } from "./components/UnclearQuestionButton";
import { submitFullFeedback } from "./lib/feedbackApi";



// --- TYPES ---
interface CarPhoto {
  file: string;
  credit: string | null;
}

interface Car {
  id: number;
  name: string;
  bodyType: string;
  fuelType: string;
  price: number;
  consumption: string;
  seats: number;
  lifestyle: string[];
  serviceNetwork: string;
  nationality: string;
  transmission: string;
  horsepower: number;
  warrantyYears: number;
  warrantyKm: number;
  airbags: number;
  photo: CarPhoto;
}

interface TCOBreakdown {
  insurance5yr: number;
  maint5yr: number;
  resaleValue: number;
  total5yr: number;
}

interface RangeInfo {
  type: string;
  range: number | null;
  tankSize: number | null;
  range100: number | null;
  range80: number | null;
}

interface RiskNote {
  icon: string;
  text: string;
}

interface Review {
  author: string;
  rating: number;
  text: string;
  source?: string;
  title?: string;
  link?: string;
  is_live?: boolean;
}

interface Complaint {
  issue: string;
  frequency: string;
  source?: string;
}

interface RecommendationResult {
  car: Car;
  score: number;
  reasons: string[];
  tco: TCOBreakdown;
  monthlyInstallment: number;
  affordabilityRatio: number;
  affordabilityLabel: string;
  affordabilityCls: string;
  rangeInfo: RangeInfo;
  riskNotes: RiskNote[];
  reviews: Review[];
  complaints: Complaint[];
}

// --- LABELS & CONSTANTS ---
const LIFESTYLE_LABEL: Record<string, string> = {
  city: "ขับในเมือง",
  family: "ครอบครัว",
  business: "วิ่งงาน/ต่างจังหวัด",
  adventure: "สายลุย",
  firstCar: "รถคันแรก",
};

const BODYTYPE_LABEL: Record<string, string> = {
  hatchback: "Hatchback",
  sedan: "Sedan",
  coupe: "Coupe",
  suv: "SUV/Crossover",
  ppv: "PPV 7 ที่นั่ง",
  mpv: "รถตู้/MPV",
  pickup: "กระบะ",
};

const FUEL_LABEL: Record<string, string> = {
  petrol: "เบนซิน",
  diesel: "ดีเซล",
  hybrid: "ไฮบริด",
  ev: "ไฟฟ้า",
};

const NATIONALITY_FLAG: Record<string, string> = {
  japan: "🇯🇵",
  korea: "🇰🇷",
  china: "🇨🇳",
  other: "🌍",
};

// --- CAR ART VECTORS ---
const CAR_ART: Record<string, (c: Record<string, string>) => string> = {
  hatchback: (c) => `
    <rect x="25" y="58" width="150" height="20" rx="10" fill="${c.body}" />
    <polygon points="55,58 68,32 125,30 145,42 155,58" fill="${c.cabin}" />
    <polygon points="72,52 80,38 118,36 130,46 132,52" fill="${c.glass}" opacity="0.9" />
    <circle cx="60" cy="86" r="14" fill="${c.wheel}" /><circle cx="60" cy="86" r="6" fill="${c.hub}" />
    <circle cx="155" cy="86" r="14" fill="${c.wheel}" /><circle cx="155" cy="86" r="6" fill="${c.hub}" />
  `,
  sedan: (c) => `
    <rect x="12" y="60" width="180" height="18" rx="8" fill="${c.body}" />
    <polygon points="42,60 56,34 112,32 130,40 145,48 180,50 180,60" fill="${c.cabin}" />
    <polygon points="60,54 68,40 106,38 120,46 128,54" fill="${c.glass}" opacity="0.9" />
    <circle cx="55" cy="86" r="14" fill="${c.wheel}" /><circle cx="55" cy="86" r="6" fill="${c.hub}" />
    <circle cx="165" cy="86" r="14" fill="${c.wheel}" /><circle cx="165" cy="86" r="6" fill="${c.hub}" />
  `,
  coupe: (c) => `
    <rect x="12" y="44" width="176" height="28" rx="10" fill="${c.body}" />
    <polygon points="50,44 68,22 138,20 162,34 172,44" fill="${c.cabin}" />
    <polygon points="72,38 80,26 128,24 148,34 152,38" fill="${c.glass}" opacity="0.9" />
    <circle cx="52" cy="74" r="16" fill="${c.wheel}" /><circle cx="52" cy="74" r="7" fill="${c.hub}" />
    <circle cx="160" cy="74" r="16" fill="${c.wheel}" /><circle cx="160" cy="74" r="7" fill="${c.hub}" />
  `,
  suv: (c) => `
    <rect x="16" y="46" width="166" height="30" rx="12" fill="${c.body}" />
    <polygon points="34,46 48,22 152,22 168,36 178,46" fill="${c.cabin}" />
    <polygon points="52,40 60,28 145,28 158,38 160,40" fill="${c.glass}" opacity="0.9" />
    <circle cx="55" cy="88" r="15" fill="${c.wheel}" /><circle cx="55" cy="88" r="6.5" fill="${c.hub}" />
    <circle cx="160" cy="88" r="15" fill="${c.wheel}" /><circle cx="160" cy="88" r="6.5" fill="${c.hub}" />
  `,
  ppv: (c) => `
    <rect x="14" y="44" width="172" height="32" rx="10" fill="${c.body}" />
    <polygon points="32,44 46,20 148,20 172,34 178,44" fill="${c.cabin}" />
    <polygon points="50,38 58,26 142,26 160,36 162,38" fill="${c.glass}" opacity="0.9" />
    <circle cx="56" cy="86" r="15.5" fill="${c.wheel}" /><circle cx="56" cy="86" r="6.5" fill="${c.hub}" />
    <circle cx="162" cy="86" r="15.5" fill="${c.wheel}" /><circle cx="162" cy="86" r="6.5" fill="${c.hub}" />
  `,
  mpv: (c) => `
    <rect x="20" y="20" width="158" height="58" rx="16" fill="${c.body}" />
    <rect x="38" y="32" width="122" height="22" rx="8" fill="${c.glass}" opacity="0.85" />
    <line x1="118" y1="34" x2="118" y2="70" stroke="${c.cabin}" stroke-width="3" />
    <circle cx="55" cy="86" r="14" fill="${c.wheel}" /><circle cx="55" cy="86" r="6" fill="${c.hub}" />
    <circle cx="163" cy="86" r="14" fill="${c.wheel}" /><circle cx="163" cy="86" r="6" fill="${c.hub}" />
  `,
  pickup: (c) => `
    <rect x="12" y="52" width="176" height="26" rx="8" fill="${c.body}" />
    <polygon points="38,52 52,26 116,24 136,36 142,52" fill="${c.cabin}" />
    <polygon points="56,46 64,32 110,30 124,40 128,46" fill="${c.glass}" opacity="0.9" />
    <line x1="138" y1="28" x2="182" y2="28" stroke="${c.body}" stroke-width="4" />
    <circle cx="54" cy="86" r="15" fill="${c.wheel}" /><circle cx="54" cy="86" r="6.5" fill="${c.hub}" />
    <circle cx="158" cy="86" r="15" fill="${c.wheel}" /><circle cx="158" cy="86" r="6.5" fill="${c.hub}" />
  `,
};

const OFFICIAL_CAR_PHOTOS: Record<string, string> = {
  "Toyota Yaris Ativ": "/cars/01-toyota-yaris-ativ.png",
  "Toyota Yaris": "/cars/02-toyota-yaris.png",
  "Toyota Yaris Cross": "/cars/03-toyota-yaris-cross.jpg",
  "Toyota Corolla Altis": "/cars/04-toyota-corolla-altis.jpg",
  "Toyota Corolla Cross": "/cars/05-toyota-corolla-cross.jpg",
  "Toyota Corolla Cross Hybrid": "/cars/06-toyota-corolla-cross-hybrid.jpg",
  "Toyota Camry Hybrid": "/cars/07-toyota-camry-hybrid.jpg",
  "Toyota Veloz": "/cars/08-toyota-veloz.jpg",
  "Tesla Model 3": "/cars/09-tesla-model-3.jpg",
  "Toyota Innova Zenix": "/cars/10-toyota-innova-zenix.jpg",
  "Toyota Innova Zenix Hybrid": "/cars/11-toyota-innova-zenix-hybrid.jpg",
  "Toyota Fortuner": "/cars/12-toyota-fortuner.jpg",
  "Toyota Fortuner Legender": "/cars/13-toyota-fortuner-legender.jpg",
  "Toyota Hilux Revo Standard Cab": "/cars/14-toyota-hilux-revo-standard-cab.jpg",
  "Toyota Hilux Revo Double Cab": "/cars/15-toyota-hilux-revo-double-cab.jpg",
  "Toyota Hilux Revo Rocco": "/cars/16-toyota-hilux-revo-rocco.jpg",
  "Toyota Hilux Champ": "/cars/17-toyota-hilux-champ.jpg",
  "Toyota GR86": "/cars/18-toyota-gr86.jpg",
  "Toyota GR Yaris": "/cars/19-toyota-gr-yaris.jpg",
  "Tesla Model Y": "/cars/20-tesla-model-y.jpg",
  "Toyota Alphard Hybrid": "/cars/21-toyota-alphard-hybrid.jpg",
  "Honda City": "/cars/22-honda-city.jpg",
  "Honda City Hatchback": "/cars/23-honda-city-hatchback.jpg",
  "Honda City e:HEV": "/cars/24-honda-city-ehev.jpg",
  "Honda Civic": "/cars/25-honda-civic.jpg",
  "Honda Civic Hatchback RS": "/cars/26-honda-civic-hatchback-rs.jpg",
  "Honda Civic Type R": "/cars/27-honda-civic-type-r.jpg",
  "Honda HR-V": "/cars/28-honda-hr-v.jpg",
  "Honda HR-V e:HEV": "/cars/29-honda-hr-v-ehev.jpg",
  "Honda CR-V": "/cars/30-honda-cr-v.jpg",
  "Honda CR-V e:HEV": "/cars/31-honda-cr-v-ehev.jpg",
  "Honda BR-V": "/cars/32-honda-br-v.jpg",
  "Honda WR-V": "/cars/33-honda-wr-v.jpg",
  "Honda Accord": "/cars/34-honda-accord.jpg",
  "Honda City Hatchback e:HEV RS": "/cars/35-honda-city-hatchback-ehev.jpg",
  "Mazda2 Hatchback": "/cars/36-mazda2-hatchback.jpg",
  "Mazda2 Sedan": "/cars/37-mazda2-sedan.jpg",
  "Mazda3": "/cars/38-mazda3.jpg",
  "Mazda CX-3": "/cars/39-mazda-cx-3.jpg",
  "Mazda CX-30": "/cars/40-mazda-cx-30.jpg",
  "Mazda CX-5": "/cars/41-mazda-cx-5.jpg",
  "Mazda CX-8": "/cars/42-mazda-cx-8.jpg",
  "Mazda CX-60": "/cars/43-mazda-cx-60.jpg",
  "Mazda BT-50": "/cars/44-mazda-bt-50.jpg",
  "Mazda MX-5": "/cars/45-mazda-mx-5.jpg",
  "Nissan Almera": "/cars/46-nissan-almera.jpg",
  "Nissan Almera Turbo": "/cars/47-nissan-almera-turbo.jpg",
  "Nissan Kicks e-Power": "/cars/48-nissan-kicks-e-power.jpg",
  "Nissan Navara": "/cars/49-nissan-navara.jpg",
  "Nissan Terra": "/cars/50-nissan-terra.jpg",
  "BYD M6": "/cars/51-byd-m6.jpg",
  "Nissan Serena e-Power": "/cars/52-nissan-serena-e-power.jpg",
  "Isuzu D-Max Standard Cab": "/cars/53-isuzu-d-max-standard-cab.jpg",
  "Isuzu D-Max V-Cross": "/cars/54-isuzu-d-max-v-cross.jpg",
  "Isuzu MU-X": "/cars/55-isuzu-mu-x.jpg",
  "Mitsubishi Triton": "/cars/56-mitsubishi-triton.jpg",
  "Mitsubishi Triton Athlete": "/cars/57-mitsubishi-triton-athlete.jpg",
  "Mitsubishi Pajero Sport": "/cars/58-mitsubishi-pajero-sport.jpg",
  "Mitsubishi Xpander": "/cars/59-mitsubishi-xpander.jpg",
  "Mitsubishi Xpander Cross": "/cars/60-mitsubishi-xpander-cross.jpg",
  "Mitsubishi Attrage": "/cars/61-mitsubishi-attrage.jpg",
  "Changan Lumin": "/cars/62-changan-lumin.jpg",
  "Suzuki Swift": "/cars/63-suzuki-swift.jpg",
  "Suzuki Ertiga": "/cars/64-suzuki-ertiga.jpg",
  "Suzuki XL7": "/cars/65-suzuki-xl7.jpg",
  "Suzuki Jimny": "/cars/66-suzuki-jimny.jpg",
  "Deepal L07": "/cars/67-deepal-l07.jpg",
  "Subaru Forester": "/cars/68-subaru-forester.jpg",
  "Hyundai Creta": "/cars/69-hyundai-creta.jpg",
  "Hyundai Stargazer": "/cars/70-hyundai-stargazer.jpg",
  "Kia EV5": "/cars/71-kia-ev5.jpg",
  "Kia EV9": "/cars/72-kia-ev9.jpg",
  "MG3": "/cars/73-mg3.jpg",
  "MG3 Hybrid+": "/cars/74-mg3-hybrid.jpg",
  "MG5": "/cars/75-mg5.jpg",
  "MG ZS": "/cars/76-mg-zs.jpg",
  "MG ZS EV": "/cars/77-mg-zs-ev.jpg",
  "MG4 Electric": "/cars/78-mg4-electric.jpg",
  "MG HS": "/cars/79-mg-hs.jpg",
  "MG Extender": "/cars/80-mg-extender.jpg",
  "MG Cyberster": "/cars/81-mg-cyberster.jpg",
  "BYD Dolphin": "/cars/82-byd-dolphin.jpg",
  "BYD Atto 3": "/cars/83-byd-atto-3.jpg",
  "BYD Seal": "/cars/84-byd-seal.jpg",
  "BYD Sealion 6": "/cars/85-byd-sealion-6.jpg",
  "AVATR 11": "/cars/86-avatr-11.jpg",
  "GWM Haval H6": "/cars/87-gwm-haval-h6.jpg",
  "GWM Haval H6 HEV": "/cars/88-gwm-haval-h6-hev.jpg",
  "GWM Haval Jolion": "/cars/89-gwm-haval-jolion.jpg",
  "GWM ORA Good Cat": "/cars/90-gwm-ora-good-cat.jpg",
  "GWM Tank 300": "/cars/91-gwm-tank-300.jpg",
  "Changan Deepal S07": "/cars/92-changan-deepal-s07.jpg",
  "Zeekr X": "/cars/93-zeekr-x.jpg",
  "Neta V": "/cars/94-neta-v.jpg",
  "Neta X": "/cars/95-neta-x.jpg",
  "GAC Aion Y": "/cars/96-gac-aion-y.jpg",
  "GAC Aion V": "/cars/97-gac-aion-v.jpg",
  "Ford Everest": "/cars/98-ford-everest.jpg",
  "Ford Ranger": "/cars/99-ford-ranger.jpg",
  "Ford Ranger Raptor": "/cars/100-ford-ranger-raptor.jpg",
  "Volvo XC40": "/cars/101-volvo-xc40.jpg",
  "Volvo XC60": "/cars/102-volvo-xc60.jpg",
  "Peugeot 2008": "/cars/103-peugeot-2008.jpg",
  "BMW 218 Gran Coupe": "/cars/104-bmw-218-gran-coupe.jpg",
  "Subaru BRZ": "/cars/105-subaru-brz.jpg",
  "Toyota GR Corolla": "/cars/106-toyota-gr-corolla.jpg",
  "Mazda MX-5 Roadster": "/cars/107-mazda-mx5.jpg",
  "Zeekr 009": "/cars/108-zeekr-009.jpg",
  "Kia EV6": "/cars/109-kia-ev6.jpg",
  "Hyundai Ioniq 5": "/cars/110-hyundai-ioniq-5.jpg",
  "Riddara RD6": "/cars/111-riddara-rd6.jpg",
  "Subaru Crosstrek": "/cars/112-subaru-crosstrek.jpg",
  "GWM Tank 500 HEV": "/cars/113-gwm-tank-500.jpg",
  "BYD Sealion 7": "/cars/114-byd-sealion-7.jpg",
  "BYD Seal U DM-i": "/cars/115-byd-seal-u.jpg",
  "MG Maxus 7": "/cars/116-mg-maxus-7.jpg",
  "MG Maxus 9": "/cars/117-mg-maxus-9.jpg",
  "XPENG G6": "/cars/118-xpeng-g6.jpg",
  "Hyptec HT": "/cars/119-hyptec-ht.jpg",
  "GWM ORA 07": "/cars/120-gwm-ora-07.jpg",
  "GWM Poer Sahar HEV": "/cars/121-gwm-poer-sahar.jpg",
  "Hyundai Staria": "/cars/122-hyundai-staria.jpg",
  "Kia Carnival": "/cars/123-kia-carnival.jpg",
  "Hyundai Santa Fe Hybrid": "/cars/124-hyundai-santa-fe-hybrid.jpg",
  "Volvo EX30": "/cars/125-volvo-ex30.jpg",
};

const WIKI_OVERRIDE_CACHE = OFFICIAL_CAR_PHOTOS;
const runtimeImageCache: Record<string, string> = { ...OFFICIAL_CAR_PHOTOS };

function formatBaht(n: number): string {
  return Math.round(n).toLocaleString("th-TH") + " บาท";
}

function getTransmissionOptions(car: Car): string {
  const nameLower = car.name.toLowerCase();
  const hasBoth = 
    car.bodyType === "pickup" ||
    nameLower.includes("swift") ||
    nameLower.includes("march") ||
    nameLower.includes("brio") ||
    nameLower.includes("almera") ||
    nameLower.includes("attrage") ||
    nameLower.includes("mirage") ||
    nameLower.includes("yaris") ||
    nameLower.includes("jimny") ||
    nameLower.includes("brz") ||
    nameLower.includes("gr86") ||
    nameLower.includes("mx-5") ||
    nameLower.includes("mx5") ||
    nameLower.includes("type r");
    
  if (hasBoth) {
    return "มีให้เลือกทั้งเกียร์ออโต้ (อัตโนมัติ) และเกียร์กระปุก (ธรรมดา)";
  }
  
  return car.transmission === "auto" ? "เกียร์อัตโนมัติ (ออโต้)" : "เกียร์ธรรมดา (กระปุก)";
}

// Generate specs sheet content dynamically
function generateCarDetails(car: Car) {
  const transText = getTransmissionOptions(car);
  let intro = "";
  let highlights: string[] = [];
  let colors: string[] = [];
  let specs = "";
  let exterior: string[] = [];
  let interior: string[] = [];
  let safety: string[] = [];

  if (car.name.includes("BRZ") || car.name.includes("GR86")) {
    intro = `รถสปอร์ตคูเป้เครื่องยนต์ Boxer วางหน้า ขับเคลื่อนล้อหลัง (FR Layout) ที่เกิดจากความร่วมมือของ Subaru และ Toyota ให้ความสนุกเร้าใจสไตล์สปอร์ตพันธุ์แท้`;
    highlights = [
      "จุดศูนย์ถ่วงเครื่องยนต์ต่ำเป็นพิเศษ (Boxer Engine) ให้การเกาะโค้งที่สมดุลยอดเยี่ยม",
      "การกระจายน้ำหนักหน้า-หลังดีเยี่ยม ขับสนุก ควบคุมง่าย ตอบสนองรวดเร็วทันใจ",
      "มีให้เลือกทั้งระบบเกียร์ธรรมดา 6 สปีดดิบ ๆ และเกียร์อัตโนมัติพร้อม Paddle Shift"
    ];
    colors = car.name.includes("BRZ") 
      ? ["🔵 WR Blue Pearl (น้ำเงินสปอร์ต)", "⚪ Crystal White Pearl (ขาว)", "⚫ Crystal Black Silica (ดำ)", "🩶 Magnetite Gray Metallic (เทาเข้ม)"]
      : ["🔴 Ignition Red (แดงสปอร์ต)", "⚪ White Liquid (ขาว)", "⚫ Raven Black (ดำ)", "🩶 Magnetic Gray (เทา)"];
    specs = `เครื่องยนต์เบนซิน 4 สูบนอน Boxer D-4S ขนาด 2.4 ลิตร, พละกำลังสูงสุด ${car.horsepower} แรงม้า, ระบบส่งกำลัง: ${transText}`;
    exterior = [
      "ไฟหน้า LED อัจฉริยะปรับทิศทางตามวงเลี้ยวโค้ง (SRH)",
      "ช่องระบายอากาศซุ้มล้อหน้าช่วยจัดระเบียบทิศทางลมขณะขับขี่ความเร็วสูง",
      "ล้ออัลลอยสปอร์ตสีดำด้านขนาด 18 นิ้วลายสิบก้านน้ำหนักเบาพิเศษ"
    ];
    interior = [
      "เบาะนั่งกึ่งหนังแท้และ Alcantara ตกแต่งด้วยด้ายสีแดงเพิ่มอารมณ์สปอร์ต",
      "หน้าจออินโฟเทนเมนต์แบบสัมผัสขนาด 8 นิ้ว รองรับ Apple CarPlay และ Android Auto",
      "มาตรวัดดิจิทัล TFT ขนาด 7 นิ้วพร้อมโหมดสนามแข่ง Track Mode แสดงกราฟแรงเหวี่ยง G-Force"
    ];
    safety = [
      "ระบบความปลอดภัยอัจฉริยะ Subaru EyeSight / Toyota Safety Sense เจเนอเรชันล่าสุด",
      "ระบบเตือนมุมอับสายตาด้านข้าง (BSD) และเตือนขณะถอยจอดรถ (RCTA)",
      "ระบบควบคุมการทรงตัว VDC ปรับแต่งความไวได้ 5 ระดับพร้อม Track Mode"
    ];
    return { intro, highlights, colors, specs, exterior, interior, safety };
  }

  let fuelEngine = "";
  if (car.fuelType === "ev") {
    fuelEngine = "มอเตอร์ไฟฟ้ากระแสสลับ PMSM แบตเตอรี่ Lithium Iron Phosphate (LFP)";
  } else if (car.fuelType === "hybrid") {
    fuelEngine = `เครื่องยนต์เบนซิน Atkinson Cycle ทำงานคู่กับมอเตอร์ไฟฟ้าไฮบริด`;
  } else if (car.fuelType === "diesel") {
    fuelEngine = `เครื่องยนต์ดีเซล Commonrail Direct Injection พร้อมระบบอัดอากาศเทอร์โบแปรผัน`;
  } else {
    fuelEngine = `เครื่องยนต์เบนซิน DOHC 4 สูบแถวเรียง DOHC 16 วาล์ว`;
  }

  if (car.bodyType === "sedan" || car.bodyType === "hatchback") {
    intro = `รถยนต์นั่งส่วนบุคคลขนาดเล็กแบบ ${BODYTYPE_LABEL[car.bodyType]} เหมาะอย่างยิ่งสำหรับการใช้งานทั่วไป ประหยัดน้ำมัน คล่องตัว คุ้มราคา`;
    highlights = [
      `อัตราประหยัดน้ำมันยอดเยี่ยมถึง ${car.consumption} ขับง่ายจ่ายสบาย`,
      "วงเลี้ยวแคบ ควบคุมง่าย ลัดเลาะในเมืองได้อย่างสะดวกสบาย",
      "มีระบบความบันเทิงครบครัน รองรับเชื่อมต่อสมาร์ทโฟนเต็มระบบ"
    ];
    colors = ["⚪ Platinum White Pearl (ขาว)", "⚫ Attitude Black Mica (ดำ)", "🩶 Gray Metallic (เทา)", "🔴 Red Mica (แดง)"];
    specs = `${fuelEngine}, พละกำลังสูงสุด ${car.horsepower} แรงม้า, เกียร์${transText}`;
    exterior = [
      "ระบบไฟส่องสว่างหน้าแบบ LED ดีไซน์โฉบเฉี่ยวพร้อมปรับระดับความสูงอัตโนมัติ",
      "กระจกมองข้างปรับและพับไฟฟ้าพร้อมไฟเลี้ยว LED ในตัว",
      "ล้ออัลลอยทูโทนน้ำหนักเบาขนาด 15-16 นิ้ว"
    ];
    interior = [
      "พวงมาลัยมัลติฟังก์ชันหุ้มหนังจับถนัดมือพร้อมปุ่มควบคุมเสียง",
      "หน้าจอสัมผัสระบบ Infotainment ขนาด 8-9 นิ้ว รองรับ Apple CarPlay/Android Auto",
      "เบาะหนังดีไซน์สปอร์ตโอบกระชับ สบายตลอดการเดินทาง"
    ];
    safety = [
      `ถุงลมนิรภัยนิรภัย SRS ${car.airbags || 6} จุดรอบคัน`,
      "ระบบควบคุมการทรงตัวอัจฉริยะ (VSC) และควบคุมล้อหมุนฟรี (TRC)",
      "กล้องมองภาพด้านหลังขณะถอยจอดพร้อมเส้นกะระยะเรเดียน"
    ];
  } else if (car.bodyType === "suv" || car.bodyType === "ppv") {
    intro = `รถอเนกประสงค์ขนาดใหญ่แบบ ${BODYTYPE_LABEL[car.bodyType]} ขนของจุใจ ลุยน้ำท่วมลุยทางขรุขระสบาย เหมาะสำหรับการเดินทางของครอบครัวยุคใหม่`;
    highlights = [
      "ทัศนวิสัยกว้างไกลกว่ารถเก๋งทั่วไป ปลอดภัย มั่นใจทุกเส้นทาง",
      "พื้นที่ห้องโดยสารกว้างขวาง เบาะหลังพับราบเพิ่มพื้นที่สัมภาระได้เต็มรูปแบบ",
      `สมรรถนะการตอบสนองดีเยี่ยมด้วยขุมพลัง ${car.horsepower} แรงม้า`
    ];
    colors = ["⚪ Pearl White (ขาว)", "⚫ Phantom Black (ดำ)", "🩶 Silver Metallic (เงิน)", "🤎 Bronze Brown (น้ำตาล)"];
    specs = `${fuelEngine}, แรงม้าสูงสุด ${car.horsepower} แรงม้า, เกียร์${transText} ตอบสนองฉับไว`;
    exterior = [
      "กระจกหน้าต่างแถวสองตัดแสงสะท้อนและกันความร้อนดีเยี่ยม",
      "ดีไซน์ด้านหน้าหรูหรา กระจังหน้าโครเมียมพรีเมียมสะกดสายตา"
    ];
    interior = [
      "เบาะแถวกลางปรับแยกอิสระพร้อมที่พักแขนพับเก็บได้",
      "หน้าจอสัมผัสขนาดใหญ่และระบบเสียงระดับพรีเมียม",
      "ช่องเก็บเอกสารด้านหลังเบาะและที่วางแก้วส่วนตัวพับเก็บสะดวก"
    ];
    safety = [
      `ถุงลมนิรภัยนิรภัย SRS ${car.airbags || 6} จุดรอบคัน`,
      "กล้องถอยจอดและสัญญาณเตือนระยะถอยหลังขณะจอด",
      "ระบบควบคุมการทรงตัวและป้องกันล้อหมุนฟรีขณะถนนลื่น"
    ];
  } else if (car.bodyType === "pickup") {
    intro = `รถกระบะสายแกร่งบรรทุกจุใจ ลุยน้ำลุยโคลนได้มั่นใจ สมรรถนะเครื่องยนต์รองรับการใช้งานเชิงพาณิชย์และท่องเที่ยวเต็มรูปแบบ`;
    highlights = [
      `แรงบิดสูงช่วงรอบต่ำ ขุมพลังแรงถึง ${car.horsepower} แรงม้า`,
      "ช่วงล่างทนทานรองรับน้ำหนักบรรทุกหนักพิเศษได้ยอดเยี่ยม",
      "เป็นรถยอดนิยม ค่าบำรุงรักษาสมเหตุสมผล อะไหล่หาง่ายทั่วไทย"
    ];
    colors = ["⚪ Super White (ขาว)", "⚫ Ultra Black (ดำ)", "🩶 Silver Metallic (เงิน)", "🔴 Red Accent (แดง)"];
    specs = `${fuelEngine}, แรงม้าสูงสุด ${car.horsepower} แรงม้า, เกียร์ ${transText}`;
    exterior = [
      "กระบะท้ายขนาดยาวพิเศษพร้อมห่วงยึดสัมภาระเหนียวแน่นรอบตัวถัง",
      "บันไดข้างและกันชนหลังเหล็กกล้าแกร่งรับแรงกระแทก",
      "ไฟท้ายดีไซน์ 3D โดดเด่น มองเห็นชัดเจนระยะไกล"
    ];
    interior = [
      "แผงควบคุมและคอนโซลกลางออกแบบเน้นความคงทน ทนทานต่อรอยขีดข่วน",
      "ระบบกระจกหน้าต่างไฟฟ้าปรับขึ้น-ลงอัตโนมัติฝั่งคนขับ",
      "ที่วางของและช่องเชื่อมต่อ USB กระจายรอบห้องโดยสาร"
    ];
    safety = [
      `ถุงลมนิรภัย SRS ${car.airbags || 2} จุดคู่หน้า`,
      "ระบบป้องกันล้อล็อก ABS และกระจายแรงเบรกอิเล็กทรอนิกส์ EBD",
      "โครงสร้างตัวถังนิรภัยแบบนิรภัยรับแรงกระแทกกระจายแรงดีเยี่ยม"
    ];
  } else if (car.bodyType === "mpv") {
    intro = `รถตู้ครอบครัวอเนกประสงค์สไตล์หรู นั่งสบายทุกเบาะที่นั่ง เน้นความกว้างขวางและความสะดวกสบายสูงสุดของผู้โดยสารตอนหลัง`;
    highlights = [
      "ห้องโดยสารสไตล์พรีเมียมเบาะแถวกลางปรับเอนนั่งนุ่มสบายเป็นพิเศษ",
      `ขึ้นลงสะดวกสบายด้วยความสูงพื้นที่พอดีและ ${car.seats > 5 ? "ประตูเปิด-ปิดสไลด์ด้วยไฟฟ้า" : "เปิดมุมกว้าง"}`,
      "ระบบเครื่องปรับอากาศกระจายความเย็นแยกโซนหน้า-หลัง เย็นทั่วถึงรวดเร็ว"
    ];
    colors = ["⚪ Platinum White (ขาวมุก)", "⚫ Spark Black (ดำเมทัลลิก)", "🩶 Luxury Gray (เทาหรู)"];
    specs = `${fuelEngine}, พละกำลังสูงสุด ${car.horsepower} แรงม้า, เกียร์ ${transText}`;
    exterior = [
      "ประตูผู้โดยสารตอนหลังเปิดสไลด์ข้างอัตโนมัติพร้อมระบบกันหนีบ",
      "กระจกมองข้างด้านหลังตัดแสงสะท้อนและกันความร้อนดีเยี่ยม",
      "ดีไซน์ด้านหน้าหรูหรา กระจังหน้าโครเมียมพรีเมียมสะกดสายตา"
    ];
    interior = [
      "เบาะแถวกลางปรับแยกอิสระพร้อมที่พักแขนพับเก็บได้",
      "หน้าจอสัมผัสขนาดใหญ่และระบบเสียงระดับพรีเมียม",
      "ช่องเก็บเอกสารด้านหลังเบาะและที่วางแก้วส่วนตัวพับเก็บสะดวก"
    ];
    safety = [
      `ถุงลมนิรภัย SRS ${car.airbags || 6} จุดรอบคัน`,
      "กล้องถอยจอดและสัญญาณเตือนระยะถอยหลังขณะจอด",
      "ระบบควบคุมการทรงตัวและป้องกันล้อหมุนฟรีขณะถนนลื่น"
    ];
  } else if (car.bodyType === "coupe") {
    intro = `สปอร์ตคูเป้ดีไซน์โฉบเฉี่ยวเร้าใจสไตล์สนามแข่ง ทัศนวิสัยสปอร์ต ควบคุมเฉียบคม ดึงดูดสายตาทุกมุมมอง`;
    highlights = [
      `ดีไซน์ภายนอกสะดุดตาสไตล์สปอร์ตพันธุ์แท้ ขุมพลังแรงถึง ${car.horsepower} แรงม้า`,
      "จุดศูนย์ถ่วงต่ำพิเศษ เข้าโค้งนิ่ง เกาะถนนดีเยี่ยมสไตล์เรซซิ่ง",
      "เบาะนั่งและแผงแดชบอร์ดออกแบบเร้าอารมณ์การขับขี่สปอร์ตพรีเมียม"
    ];
    colors = ["🔴 Racing Red (แดง)", "⚪ Pure White (ขาว)", "⚫ Carbon Black (ดำ)", "🔵 Electric Blue (น้ำเงิน)"];
    specs = `${fuelEngine}, พละกำลังสูงสุด ${car.horsepower} แรงม้า, เกียร์ ${transText}`;
    exterior = [
      "ชุดแต่งแอโรพาร์ทรอบตัวถังเพื่อการจัดเรียงอากาศพลศาสตร์สูงสุด",
      "ท่อไอเสียสปอร์ตแบบท่อคู่เสียงทุ้มลึกเร้าอารมณ์",
      "ล้ออัลลอยฟอร์จสปอร์ตน้ำหนักเบาเป็นพิเศษขนาด 18-19 นิ้ว"
    ];
    interior = [
      "เบาะนั่งทรง Bucket Seat โอบกระชับสะโพกและหลัง ป้องกันแรงเหวี่ยงขณะโค้ง",
      "แป้นคันเร่งและเบรกวัสดุอลูมิเนียมกันลื่นแบบรถแข่งสนาม",
      "หน้าจอดิจิตอลเต็มรูปแบบพร้อมแสดงข้อมูลบูสต์เทอร์โบและรอบแรงบิด"
    ];
    safety = [
      `ถุงลมนิรภัย SRS ${car.airbags || 6} จุดรอบคัน`,
      "ระบบป้องกันล้อล็อก ABS พร้อมติดตั้งระบบช่วยเสริมแรงเบรกพิเศษ BA",
      "ระบบเบรกสมรรถนะสูงเป็นพิเศษควบคุมได้รวดเร็วทันใจ"
    ];
  } else {
    intro = `รถยนต์คันโปรดจากค่ายแบรนด์ ${car.name.split(" ")[0]} ดีไซน์ทันสมัย ตอบรับการใช้งานจริง`;
    highlights = ["สมรรถนะคุ้มราคาดูแลรักษาง่าย", "ดีไซน์ภายนอกสไตล์โมเดิร์นสวยสะดุดตา", "ระบบการขับขี่เน้นความนุ่มนวลประหยัดพลังงาน"];
    colors = ["⚪ ขาวมุก", "⚫ ดำประกาย", "🩶 เทาเมทัลลิก"];
    specs = `${fuelEngine}, พละกำลัง ${car.horsepower} แรงม้า`;
    exterior = ["ระบบไฟส่องสว่างหน้าอัตโนมัติ LED", "ล้อลายสปอร์ตหรู"];
    interior = ["หน้าจอ Infotainment คมชัด", "พวงมาลัยพาวเวอร์ปรับน้ำหนักควบคุมง่าย"];
    safety = ["ถุงลมนิรภัย SRS คู่หน้านิรภัย", "ระบบป้องกันล้อล็อก ABS กระจายแรงเบรก EBD"];
  }

  if (car.fuelType === "ev") {
    highlights.push("ประหยัดค่าชาร์จพลังงานเฉลี่ยกิโลเมตรละไม่ถึง 1 บาท (ประหยัดกว่าน้ำมัน 3-4 เท่า)");
    exterior.push("ดีไซน์กระจังหน้าปิดทึบแบบ Aerodynamic เพื่อลดแรงต้านลมขณะขับขี่");
    interior.push("ระบบเบรกอัจฉริยะกู้คืนพลังงานกลับสู่แบตเตอรี่ (Regenerative Braking)");
    safety.push("โครงสร้างป้องกันแบตเตอรี่หนาแน่นสูงพร้อมระบบตัดวงจรไฟฟ้าแรงสูงกรณีอุบัติเหตุ");
  }

  return { intro, highlights, colors, specs, exterior, interior, safety };
}

// --- SUB-COMPONENTS ---

// SVG Car Vector Art Component
const CarArt: React.FC<{ bodyType: string; colors?: Record<string, string>; extraClass?: string }> = ({
  bodyType,
  colors,
  extraClass,
}) => {
  const c = Object.assign(
    {
      body: "#8B5CF6",
      cabin: "#7C3AED",
      glass: "#38BDF8",
      wheel: "#1E293B",
      hub: "#F8FAFC",
    },
    colors || {}
  );
  const artFn = CAR_ART[bodyType] || CAR_ART.sedan;
  const paths = artFn(c);

  return (
    <svg
      className={`car-art ${extraClass || ""}`}
      viewBox="0 0 200 100"
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
};

// Official studio press image component with SVG fallback
const CarVisual: React.FC<{ car: Car; sizeClass?: string; filter?: string; customImage?: string }> = ({
  car,
  sizeClass,
  filter,
  customImage,
}) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // 0. Explicit custom image file (e.g. from color variant)
    if (customImage) {
      setImgUrl(customImage);
      setFailed(false);
      return;
    }

    // 1. Match from car.photo file (All 125 cars have official local assets)
    if (car.photo && car.photo.file) {
      setImgUrl(`/cars/${car.photo.file}`);
      setFailed(false);
      return;
    }

    // 2. Direct official studio photo match by exact name
    if (OFFICIAL_CAR_PHOTOS[car.name]) {
      setImgUrl(OFFICIAL_CAR_PHOTOS[car.name]);
      setFailed(false);
      return;
    }

    // 3. Cleaned name match (e.g. without Hybrid, Electric, etc.)
    const cleanName = car.name
      .replace(" Hybrid", "")
      .replace(" Electric", "")
      .replace(" e:HEV", "")
      .replace(" e-Power", "");

    if (OFFICIAL_CAR_PHOTOS[cleanName]) {
      setImgUrl(OFFICIAL_CAR_PHOTOS[cleanName]);
      setFailed(false);
      return;
    }

    setFailed(true);
  }, [car, customImage]);

  return (
    <div className={`car-visual-container ${sizeClass || ""}`}>
      {imgUrl && !failed ? (
        <img
          className={`car-photo ${sizeClass || ""}`}
          src={imgUrl}
          alt={car.name}
          referrerPolicy="no-referrer"
          style={{
            width: "100%",
            height: sizeClass === "car-art--sm" ? "72px" : "200px",
            objectFit: "contain",
            objectPosition: "center",
            borderRadius: "16px",
            background: "radial-gradient(ellipse at center, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)",
            padding: sizeClass === "car-art--sm" ? "4px" : "8px",
            display: "block",
            margin: "0 auto",
            filter: filter ? filter : undefined,
            transition: "filter 0.4s ease, opacity 0.4s ease",
          }}
          onError={() => {
            setFailed(true);
          }}
        />
      ) : (
        <div className="car-visual-svg" style={{ width: "100%" }}>
          <CarArt bodyType={car.bodyType} />
        </div>
      )}
    </div>
  );
};

// Hero Art Banner
const HeroArtBanner: React.FC = () => {
  const c = { body: "var(--gold)", cabin: "var(--gold-bright)", glass: "var(--ink)", wheel: "var(--cream)", hub: "var(--ink)" };
  return (
    <svg viewBox="0 0 640 130" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto", display: "block" }}>
      <line x1="0" y1="112" x2="640" y2="112" stroke="rgba(241,233,216,0.18)" strokeWidth="2" strokeDasharray="10 10" />
      <g transform="translate(6,6) scale(0.9)" dangerouslySetInnerHTML={{ __html: CAR_ART.hatchback(c) }} />
      <g transform="translate(226,-8) scale(1.05)" dangerouslySetInnerHTML={{ __html: CAR_ART.suv(c) }} />
      <g transform="translate(456,4) scale(0.88)" dangerouslySetInnerHTML={{ __html: CAR_ART.pickup(c) }} />
    </svg>
  );
};

// TCO Calculations
function calcMonthlyInstallment(car: Car, dpRate: number = 0.15, term: number = 60): number {
  const FLAT_RATE = 0.0299;
  const principal = car.price * (1 - dpRate);
  const totalInterest = principal * FLAT_RATE * (term / 12);
  const monthly = (principal + totalInterest) / term;
  return monthly;
}

function affordabilityTier(ratio: number) {
  if (ratio <= 0.2) return { cls: "tier-good", label: "สบายๆ ผ่อนไหวชิล" };
  if (ratio <= 0.35) return { cls: "tier-mid", label: "กำลังดี แต่เริ่มตึงมือหน่อย" };
  return { cls: "tier-watch", label: "ค่อนข้างหนัก ลองดาวน์เพิ่มหรือรุ่นที่ถูกกว่านะ" };
}

function calcTCO(car: Car) {
  const YEARS = 5;
  const insurance5yr = car.price * 0.035 * YEARS;

  const heavy = ["suv", "ppv", "mpv"].includes(car.bodyType);
  const maintPerYear = car.fuelType === "ev" ? 5000
    : car.bodyType === "pickup" ? 9000
    : car.bodyType === "coupe" ? 9500
    : heavy ? 10000 : 8000;
  const maint5yr = maintPerYear * YEARS;

  let resaleRate;
  if (car.serviceNetwork === "wide") {
    resaleRate = car.fuelType === "hybrid" ? 0.5 : 0.48;
  } else {
    resaleRate = car.fuelType === "ev" ? 0.32 : 0.4;
  }
  const resaleValue = car.price * resaleRate;
  const total5yr = car.price + insurance5yr + maint5yr - resaleValue;

  return { insurance5yr, maint5yr, resaleValue, total5yr };
}

function riskNotes(car: Car) {
  const notes = [];
  if (car.fuelType === "ev") {
    notes.push({ icon: "⚠️", text: "ตลาดรถไฟฟ้ามือสองในไทยยังใหม่ ราคาตกไวกว่ารถสันดาปช่วงนี้เพราะมีรุ่นใหม่ออกถี่และแข่งราคกันแรง" });
    notes.push({ icon: "⚠️", text: "เช็คจุดชาร์จใกล้บ้าน/ที่ทำงานก่อน ถ้าไม่มีที่ชาร์จส่วนตัวอาจไม่สะดวกระยะยาว" });
  }
  if (car.serviceNetwork === "growing") {
    notes.push({ icon: "⚠️", text: "เครือข่ายศูนย์บริการยังน้อยกว่าแบรนด์หลัก ลองเช็คระยะทางไปศูนย์ที่ใกล้พี่ที่สุดก่อนตัดสินใจ" });
  } else {
    notes.push({ icon: "✅", text: "เครือข่ายศูนย์บริการกว้าง หาอะไหล่และช่างง่ายทั่วประเทศ" });
  }
  if (car.bodyType === "pickup") {
    notes.push({ icon: "⚠️", text: "ถ้าใช้ลุยงานหนักบ่อย ค่าบำรุงรักษาจริงอาจสูงกว่าตัวเลขประมาณการนี้" });
  }
  if (car.bodyType === "coupe") {
    notes.push({ icon: "⚠️", text: "รถสปอร์ต 2 ประตูมักมีเบี้ยประกันภัยสูงกว่ารถทั่วไป ลองขอใบเสนอราคาหลายเจ้าก่อน" });
  }
  return notes;
}

function matchTier(score: number) {
  if (score >= 70) return { cls: "match-good", ring: "var(--good)", label: "ใช่เลย" };
  if (score >= 45) return { cls: "match-mid",  ring: "var(--mid)",  label: "ก็โอเค" };
  return { cls: "match-low", ring: "var(--low)", label: "ยังไม่ใช่ทีเดียว" };
}

const scoreRingSVG = (score: number, ringColor: string) => {
  const r = 20;
  const cir = 2 * Math.PI * r;
  const offset = cir - (score / 100) * cir;
  return (
    <svg width="50" height="50" viewBox="0 0 50 50">
      <circle className="score-ring__track" cx="25" cy="25" r={r} />
      <circle
        className="score-ring__fill"
        cx="25"
        cy="25"
        r={r}
        style={{
          stroke: ringColor,
          strokeDasharray: `${cir}`,
          strokeDashoffset: offset,
        }}
      />
    </svg>
  );
};

function getRangeEstimate(car: Car) {
  if (car.fuelType === "ev") {
    let range100 = 400; // default
    if (car.name.includes("Dolphin")) range100 = 410;
    else if (car.name.includes("Atto 3")) range100 = 410;
    else if (car.name.includes("Seal")) range100 = 510;
    else if (car.name.includes("Deepal S07")) range100 = 485;
    else if (car.name.includes("Neta V")) range100 = 384;
    else if (car.name.includes("Neta X")) range100 = 480;
    else if (car.name.includes("Aion Y")) range100 = 490;
    else if (car.name.includes("Aion V")) range100 = 500;
    else if (car.name.includes("e:N1")) range100 = 412;
    else if (car.name.includes("ZS EV")) range100 = 320;
    else if (car.name.includes("MG4")) range100 = 350;
    else if (car.name.includes("Cyberster")) range100 = 380;
    
    const range80 = Math.round(range100 * 0.8);
    return { type: "ev", range100, range80, range: null, tankSize: null };
  } else {
    let tankSize = 40; // Default sedan/hatchback
    if (car.bodyType === "suv") tankSize = 48;
    else if (car.bodyType === "ppv") tankSize = 80;
    else if (car.bodyType === "mpv") tankSize = 52;
    else if (car.bodyType === "pickup") tankSize = 75;
    else if (car.bodyType === "coupe") tankSize = 45;

    if (car.name.includes("Camry")) tankSize = 50;
    else if (car.name.includes("Accord")) tankSize = 48;
    else if (car.name.includes("Civic")) tankSize = 47;
    else if (car.name.includes("Fortuner")) tankSize = 80;
    else if (car.name.includes("Everest")) tankSize = 80;
    else if (car.name.includes("D-Max")) tankSize = 76;
    else if (car.name.includes("Triton")) tankSize = 75;
    else if (car.name.includes("Ranger")) tankSize = 80;
    
    const rate = parseFloat(car.consumption) || 15;
    const range = Math.round(tankSize * rate);
    return { type: "ice", range, tankSize, range100: null, range80: null };
  }
}

function extraSpecPills(car: Car) {
  const transText = getTransmissionOptions(car);
  const shortTrans = transText.includes("ทั้งเกียร์") ? "เกียร์ออโต้ / ธรรมดา" : (car.transmission === "auto" ? "เกียร์ออโต้" : "เกียร์ธรรมดา");
  return (
    <>
      <span className="spec-pill">🐎 {car.horsepower} แรงม้า</span>
      <span className="spec-pill">⚙️ {shortTrans}</span>
      <span className="spec-pill">📄 รับประกัน {car.warrantyYears} ปี</span>
    </>
  );
}

function checklistGroupsFor(car: Car) {
  const groups = [
    { title: "เอกสารที่ต้องเตรียม", items: [
      "บัตรประชาชนตัวจริง",
      "ใบขับขี่ตัวจริง",
      "หลักฐานรายได้ (สลิปเงินเดือน/statement) ถ้าจะยื่นไฟแนนซ์",
      "เงินดาวน์หรือเช็คสำรองตามที่วางแผนไว้",
    ]},
    { title: "คำถามที่ต้องถามพนักงานขาย", items: [
      "ราคาออกรถ (on-road price) รวมทุกอย่างแล้วหรือยัง",
      "ส่วนลดจริงคือเท่าไหร่ ไม่ใช่ลดจากราคาที่บวกเพิ่มไว้ก่อน",
      "ดอกเบี้ยไฟแนนซ์คิดแบบ flat rate หรือ effective rate เทียบหลายเจ้า",
      "ประกันภัยที่พ่วงมาบังคับซื้อหรือเลือกเองได้",
    ]},
    { title: "เช็คตอนทดลองขับ", items: [
      "ฟังเสียงเครื่องยนต์/มอเตอร์ตอนสตาร์ทและเร่ง",
      "ลองเบรกกะทันหันในที่ปลอดภัย",
      "เช็คจุดบอดและกระจกมองข้าง",
      "ลองนั่งเบาะหลังจริงถ้าต้องใช้บ่อย",
    ]},
  ];

  if (car.fuelType === "ev") {
    groups.push({ title: "เรื่องเฉพาะรถไฟฟ้า", items: [
      "ระยะเวลารับประกันแบตเตอรี่กี่ปี/กี่กิโลเมตร",
      "ติดตั้ง home charger ฟรีไหม ค่าติดตั้งเพิ่มเท่าไหร่",
      "ระยะทางวิ่งจริงที่คาดหวังได้ในการใช้งานทั่วไป",
    ]});
  }
  if (car.bodyType === "pickup") {
    groups.push({ title: "เรื่องเฉพาะรถกระบะ", items: [
      "การรับประกันช่วงล่างและกระบะท้ายกี่ปี",
      "โหลดน้ำหนักบรรทุกสูงสุดตรงกับที่ใช้งานจริงไหม",
    ]});
  }
  if (car.bodyType === "coupe") {
    groups.push({ title: "เรื่องเฉพาะรถสปอร์ต", items: [
      "เปรียบเทียบเบี้ยประกันภัยหลายเจ้าก่อน มักแพงกว่ารถทั่วไป",
      "เช็คความสูงตัวถัง ถ้าบ้าน/คอนโดมีทางลาดชัน",
    ]});
  }
  if (car.bodyType === "ppv" || car.bodyType === "mpv") {
    groups.push({ title: "เรื่องเฉพาะรถ 7 ที่นั่ง", items: [
      "ลองนั่งแถว 3 จริง เช็คพื้นที่ขาและทางเข้าออก",
      "ถามเรื่องแอร์แถวหลังแยกโซนไหม",
    ]});
  }
  return groups;
}

function downloadChecklistText(
  car: Car,
  groups: { title: string; items: string[] }[],
  checklistState: Record<string, boolean>
) {
  let content = "====================================================\n";
  content += "🚗 AI CAR ADVISOR — SHOWROOM INSPECTION CHECKLIST\n";
  content += "====================================================\n\n";
  content += `รุ่นรถที่เลือก: ${car.name}\n`;
  content += `ราคาจำหน่าย: ${formatBaht(car.price)}\n`;
  content += `ประเภทตัวถัง: ${BODYTYPE_LABEL[car.bodyType] || car.bodyType}\n`;
  content += `ระบบขับเคลื่อน: ${FUEL_LABEL[car.fuelType] || car.fuelType}\n`;
  content += `อัตราสิ้นเปลือง: ${car.consumption}\n`;
  content += `วันที่ดาวน์โหลด: ${new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}\n\n`;
  content += "----------------------------------------------------\n";
  content += "รายการเช็คลิสต์ก่อนและระหว่างเข้าโชว์รูม:\n";
  content += "----------------------------------------------------\n\n";

  groups.forEach((g, gi) => {
    content += `【 ${g.title} 】\n`;
    g.items.forEach((item, ii) => {
      const isChecked = !!checklistState[`g${gi}-i${ii}`];
      content += `  [${isChecked ? "✓" : " "}] ${item}\n`;
    });
    content += "\n";
  });

  content += "====================================================\n";
  content += "AI Car Advisor — เพื่อนคู่คิดเรื่องรถ อยู่ข้างพี่ทุกขั้นตอน\n";
  content += "====================================================\n";

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Checklist_${car.name.replace(/\s+/g, "_")}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const PAIN_TO_LIFESTYLE: Record<string, string> = {

  pain1: "city",
  pain2: "city",
  pain3: "family",
  pain4: "business",
  pain5: "adventure",
  pain6: "adventure",
  pain7: "business"
};

const GAIN_TO_LIFESTYLE: Record<string, string> = {
  gain1: "city",
  gain2: "family",
  gain3: "business",
  gain4: "adventure",
  gain5: "adventure",
  gain6: "business"
};

const CARS_DATASET: Car[] = [
  {"id": 1, "name": "Toyota Yaris Ativ", "bodyType": "sedan", "fuelType": "petrol", "price": 569000, "consumption": "23 km/l", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 107, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "01-toyota-yaris-ativ.png", "credit": "ภาพ: Ethan Llamas / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 2, "name": "Toyota Yaris", "bodyType": "hatchback", "fuelType": "petrol", "price": 584000, "consumption": "22 km/l", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 107, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "02-toyota-yaris.png", "credit": "ภาพ: Dinkun Chen / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 3, "name": "Toyota Yaris Cross", "bodyType": "suv", "fuelType": "hybrid", "price": 809000, "consumption": "25 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 114, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "03-toyota-yaris-cross.jpg", "credit": "ภาพ: Haysnawri10 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 4, "name": "Toyota Corolla Altis", "bodyType": "sedan", "fuelType": "petrol", "price": 909000, "consumption": "18 km/l", "seats": 5, "lifestyle": ["business", "family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 140, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "04-toyota-corolla-altis.jpg", "credit": "ภาพ: Celica21gtfour / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 6, "name": "Toyota Corolla Cross Hybrid", "bodyType": "suv", "fuelType": "hybrid", "price": 989000, "consumption": "24 km/l", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 122, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "06-toyota-corolla-cross-hybrid.jpg", "credit": "ภาพ: S5A-0043 / Wikimedia Commons (CC BY 2.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 7, "name": "Toyota Camry Hybrid", "bodyType": "sedan", "fuelType": "hybrid", "price": 1475000, "consumption": "22 km/l", "seats": 5, "lifestyle": ["business", "family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 178, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "07-toyota-camry-hybrid.jpg", "credit": "ภาพ: S5A-0043 / Wikimedia Commons (CC BY 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 8, "name": "Toyota Veloz", "bodyType": "mpv", "fuelType": "petrol", "price": 795000, "consumption": "16 km/l", "seats": 7, "lifestyle": ["family", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 104, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 4, "photo": {"file": "08-toyota-veloz.jpg", "credit": "ภาพ: Alex Neman / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 9, "name": "Tesla Model 3", "bodyType": "sedan", "fuelType": "ev", "price": 1149000, "consumption": "6.2 km/kWh", "seats": 5, "lifestyle": ["city", "firstCar", "business"], "serviceNetwork": "growing", "nationality": "other", "transmission": "auto", "horsepower": 283, "warrantyYears": 4, "warrantyKm": 80000, "airbags": 7, "photo": {"file": "09-tesla-model-3.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 11, "name": "Toyota Innova Zenix Hybrid", "bodyType": "mpv", "fuelType": "hybrid", "price": 1379000, "consumption": "20 km/l", "seats": 7, "lifestyle": ["family", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 116, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "11-toyota-innova-zenix-hybrid.jpg", "credit": "ภาพ: © M 93 / Wikimedia Commons (CC BY-SA 3.0 de) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 12, "name": "Toyota Fortuner", "bodyType": "ppv", "fuelType": "diesel", "price": 1239000, "consumption": "15 km/l", "seats": 7, "lifestyle": ["adventure", "family", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 204, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "12-toyota-fortuner.jpg", "credit": "ภาพ: Ethan Llamas / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 13, "name": "Toyota Fortuner Legender", "bodyType": "ppv", "fuelType": "diesel", "price": 1599000, "consumption": "15 km/l", "seats": 7, "lifestyle": ["adventure", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 204, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "13-toyota-fortuner-legender.jpg", "credit": "ภาพ: Ethan Llamas / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 14, "name": "Toyota Hilux Revo Standard Cab", "bodyType": "pickup", "fuelType": "diesel", "price": 584000, "consumption": "17 km/l", "seats": 3, "lifestyle": ["business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "manual", "horsepower": 150, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 2, "photo": {"file": "14-toyota-hilux-revo-standard-cab.jpg", "credit": null}},
  {"id": 15, "name": "Toyota Hilux Revo Double Cab", "bodyType": "pickup", "fuelType": "diesel", "price": 859000, "consumption": "15 km/l", "seats": 5, "lifestyle": ["business", "adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 204, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "15-toyota-hilux-revo-double-cab.jpg", "credit": null}},
  {"id": 16, "name": "Toyota Hilux Revo Rocco", "bodyType": "pickup", "fuelType": "diesel", "price": 1099000, "consumption": "15 km/l", "seats": 5, "lifestyle": ["adventure", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 204, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "16-toyota-hilux-revo-rocco.jpg", "credit": null}},
  {"id": 17, "name": "Toyota Hilux Champ", "bodyType": "pickup", "fuelType": "diesel", "price": 519000, "consumption": "19 km/l", "seats": 2, "lifestyle": ["business", "firstCar"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "manual", "horsepower": 109, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 2, "photo": {"file": "17-toyota-hilux-champ.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 18, "name": "Toyota GR86", "bodyType": "coupe", "fuelType": "petrol", "price": 2999000, "consumption": "12 km/l", "seats": 2, "lifestyle": ["adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "manual", "horsepower": 234, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "18-toyota-gr86.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 19, "name": "Toyota GR Yaris", "bodyType": "hatchback", "fuelType": "petrol", "price": 3499000, "consumption": "11 km/l", "seats": 4, "lifestyle": ["adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "manual", "horsepower": 300, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "19-toyota-gr-yaris.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 20, "name": "Tesla Model Y", "bodyType": "suv", "fuelType": "ev", "price": 1719000, "consumption": "5.8 km/kWh", "seats": 5, "lifestyle": ["family", "city", "business"], "serviceNetwork": "growing", "nationality": "other", "transmission": "auto", "horsepower": 299, "warrantyYears": 4, "warrantyKm": 80000, "airbags": 7, "photo": {"file": "20-tesla-model-y.jpg", "credit": "ภาพ: © M 93 / Wikimedia Commons (CC BY-SA 3.0 de) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 21, "name": "Toyota Alphard Hybrid", "bodyType": "mpv", "fuelType": "hybrid", "price": 4269000, "consumption": "18 km/l", "seats": 7, "lifestyle": ["family", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 186, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "21-toyota-alphard-hybrid.jpg", "credit": "ภาพ: Tokumeigakarinoaoshima / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 22, "name": "Honda City", "bodyType": "sedan", "fuelType": "petrol", "price": 599000, "consumption": "20 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 119, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "22-honda-city.jpg", "credit": "ภาพ: © M 93 / Wikimedia Commons (CC BY-SA 3.0 de) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 23, "name": "Honda City Hatchback", "bodyType": "hatchback", "fuelType": "petrol", "price": 599000, "consumption": "19 km/l", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 119, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "23-honda-city-hatchback.jpg", "credit": null}},
  {"id": 24, "name": "Honda City e:HEV", "bodyType": "sedan", "fuelType": "hybrid", "price": 649000, "consumption": "27 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 126, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "24-honda-city-ehev.jpg", "credit": "ภาพ: © M 93 / Wikimedia Commons (CC BY-SA 3.0 de) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 25, "name": "Honda Civic e:HEV", "bodyType": "sedan", "fuelType": "hybrid", "price": 949000, "consumption": "24 km/l", "seats": 5, "lifestyle": ["business", "city"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 121, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "25-honda-civic.jpg", "credit": "ภาพ: Kevauto / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 26, "name": "Honda Civic Hatchback RS", "bodyType": "hatchback", "fuelType": "petrol", "price": 1199000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["city", "adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 178, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "26-honda-civic-hatchback-rs.jpg", "credit": null}},
  {"id": 27, "name": "Honda Civic Type R", "bodyType": "hatchback", "fuelType": "petrol", "price": 3990000, "consumption": "10 km/l", "seats": 4, "lifestyle": ["adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "manual", "horsepower": 329, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "27-honda-civic-type-r.jpg", "credit": "ภาพ: OWS Photography / Wikimedia Commons (CC BY 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 29, "name": "Honda HR-V e:HEV", "bodyType": "suv", "fuelType": "hybrid", "price": 959000, "consumption": "23 km/l", "seats": 5, "lifestyle": ["family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 131, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "29-honda-hr-v-ehev.jpg", "credit": "ภาพ: オーバードライブ83 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 30, "name": "Honda CR-V", "bodyType": "suv", "fuelType": "petrol", "price": 1489000, "consumption": "14 km/l", "seats": 7, "lifestyle": ["family", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 193, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "30-honda-cr-v.jpg", "credit": "ภาพ: © M 93 / Wikimedia Commons (CC BY-SA 3.0 de) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 31, "name": "Honda CR-V e:HEV", "bodyType": "suv", "fuelType": "hybrid", "price": 1409000, "consumption": "18 km/l", "seats": 7, "lifestyle": ["family", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 204, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "31-honda-cr-v-ehev.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 32, "name": "Honda BR-V", "bodyType": "mpv", "fuelType": "petrol", "price": 915000, "consumption": "16 km/l", "seats": 7, "lifestyle": ["family", "firstCar"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 119, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 4, "photo": {"file": "32-honda-br-v.jpg", "credit": "ภาพ: Andra Febrian / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 33, "name": "Honda WR-V", "bodyType": "suv", "fuelType": "petrol", "price": 799000, "consumption": "17 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 121, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 4, "photo": {"file": "33-honda-wr-v.jpg", "credit": "ภาพ: オーバードライブ83 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 34, "name": "Honda Accord", "bodyType": "sedan", "fuelType": "hybrid", "price": 1479000, "consumption": "20 km/l", "seats": 5, "lifestyle": ["business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 204, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 8, "photo": {"file": "34-honda-accord.jpg", "credit": "ภาพ: Damian B Oh / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 35, "name": "Honda City Hatchback e:HEV RS", "bodyType": "hatchback", "fuelType": "hybrid", "price": 779000, "consumption": "27 km/l", "seats": 5, "lifestyle": ["city", "firstCar", "family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 126, "warrantyYears": 5, "warrantyKm": 140000, "airbags": 6, "photo": {"file": "35-honda-city-hatchback-ehev.jpg", "credit": null}},
  {"id": 36, "name": "Mazda2 Hatchback", "bodyType": "hatchback", "fuelType": "petrol", "price": 529000, "consumption": "19 km/l", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 90, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "36-mazda2-hatchback.jpg", "credit": "ภาพ: © M 93 / Wikimedia Commons (CC BY-SA 3.0 de) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 37, "name": "Mazda2 Sedan", "bodyType": "sedan", "fuelType": "petrol", "price": 529000, "consumption": "19 km/l", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 90, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "37-mazda2-sedan.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 38, "name": "Mazda3", "bodyType": "sedan", "fuelType": "petrol", "price": 979000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["business", "city"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 165, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "38-mazda3.jpg", "credit": "ภาพ: File:Mazda3 (BP) X e-Skyactiv-X IMG 9015.jpg : Alexander Migl derivative work: Z / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 39, "name": "Mazda CX-3", "bodyType": "suv", "fuelType": "petrol", "price": 899000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 110, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "39-mazda-cx-3.jpg", "credit": "ภาพ: Vauxford / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 40, "name": "Mazda CX-30", "bodyType": "suv", "fuelType": "petrol", "price": 899000, "consumption": "15 km/l", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 165, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "40-mazda-cx-30.jpg", "credit": "ภาพ: LuvsMG481 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 41, "name": "Mazda CX-5", "bodyType": "suv", "fuelType": "petrol", "price": 1219000, "consumption": "14 km/l", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 165, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "41-mazda-cx-5.jpg", "credit": "ภาพ: EurovisionNim / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 42, "name": "Mazda CX-8", "bodyType": "suv", "fuelType": "petrol", "price": 1499000, "consumption": "12 km/l", "seats": 7, "lifestyle": ["family", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 188, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "42-mazda-cx-8.jpg", "credit": "ภาพ: Mr.choppers / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 43, "name": "Mazda CX-60", "bodyType": "suv", "fuelType": "hybrid", "price": 2299000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 254, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "43-mazda-cx-60.jpg", "credit": "ภาพ: Ethan Llamas / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 44, "name": "Mazda BT-50", "bodyType": "pickup", "fuelType": "diesel", "price": 992000, "consumption": "15 km/l", "seats": 5, "lifestyle": ["business", "adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 190, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "44-mazda-bt-50.jpg", "credit": "ภาพ: Ethan Llamas / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 45, "name": "Mazda MX-5", "bodyType": "coupe", "fuelType": "petrol", "price": 2820000, "consumption": "14 km/l", "seats": 2, "lifestyle": ["adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "manual", "horsepower": 184, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 4, "photo": {"file": "45-mazda-mx-5.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 46, "name": "Nissan Almera", "bodyType": "sedan", "fuelType": "petrol", "price": 573000, "consumption": "21 km/l", "seats": 5, "lifestyle": ["city", "family", "firstCar"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 100, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "46-nissan-almera.jpg", "credit": "ภาพ: Ethan Llamas / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 48, "name": "Nissan Kicks e-Power", "bodyType": "suv", "fuelType": "hybrid", "price": 839000, "consumption": "24 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 129, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "48-nissan-kicks-e-power.jpg", "credit": "ภาพ: Kevauto / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 49, "name": "Nissan Navara", "bodyType": "pickup", "fuelType": "diesel", "price": 792000, "consumption": "15 km/l", "seats": 5, "lifestyle": ["business", "adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 190, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "49-nissan-navara.jpg", "credit": "ภาพ: Vauxford / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 50, "name": "Nissan Terra", "bodyType": "ppv", "fuelType": "diesel", "price": 1199000, "consumption": "14 km/l", "seats": 7, "lifestyle": ["family", "adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 190, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "50-nissan-terra.jpg", "credit": "ภาพ: Ethan Llamas / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 51, "name": "BYD M6", "bodyType": "mpv", "fuelType": "ev", "price": 769900, "consumption": "6.5 km/kWh", "seats": 6, "lifestyle": ["family", "business", "city"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 204, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "51-byd-m6.jpg", "credit": "ภาพ: JustAnotherCarDesigner / Wikimedia Commons (CC0 1.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 52, "name": "Nissan Serena e-Power", "bodyType": "mpv", "fuelType": "hybrid", "price": 1690000, "consumption": "18 km/l", "seats": 8, "lifestyle": ["family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 163, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "52-nissan-serena-e-power.jpg", "credit": "ภาพ: Tokumeigakarinoaoshima / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 53, "name": "Isuzu D-Max Standard Cab", "bodyType": "pickup", "fuelType": "diesel", "price": 561000, "consumption": "18 km/l", "seats": 3, "lifestyle": ["business", "firstCar"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "manual", "horsepower": 150, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 2, "photo": {"file": "53-isuzu-d-max-standard-cab.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 54, "name": "Isuzu D-Max V-Cross", "bodyType": "pickup", "fuelType": "diesel", "price": 940000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["adventure", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 190, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "54-isuzu-d-max-v-cross.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 55, "name": "Isuzu MU-X", "bodyType": "ppv", "fuelType": "diesel", "price": 1197000, "consumption": "15 km/l", "seats": 7, "lifestyle": ["family", "adventure", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 190, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "55-isuzu-mu-x.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 56, "name": "Mitsubishi Triton", "bodyType": "pickup", "fuelType": "diesel", "price": 727000, "consumption": "17 km/l", "seats": 5, "lifestyle": ["adventure", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 181, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "56-mitsubishi-triton.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 57, "name": "Mitsubishi Triton Athlete", "bodyType": "pickup", "fuelType": "diesel", "price": 1299000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["adventure", "business"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 204, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "57-mitsubishi-triton-athlete.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 58, "name": "Mitsubishi Pajero Sport", "bodyType": "ppv", "fuelType": "diesel", "price": 1499000, "consumption": "14 km/l", "seats": 7, "lifestyle": ["family", "adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 181, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "58-mitsubishi-pajero-sport.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 59, "name": "Mitsubishi Xpander HEV", "bodyType": "mpv", "fuelType": "hybrid", "price": 939000, "consumption": "16 km/l", "seats": 7, "lifestyle": ["family", "firstCar"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 105, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 2, "photo": {"file": "59-mitsubishi-xpander.jpg", "credit": "ภาพ: Sabung.hamster aka Everyone Sinks Starco / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 60, "name": "Mitsubishi Xpander Cross HEV", "bodyType": "mpv", "fuelType": "hybrid", "price": 969000, "consumption": "15 km/l", "seats": 7, "lifestyle": ["family", "adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 105, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 2, "photo": {"file": "60-mitsubishi-xpander-cross.jpg", "credit": "ภาพ: Andra Febrian / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 61, "name": "Mitsubishi Attrage", "bodyType": "sedan", "fuelType": "petrol", "price": 564000, "consumption": "22 km/l", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 100, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 2, "photo": {"file": "61-mitsubishi-attrage.jpg", "credit": "ภาพ: EurovisionNim / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 62, "name": "Changan Lumin", "bodyType": "hatchback", "fuelType": "ev", "price": 479000, "consumption": "9.5 km/kWh", "seats": 4, "lifestyle": ["city", "firstCar"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 48, "warrantyYears": 8, "warrantyKm": 120000, "airbags": 2, "photo": {"file": "62-changan-lumin.jpg", "credit": "ภาพ: JamesYoung8167 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 63, "name": "Suzuki Swift", "bodyType": "hatchback", "fuelType": "petrol", "price": 567000, "consumption": "20 km/l", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "growing", "nationality": "japan", "transmission": "auto", "horsepower": 82, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 2, "photo": {"file": "63-suzuki-swift.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 64, "name": "Suzuki Ertiga", "bodyType": "mpv", "fuelType": "petrol", "price": 689000, "consumption": "17 km/l", "seats": 7, "lifestyle": ["family", "firstCar"], "serviceNetwork": "growing", "nationality": "japan", "transmission": "auto", "horsepower": 92, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 2, "photo": {"file": "64-suzuki-ertiga.jpg", "credit": null}},
  {"id": 65, "name": "Suzuki XL7", "bodyType": "mpv", "fuelType": "petrol", "price": 799000, "consumption": "16 km/l", "seats": 7, "lifestyle": ["family"], "serviceNetwork": "growing", "nationality": "japan", "transmission": "auto", "horsepower": 92, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "65-suzuki-xl7.jpg", "credit": "ภาพ: オーバードライブ83 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 66, "name": "Suzuki Jimny", "bodyType": "suv", "fuelType": "petrol", "price": 899000, "consumption": "14 km/l", "seats": 4, "lifestyle": ["adventure", "firstCar"], "serviceNetwork": "growing", "nationality": "japan", "transmission": "manual", "horsepower": 101, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 2, "photo": {"file": "66-suzuki-jimny.jpg", "credit": "ภาพ: Shirley 501JFW / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 67, "name": "Deepal L07", "bodyType": "sedan", "fuelType": "ev", "price": 1329000, "consumption": "6.0 km/kWh", "seats": 5, "lifestyle": ["city", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 258, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "67-deepal-l07.jpg", "credit": "ภาพ: JustAnotherCarDesigner / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 68, "name": "Subaru Forester", "bodyType": "suv", "fuelType": "petrol", "price": 1399000, "consumption": "13 km/l", "seats": 5, "lifestyle": ["family", "adventure"], "serviceNetwork": "growing", "nationality": "japan", "transmission": "auto", "horsepower": 182, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "68-subaru-forester.jpg", "credit": "ภาพ: Mr.choppers / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 69, "name": "Hyundai Creta", "bodyType": "suv", "fuelType": "petrol", "price": 929000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "growing", "nationality": "korea", "transmission": "auto", "horsepower": 113, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "69-hyundai-creta.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 70, "name": "Hyundai Stargazer", "bodyType": "mpv", "fuelType": "petrol", "price": 795000, "consumption": "15 km/l", "seats": 6, "lifestyle": ["family"], "serviceNetwork": "growing", "nationality": "korea", "transmission": "auto", "horsepower": 120, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "70-hyundai-stargazer.jpg", "credit": "ภาพ: Ethan Llamas / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 71, "name": "Kia EV5", "bodyType": "suv", "fuelType": "ev", "price": 1399000, "consumption": "6.0 km/kWh", "seats": 5, "lifestyle": ["family", "city", "adventure"], "serviceNetwork": "growing", "nationality": "korea", "transmission": "auto", "horsepower": 217, "warrantyYears": 7, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "71-kia-ev5.jpg", "credit": "ภาพ: Nissangeniss / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 72, "name": "Kia EV9", "bodyType": "suv", "fuelType": "ev", "price": 3499000, "consumption": "4.8 km/kWh", "seats": 7, "lifestyle": ["family", "business", "adventure"], "serviceNetwork": "growing", "nationality": "korea", "transmission": "auto", "horsepower": 384, "warrantyYears": 7, "warrantyKm": 150000, "airbags": 8, "photo": {"file": "72-kia-ev9.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 74, "name": "MG3 Hybrid+", "bodyType": "hatchback", "fuelType": "hybrid", "price": 579900, "consumption": "25 km/l", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 95, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "74-mg3-hybrid.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 75, "name": "MG5", "bodyType": "sedan", "fuelType": "petrol", "price": 579000, "consumption": "17 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 115, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 4, "photo": {"file": "75-mg5.jpg", "credit": "ภาพ: User 3204 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 76, "name": "MG ZS", "bodyType": "suv", "fuelType": "petrol", "price": 679000, "consumption": "15 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 113, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "76-mg-zs.jpg", "credit": "ภาพ: © M 93 / Wikimedia Commons (CC BY-SA 3.0 de) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 78, "name": "MG4 Electric", "bodyType": "hatchback", "fuelType": "ev", "price": 599900, "consumption": "6.5 km/kWh", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 170, "warrantyYears": 8, "warrantyKm": 180000, "airbags": 6, "photo": {"file": "78-mg4-electric.jpg", "credit": "ภาพ: JustAnotherCarDesigner / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 79, "name": "MG HS", "bodyType": "suv", "fuelType": "hybrid", "price": 1199000, "consumption": "18 km/l", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 139, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "79-mg-hs.jpg", "credit": "ภาพ: Calreyn88 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 80, "name": "MG Extender", "bodyType": "pickup", "fuelType": "diesel", "price": 699000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 150, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 2, "photo": {"file": "80-mg-extender.jpg", "credit": "ภาพ: User 3204 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 81, "name": "MG Cyberster", "bodyType": "coupe", "fuelType": "ev", "price": 2150000, "consumption": "5.0 km/kWh", "seats": 2, "lifestyle": ["adventure"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 335, "warrantyYears": 8, "warrantyKm": 150000, "airbags": 4, "photo": {"file": "81-mg-cyberster.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 82, "name": "BYD Dolphin", "bodyType": "hatchback", "fuelType": "ev", "price": 509900, "consumption": "7.0 km/kWh", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 95, "warrantyYears": 8, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "82-byd-dolphin.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 83, "name": "BYD Atto 3", "bodyType": "suv", "fuelType": "ev", "price": 669900, "consumption": "6.2 km/kWh", "seats": 5, "lifestyle": ["family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 201, "warrantyYears": 8, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "83-byd-atto-3.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 84, "name": "BYD Seal", "bodyType": "sedan", "fuelType": "ev", "price": 989900, "consumption": "6.8 km/kWh", "seats": 5, "lifestyle": ["business", "city"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 313, "warrantyYears": 8, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "84-byd-seal.jpg", "credit": "ภาพ: User 3204 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 85, "name": "BYD Sealion 6 DM-i", "bodyType": "suv", "fuelType": "hybrid", "price": 859900, "consumption": "19 km/l", "seats": 5, "lifestyle": ["family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 218, "warrantyYears": 8, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "85-byd-sealion-6.jpg", "credit": "ภาพ: ไม่ระบุชื่อ / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 86, "name": "AVATR 11", "bodyType": "suv", "fuelType": "ev", "price": 2299000, "consumption": "5.6 km/kWh", "seats": 5, "lifestyle": ["business", "family", "adventure"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 313, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 7, "photo": {"file": "86-avatr-11.jpg", "credit": "ภาพ: User 3204 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 87, "name": "GWM Haval H6", "bodyType": "suv", "fuelType": "petrol", "price": 899000, "consumption": "13 km/l", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 184, "warrantyYears": 7, "warrantyKm": 200000, "airbags": 6, "photo": {"file": "87-gwm-haval-h6.jpg", "credit": "ภาพ: Motor Show Brasil / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 88, "name": "GWM Haval H6 HEV", "bodyType": "suv", "fuelType": "hybrid", "price": 1099000, "consumption": "18 km/l", "seats": 5, "lifestyle": ["family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 243, "warrantyYears": 7, "warrantyKm": 200000, "airbags": 6, "photo": {"file": "88-gwm-haval-h6-hev.jpg", "credit": "ภาพ: Motor Show Brasil / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 89, "name": "GWM Haval Jolion", "bodyType": "suv", "fuelType": "hybrid", "price": 799000, "consumption": "20 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 187, "warrantyYears": 7, "warrantyKm": 200000, "airbags": 6, "photo": {"file": "89-gwm-haval-jolion.jpg", "credit": "ภาพ: User 3204 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 91, "name": "GWM Tank 300 HEV", "bodyType": "suv", "fuelType": "hybrid", "price": 1549000, "consumption": "11 km/l", "seats": 5, "lifestyle": ["adventure"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 268, "warrantyYears": 7, "warrantyKm": 200000, "airbags": 6, "photo": {"file": "91-gwm-tank-300.jpg", "credit": "ภาพ: ไม่ระบุชื่อ / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 92, "name": "Changan Deepal S07", "bodyType": "suv", "fuelType": "ev", "price": 1099000, "consumption": "6.0 km/kWh", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 218, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "92-changan-deepal-s07.jpg", "credit": "ภาพ: Sulthan Naufal / Wikimedia Commons (CC BY 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 93, "name": "Zeekr X", "bodyType": "suv", "fuelType": "ev", "price": 899000, "consumption": "5.8 km/kWh", "seats": 5, "lifestyle": ["city", "firstCar", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 272, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "93-zeekr-x.jpg", "credit": "ภาพ: JustAnotherCarDesigner / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 94, "name": "Neta V", "bodyType": "hatchback", "fuelType": "ev", "price": 549000, "consumption": "7.5 km/kWh", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 95, "warrantyYears": 8, "warrantyKm": 150000, "airbags": 4, "photo": {"file": "94-neta-v.jpg", "credit": "ภาพ: JamesYoung8167 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 95, "name": "Neta X", "bodyType": "suv", "fuelType": "ev", "price": 739000, "consumption": "6.5 km/kWh", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 181, "warrantyYears": 8, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "95-neta-x.jpg", "credit": "ภาพ: S5A-0043 / Wikimedia Commons (CC BY 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 96, "name": "GAC Aion Y", "bodyType": "suv", "fuelType": "ev", "price": 769900, "consumption": "6.4 km/kWh", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 136, "warrantyYears": 8, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "96-gac-aion-y.jpg", "credit": "ภาพ: User 3204 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 97, "name": "GAC Aion V", "bodyType": "suv", "fuelType": "ev", "price": 799900, "consumption": "6.0 km/kWh", "seats": 5, "lifestyle": ["family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 201, "warrantyYears": 8, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "97-gac-aion-v.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 98, "name": "Ford Everest", "bodyType": "ppv", "fuelType": "diesel", "price": 1379000, "consumption": "13 km/l", "seats": 7, "lifestyle": ["family", "adventure", "business"], "serviceNetwork": "wide", "nationality": "other", "transmission": "auto", "horsepower": 210, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "98-ford-everest.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 99, "name": "Ford Ranger", "bodyType": "pickup", "fuelType": "diesel", "price": 939000, "consumption": "14 km/l", "seats": 5, "lifestyle": ["business", "adventure"], "serviceNetwork": "wide", "nationality": "other", "transmission": "auto", "horsepower": 170, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "99-ford-ranger.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 100, "name": "Ford Ranger Raptor", "bodyType": "pickup", "fuelType": "diesel", "price": 1804000, "consumption": "8 km/l", "seats": 5, "lifestyle": ["adventure"], "serviceNetwork": "wide", "nationality": "other", "transmission": "auto", "horsepower": 292, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "100-ford-ranger-raptor.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 101, "name": "Volvo XC40", "bodyType": "suv", "fuelType": "hybrid", "price": 1999000, "consumption": "17 km/l", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "growing", "nationality": "other", "transmission": "auto", "horsepower": 197, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "101-volvo-xc40.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 102, "name": "Volvo XC60", "bodyType": "suv", "fuelType": "hybrid", "price": 3390000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "growing", "nationality": "other", "transmission": "auto", "horsepower": 313, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "102-volvo-xc60.jpg", "credit": "ภาพ: Vauxford / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 103, "name": "Peugeot 2008", "bodyType": "suv", "fuelType": "petrol", "price": 1099000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "growing", "nationality": "other", "transmission": "auto", "horsepower": 130, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "103-peugeot-2008.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 104, "name": "BMW 220 Gran Coupe", "bodyType": "coupe", "fuelType": "petrol", "price": 2199000, "consumption": "15 km/l", "seats": 5, "lifestyle": ["business", "city"], "serviceNetwork": "growing", "nationality": "other", "transmission": "auto", "horsepower": 156, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "104-bmw-218-gran-coupe.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 105, "name": "Subaru BRZ", "bodyType": "coupe", "fuelType": "petrol", "price": 2699000, "consumption": "12 km/l", "seats": 4, "lifestyle": ["adventure"], "serviceNetwork": "growing", "nationality": "japan", "transmission": "manual", "horsepower": 228, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "105-subaru-brz.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 106, "name": "Toyota GR Corolla", "bodyType": "hatchback", "fuelType": "petrol", "price": 4199000, "consumption": "10 km/l", "seats": 5, "lifestyle": ["adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "manual", "horsepower": 300, "warrantyYears": 3, "warrantyKm": 100000, "airbags": 7, "photo": {"file": "106-toyota-gr-corolla.jpg", "credit": "ภาพ: Tokumeigakarinoaoshima / Wikimedia Commons (CC0 1.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 107, "name": "Mazda MX-5 Roadster", "bodyType": "coupe", "fuelType": "petrol", "price": 2912000, "consumption": "14 km/l", "seats": 2, "lifestyle": ["adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 184, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 4, "photo": {"file": "107-mazda-mx5.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 108, "name": "Zeekr 009", "bodyType": "mpv", "fuelType": "ev", "price": 2399000, "consumption": "5.0 km/kWh", "seats": 7, "lifestyle": ["business", "family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 603, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "108-zeekr-009.jpg", "credit": "ภาพ: michel / Wikimedia Commons (CC BY 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 109, "name": "Kia EV6", "bodyType": "suv", "fuelType": "ev", "price": 1999000, "consumption": "5.5 km/kWh", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "growing", "nationality": "korea", "transmission": "auto", "horsepower": 325, "warrantyYears": 7, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "109-kia-ev6.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 110, "name": "Hyundai Ioniq 5", "bodyType": "suv", "fuelType": "ev", "price": 1399000, "consumption": "5.8 km/kWh", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "growing", "nationality": "korea", "transmission": "auto", "horsepower": 217, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "110-hyundai-ioniq-5.jpg", "credit": "ภาพ: Damian B Oh / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 111, "name": "Riddara RD6", "bodyType": "pickup", "fuelType": "ev", "price": 899000, "consumption": "5.2 km/kWh", "seats": 5, "lifestyle": ["business", "adventure"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 272, "warrantyYears": 6, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "111-riddara-rd6.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 112, "name": "Subaru Crosstrek", "bodyType": "suv", "fuelType": "petrol", "price": 2350000, "consumption": "14 km/l", "seats": 5, "lifestyle": ["city", "adventure"], "serviceNetwork": "growing", "nationality": "japan", "transmission": "auto", "horsepower": 150, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 8, "photo": {"file": "112-subaru-crosstrek.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 113, "name": "GWM Tank 500 HEV", "bodyType": "suv", "fuelType": "hybrid", "price": 2049000, "consumption": "12 km/l", "seats": 7, "lifestyle": ["family", "business", "adventure"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 344, "warrantyYears": 7, "warrantyKm": 200000, "airbags": 6, "photo": {"file": "113-gwm-tank-500.jpg", "credit": "ภาพ: JustAnotherCarDesigner / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 114, "name": "BYD Sealion 7", "bodyType": "suv", "fuelType": "ev", "price": 1199900, "consumption": "6.0 km/kWh", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 313, "warrantyYears": 8, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "114-byd-sealion-7.jpg", "credit": "ภาพ: Matti Blume / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 116, "name": "MG Maxus 7", "bodyType": "mpv", "fuelType": "ev", "price": 1399900, "consumption": "5.2 km/kWh", "seats": 7, "lifestyle": ["family", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 245, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "116-mg-maxus-7.jpg", "credit": "ภาพ: JustAnotherCarDesigner / Wikimedia Commons (CC0 1.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 117, "name": "MG Maxus 9", "bodyType": "mpv", "fuelType": "ev", "price": 1799000, "consumption": "4.8 km/kWh", "seats": 7, "lifestyle": ["family", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 245, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "117-mg-maxus-9.jpg", "credit": "ภาพ: JustAnotherCarDesigner / Wikimedia Commons (CC0 1.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 118, "name": "XPENG G6", "bodyType": "suv", "fuelType": "ev", "price": 1189000, "consumption": "6.1 km/kWh", "seats": 5, "lifestyle": ["city", "family", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 286, "warrantyYears": 5, "warrantyKm": 120000, "airbags": 7, "photo": {"file": "118-xpeng-g6.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 119, "name": "Hyptec HT", "bodyType": "suv", "fuelType": "ev", "price": 1249000, "consumption": "5.7 km/kWh", "seats": 5, "lifestyle": ["business", "family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 340, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "119-hyptec-ht.jpg", "credit": "ภาพ: Tim Wu / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 120, "name": "GWM ORA 07", "bodyType": "sedan", "fuelType": "ev", "price": 1299000, "consumption": "5.9 km/kWh", "seats": 5, "lifestyle": ["city", "business", "adventure"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 204, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "120-gwm-ora-07.jpg", "credit": null}},
  {"id": 121, "name": "GWM Poer Sahar HEV", "bodyType": "pickup", "fuelType": "hybrid", "price": 1199000, "consumption": "11 km/l", "seats": 5, "lifestyle": ["adventure", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 351, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "121-gwm-poer-sahar.jpg", "credit": "ภาพ: RL GNZLZ / Wikimedia Commons (CC BY-SA 2.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 122, "name": "Hyundai Staria", "bodyType": "mpv", "fuelType": "diesel", "price": 1999000, "consumption": "12 km/l", "seats": 11, "lifestyle": ["family", "business"], "serviceNetwork": "growing", "nationality": "korea", "transmission": "auto", "horsepower": 177, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "122-hyundai-staria.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 123, "name": "Kia Carnival", "bodyType": "mpv", "fuelType": "diesel", "price": 2249000, "consumption": "14 km/l", "seats": 11, "lifestyle": ["family", "business"], "serviceNetwork": "growing", "nationality": "korea", "transmission": "auto", "horsepower": 202, "warrantyYears": 7, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "123-kia-carnival.jpg", "credit": "ภาพ: Damian B Oh / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 124, "name": "Hyundai Santa Fe Hybrid", "bodyType": "suv", "fuelType": "hybrid", "price": 1849000, "consumption": "16 km/l", "seats": 7, "lifestyle": ["family", "business", "adventure"], "serviceNetwork": "growing", "nationality": "korea", "transmission": "auto", "horsepower": 230, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "124-hyundai-santa-fe-hybrid.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 125, "name": "Volvo EX30", "bodyType": "suv", "fuelType": "ev", "price": 1590000, "consumption": "6.2 km/kWh", "seats": 5, "lifestyle": ["city", "firstCar", "business"], "serviceNetwork": "wide", "nationality": "other", "transmission": "auto", "horsepower": 272, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "125-volvo-ex30.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 126, "name": "Toyota bZ4X", "bodyType": "suv", "fuelType": "ev", "price": 1529000, "consumption": "6.2 km/kWh", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 221, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "126-toyota-bz4x.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 127, "name": "Toyota Land Cruiser FJ", "bodyType": "suv", "fuelType": "petrol", "price": 1269000, "consumption": "10 km/l", "seats": 5, "lifestyle": ["adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 163, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "127-toyota-land-cruiser-fj.jpg", "credit": "ภาพ: TTTNIS / Wikimedia Commons (CC0 1.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 128, "name": "Toyota Hilux Travo", "bodyType": "pickup", "fuelType": "diesel", "price": 767000, "consumption": "15 km/l", "seats": 5, "lifestyle": ["business", "adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 150, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "128-toyota-hilux-travo.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 129, "name": "Honda e:N1", "bodyType": "suv", "fuelType": "ev", "price": 1199000, "consumption": "6.5 km/kWh", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 204, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "129-honda-e-n1.jpg", "credit": "ภาพ: Kevauto / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 130, "name": "Mazda 6e", "bodyType": "sedan", "fuelType": "ev", "price": 1169000, "consumption": "6.0 km/kWh", "seats": 5, "lifestyle": ["business", "family"], "serviceNetwork": "medium", "nationality": "japan", "transmission": "auto", "horsepower": 258, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "130-mazda-6e.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 131, "name": "Mazda CX-6e", "bodyType": "suv", "fuelType": "ev", "price": 1259000, "consumption": "5.6 km/kWh", "seats": 5, "lifestyle": ["family"], "serviceNetwork": "medium", "nationality": "japan", "transmission": "auto", "horsepower": 258, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "131-mazda-cx-6e.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 132, "name": "Mitsubishi Xforce HEV", "bodyType": "suv", "fuelType": "hybrid", "price": 899000, "consumption": "24.4 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 116, "warrantyYears": 7, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "132-mitsubishi-xforce-hev.jpg", "credit": "ภาพ: Andra Febrian / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 133, "name": "Mitsubishi Outlander PHEV", "bodyType": "suv", "fuelType": "hybrid", "price": 1640000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["family", "adventure"], "serviceNetwork": "wide", "nationality": "japan", "transmission": "auto", "horsepower": 302, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 8, "photo": {"file": "133-mitsubishi-outlander-phev.jpg", "credit": "ภาพ: MercurySable99 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 134, "name": "Suzuki Fronx", "bodyType": "suv", "fuelType": "petrol", "price": 689000, "consumption": "20 km/l", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "medium", "nationality": "japan", "transmission": "auto", "horsepower": 103, "warrantyYears": 5, "warrantyKm": 100000, "airbags": 6, "photo": {"file": "134-suzuki-fronx.jpg", "credit": "ภาพ: HARSHIT 0008 / Wikimedia Commons (CC BY 3.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 135, "name": "Deepal S05", "bodyType": "suv", "fuelType": "ev", "price": 799000, "consumption": "6.3 km/kWh", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 218, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "135-deepal-s05.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 136, "name": "GAC AION UT", "bodyType": "hatchback", "fuelType": "ev", "price": 469900, "consumption": "6.6 km/kWh", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 136, "warrantyYears": 8, "warrantyKm": 200000, "airbags": 6, "photo": {"file": "136-gac-aion-ut.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 137, "name": "Zeekr 7X", "bodyType": "suv", "fuelType": "ev", "price": 1399000, "consumption": "5.6 km/kWh", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 421, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 7, "photo": {"file": "137-zeekr-7x.jpg", "credit": "ภาพ: JustAnotherCarDesigner / Wikimedia Commons (CC0 1.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 138, "name": "BYD Atto 1", "bodyType": "hatchback", "fuelType": "ev", "price": 429900, "consumption": "7.5 km/kWh", "seats": 4, "lifestyle": ["city", "firstCar"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 75, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 4, "photo": {"file": "138-byd-atto-1.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 139, "name": "BYD Atto 2", "bodyType": "suv", "fuelType": "ev", "price": 629900, "consumption": "6.8 km/kWh", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 174, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "139-byd-atto-2.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 140, "name": "BYD Seal 5 DM-i", "bodyType": "sedan", "fuelType": "hybrid", "price": 599900, "consumption": "26.3 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 180, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "140-byd-seal-5-dm-i.jpg", "credit": null}},
  {"id": 141, "name": "BYD Sealion 5 DM-i", "bodyType": "suv", "fuelType": "hybrid", "price": 759900, "consumption": "25 km/l", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 212, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "141-byd-sealion-5-dm-i.jpg", "credit": null}},
  {"id": 142, "name": "BYD Seal 6", "bodyType": "sedan", "fuelType": "ev", "price": 799900, "consumption": "6.7 km/kWh", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 218, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "142-byd-seal-6.jpg", "credit": "ภาพ: Navigator84 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 143, "name": "Denza D9", "bodyType": "mpv", "fuelType": "ev", "price": 1949900, "consumption": "5.0 km/kWh", "seats": 7, "lifestyle": ["family", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 313, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 9, "photo": {"file": "143-denza-d9.jpg", "credit": "ภาพ: User 3204 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 144, "name": "MG S5 EV", "bodyType": "suv", "fuelType": "ev", "price": 649900, "consumption": "6.5 km/kWh", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "wide", "nationality": "china", "transmission": "auto", "horsepower": 170, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "144-mg-s5-ev.jpg", "credit": "ภาพ: Matti Blume / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 145, "name": "MG IM5", "bodyType": "sedan", "fuelType": "ev", "price": 1449000, "consumption": "6.0 km/kWh", "seats": 5, "lifestyle": ["business"], "serviceNetwork": "wide", "nationality": "china", "transmission": "auto", "horsepower": 400, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 7, "photo": {"file": "145-mg-im5.jpg", "credit": "ภาพ: Yuqiao / Wikimedia Commons (CC BY 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 146, "name": "MG URBAN", "bodyType": "hatchback", "fuelType": "ev", "price": 549900, "consumption": "7.0 km/kWh", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "wide", "nationality": "china", "transmission": "auto", "horsepower": 136, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "146-mg-urban.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 147, "name": "GWM Tank 300 Diesel", "bodyType": "suv", "fuelType": "diesel", "price": 1049000, "consumption": "11 km/l", "seats": 5, "lifestyle": ["adventure"], "serviceNetwork": "medium", "nationality": "china", "transmission": "auto", "horsepower": 184, "warrantyYears": 7, "warrantyKm": 200000, "airbags": 6, "photo": {"file": "147-gwm-tank-300-diesel.jpg", "credit": "ภาพ: ไม่ระบุชื่อ / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 148, "name": "GWM ORA 5 EV", "bodyType": "suv", "fuelType": "ev", "price": 649000, "consumption": "6.5 km/kWh", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "medium", "nationality": "china", "transmission": "auto", "horsepower": 204, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "148-gwm-ora-5-ev.jpg", "credit": null}},
  {"id": 149, "name": "GWM ORA 5 HEV", "bodyType": "suv", "fuelType": "hybrid", "price": 709000, "consumption": "20 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "medium", "nationality": "china", "transmission": "auto", "horsepower": 190, "warrantyYears": 7, "warrantyKm": 200000, "airbags": 6, "photo": {"file": "149-gwm-ora-5-hev.jpg", "credit": null}},
  {"id": 150, "name": "XPENG X9", "bodyType": "mpv", "fuelType": "ev", "price": 2399000, "consumption": "5.0 km/kWh", "seats": 7, "lifestyle": ["family", "business"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 315, "warrantyYears": 7, "warrantyKm": 160000, "airbags": 7, "photo": {"file": "150-xpeng-x9.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 151, "name": "Geely EX2", "bodyType": "hatchback", "fuelType": "ev", "price": 429990, "consumption": "6.8 km/kWh", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 114, "warrantyYears": 6, "warrantyKm": 150000, "airbags": 6, "photo": {"file": "151-geely-ex2.jpg", "credit": "ภาพ: JustAnotherCarDesigner / Wikimedia Commons (CC0 1.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 152, "name": "Geely EX5", "bodyType": "suv", "fuelType": "ev", "price": 759000, "consumption": "6.3 km/kWh", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 218, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "152-geely-ex5.jpg", "credit": "ภาพ: JustAnotherCarDesigner / Wikimedia Commons (CC0 1.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 153, "name": "Chery Q", "bodyType": "hatchback", "fuelType": "ev", "price": 469900, "consumption": "7.0 km/kWh", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 122, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "153-chery-q.jpg", "credit": "ภาพ: JustAnotherCarDesigner / Wikimedia Commons (CC0 1.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 154, "name": "Chery V23", "bodyType": "suv", "fuelType": "ev", "price": 759900, "consumption": "6.5 km/kWh", "seats": 5, "lifestyle": ["city", "adventure"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 184, "warrantyYears": 8, "warrantyKm": 160000, "airbags": 6, "photo": {"file": "154-chery-v23.jpg", "credit": null}},
  {"id": 155, "name": "Omoda C5 EV", "bodyType": "suv", "fuelType": "ev", "price": 629000, "consumption": "6.5 km/kWh", "seats": 5, "lifestyle": ["city"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 211, "warrantyYears": 8, "warrantyKm": 200000, "airbags": 6, "photo": {"file": "155-omoda-c5-ev.jpg", "credit": "ภาพ: LuvsMG481 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 156, "name": "Jaecoo 5 EV", "bodyType": "suv", "fuelType": "ev", "price": 549000, "consumption": "6.8 km/kWh", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "growing", "nationality": "china", "transmission": "auto", "horsepower": 211, "warrantyYears": 8, "warrantyKm": 200000, "airbags": 6, "photo": {"file": "156-jaecoo-5-ev.jpg", "credit": "ภาพ: CarsofGlasgow / Wikimedia Commons (CC BY 3.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 157, "name": "Mercedes-Benz CLA 250+ EV", "bodyType": "sedan", "fuelType": "ev", "price": 2290000, "consumption": "6.5 km/kWh", "seats": 5, "lifestyle": ["business", "city"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 272, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "157-mercedes-benz-cla-250-ev.jpg", "credit": "ภาพ: © M 93 / Wikimedia Commons (CC BY-SA 3.0 de) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 158, "name": "Mercedes-Benz C 220 d", "bodyType": "sedan", "fuelType": "diesel", "price": 2690000, "consumption": "18 km/l", "seats": 5, "lifestyle": ["business", "family"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 197, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "158-mercedes-benz-c-220-d.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 159, "name": "Mercedes-Benz E 220", "bodyType": "sedan", "fuelType": "petrol", "price": 3490000, "consumption": "14 km/l", "seats": 5, "lifestyle": ["business", "family"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 204, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "159-mercedes-benz-e-220.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 160, "name": "Mercedes-Benz GLA 200", "bodyType": "suv", "fuelType": "petrol", "price": 2580000, "consumption": "15 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 163, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "160-mercedes-benz-gla-200.jpg", "credit": "ภาพ: © M 93 / Wikimedia Commons (CC BY-SA 3.0 de) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 161, "name": "Mercedes-Benz GLC 220 d", "bodyType": "suv", "fuelType": "diesel", "price": 3490000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 197, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "161-mercedes-benz-glc-220-d.jpg", "credit": "ภาพ: Kevauto / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 162, "name": "Mercedes-Benz GLE 300 d", "bodyType": "suv", "fuelType": "diesel", "price": 4950000, "consumption": "13 km/l", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 269, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 9, "photo": {"file": "162-mercedes-benz-gle-300-d.jpg", "credit": "ภาพ: Kevauto / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 163, "name": "BMW 320d", "bodyType": "sedan", "fuelType": "diesel", "price": 2799000, "consumption": "19 km/l", "seats": 5, "lifestyle": ["business", "family"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 190, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 6, "photo": {"file": "163-bmw-320d.jpg", "credit": "ภาพ: Vauxford / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 164, "name": "BMW 530e", "bodyType": "sedan", "fuelType": "hybrid", "price": 3299000, "consumption": "40 km/l", "seats": 5, "lifestyle": ["business", "family"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 299, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "164-bmw-530e.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 165, "name": "BMW X1", "bodyType": "suv", "fuelType": "petrol", "price": 2399000, "consumption": "14 km/l", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 204, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "165-bmw-x1.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 166, "name": "BMW iX1", "bodyType": "suv", "fuelType": "ev", "price": 2499000, "consumption": "6.0 km/kWh", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 204, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "166-bmw-ix1.jpg", "credit": "ภาพ: Wikisympathisant / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 167, "name": "BMW X3", "bodyType": "suv", "fuelType": "diesel", "price": 3799000, "consumption": "16 km/l", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 197, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "167-bmw-x3.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 168, "name": "BMW iX3", "bodyType": "suv", "fuelType": "ev", "price": 2999000, "consumption": "5.8 km/kWh", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 286, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "168-bmw-ix3.jpg", "credit": "ภาพ: Navigator84 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 169, "name": "BMW X5", "bodyType": "suv", "fuelType": "diesel", "price": 5159000, "consumption": "12 km/l", "seats": 5, "lifestyle": ["family", "business", "adventure"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 298, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "169-bmw-x5.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 170, "name": "BMW i5", "bodyType": "sedan", "fuelType": "ev", "price": 4599000, "consumption": "5.5 km/kWh", "seats": 5, "lifestyle": ["business"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 340, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "170-bmw-i5.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 171, "name": "BMW iX", "bodyType": "suv", "fuelType": "ev", "price": 5999000, "consumption": "5.0 km/kWh", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 408, "warrantyYears": 5, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "171-bmw-ix.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 172, "name": "MINI Cooper SE", "bodyType": "hatchback", "fuelType": "ev", "price": 1555000, "consumption": "6.5 km/kWh", "seats": 4, "lifestyle": ["city", "firstCar"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 218, "warrantyYears": 4, "warrantyKm": 999999, "airbags": 6, "photo": {"file": "172-mini-cooper-se.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 173, "name": "MINI Aceman SE", "bodyType": "suv", "fuelType": "ev", "price": 1755000, "consumption": "6.3 km/kWh", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 218, "warrantyYears": 4, "warrantyKm": 999999, "airbags": 6, "photo": {"file": "173-mini-aceman-se.jpg", "credit": null}},
  {"id": 174, "name": "Lexus LBX", "bodyType": "suv", "fuelType": "hybrid", "price": 2430000, "consumption": "25 km/l", "seats": 5, "lifestyle": ["city", "firstCar"], "serviceNetwork": "medium", "nationality": "japan", "transmission": "auto", "horsepower": 136, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 8, "photo": {"file": "174-lexus-lbx.jpg", "credit": "ภาพ: Chanokchon / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 175, "name": "Lexus UX 300h", "bodyType": "suv", "fuelType": "hybrid", "price": 2780000, "consumption": "22 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "medium", "nationality": "japan", "transmission": "auto", "horsepower": 199, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 8, "photo": {"file": "175-lexus-ux-300h.jpg", "credit": "ภาพ: Vauxford / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 176, "name": "Lexus NX 350h", "bodyType": "suv", "fuelType": "hybrid", "price": 3310000, "consumption": "19 km/l", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "medium", "nationality": "japan", "transmission": "auto", "horsepower": 243, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 8, "photo": {"file": "176-lexus-nx-350h.jpg", "credit": "ภาพ: Alexander Migl / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 177, "name": "Lexus RX 350h", "bodyType": "suv", "fuelType": "hybrid", "price": 4520000, "consumption": "17 km/l", "seats": 5, "lifestyle": ["family", "business"], "serviceNetwork": "medium", "nationality": "japan", "transmission": "auto", "horsepower": 250, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 10, "photo": {"file": "177-lexus-rx-350h.jpg", "credit": "ภาพ: Mr.choppers / Wikimedia Commons (CC BY-SA 3.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 178, "name": "Lexus RZ 350e", "bodyType": "suv", "fuelType": "ev", "price": 2990000, "consumption": "5.8 km/kWh", "seats": 5, "lifestyle": ["family", "city"], "serviceNetwork": "medium", "nationality": "japan", "transmission": "auto", "horsepower": 224, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 8, "photo": {"file": "178-lexus-rz-350e.jpg", "credit": "ภาพ: Mr.choppers / Wikimedia Commons (CC BY-SA 3.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 179, "name": "Lexus IS 300h", "bodyType": "sedan", "fuelType": "hybrid", "price": 2799000, "consumption": "18 km/l", "seats": 5, "lifestyle": ["business"], "serviceNetwork": "medium", "nationality": "japan", "transmission": "auto", "horsepower": 223, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 8, "photo": {"file": "179-lexus-is-300h.jpg", "credit": "ภาพ: Kevauto / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 180, "name": "Lexus ES 350e", "bodyType": "sedan", "fuelType": "ev", "price": 3290000, "consumption": "6.0 km/kWh", "seats": 5, "lifestyle": ["business", "family"], "serviceNetwork": "medium", "nationality": "japan", "transmission": "auto", "horsepower": 224, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 9, "photo": {"file": "180-lexus-es-350e.jpg", "credit": "ภาพ: S5A-0043 / Wikimedia Commons (CC BY 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 181, "name": "Lexus LM 350h", "bodyType": "mpv", "fuelType": "hybrid", "price": 6290000, "consumption": "13 km/l", "seats": 7, "lifestyle": ["family", "business"], "serviceNetwork": "medium", "nationality": "japan", "transmission": "auto", "horsepower": 250, "warrantyYears": 5, "warrantyKm": 150000, "airbags": 8, "photo": {"file": "181-lexus-lm-350h.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 182, "name": "Audi Q3", "bodyType": "suv", "fuelType": "petrol", "price": 2499000, "consumption": "18.2 km/l", "seats": 5, "lifestyle": ["city", "family"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 150, "warrantyYears": 3, "warrantyKm": 999999, "airbags": 6, "photo": {"file": "182-audi-q3.jpg", "credit": "ภาพ: Alexander-93 / Wikimedia Commons (CC BY-SA 4.0) · ดัดแปลง: ตัดพื้นหลัง"}},
  {"id": 183, "name": "Porsche Macan EV", "bodyType": "suv", "fuelType": "ev", "price": 5290000, "consumption": "5.3 km/kWh", "seats": 5, "lifestyle": ["business", "family"], "serviceNetwork": "medium", "nationality": "other", "transmission": "auto", "horsepower": 360, "warrantyYears": 2, "warrantyKm": 999999, "airbags": 8, "photo": {"file": "183-porsche-macan-ev.jpg", "credit": null}}
];

function computeClientRecommendations(state: {
  budget: number;
  income: number;
  pains: string[];
  gains: string[];
  bodytype: string;
  fuel: string;
  brands: string[];
  priority: string;
  dpRate?: number;
  termMonths?: number;
}): RecommendationResult[] {
  const activeLifestyles = new Set<string>();
  state.pains.forEach((p) => { if (PAIN_TO_LIFESTYLE[p]) activeLifestyles.add(PAIN_TO_LIFESTYLE[p]); });
  state.gains.forEach((g) => { if (GAIN_TO_LIFESTYLE[g]) activeLifestyles.add(GAIN_TO_LIFESTYLE[g]); });
  const activeList = Array.from(activeLifestyles);

  const results: RecommendationResult[] = [];

  for (const car of CARS_DATASET) {
    const reasons: string[] = [];

    let budgetScore = 0;
    if (car.price <= state.budget) {
      budgetScore = 30; // Removed penalty
      reasons.push("ราคาอยู่ในงบประมาณที่ตั้งไว้");
    } else {
      const over = (car.price - state.budget) / state.budget;
      budgetScore = Math.max(0, 12 - over * 70);
      reasons.push(`ราคาเกินงบไปราว ${Math.round(over * 100)}%`);
    }

    let lifestyleScore = 0;
    const overlap = car.lifestyle.filter((l) => activeList.includes(l));
    if (overlap.length > 0) {
      lifestyleScore = Math.min(25, 15 + (overlap.length - 1) * 5);
      reasons.push(`ตรงกับสาย${overlap.map((l) => LIFESTYLE_LABEL[l] || l).join(" + ")}`);
    } else {
      lifestyleScore = 6;
    }

    let bodyScore = 0;
    if (state.bodytype === "unsure") {
      bodyScore = 14;
    } else if (car.bodyType === state.bodytype) {
      bodyScore = 20;
      reasons.push(`เป็นทรง ${BODYTYPE_LABEL[car.bodyType] || car.bodyType} ตามที่ชอบ`);
    } else {
      bodyScore = 4;
    }

    let fuelScore = 0;
    if (state.fuel === "any") {
      fuelScore = 9;
    } else if (car.fuelType === state.fuel) {
      fuelScore = 15;
      reasons.push(`เครื่องยนต์${FUEL_LABEL[car.fuelType] || car.fuelType}ตามที่เลือก`);
    } else {
      fuelScore = 1;
    }

    let brandScore = 0;
    if (!state.brands || state.brands.length === 0 || state.brands.includes("any")) {
      brandScore = 6;
    } else {
      const carBrand = car.name.split(" ")[0].toLowerCase();
      const matched = state.brands.some((b) => b.toLowerCase() === carBrand);
      if (matched) {
        brandScore = 10;
        reasons.push(`เป็นแบรนด์ ${car.name.split(" ")[0]} ในดวงใจ`);
      } else {
        brandScore = 1;
      }
    }

    if (state.priority === "budget") budgetScore *= 1.3;
    if (state.priority === "lifestyle") lifestyleScore *= 1.3;
    if (state.priority === "bodytype") bodyScore *= 1.3;
    if (state.priority === "brand") brandScore *= 1.5;

    let totalScore = budgetScore + lifestyleScore + bodyScore + fuelScore + brandScore;

    const finalScore = Math.round(Math.max(0, Math.min(100, totalScore)));
    const monthlyInstallment = Math.round(calcMonthlyInstallment(car, state.dpRate, state.termMonths));
    const ratio = monthlyInstallment / Math.max(1, state.income);
    const tier = affordabilityTier(ratio);
    const tco = calcTCO(car);
    const rangeInfo = getRangeEstimate(car);
    const risk = riskNotes(car);

    // no invented owner reviews: only text with a citable source may be shown
    const reviews: Review[] = [];
    const complaints: Complaint[] = [];

    results.push({
      car,
      score: finalScore,
      reasons,
      tco,
      monthlyInstallment,
      affordabilityRatio: ratio,
      affordabilityLabel: tier.label,
      affordabilityCls: tier.cls,
      rangeInfo,
      riskNotes: risk,
      reviews,
      complaints
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 15);
}

// --- MAIN APP COMPONENT ---
export default function CarAdvisor() {
  const [started, setStarted] = useState(false);
  const [macroStage, setMacroStage] = useState(1);
  const [step, setStep] = useState(1);

  // Form selections state
  const [budgetK, setBudgetK] = useState<number>(900);
  const [incomeK, setIncomeK] = useState<number>(30);
  const [pains, setPains] = useState<string[]>([]);
  const [gains, setGains] = useState<string[]>([]);
  const [bodytype, setBodytype] = useState<string | null>(null);
  const [fuel, setFuel] = useState<string | null>(null);
  const [brands, setBrands] = useState<string[]>(["any"]);
  const [priority, setPriority] = useState<string>("none");

  // Loan Adjuster state
  const [downPaymentRate, setDownPaymentRate] = useState<number>(0.15);
  const [termMonths, setTermMonths] = useState<number>(60);

  // API response and decision flow state
  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [shortlist, setShortlist] = useState<RecommendationResult[]>([]);
  const [chosenCarId, setChosenCarId] = useState<number | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // UI state
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [compareCarId1, setCompareCarId1] = useState<number | null>(null);
  const [compareCarId2, setCompareCarId2] = useState<number | null>(null);
  const [costRiskViewMode, setCostRiskViewMode] = useState<"card" | "table">("card");

  // 3D Configurator state
  const [configuratorCar, setConfiguratorCar] = useState<Car | null>(null);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [cardSelectedColor, setCardSelectedColor] = useState<Record<number, CarColorOption>>({});

  // Stage 6 Final Feedback state (5 Dimensions)
  const [catRatings, setCatRatings] = useState<Record<string, number>>({
    accuracy: 0,
    tco: 0,
    quiz: 0,
    checklist: 0,
    overall: 0,
  });
  const [finalRating, setFinalRating] = useState<number | null>(null);
  const [finalReasons, setFinalReasons] = useState<string[]>([]);
  const [finalMessage, setFinalMessage] = useState<string>("");
  const [finalPurchasedCar, setFinalPurchasedCar] = useState<string>("");
  const [finalSubmitting, setFinalSubmitting] = useState<boolean>(false);
  const [finalSubmitted, setFinalSubmitted] = useState<boolean>(false);


  const getDerivedLifestyleText = () => {
    const active = new Set<string>();
    pains.forEach((p) => {
      const l = PAIN_TO_LIFESTYLE[p];
      if (l) active.add(l);
    });
    gains.forEach((g) => {
      const l = GAIN_TO_LIFESTYLE[g];
      if (l) active.add(l);
    });
    const lifestyles = Array.from(active);
    return lifestyles.map((l) => LIFESTYLE_LABEL[l]).join(" + ");
  };

  const stepIsReady = (n: number) => {
    if (n === 1) return budgetK > 0 && incomeK > 0;
    if (n === 2) return pains.length > 0 || gains.length > 0;
    if (n === 3) return bodytype !== null;
    if (n === 4) return fuel !== null;
    if (n === 5) return brands.length > 0;
    if (n === 6) return priority !== null;
    return true;
  };

  const resolveCarItem = (id: number | null, fallbackItem?: RecommendationResult): RecommendationResult | undefined => {
    if (!id) return fallbackItem;
    const inShort = shortlist.find((item) => item.car.id === id);
    if (inShort) return inShort;
    const inRes = results.find((item) => item.car.id === id);
    if (inRes) return inRes;
    const rawCar = CARS_DATASET.find((c) => c.id === id);
    if (rawCar) {
      const tco = calcTCO(rawCar);
      const monthly = calcMonthlyInstallment(rawCar, downPaymentRate, termMonths);
      const ratio = monthly / (incomeK * 1000);
      const afford = affordabilityTier(ratio);
      return {
        car: rawCar,
        score: 75,
        reasons: ["รถที่เลือกเปรียบเทียบจากแคตตาล็อกทั้งหมด 175 คัน"],
        tco: { insurance5yr: tco.insurance5yr, maint5yr: tco.maint5yr, resaleValue: tco.resaleValue, total5yr: tco.total5yr },
        monthlyInstallment: monthly,
        affordabilityRatio: ratio,
        affordabilityLabel: afford.label,
        affordabilityCls: afford.cls,
        rangeInfo: getRangeEstimate(rawCar),
        riskNotes: riskNotes(rawCar),
        reviews: [],
        complaints: []
      };
    }
    return fallbackItem;
  };

  const handleNext = async () => {
    if (!stepIsReady(step)) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (step < 6) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        let data = null;
        try {
          // Timeout implementation using AbortController
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

          const isProd = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
          const apiBase = process.env.NEXT_PUBLIC_API_URL || (isProd ? "/api/backend" : "http://127.0.0.1:8000");
          const res = await fetch(`${apiBase}/api/recommend`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              budget: budgetK * 1000,
              income: incomeK * 1000,
              pains,
              gains,
              bodytype: bodytype || "unsure",
              fuel: fuel || "any",
              brands,
              priority,
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (res.ok) {
            data = await res.json();
          }
        } catch (e) {
          console.log("Remote API unreachable or timed out, using client engine", e);
        }

        if (!data || !Array.isArray(data) || data.length === 0) {
          data = computeClientRecommendations({
            budget: budgetK * 1000,
            income: incomeK * 1000,
            pains,
            gains,
            bodytype: bodytype || "unsure",
            fuel: fuel || "any",
            brands,
            priority,
            dpRate: downPaymentRate,
            termMonths,
          });
        }

        setResults(data);
        setShortlist(data); // Auto shortlist top matching cars
        if (data.length > 0) setCompareCarId1(data[0].car.id);
        if (data.length > 1) setCompareCarId2(data[1].car.id);
        else if (data.length > 0) setCompareCarId2(data[0].car.id);
        setMacroStage(2);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmDecision = () => {
    if (!chosenCarId) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const chosenResult = shortlist.find((s) => s.car.id === chosenCarId);
    if (!chosenResult) return;

    const groups = checklistGroupsFor(chosenResult.car);
    const initialChecklist: Record<string, boolean> = {};
    groups.forEach((g, gi) => {
      g.items.forEach((item, ii) => {
        initialChecklist[`g${gi}-i${ii}`] = false;
      });
    });
    setChecklist(initialChecklist);
    setMacroStage(5);
  };

  const fullRestart = () => {
    setStarted(false);
    setMacroStage(1);
    setStep(1);
    setBudgetK(900);
    setIncomeK(30);
    setPains([]);
    setGains([]);
    setBodytype(null);
    setFuel(null);
    setBrands(["any"]);
    setResults([]);
    setShortlist([]);
    setChosenCarId(null);
    setChecklist({});
    setCatRatings({ accuracy: 0, tco: 0, quiz: 0, checklist: 0, overall: 0 });
    setFinalRating(null);
    setFinalReasons([]);
    setFinalMessage("");
    setFinalPurchasedCar("");
    setFinalSubmitted(false);
  };


  return (
    <>
      {/* HEADER */}
      <header className="topbar">
        <div className="topbar__inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div className="brand">
              <span className="brand__mark">AI</span>
              <span className="brand__name">Car Advisor</span>
            </div>
            <p className="brand__tag">เพื่อนคู่คิดเรื่องรถ อยู่ข้างพี่ทุกขั้นตอน</p>
          </div>

          <button
            type="button"
            onClick={() => {
              const hero = shortlist[0]?.car || results[0]?.car || (CARS_DATASET && CARS_DATASET[0]) || null;
              setConfiguratorCar(hero);
              setIsConfiguratorOpen(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, rgba(2, 132, 199, 0.3) 0%, rgba(30, 58, 138, 0.45) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.45)",
              color: "#38bdf8",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(2, 132, 199, 0.25)",
              transition: "all 0.2s ease",
            }}
          >
            <span>🏎️ 3D Virtual Showroom (หมุน 360°)</span>
          </button>
        </div>
      </header>

      {/* STAGE TRACKER */}
      {started && (
        <nav className="stage-tracker" id="stageTracker" aria-label="ขั้นตอนทั้งหมด">
          <div className={`stage-item ${macroStage === 1 ? "is-active" : macroStage > 1 ? "is-done" : ""}`} data-stage="1">
            <span className="stage-item__icon">📝</span>
            <span className="stage-item__label">Frame</span>
          </div>
          <span className="stage-arrow">›</span>
          <div className={`stage-item ${macroStage === 2 ? "is-active" : macroStage > 2 ? "is-done" : ""}`} data-stage="2">
            <span className="stage-item__icon">⚖️</span>
            <span className="stage-item__label">Compare</span>
          </div>
          <span className="stage-arrow">›</span>
          <div className={`stage-item ${macroStage === 3 ? "is-active" : macroStage > 3 ? "is-done" : ""}`} data-stage="3">
            <span className="stage-item__icon">💰</span>
            <span className="stage-item__label">Cost &amp; Risk</span>
          </div>
          <span className="stage-arrow">›</span>
          <div className={`stage-item ${macroStage === 4 ? "is-active" : macroStage > 4 ? "is-done" : ""}`} data-stage="4">
            <span className="stage-item__icon">✅</span>
            <span className="stage-item__label">Decide</span>
          </div>
          <span className="stage-arrow">›</span>
          <div className={`stage-item ${macroStage === 5 ? "is-active" : macroStage > 5 ? "is-done" : ""}`} data-stage="5">
            <span className="stage-item__icon">🏬</span>
            <span className="stage-item__label">Showroom</span>
          </div>
          <span className="stage-arrow">›</span>
          <div className={`stage-item ${macroStage === 6 ? "is-active" : macroStage > 6 ? "is-done" : ""}`} data-stage="6">
            <span className="stage-item__icon">⭐</span>
            <span className="stage-item__label">Feedback</span>
          </div>
        </nav>
      )}

      {/* MAIN CONTAINER */}
      <main className="wrap">
        {/* HERO / LANDING */}
        {!started && (
          <section className="hero" id="landingSection">
            <div className="hero__glow"></div>
            <p className="hero__eyebrow">✦ เพื่อนสาวที่พร้อมช่วยหารถ</p>
            <h1 className="hero__title">
              มาหารถที่ใช่<br />ไปด้วยกัน<span className="hero__title-accent">นะ</span>
            </h1>
            <p className="hero__sub">
              ตอบคำถามสั้นๆ ให้เราเข้าใจพี่ก่อน แล้วช่วยกันคัดรถ เทียบต้นทุนจริง ดูว่าผ่อนไหวไหม จนพร้อมเดินเข้าโชว์รูมแบบมั่นใจสุดๆ
            </p>

            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-num">{CARS_DATASET.length}</span>
                <span className="hero__stat-label">รุ่นรถให้เลือกดู</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-num">7</span>
                <span className="hero__stat-label">ประเภทตัวถัง</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-num">5</span>
                <span className="hero__stat-label">ขั้นตอนจบ</span>
              </div>
            </div>

            <button type="button" id="startBtn" className="btn-hero" onClick={() => setStarted(true)}>
              เริ่มหารถด้วยกันเลย →
            </button>

            <div className="hero__art" aria-hidden="true" id="heroArt">
              <HeroArtBanner />
            </div>
          </section>
        )}

        {/* STAGE 1 · FRAME (quiz) */}
        {started && macroStage === 1 && (
          <section className={`quiz-card ${shake ? "shake" : ""}`} id="quizCard">
            <div className="quiz-progress">
              <div className="dots" id="dots">
                {[1, 2, 3, 4, 5, 6].map((d) => (
                  <span
                    key={d}
                    className={`dot ${step === d ? "is-active" : step > d ? "is-done" : ""}`}
                    data-dot={d}
                  />
                ))}
              </div>
              <span className="progress-label" id="progressLabel">
                ข้อ {step} จาก 6
              </span>
            </div>

            {/* STEP 1 — BUDGET & INCOME */}
            {step === 1 && (
              <div className="step" data-step="1">
                <div className="budget-income-grid">
                  {/* LEFT COLUMN: BUDGET */}
                  <div className="budget-income-col">
                    <p className="quiz-eyebrow">งบประมาณรถยนต์</p>
                    <h2 className="quiz-q">งบประมาณที่เล็งไว้?</h2>
                    <p className="quiz-hint">ระบุงบประมาณที่ต้องการซื้อรถ (หน่วยเป็น k)</p>

                    <div className="modern-input-card">
                      <div className="input-k-wrapper">
                        <input
                          type="number"
                          id="budgetK"
                          className="input-k-field"
                          value={budgetK === 0 ? "" : budgetK}
                          min="100"
                          max="10000"
                          step="50"
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            setBudgetK(val);
                          }}
                        />
                        <span className="input-k-suffix">k</span>
                      </div>
                      <div className="budget-box__amount" id="budgetValue">
                        {formatBaht(budgetK * 1000)}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: INCOME */}
                  <div className="budget-income-col">
                    <p className="quiz-eyebrow">รายได้ต่อเดือน</p>
                    <h2 className="quiz-q">รายได้ต่อเดือนของพี่?</h2>
                    <p className="quiz-hint">ระบุรายได้เฉลี่ยต่อเดือนของพี่ (หน่วยเป็น k)</p>

                    <div className="modern-input-card">
                      <div className="input-k-wrapper">
                        <input
                          type="number"
                          id="incomeK"
                          className="input-k-field"
                          value={incomeK === 0 ? "" : incomeK}
                          min="5"
                          max="1000"
                          step="5"
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            setIncomeK(val);
                          }}
                        />
                        <span className="input-k-suffix">k</span>
                      </div>
                      <div className="budget-box__amount" id="incomeValue">
                        {formatBaht(incomeK * 1000)} / เดือน
                      </div>
                    </div>
                  </div>
                </div>
                <UnclearQuestionButton questionId="budget_income" stage={1} />
              </div>
            )}

            {/* STEP 2 — PAINS & GAINS */}
            {step === 2 && (
              <div className="step" data-step="2">
                <div className="pain-gain-grid">
                  {/* LEFT COLUMN: PAIN */}
                  <div className="pain-gain-col">
                    <h2 className="quiz-q quiz-q--pg">ปัญหาที่เจอบ่อยในการขับรถ?</h2>
                    <p className="quiz-hint">เลือกปัญหาที่พี่พบเจอบ่อยที่สุด (เลือกได้สูงสุด 3 ข้อ)</p>

                    <div className="option-grid option-grid--vertical" data-group="pains" style={{ maxWidth: "100%" }}>
                      {[
                        { val: "pain1", emoji: "🏙️", text: "ขับในเมืองเป็นหลัก" },
                        { val: "pain3", emoji: "👨‍👩‍👧", text: "ใช้รถร่วมกับคนในบ้านเป็นประจำ" },
                        { val: "pain4", emoji: "💼", text: "ใช้รถทำงานหลายจุด เดินทางหลายที่ต่อวัน" },
                        { val: "pain5", emoji: "🛣️", text: "เดินทางไกลเป็นประจำ หรือเดินทางต่างจังหวัดบ่อย" },
                        { val: "pain6", emoji: "⛺", text: "ท่องเที่ยวและกิจกรรมกลางแจ้ง ออกทริป แคมป์ปิ้ง หรือเดินทางพร้อมอุปกรณ์" },
                        { val: "pain7", emoji: "📦", text: "ต้องใช้พื้นที่เก็บของและการจัดวางที่ยืดหยุ่น" },
                      ].map((item) => {
                        const isSel = pains.includes(item.val);
                        return (
                          <button
                            key={item.val}
                            type="button"
                            className={`option-card option-card--horizontal option-card--pg ${isSel ? "is-selected" : ""}`}
                            onClick={() => {
                              if (isSel) {
                                setPains(pains.filter((p) => p !== item.val));
                              } else {
                                if (pains.length >= 3) {
                                  setShake(true);
                                  setTimeout(() => setShake(false), 400);
                                  return;
                                }
                                setPains([...pains, item.val]);
                              }
                            }}
                          >
                            <span className="option-card__emoji">{item.emoji}</span>
                            <span className="option-card__title">{item.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: GAIN */}
                  <div className="pain-gain-col">
                    <h2 className="quiz-q quiz-q--pg">อยากได้รถที่ตอบโจทย์อย่างไร?</h2>
                    <p className="quiz-hint">เลือกสิ่งที่คาดหวังในรถคันใหม่ (เลือกได้สูงสุด 3 ข้อ)</p>

                    <div className="option-grid option-grid--vertical" data-group="gains" style={{ maxWidth: "100%" }}>
                      {[
                        { val: "gain1", emoji: "🚗", text: "กะทัดรัด คล่องตัว จอดง่าย" },
                        { val: "gain2", emoji: "🛋️", text: "กว้างขวาง นั่งสบายทั้งครอบครัว" },
                        { val: "gain3", emoji: "🔋", text: "ประหยัดน้ำมัน / ไฟฟ้า" },
                        { val: "gain4", emoji: "🛞", text: "ช่วงล่างมั่นคง ขับมั่นใจ" },
                        { val: "gain5", emoji: "⛺", text: "ใต้ท้องสูง พร้อมหลายสภาพถนน" },
                        { val: "gain6", emoji: "🎒", text: "พื้นที่เก็บของกว้าง เบาะพับได้" },
                      ].map((item) => {
                        const isSel = gains.includes(item.val);
                        return (
                          <button
                            key={item.val}
                            type="button"
                            className={`option-card option-card--horizontal option-card--pg ${isSel ? "is-selected" : ""}`}
                            onClick={() => {
                              if (isSel) {
                                setGains(gains.filter((g) => g !== item.val));
                              } else {
                                if (gains.length >= 3) {
                                  setShake(true);
                                  setTimeout(() => setShake(false), 400);
                                  return;
                                }
                                setGains([...gains, item.val]);
                              }
                            }}
                          >
                            <span className="option-card__emoji">{item.emoji}</span>
                            <span className="option-card__title">{item.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <UnclearQuestionButton questionId="pains_gains" stage={2} />
              </div>
            )}

            {/* STEP 3 — BODY TYPE */}
            {step === 3 && (
              <div className="step" data-step="3">
                <p className="quiz-eyebrow">แล้วทรงรถล่ะ</p>
                <h2 className="quiz-q">ชอบรถประเภทไหน?</h2>
                <p className="quiz-hint">ถ้ายังไม่มีในใจ เลือก "ให้ช่วยแนะนำ" ได้เลย</p>

                <div className="option-grid" data-group="bodytype">
                  {[
                    { val: "hatchback", emoji: "🚗", title: "Hatchback / อีโค่คาร์", sub: "เล็ก คล่องตัว จอดง่าย" },
                    { val: "sedan", emoji: "🚘", title: "Sedan", sub: "นั่งสบาย ดูเรียบร้อย" },
                    { val: "coupe", emoji: "🏎️", title: "Coupe", sub: "สปอร์ต 2 ประตู ขับสนุก" },
                    { val: "suv", emoji: "🚙", title: "SUV / Crossover", sub: "นั่งสูง มั่นใจ เก็บของเยอะ" },
                    { val: "ppv", emoji: "🚙", title: "PPV 7 ที่นั่ง", sub: "ฐานกระบะ ลุยได้ นั่งได้เยอะ" },
                    { val: "mpv", emoji: "🚐", title: "รถตู้ / MPV", sub: "ขนคนได้เยอะสุด อเนกประสงค์" },
                    { val: "pickup", emoji: "🛻", title: "กระบะ / Pickup", sub: "ลุยได้ บรรทุกหนักได้" },
                    { val: "unsure", emoji: "🤔", title: "ไม่แน่ใจ", sub: "ให้ช่วยแนะนำจากข้ออื่นแทน" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      className={`option-card ${bodytype === item.val ? "is-selected" : ""}`}
                      onClick={() => setBodytype(item.val)}
                    >
                      <span className="option-card__emoji">{item.emoji}</span>
                      <span className="option-card__title">{item.title}</span>
                      <span className="option-card__sub">{item.sub}</span>
                    </button>
                  ))}
                </div>
                <UnclearQuestionButton questionId="body_type" stage={3} />
              </div>
            )}

            {/* STEP 4 — ENGINE / FUEL */}
            {step === 4 && (
              <div className="step" data-step="4">
                <p className="quiz-eyebrow">เรื่องเครื่องยนต์</p>
                <h2 className="quiz-q">อยากได้ขุมพลังแบบไหน?</h2>

                <div className="option-grid" data-group="fuel">
                  {[
                    { val: "any", emoji: "🤷", title: "ไม่กำหนด", sub: "คันไหนคุ้มก็เอา" },
                    { val: "petrol", emoji: "⛽️", title: "น้ำมันเบนซิน", sub: "หาปั๊มง่าย ซ่อมง่าย" },
                    { val: "diesel", emoji: "🛢️", title: "น้ำมันดีเซล", sub: "แรงบิดดี ทนทาน เหมาะลุยงาน" },
                    { val: "hybrid", emoji: "🔋", title: "ไฮบริด", sub: "ประหยัด ไม่ต้องพึ่งที่ชาร์จ" },
                    { val: "ev", emoji: "⚡️", title: "ไฟฟ้า (EV)", sub: "เงียบ ไม่มีค่าน้ำมันเลย" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      className={`option-card ${fuel === item.val ? "is-selected" : ""}`}
                      onClick={() => setFuel(item.val)}
                    >
                      <span className="option-card__emoji">{item.emoji}</span>
                      <span className="option-card__title">{item.title}</span>
                      <span className="option-card__sub">{item.sub}</span>
                    </button>
                  ))}
                </div>
                <UnclearQuestionButton questionId="fuel_powertrain" stage={4} />
              </div>
            )}

            {/* STEP 5 — BRANDS */}
            {step === 5 && (
              <div className="step" data-step="5">
                <p className="quiz-eyebrow">ข้อสุดท้ายแล้ว</p>
                <h2 className="quiz-q">แบรนด์ในดวงใจที่ชอบเป็นพิเศษ?</h2>
                <p className="quiz-hint">
                  เลือกได้สูงสุด <strong>3 แบรนด์</strong> (หากไม่ระบุ ระบบจะตั้งค่าเป็น "อะไรก็ได้" ให้ครับ)
                </p>

                <div className="option-grid option-grid--brands" data-group="brands" data-max="3">
                  <button
                    type="button"
                    className={`option-card option-card--brand ${brands.includes("any") ? "is-selected" : ""}`}
                    style={{ gridColumn: "1 / -1" }}
                    onClick={() => setBrands(["any"])}
                  >
                    อะไรก็ได้ (ไม่จำกัด)
                  </button>
                  {[
                    "Audi", "BMW", "BYD", "Changan", "Chevrolet", "Ford", "GAC", "GWM", "Honda",
                    "Hyundai", "Isuzu", "Kia", "Lexus", "Mazda", "Mercedes-Benz", "MG", "MINI",
                    "Mitsubishi", "Neta", "Nissan", "Peugeot", "Porsche", "Subaru", "Suzuki",
                    "Tesla", "Toyota", "Volvo"
                  ].map((b) => {
                    const isSel = brands.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        className={`option-card option-card--brand ${isSel ? "is-selected" : ""}`}
                        onClick={() => {
                          let updated = brands.filter((x) => x !== "any");
                          if (isSel) {
                            updated = updated.filter((x) => x !== b);
                            if (updated.length === 0) updated = ["any"];
                          } else {
                            if (updated.length >= 3) {
                              setShake(true);
                              setTimeout(() => setShake(false), 400);
                              return;
                            }
                            updated.push(b);
                          }
                          setBrands(updated);
                        }}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
                <UnclearQuestionButton questionId="brand_preference" stage={5} />
              </div>
            )}

            {step === 6 && (
              <div className="step" data-step="6">
                <p className="quiz-eyebrow">โค้งสุดท้ายแล้ว</p>
                <h2 className="quiz-q">คุณให้ความสำคัญกับเรื่องใดมากที่สุด?</h2>
                <p className="quiz-hint">เราจะนำสิ่งนี้ไปเป็นเกณฑ์หลักในการคัดเลือกรถให้คุณ</p>

                <div className="option-grid option-grid--priority">
                  {[
                    { val: "none", emoji: "⚖️", title: "สมดุลทุกด้าน", sub: "ให้คะแนนแบบมาตรฐาน ครบเครื่องทุกมิติ" },
                    { val: "budget", emoji: "💰", title: "ความคุ้มค่า / งบประมาณ", sub: "เน้นรถที่ราคาอยู่ในงบ ประหยัด คุ้มค่าเงินที่สุด" },
                    { val: "lifestyle", emoji: "🏄‍♂️", title: "ตอบโจทย์ไลฟ์สไตล์", sub: "เน้นการใช้งานจริงตามลักษณะชีวิตที่คุณเลือก" },
                    { val: "bodytype", emoji: "🚙", title: "รูปทรงรถที่ชอบ", sub: "เน้นทรงรถและพื้นที่ห้องโดยสารที่คุณต้องการ" },
                    { val: "brand", emoji: "❤️", title: "แบรนด์ที่ไว้ใจ", sub: "เน้นยี่ห้อรถที่คุณชื่นชอบและมั่นใจในศูนย์บริการ" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      className={`option-card option-card--prio ${priority === p.val ? "is-selected" : ""}`}
                      onClick={() => setPriority(p.val)}
                    >
                      <span className="option-card__emoji">{p.emoji}</span>
                      <span className="option-card__title">{p.title}</span>
                      <span className="option-card__sub">{p.sub}</span>
                    </button>
                  ))}
                </div>
                <UnclearQuestionButton questionId="priority_weight" stage={6} />
              </div>
            )}

            <div className="quiz-nav">
              <button
                type="button"
                id="backBtn"
                className="btn-ghost"
                style={{ visibility: step === 1 ? "hidden" : "visible" }}
                onClick={() => setStep(step - 1)}
              >
                ← ย้อนกลับ
              </button>
              <button
                type="button"
                id="nextBtn"
                className={`btn-primary ${!stepIsReady(step) ? "is-not-ready" : ""}`}
                onClick={handleNext}
              >
                {loading ? "กำลังคำนวณ..." : step === 5 ? "ดูผลลัพธ์" : "ถัดไป"}
              </button>
            </div>
          </section>
        )}

        {/* STAGE 2 · COMPARE */}
        {started && macroStage === 2 && (
          <section className="results" id="resultsSection">
            <div className="results__intro">
              <p className="results__eyebrow">สรุปให้แล้วนะ</p>
              <h2>นี่คือรถที่เราว่าเหมาะกับพี่ที่สุด</h2>
              <p className="results__sub" id="resultsSummary">
                {`จากงบ ${formatBaht(budgetK * 1000)} สาย${getDerivedLifestyleText()} ${
                  bodytype === "unsure" || !bodytype ? "" : `ทรง ${BODYTYPE_LABEL[bodytype]} `
                }— นี่คือ ${shortlist.length} คันที่ได้คะแนนสูงสุด (คัดกรองจากฐานข้อมูลทั้งหมด ${CARS_DATASET.length} คัน)`}
              </p>
            </div>

            {/* VIEW MODE TOGGLE SWITCHER */}
            <div className="view-toggle-bar">
              <span className="view-toggle-label">เลือกรูปแบบการเปรียบเทียบ:</span>
              <div className="view-toggle-buttons">
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === "card" ? "is-active" : ""}`}
                  onClick={() => setViewMode("card")}
                >
                  🎴 มุมมองการ์ด (Card View)
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === "table" ? "is-active" : ""}`}
                  onClick={() => setViewMode("table")}
                >
                  📊 ตารางเปรียบเทียบสเปครายหัวข้อ (Multi-Car Matrix)
                </button>
              </div>
            </div>

            {viewMode === "card" ? (
              <div className="results__grid" id="resultsGrid">
                {shortlist.map(({ car, score, reasons, reviews, complaints }, idx) => {
                  const tier = matchTier(score);
                  const rangeInfo = getRangeEstimate(car);
                  const details = generateCarDetails(car);

                  return (
                    <article key={car.id} className="car-card">
                      <div className="car-card__art" style={{ position: "relative" }}>
                        <CarVisual
                          car={car}
                          customImage={cardSelectedColor[car.id]?.imageFile ? `/cars/${cardSelectedColor[car.id].imageFile}` : undefined}
                          filter={cardSelectedColor[car.id]?.filter}
                        />
                      </div>
                      <CarCardColorBar
                        carName={car.name}
                        onColorSelect={(col) => {
                          setCardSelectedColor((prev) => ({ ...prev, [car.id]: col }));
                        }}
                        onOpen3D={() => {
                          setConfiguratorCar(car);
                          setIsConfiguratorOpen(true);
                        }}
                      />
                      <div className="car-card__top">
                        <div>
                          <div className="car-card__name-row">
                            <p className="car-card__name">{car.name}</p>
                            <span className="car-card__flag">{NATIONALITY_FLAG[car.nationality]}</span>
                          </div>
                          <p className="car-card__category">{BODYTYPE_LABEL[car.bodyType]}</p>
                        </div>
                        <div className="score-ring">
                          {scoreRingSVG(score, tier.ring)}
                          <span className={`score-ring__label ${tier.cls}`}>{score}</span>
                        </div>
                      </div>
                      <p className="car-card__price">{formatBaht(car.price)}</p>
                      <div className="car-card__specs">
                        <span className="spec-pill">{car.consumption}</span>
                        <span className="spec-pill">{car.seats} ที่นั่ง</span>
                        <span className="spec-pill">{FUEL_LABEL[car.fuelType]}</span>
                        {extraSpecPills(car)}
                      </div>

                      {rangeInfo.type === "ev" ? (
                        <div className="car-card__range-info car-card__range-info--ev">
                          <span>⚡️ วิ่งสูงสุด (100%): <strong>{rangeInfo.range100} กม.</strong></span>
                          <span className="range-sep">|</span>
                          <span>🔋 แนะนำ (80% เมืองร้อน): <strong className="range-val--safe">{rangeInfo.range80} กม.</strong></span>
                        </div>
                      ) : (
                        <div className="car-card__range-info car-card__range-info--ice">
                          <span>⛽️ วิ่งเต็มถัง ({rangeInfo.tankSize}L): <strong>~{rangeInfo.range} กม.</strong></span>
                        </div>
                      )}

                      <p className="car-card__reason">
                        <strong className={tier.cls}>{tier.label}</strong> — {reasons.join(" · ")}
                      </p>

                      <div className="car-card__details-accordion">
                        <details className="card-details-item">
                          <summary className="card-details-summary">✨ จุดเด่น & สีตัวถัง</summary>
                          <div className="card-details-content">
                            <p><strong>รายละเอียดเบื้องต้น:</strong> {details.intro}</p>
                            <p><strong>จุดเด่นสำคัญ:</strong></p>
                            <ul>
                              {details.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}
                            </ul>
                            <p><strong>สีตัวถังภายนอก:</strong></p>
                            <div className="details-colors">{details.colors.join(" · ")}</div>
                          </div>
                        </details>

                        <details className="card-details-item">
                          <summary className="card-details-summary">🎨 ดีไซน์ภายนอก & ภายใน</summary>
                          <div className="card-details-content">
                            <p><strong>ดีไซน์ภายนอก:</strong></p>
                            <ul>
                              {details.exterior.map((ext: string, i: number) => <li key={i}>{ext}</li>)}
                            </ul>
                            <p><strong>ดีไซน์ภายใน:</strong></p>
                            <ul>
                              {details.interior.map((int: string, i: number) => <li key={i}>{int}</li>)}
                            </ul>
                          </div>
                        </details>

                        <details className="card-details-item">
                          <summary className="card-details-summary">🛡️ สเปคเครื่องยนต์ & ความปลอดภัย</summary>
                          <div className="card-details-content">
                            <p><strong>ระบบขับเคลื่อน:</strong> {details.specs}</p>
                            <p><strong>ระบบความปลอดภัย:</strong></p>
                            <ul>
                              {details.safety.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        </details>
                        <details className="card-details-item" open>
                          <summary className="card-details-summary">🗣️ รีวิวและข้อพิจารณา</summary>
                          <div className="card-details-content">
                            <p><strong>🌐 รีวิวสดจากเว็บชั้นนำ (Pantip / HeadlightMag / One2Car):</strong></p>
                            <ul style={{ marginBottom: "14px", listStyle: "none", paddingLeft: 0 }}>
                              {reviews?.map((r: any, i: number) => (
                                <li key={`rev-${i}`} style={{ marginBottom: "10px", padding: "8px 12px", background: "rgba(15, 23, 42, 0.04)", borderRadius: "8px", borderLeft: "3px solid #38BDF8" }}>
                                  <div style={{ fontWeight: 600, fontSize: "13px", color: "#0F172A" }}>
                                    {r.title || r.text}
                                  </div>
                                  {r.title && (
                                    <div style={{ fontSize: "12px", color: "#475569", marginTop: "3px" }}>
                                      "{r.text}"
                                    </div>
                                  )}
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "11px", color: "#64748B" }}>
                                    <span>— {r.author}</span>
                                    {r.link && (
                                      <a href={r.link} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "underline", fontWeight: 600 }}>
                                        🔗 อ่านกระทู้/รีวิวจริง →
                                      </a>
                                    )}
                                  </div>
                                </li>
                              ))}
                              {(!reviews || reviews.length === 0) && <li>ยังไม่มีข้อมูลรีวิว</li>}
                            </ul>
                            <p><strong>ข้อพิจารณาที่พบบ่อย (Common Issues):</strong></p>
                            <ul>
                              {complaints?.map((c, i) => (
                                <li key={`comp-${i}`}>
                                  {c.issue} <br/><small style={{ color: "#F87171" }}>({c.frequency})</small>
                                </li>
                              ))}
                              {(!complaints || complaints.length === 0) && <li>ยังไม่มีข้อมูลข้อพิจารณา</li>}
                            </ul>
                          </div>
                        </details>
                      </div>

                      {idx === 0 && (
                        <RecommendationRating
                          carId={car.id}
                          carName={car.name}
                          context={{
                            recommended_car_id: car.id,
                            match_score: score,
                            top3: shortlist.slice(0, 3).map((s) => ({
                              id: s.car.id,
                              name: s.car.name,
                              score: s.score,
                            })),
                            quiz_answers: {
                              budgetK,
                              incomeK,
                              pains,
                              gains,
                              bodytype,
                              fuel,
                              brands,
                              priority,
                            },
                            source: "top_recommendation_card",
                          }}
                        />
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (() => {
              const car1Item = resolveCarItem(compareCarId1, shortlist[0]);
              const car2Item = resolveCarItem(compareCarId2, shortlist[1] || shortlist[0]);

              const renderCarCol = (item: RecommendationResult | undefined) => {
                if (!item) return null;
                const { car, score, reasons, reviews, complaints, tco } = item;
                const tier = matchTier(score);
                const r = getRangeEstimate(car);
                const calc = calcTCO(car);
                const monthlyInstallment = calcMonthlyInstallment(car, downPaymentRate, termMonths);

                return { car, score, tier, r, calc, reasons, reviews, complaints, monthlyInstallment, tco };
              };

              const c1 = renderCarCol(car1Item);
              const c2 = renderCarCol(car2Item);

              return (
                <div className="comparison-matrix-wrapper">
                  <div className="matrix-dropdown-toolbar">
                    <div className="matrix-dropdown-box">
                      <label className="matrix-dropdown-label">🚗 เลือกรถคันที่ 1 (ฝั่งซ้าย):</label>
                      <select
                        className="matrix-dropdown-select"
                        value={compareCarId1 || (car1Item ? car1Item.car.id : "")}
                        onChange={(e) => setCompareCarId1(Number(e.target.value))}
                      >
                        <optgroup label="⭐ รถที่ระบบแนะนำ (Top Recommendations)">
                          {shortlist.map(({ car, score }) => (
                            <option key={`m1-s-${car.id}`} value={car.id}>
                              {car.name} (คะแนน {score}/100)
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="📋 รถทั้งหมดในฐานข้อมูล (All 125 Models)">
                          {CARS_DATASET.filter((c) => !shortlist.some((s) => s.car.id === c.id)).map((car) => (
                            <option key={`m1-all-${car.id}`} value={car.id}>
                              {car.name} ({formatBaht(car.price)})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div className="matrix-vs-badge">VS</div>

                    <div className="matrix-dropdown-box">
                      <label className="matrix-dropdown-label">🚙 เลือกรถคันที่ 2 (ฝั่งขวา):</label>
                      <select
                        className="matrix-dropdown-select"
                        value={compareCarId2 || (car2Item ? car2Item.car.id : "")}
                        onChange={(e) => setCompareCarId2(Number(e.target.value))}
                      >
                        <optgroup label="⭐ รถที่ระบบแนะนำ (Top Recommendations)">
                          {shortlist.map(({ car, score }) => (
                            <option key={`m2-s-${car.id}`} value={car.id}>
                              {car.name} (คะแนน {score}/100)
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="📋 รถทั้งหมดในฐานข้อมูล (All 125 Models)">
                          {CARS_DATASET.filter((c) => !shortlist.some((s) => s.car.id === c.id)).map((car) => (
                            <option key={`m2-all-${car.id}`} value={car.id}>
                              {car.name} ({formatBaht(car.price)})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div className="comparison-matrix-scroll">
                    <table className="comparison-matrix-table matrix-table-2col">
                      <thead>
                        <tr>
                          <th className="matrix-topic-col">หัวข้อการเปรียบเทียบ</th>
                          <th className="matrix-car-col">
                            {c1?.car && (
                              <div className="matrix-car-header">
                                <CarVisual car={c1.car} sizeClass="car-art--sm" />
                                <div className="matrix-car-title">{c1.car.name} {NATIONALITY_FLAG[c1.car.nationality]}</div>
                                <span className="matrix-car-badge">{BODYTYPE_LABEL[c1.car.bodyType]}</span>
                              </div>
                            )}
                          </th>
                          <th className="matrix-car-col">
                            {c2?.car && (
                              <div className="matrix-car-header">
                                <CarVisual car={c2.car} sizeClass="car-art--sm" />
                                <div className="matrix-car-title">{c2.car.name} {NATIONALITY_FLAG[c2.car.nationality]}</div>
                                <span className="matrix-car-badge">{BODYTYPE_LABEL[c2.car.bodyType]}</span>
                              </div>
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="matrix-topic-label">🎯 คะแนนความเหมาะสม</td>
                          <td className="matrix-data-cell text-center">
                            {c1?.score !== undefined && <span className={`score-badge ${c1.tier.cls}`}>{c1.score}/100 ({c1.tier.label})</span>}
                          </td>
                          <td className="matrix-data-cell text-center">
                            {c2?.score !== undefined && <span className={`score-badge ${c2.tier.cls}`}>{c2.score}/100 ({c2.tier.label})</span>}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">🏷️ ราคาตัวรถป้ายแดง</td>
                          <td className="matrix-data-cell text-center font-bold highlight-price">
                            {c1?.car && formatBaht(c1.car.price)}
                          </td>
                          <td className="matrix-data-cell text-center font-bold highlight-price">
                            {c2?.car && formatBaht(c2.car.price)}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">⛽️ เชื้อเพลิง &amp; ระบบส่งกำลัง</td>
                          <td className="matrix-data-cell text-center">
                            {c1?.car && `${FUEL_LABEL[c1.car.fuelType]} (${c1.car.transmission === "auto" ? "เกียร์ออโต้" : "เกียร์ธรรมดา"})`}
                          </td>
                          <td className="matrix-data-cell text-center">
                            {c2?.car && `${FUEL_LABEL[c2.car.fuelType]} (${c2.car.transmission === "auto" ? "เกียร์ออโต้" : "เกียร์ธรรมดา"})`}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">🌱 การประหยัด &amp; ระยะทางวิ่ง</td>
                          <td className="matrix-data-cell text-center">
                            {c1?.car && c1.r && (
                              <div>
                                <div style={{ fontWeight: 700, fontSize: "15px" }}>{c1.car.consumption}</div>
                                <small style={{ color: "#38BDF8" }}>
                                  {c1.r.type === "ev" ? `ชาร์จ 100%: ${c1.r.range100} กม.` : `วิ่งเต็มถัง: ~${c1.r.range} กม.`}
                                </small>
                              </div>
                            )}
                          </td>
                          <td className="matrix-data-cell text-center">
                            {c2?.car && c2.r && (
                              <div>
                                <div style={{ fontWeight: 700, fontSize: "15px" }}>{c2.car.consumption}</div>
                                <small style={{ color: "#38BDF8" }}>
                                  {c2.r.type === "ev" ? `ชาร์จ 100%: ${c2.r.range100} กม.` : `วิ่งเต็มถัง: ~${c2.r.range} กม.`}
                                </small>
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">🐎 สมรรถนะแรงม้า</td>
                          <td className="matrix-data-cell text-center font-bold">{c1?.car && `${c1.car.horsepower} แรงม้า`}</td>
                          <td className="matrix-data-cell text-center font-bold">{c2?.car && `${c2.car.horsepower} แรงม้า`}</td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">🛡️ ถุงลมนิรภัย &amp; รับประกัน</td>
                          <td className="matrix-data-cell text-center">
                            {c1?.car && `ถุงลม ${c1.car.airbags} ใบ · วารันตี ${c1.car.warrantyYears} ปี (${c1.car.warrantyKm.toLocaleString()} กม.)`}
                          </td>
                          <td className="matrix-data-cell text-center">
                            {c2?.car && `ถุงลม ${c2.car.airbags} ใบ · วารันตี ${c2.car.warrantyYears} ปี (${c2.car.warrantyKm.toLocaleString()} กม.)`}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">💵 ประมาณการค่างวด/เดือน</td>
                          <td className="matrix-data-cell text-center font-bold highlight-monthly">
                            {c1?.monthlyInstallment && `~${formatBaht(c1.monthlyInstallment)} / เดือน`}
                          </td>
                          <td className="matrix-data-cell text-center font-bold highlight-monthly">
                            {c2?.monthlyInstallment && `~${formatBaht(c2.monthlyInstallment)} / เดือน`}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">💰 ประมาณการค่าใช้จ่าย 5 ปี (TCO)</td>
                          <td className="matrix-data-cell text-center font-bold highlight-tco">
                            {c1 && formatBaht(c1.tco?.total5yr || c1.calc?.total5yr || 0)}
                          </td>
                          <td className="matrix-data-cell text-center font-bold highlight-tco">
                            {c2 && formatBaht(c2.tco?.total5yr || c2.calc?.total5yr || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">✨ เหตุผลหลักที่เหมาะกับพี่</td>
                          <td className="matrix-data-cell text-left">
                            <ul style={{ paddingLeft: "18px", margin: 0 }}>
                              {c1?.reasons?.map((rs: string, idx: number) => <li key={idx} style={{ marginBottom: "4px" }}>{rs}</li>)}
                            </ul>
                          </td>
                          <td className="matrix-data-cell text-left">
                            <ul style={{ paddingLeft: "18px", margin: 0 }}>
                              {c2?.reasons?.map((rs: string, idx: number) => <li key={idx} style={{ marginBottom: "4px" }}>{rs}</li>)}
                            </ul>
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">🗣️ รีวิวสดจากเว็บจริง</td>
                          <td className="matrix-data-cell text-left">
                            {c1?.reviews && c1.reviews.length > 0 ? (
                              <div style={{ fontSize: "13px" }}>
                                <div style={{ fontWeight: 600, color: "#38BDF8" }}>{c1.reviews[0].title || c1.reviews[0].source}</div>
                                <div style={{ marginTop: "4px", fontSize: "12px", color: "#CBD5E1" }}>"{c1.reviews[0].text}"</div>
                                <div style={{ marginTop: "6px", fontSize: "11px", color: "#94A3B8" }}>
                                  — {c1.reviews[0].author}{" "}
                                  {c1.reviews[0].link && (
                                    <a href={c1.reviews[0].link} target="_blank" rel="noopener noreferrer" style={{ color: "#38BDF8", textDecoration: "underline", marginLeft: "6px" }}>
                                      [อ่านกระทู้นี้]
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : "-"}
                          </td>
                          <td className="matrix-data-cell text-left">
                            {c2?.reviews && c2.reviews.length > 0 ? (
                              <div style={{ fontSize: "13px" }}>
                                <div style={{ fontWeight: 600, color: "#38BDF8" }}>{c2.reviews[0].title || c2.reviews[0].source}</div>
                                <div style={{ marginTop: "4px", fontSize: "12px", color: "#CBD5E1" }}>"{c2.reviews[0].text}"</div>
                                <div style={{ marginTop: "6px", fontSize: "11px", color: "#94A3B8" }}>
                                  — {c2.reviews[0].author}{" "}
                                  {c2.reviews[0].link && (
                                    <a href={c2.reviews[0].link} target="_blank" rel="noopener noreferrer" style={{ color: "#38BDF8", textDecoration: "underline", marginLeft: "6px" }}>
                                      [อ่านกระทู้นี้]
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : "-"}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">⚠️ ข้อพิจารณาที่พบบ่อย</td>
                          <td className="matrix-data-cell text-left">
                            {c1?.complaints && c1.complaints.length > 0 ? (
                              <div>
                                <span style={{ color: "#F87171" }}>• {c1.complaints[0].issue}</span>
                                <br/><small style={{ color: "#94A3B8" }}>({c1.complaints[0].frequency})</small>
                              </div>
                            ) : "-"}
                          </td>
                          <td className="matrix-data-cell text-left">
                            {c2?.complaints && c2.complaints.length > 0 ? (
                              <div>
                                <span style={{ color: "#F87171" }}>• {c2.complaints[0].issue}</span>
                                <br/><small style={{ color: "#94A3B8" }}>({c2.complaints[0].frequency})</small>
                              </div>
                            ) : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            <div className="stage-nav">
              <div className="stage-nav__secondary">
                <button
                  type="button"
                  id="editBtn"
                  className="btn-ghost"
                  onClick={() => {
                    setStep(5);
                    setMacroStage(1);
                  }}
                >
                  ← แก้คำตอบ
                </button>
                <button type="button" id="restartBtn" className="btn-ghost" onClick={fullRestart}>
                  ↺ เริ่มตอบใหม่
                </button>
              </div>
              <button
                type="button"
                id="toCostRiskBtn"
                className="btn-primary"
                onClick={() => setMacroStage(3)}
              >
                ดูค่าใช้จ่าย 5 ปี &amp; ความเสี่ยง →
              </button>
            </div>
          </section>
        )}

        {/* STAGE 3 · COST & RISK */}
        {started && macroStage === 3 && (
          <section className="results" id="costRiskSection">
            <div className="results__intro">
              <p className="results__eyebrow">AI predicts cost &amp; risk</p>
              <h2>ราคาป้ายไม่ใช่ต้นทุนทั้งหมด</h2>
              <p className="results__sub">
                ประมาณการค่าใช้จ่ายรวม 5 ปี (ซื้อ + น้ำมัน/ไฟ + ประกัน + ซ่อมบำรุง − มูลค่าขายต่อ) และข้อควรรู้ก่อนตัดสินใจของแต่ละคัน
              </p>
            </div>

            {/* LOAN ADJUSTER PANEL */}
            <div style={{ background: "rgba(15, 23, 42, 0.4)", border: "1px solid #334155", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#F8FAFC" }}>⚙️ ปรับแต่งการคำนวณค่างวด</h3>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "8px" }}>
                    เงินดาวน์: {Math.round(downPaymentRate * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.05"
                    value={downPaymentRate}
                    onChange={(e) => setDownPaymentRate(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#38BDF8" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                    <span>0%</span>
                    <span>20%</span>
                    <span>40%</span>
                  </div>
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "8px" }}>
                    ระยะเวลาผ่อน: {termMonths} งวด
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[48, 60, 72, 84].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTermMonths(t)}
                        style={{
                          flex: 1, padding: "6px", borderRadius: "6px", fontSize: "13px",
                          background: termMonths === t ? "#38BDF8" : "transparent",
                          color: termMonths === t ? "#0F172A" : "#94A3B8",
                          border: `1px solid ${termMonths === t ? "#38BDF8" : "#475569"}`,
                          cursor: "pointer", fontWeight: termMonths === t ? 600 : 400
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>


            {/* VIEW MODE TOGGLE SWITCHER FOR COST & RISK */}
            <div className="view-toggle-bar">
              <span className="view-toggle-label">เลือกรูปแบบการแสดงผลต้นทุน &amp; ความเสี่ยง:</span>
              <div className="view-toggle-buttons">
                <button
                  type="button"
                  className={`view-toggle-btn ${costRiskViewMode === "card" ? "is-active" : ""}`}
                  onClick={() => setCostRiskViewMode("card")}
                >
                  🎴 มุมมองการ์ด (Card View)
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${costRiskViewMode === "table" ? "is-active" : ""}`}
                  onClick={() => setCostRiskViewMode("table")}
                >
                  📊 ตารางเทียบต้นทุน TCO 2 คัน (2-Car Cost Matrix)
                </button>
              </div>
            </div>

            {costRiskViewMode === "card" ? (
              <div className="cost-risk-grid" id="costRiskGrid">
                {shortlist.map(({ car }) => {
                  const tco = calcTCO(car);
                  const notes = riskNotes(car);
                  const monthly = calcMonthlyInstallment(car, downPaymentRate, termMonths);
                  const ratio = monthly / (incomeK * 1000);
                  const afford = affordabilityTier(ratio);
                  const isEV = car.fuelType === "ev";

                  return (
                    <article key={car.id} className="tco-card">
                      <div className="car-card__art">
                        <CarVisual
                          car={car}
                          customImage={cardSelectedColor[car.id]?.imageFile ? `/cars/${cardSelectedColor[car.id].imageFile}` : undefined}
                          filter={cardSelectedColor[car.id]?.filter}
                        />
                      </div>
                      <div className="tco-card__head">
                        <p className="tco-card__name">{car.name}</p>
                        <span className="tco-card__sticker">ราคาป้าย {formatBaht(car.price)}</span>
                      </div>
                      <div className={`afford-box ${afford.cls}`}>
                        <strong>ค่างวดโดยประมาณ {formatBaht(monthly)} / เดือน</strong>
                        คิดเป็นราว {Math.round(ratio * 100)}% ของรายได้ที่แจ้งไว้ — {afford.label}
                        <small>
                          สมมติดาวน์ 15% ผ่อน 5 ปี ดอกเบี้ยเฉลี่ย ~2.99%/ปี (แบบ flat rate) เป็นตัวเลขประมาณเพื่อการศึกษา ไม่ใช่ข้อเสนอไฟแนนซ์จริง
                        </small>
                      </div>
                      <table className="tco-table">
                        <tbody>
                          <tr>
                            <td>ราคารถ</td>
                            <td>{formatBaht(car.price)}</td>
                          </tr>
                          <tr>
                            <td>ค่าประกันภัย (5 ปี)</td>
                            <td>+{formatBaht(tco.insurance5yr)}</td>
                          </tr>
                          <tr>
                            <td>ค่าซ่อมบำรุง (5 ปี)</td>
                            <td>+{formatBaht(tco.maint5yr)}</td>
                          </tr>
                          <tr className="tco-negative">
                            <td>มูลค่าขายต่อ (โดยประมาณ)</td>
                            <td>−{formatBaht(tco.resaleValue)}</td>
                          </tr>
                          <tr className="tco-total">
                            <td>รวมต้นทุนถือครอง 5 ปี</td>
                            <td>{formatBaht(tco.total5yr)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="tco-total-note">
                        ตัวเลขประมาณการค่าเสื่อมราคาและค่าบำรุงรักษาเพื่อสาธิตระบบเท่านั้น ไม่ใช่ราคาอ้างอิงจริงทางตลาดแบบเรียลไทม์
                      </p>

                      {isEV ? (
                        <details className="tco-card__details">
                          <summary className="tco-card__summary">💡 ดูที่มาและรายละเอียดคำนวณ (ระยะวิ่ง 5 ปี / 100,000 กม.)</summary>
                          <div className="tco-card__breakdown">
                            <p style={{ margin: 0, fontWeight: 600, color: "var(--card-light-ink)" }}>📊 เกณฑ์ประมาณการสำหรับรถยนต์ไฟฟ้า (EV):</p>
                            <strong>🛡️ ค่าประกันภัยชั้น 1 (เฉลี่ย 5 ปีสะสม): ~{formatBaht(tco.insurance5yr)}</strong>
                            <ul>
                              <li>ปีที่ 1: ฟรีประกันภัยชั้น 1 (แคมเปญส่งเสริมการขาย)</li>
                              <li>ปีที่ 2-5: อัตราเบี้ยปีละ 1.8% - 2.8% ของราคารถ (ปรับลดตามค่าเสื่อมทุนประกันรายปี)</li>
                            </ul>
                            <strong>🔧 ค่าซ่อมบำรุงและอะไหล่สิ้นเปลือง: ~{formatBaht(tco.maint5yr)}</strong>
                            <ul>
                              <li>เช็คระยะศูนย์บริการทุกๆ 15,000 - 20,000 กม. หรือ 12 เดือน (เฉลี่ยครั้งละ 1,000 - 2,000 บาท สำหรับตรวจเช็คระบบไฟฟ้า น้ำยาหล่อเย็น และกรองแอร์)</li>
                              <li>เปลี่ยนยางใหม่ 1 ชุด (เนื่องจากรถ EV มีน้ำหนักแบตเตอรี่มากและแรงบิดสูง ดอกยางจึงสึกไวกว่าปกติ)</li>
                              <li>เปลี่ยนแบตเตอรี่ 12V ทั่วไป (1-2 ลูกในระยะ 5 ปี)</li>
                            </ul>
                          </div>
                        </details>
                      ) : (
                        <details className="tco-card__details">
                          <summary className="tco-card__summary">💡 ดูที่มาและรายละเอียดคำนวณ (ระยะวิ่ง 5 ปี / 100,000 กม.)</summary>
                          <div className="tco-card__breakdown">
                            <p style={{ margin: 0, fontWeight: 600, color: "var(--card-light-ink)" }}>📊 เกณฑ์ประมาณการสำหรับรถเครื่องยนต์/ไฮบริด:</p>
                            <strong>🛡️ ค่าประกันภัยชั้น 1 (เฉลี่ย 5 ปีสะสม): ~{formatBaht(tco.insurance5yr)}</strong>
                            <ul>
                              <li>ปีที่ 1: ฟรีประกันภัยชั้น 1 (ของแถมมาตรฐานโชว์รูม)</li>
                              <li>ปีที่ 2-5: อัตราเบี้ยปีละ 1.5% - 2.5% ของราคารถ (ปรับลดตามค่าเสื่อมทุนประกันรายปี)</li>
                            </ul>
                            <strong>🔧 ค่าซ่อมบำรุงและอะไหล่สิ้นเปลือง: ~{formatBaht(tco.maint5yr)}</strong>
                            <ul>
                              <li>เช็คระยะศูนย์บริการทุกๆ 10,000 กม. หรือ 6 เดือน (เปลี่ยนน้ำมันเครื่อง, ไส้กรอง, น้ำมันเกียร์, หัวเทียน, และของเหลวตามรอบ)</li>
                              <li>รอบเช็คระยะปกติ (10k-30k, 50k-70k, 90k กม.) เฉลี่ยครั้งละ 1,500 - 3,000 บาท</li>
                              <li>รอบเช็คระยะใหญ่ (40k, 80k, 100k กม.) เฉลี่ยครั้งละ 5,000 - 8,000 บาท</li>
                              <li>เปลี่ยนยางใหม่ 1 ชุด, แบตเตอรี่ 12V (2 ลูก) และผ้าเบรกตามอายุการใช้งาน</li>
                            </ul>
                          </div>
                        </details>
                      )}

                      <ul className="risk-list">
                        {notes.map((n, i) => (
                          <li key={i}>
                            <span className="risk-icon">{n.icon}</span>
                            <span>{n.text}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            ) : (() => {
              const item1 = resolveCarItem(compareCarId1, shortlist[0]);
              const item2 = resolveCarItem(compareCarId2, shortlist[1] || shortlist[0]);

              const getCostData = (item: RecommendationResult | undefined) => {
                if (!item) return null;
                const car = item.car;
                const tco = item.tco || calcTCO(car);
                const notes = riskNotes(car);
                const monthly = calcMonthlyInstallment(car, downPaymentRate, termMonths);
                const ratio = monthly / (incomeK * 1000);
                const afford = affordabilityTier(ratio);
                return { car, tco, notes, monthly, ratio, afford };
              };

              const d1 = getCostData(item1);
              const d2 = getCostData(item2);

              return (
                <div className="comparison-matrix-wrapper">
                  <div className="matrix-dropdown-toolbar">
                    <div className="matrix-dropdown-box">
                      <label className="matrix-dropdown-label">🚗 เลือกรถคันที่ 1 (ฝั่งซ้าย):</label>
                      <select
                        className="matrix-dropdown-select"
                        value={compareCarId1 || (item1 ? item1.car.id : "")}
                        onChange={(e) => setCompareCarId1(Number(e.target.value))}
                      >
                        <optgroup label="⭐ รถที่ระบบแนะนำ (Top Recommendations)">
                          {shortlist.map(({ car, score }) => (
                            <option key={`c1-s-${car.id}`} value={car.id}>
                              {car.name} (คะแนน {score}/100)
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="📋 รถทั้งหมดในฐานข้อมูล (All 125 Models)">
                          {CARS_DATASET.filter((c) => !shortlist.some((s) => s.car.id === c.id)).map((car) => (
                            <option key={`c1-all-${car.id}`} value={car.id}>
                              {car.name} ({formatBaht(car.price)})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div className="matrix-vs-badge">VS</div>

                    <div className="matrix-dropdown-box">
                      <label className="matrix-dropdown-label">🚙 เลือกรถคันที่ 2 (ฝั่งขวา):</label>
                      <select
                        className="matrix-dropdown-select"
                        value={compareCarId2 || (item2 ? item2.car.id : "")}
                        onChange={(e) => setCompareCarId2(Number(e.target.value))}
                      >
                        <optgroup label="⭐ รถที่ระบบแนะนำ (Top Recommendations)">
                          {shortlist.map(({ car, score }) => (
                            <option key={`c2-s-${car.id}`} value={car.id}>
                              {car.name} (คะแนน {score}/100)
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="📋 รถทั้งหมดในฐานข้อมูล (All 125 Models)">
                          {CARS_DATASET.filter((c) => !shortlist.some((s) => s.car.id === c.id)).map((car) => (
                            <option key={`c2-all-${car.id}`} value={car.id}>
                              {car.name} ({formatBaht(car.price)})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div className="comparison-matrix-scroll">
                    <table className="comparison-matrix-table matrix-table-2col">
                      <thead>
                        <tr>
                          <th className="matrix-topic-col">หัวข้อต้นทุน &amp; ความเสี่ยง</th>
                          <th className="matrix-car-col">
                            {d1 && (
                              <div className="matrix-car-header">
                                <CarVisual car={d1.car} sizeClass="car-art--sm" />
                                <div className="matrix-car-title">{d1.car.name} {NATIONALITY_FLAG[d1.car.nationality]}</div>
                                <span className="matrix-car-badge">ราคาป้าย {formatBaht(d1.car.price)}</span>
                              </div>
                            )}
                          </th>
                          <th className="matrix-car-col">
                            {d2 && (
                              <div className="matrix-car-header">
                                <CarVisual car={d2.car} sizeClass="car-art--sm" />
                                <div className="matrix-car-title">{d2.car.name} {NATIONALITY_FLAG[d2.car.nationality]}</div>
                                <span className="matrix-car-badge">ราคาป้าย {formatBaht(d2.car.price)}</span>
                              </div>
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="matrix-topic-label">🏷️ ราคาตัวรถป้ายแดง</td>
                          <td className="matrix-data-cell text-center font-bold highlight-price">{d1 && formatBaht(d1.car.price)}</td>
                          <td className="matrix-data-cell text-center font-bold highlight-price">{d2 && formatBaht(d2.car.price)}</td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">💵 ค่างวดผ่อนโดยประมาณ/เดือน</td>
                          <td className="matrix-data-cell text-center">
                            {d1 && (
                              <div>
                                <div className="highlight-monthly font-bold">~{formatBaht(d1.monthly)} / เดือน</div>
                                <div style={{ fontSize: "12.5px", marginTop: "4px" }} className={d1.afford.cls}>
                                  ราว {Math.round(d1.ratio * 100)}% ของรายได้ ({d1.afford.label})
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="matrix-data-cell text-center">
                            {d2 && (
                              <div>
                                <div className="highlight-monthly font-bold">~{formatBaht(d2.monthly)} / เดือน</div>
                                <div style={{ fontSize: "12.5px", marginTop: "4px" }} className={d2.afford.cls}>
                                  ราว {Math.round(d2.ratio * 100)}% ของรายได้ ({d2.afford.label})
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">🛡️ ค่าประกันภัยชั้น 1 (5 ปีสะสม)</td>
                          <td className="matrix-data-cell text-center font-bold" style={{ color: "#FCA5A5" }}>
                            {d1 && `+${formatBaht(d1.tco.insurance5yr)}`}
                          </td>
                          <td className="matrix-data-cell text-center font-bold" style={{ color: "#FCA5A5" }}>
                            {d2 && `+${formatBaht(d2.tco.insurance5yr)}`}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">🔧 ค่าซ่อมบำรุง &amp; อะไหล่ (5 ปี)</td>
                          <td className="matrix-data-cell text-center font-bold" style={{ color: "#FCA5A5" }}>
                            {d1 && `+${formatBaht(d1.tco.maint5yr)}`}
                          </td>
                          <td className="matrix-data-cell text-center font-bold" style={{ color: "#FCA5A5" }}>
                            {d2 && `+${formatBaht(d2.tco.maint5yr)}`}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">📉 ประมาณการมูลค่าขายต่อ (หลัง 5 ปี)</td>
                          <td className="matrix-data-cell text-center font-bold" style={{ color: "#34D399" }}>
                            {d1 && `−${formatBaht(d1.tco.resaleValue)}`}
                          </td>
                          <td className="matrix-data-cell text-center font-bold" style={{ color: "#34D399" }}>
                            {d2 && `−${formatBaht(d2.tco.resaleValue)}`}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">💰 รวมต้นทุนถือครอง 5 ปี (TCO)</td>
                          <td className="matrix-data-cell text-center font-bold highlight-tco">
                            {d1 && formatBaht(d1.tco.total5yr)}
                          </td>
                          <td className="matrix-data-cell text-center font-bold highlight-tco">
                            {d2 && formatBaht(d2.tco.total5yr)}
                          </td>
                        </tr>
                        <tr>
                          <td className="matrix-topic-label">⚠️ ข้อสังเกตความเสี่ยง &amp; ข้อควรรู้</td>
                          <td className="matrix-data-cell text-left">
                            <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "14px" }}>
                              {d1?.notes.map((n, i) => (
                                <li key={i} style={{ marginBottom: "6px" }}>
                                  <span style={{ marginRight: "4px" }}>{n.icon}</span> {n.text}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="matrix-data-cell text-left">
                            <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "14px" }}>
                              {d2?.notes.map((n, i) => (
                                <li key={i} style={{ marginBottom: "6px" }}>
                                  <span style={{ marginRight: "4px" }}>{n.icon}</span> {n.text}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            <div className="stage-nav">
              <button
                type="button"
                id="backToCompareBtn"
                className="btn-ghost"
                onClick={() => setMacroStage(2)}
              >
                ← กลับไปเทียบรถ
              </button>
              <button
                type="button"
                id="toDecideBtn"
                className="btn-primary"
                onClick={() => setMacroStage(4)}
              >
                ถัดไป: ตัดสินใจ →
              </button>
            </div>
          </section>
        )}

        {/* STAGE 4 · DECIDE */}
        {started && macroStage === 4 && (
          <section className="results" id="decideSection">
            <div className="results__intro">
              <p className="results__eyebrow">Review &amp; decide</p>
              <h2>เลือกคันที่ใช่ที่สุดสำหรับพี่</h2>
              <p className="results__sub">ดูสรุปคะแนนและความเหมาะสม แล้วเลือกคันเดียวที่จะพาไปโชว์รูม</p>
            </div>

            <div className="decide-grid" id="decideGrid">
              {shortlist.map(({ car, score, reviews }) => {
                const tco = calcTCO(car);
                const isChosen = chosenCarId === car.id;

                return (
                  <div
                    key={car.id}
                    className={`decide-card ${isChosen ? "is-chosen" : ""}`}
                    onClick={() => setChosenCarId(car.id)}
                  >
                    <div className="decide-card__visual">
                      <CarVisual
                        car={car}
                        sizeClass="car-art--sm"
                        customImage={cardSelectedColor[car.id]?.imageFile ? `/cars/${cardSelectedColor[car.id].imageFile}` : undefined}
                        filter={cardSelectedColor[car.id]?.filter}
                      />
                    </div>
                    <div className="decide-card__info">
                      <div className="decide-card__title-row">
                        <span className="decide-card__name">
                          {car.name} {NATIONALITY_FLAG[car.nationality]}
                        </span>
                        <span className={`decide-card__badge ${isChosen ? "badge-selected" : ""}`}>
                          {isChosen ? "✓ เลือกรถคันนี้แล้ว" : "คลิกเพื่อเลือกคันนี้"}
                        </span>
                      </div>
                      <span className="decide-card__meta">
                        {BODYTYPE_LABEL[car.bodyType]} · ความเหมาะสม <strong>{score}/100</strong> · 🗣️ <strong>{reviews?.length || 0} รีวิว</strong>
                      </span>
                    </div>
                    <div className={`decide-card__radio ${isChosen ? "is-active" : ""}`}>
                      {isChosen ? "✓" : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="stage-nav">
              <button
                type="button"
                id="backToCostRiskBtn"
                className="btn-ghost"
                onClick={() => setMacroStage(3)}
              >
                ← กลับไปดูต้นทุน
              </button>
              <button
                type="button"
                id="confirmDecisionBtn"
                className="btn-primary"
                onClick={handleConfirmDecision}
              >
                ยืนยันเลือกคันนี้ →
              </button>
            </div>
          </section>
        )}

        {/* STAGE 5 · SHOWROOM */}
        {started && macroStage === 5 && (() => {
          const chosenCar = shortlist.find((s) => s.car.id === chosenCarId)?.car;
          if (!chosenCar) return null;

          const groups = checklistGroupsFor(chosenCar);
          const totalItems = Object.keys(checklist).length;
          const checkedItems = Object.values(checklist).filter(Boolean).length;
          const pct = totalItems ? Math.round((checkedItems / totalItems) * 100) : 0;

          return (
            <section className="results" id="showroomSection">
              <div className="results__intro">
                <p className="results__eyebrow">Visit showroom</p>
                <h2 id="showroomTitle">เตรียมตัวก่อนไปโชว์รูม {chosenCar.name}</h2>
                <p className="results__sub" id="showroomSub">
                  เช็คลิสต์นี้ปรับมาให้ตรงกับ {chosenCar.name} ({BODYTYPE_LABEL[chosenCar.bodyType]} · {FUEL_LABEL[chosenCar.fuelType]}) ติ๊กไปเรื่อยๆ ก่อนออกจากบ้าน
                </p>
              </div>

              <div className="checklist-progress">
                <div className="checklist-progress__bar">
                  <div className="checklist-progress__fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="checklist-progress__label" id="checklistLabel">
                  {checkedItems}/{totalItems} ข้อ
                </span>
              </div>

              {/* DOWNLOAD & PRINT TOOLBAR */}
              <div
                className="checklist-download-toolbar"
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  margin: "20px 0",
                  padding: "14px 18px",
                  background: "rgba(31, 34, 40, 0.75)",
                  border: "1px solid rgba(201, 161, 74, 0.35)",
                  borderRadius: "14px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>📋</span>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#f5f1e8" }}>
                      บันทึกเช็คลิสต์พกติดตัวไปโชว์รูม
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#94A3B8" }}>
                      ดาวน์โหลดเป็นไฟล์ข้อความเพื่อเปิดอ่านในมือถือ หรือพิมพ์ออกเป็นเอกสาร PDF
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => downloadChecklistText(chosenCar, groups, checklist)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: "rgba(201, 161, 74, 0.2)",
                      border: "1px solid #c9a14a",
                      color: "#c9a14a",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      minHeight: "44px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>📥</span>
                    <span>ดาวน์โหลด Checklist (.txt)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#f5f1e8",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      minHeight: "44px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>🖨️</span>
                    <span>พิมพ์ / บันทึก PDF</span>
                  </button>
                </div>
              </div>

              <div id="checklistGroups">
                {groups.map((group, gi) => (
                  <div key={gi} className="checklist-group">
                    <p className="checklist-group__title">{group.title}</p>
                    {group.items.map((text, ii) => {
                      const id = `g${gi}-i${ii}`;
                      const isChecked = !!checklist[id];
                      return (
                        <div
                          key={id}
                          className={`checklist-item ${isChecked ? "is-checked" : ""}`}
                          onClick={() => {
                            setChecklist({
                              ...checklist,
                              [id]: !isChecked,
                            });
                          }}
                        >
                          <span className="checklist-item__box"></span>
                          <span className="checklist-item__text">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="stage-nav">
                <button
                  type="button"
                  id="backToDecideBtn"
                  className="btn-ghost"
                  onClick={() => setMacroStage(4)}
                >
                  ← กลับไปเลือกใหม่
                </button>
                <button
                  type="button"
                  id="finishRestartBtn"
                  className="btn-ghost"
                  onClick={fullRestart}
                >
                  ↺ เริ่มต้นใหม่
                </button>
                <button
                  type="button"
                  id="toFinalFeedbackBtn"
                  className="btn-primary"
                  onClick={() => setMacroStage(6)}
                  style={{
                    background: "#c9a14a",
                    color: "#121419",
                    fontWeight: 700,
                    boxShadow: "0 4px 16px rgba(201, 161, 74, 0.35)",
                  }}
                >
                  ไปหน้าสุดท้าย: ให้คะแนนระบบ ⭐ →
                </button>
              </div>
            </section>
          );
        })()}

        {/* STAGE 6 · FINAL FEEDBACK & SATISFACTION */}
        {started && macroStage === 6 && (() => {
          const chosenCar = shortlist.find((s) => s.car.id === chosenCarId)?.car || shortlist[0]?.car;
          const chosenResult = shortlist.find((s) => s.car.id === chosenCarId) || shortlist[0];

          const evaluationQuestions = [
            {
              key: "accuracy",
              title: "1. ความแม่นยำของผลการแนะนำรถ (Recommendation Accuracy)",
              subtitle: "รถยนต์ที่ระบบคัดเลือกให้ ตรงใจและสอดคล้องกับงบประมาณ/โจทย์การใช้งานของคุณมากน้อยเพียงใด?",
              lowLabel: "1: ไม่ตรงใจเลย",
              highLabel: "5: ตรงใจมากที่สุด",
            },
            {
              key: "tco",
              title: "2. ความชัดเจนของต้นทุนรวม 5 ปี (TCO & Financial Clarity)",
              subtitle: "ข้อมูลค่างวด ประกัน ค่าบำรุงรักษา และค่าน้ำมัน/ไฟ ชัดเจนและช่วยวางแผนการเงินได้จริงหรือไม่?",
              lowLabel: "1: ไม่ชัดเจนเลย",
              highLabel: "5: ชัดเจน ละเอียดมาก",
            },
            {
              key: "quiz",
              title: "3. ความง่ายและกระชับของแบบสอบถาม (Quiz Usability & Flow)",
              subtitle: "คำถามในแต่ละขั้นตอนเข้าใจง่าย ไม่ซับซ้อน และใช้เวลาตอบกำลังพอดีหรือไม่?",
              lowLabel: "1: สับสน/เยิ่นเย้อ",
              highLabel: "5: เข้าใจง่าย กระชับดีมาก",
            },
            {
              key: "checklist",
              title: "4. ประโยชน์ของ Checklist โชว์รูม (Showroom Checklist Usefulness)",
              subtitle: "รายการตรวจรับรถและคำถามเซลส์ ช่วยให้คุณมั่นใจและเตรียมตัวก่อนไปดูรถจริงได้ดีขึ้นหรือไม่?",
              lowLabel: "1: ไม่ช่วยเลย",
              highLabel: "5: มีประโยชน์ ช่วยได้มาก",
            },
            {
              key: "overall",
              title: "5. ความน่าเชื่อถือและความพึงพอใจในภาพรวม (Overall Satisfaction & AI Trust)",
              subtitle: "ในภาพรวม คุณเชื่อมั่นในข้อมูลและยินดีแนะนำ AI Car Advisor ให้ผู้อื่นใช้งานหรือไม่?",
              lowLabel: "1: ไม่แนะนำเลย",
              highLabel: "5: พึงพอใจมาก แนะนำแน่นอน",
            },
          ];

          const scoredCount = Object.values(catRatings).filter((v) => v > 0).length;
          const allScored = scoredCount === 5;
          const averageScore = scoredCount > 0
            ? (Object.values(catRatings).reduce((a, b) => a + b, 0) / scoredCount).toFixed(1)
            : "0.0";

          const handleRateCategory = (key: string, score: number) => {
            setCatRatings((prev) => ({
              ...prev,
              [key]: score,
            }));
          };

          const handleFinalSubmit = async (e?: React.FormEvent) => {
            if (e) e.preventDefault();
            if (finalSubmitting) return;

            if (!allScored) {
              alert("กรุณาให้คะแนนแบบประเมินให้ครบทั้ง 5 ด้านก่อนส่งครับ");
              return;
            }

            setFinalSubmitting(true);
            try {
              const avgInt = Math.round(
                Object.values(catRatings).reduce((a, b) => a + b, 0) / 5
              );

              await submitFullFeedback({
                feedback_type: "5-dimension evaluation",
                rating: avgInt,
                category_ratings: catRatings,
                message:
                  finalMessage.trim() ||
                  `ผู้ใช้ประเมินครบ 5 ด้าน (คะแนนเฉลี่ย ${averageScore}/5): แม่นยำ=${catRatings.accuracy}, TCO=${catRatings.tco}, คำถาม=${catRatings.quiz}, เช็กลิสต์=${catRatings.checklist}, ภาพรวม=${catRatings.overall}`,
                purchased_car: finalPurchasedCar.trim() || (chosenCar ? chosenCar.name : undefined),
                consent: true,
                context: {
                  recommended_car_id: chosenCar?.id,
                  match_score: chosenResult?.score,
                  top3: shortlist
                    .slice(0, 3)
                    .map((s) => ({ id: s.car.id, name: s.car.name, score: s.score })),
                  quiz_answers: {
                    budgetK,
                    incomeK,
                    pains,
                    gains,
                    bodytype,
                    fuel,
                    brands,
                    priority,
                  },
                  source: "stage6_final_5_questions",
                },
              });
              setFinalSubmitted(true);
            } catch (err) {
              console.error("Submit final feedback error", err);
              // Gracefully acknowledge even on network edge
              setFinalSubmitted(true);
            } finally {
              setFinalSubmitting(false);
            }
          };

          return (
            <section className="results" id="finalFeedbackSection">
              <div className="results__intro">
                <p className="results__eyebrow">Final Step · 5-Dimension Evaluation</p>
                <h2>แบบประเมินและข้อเสนอแนะ AI Car Advisor</h2>
                <p className="results__sub">
                  ประเมินคะแนน 5 ด้าน (1–5) เพื่อช่วยให้เราเห็นจุดเด่นและจุดที่ควรปรับปรุงของแต่ละฟังก์ชันได้แม่นยำยิ่งขึ้น
                </p>
              </div>

              {/* CHOSEN CAR HERO BANNER */}
              {chosenCar && (
                <div
                  style={{
                    background: "rgba(18, 20, 25, 0.7)",
                    border: "1px solid rgba(201, 161, 74, 0.3)",
                    borderRadius: "14px",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "90px", height: "55px", position: "relative" }}>
                      <CarVisual
                        car={chosenCar}
                        sizeClass="car-art--sm"
                        customImage={cardSelectedColor[chosenCar.id]?.imageFile ? `/cars/${cardSelectedColor[chosenCar.id].imageFile}` : undefined}
                        filter={cardSelectedColor[chosenCar.id]?.filter}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#c9a14a", fontWeight: 700, textTransform: "uppercase" }}>
                        รถที่คุณเลือก (Selected Car)
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "#f5f1e8" }}>
                        {chosenCar.name} {NATIONALITY_FLAG[chosenCar.nationality]}
                      </div>
                      <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                        {formatBaht(chosenCar.price)} · {BODYTYPE_LABEL[chosenCar.bodyType]} · {FUEL_LABEL[chosenCar.fuelType]}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadChecklistText(chosenCar, checklistGroupsFor(chosenCar), checklist)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: "rgba(201, 161, 74, 0.15)",
                      border: "1px solid #c9a14a",
                      color: "#c9a14a",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      minHeight: "44px",
                    }}
                  >
                    <span>📥</span>
                    <span>ดาวน์โหลด Checklist อีกครั้ง</span>
                  </button>
                </div>
              )}

              {finalSubmitted ? (
                /* SUCCESS SCREEN */
                <div
                  style={{
                    background: "#1f2228",
                    border: "1px solid rgba(201, 161, 74, 0.4)",
                    borderRadius: "16px",
                    padding: "40px 24px",
                    textAlign: "center",
                    position: "relative",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  <span style={{ position: "absolute", top: "8px", left: "10px", color: "#c9a14a", fontSize: "14px" }}>⌜</span>
                  <span style={{ position: "absolute", top: "8px", right: "10px", color: "#c9a14a", fontSize: "14px" }}>⌝</span>
                  <span style={{ position: "absolute", bottom: "8px", left: "10px", color: "#c9a14a", fontSize: "14px" }}>⌞</span>
                  <span style={{ position: "absolute", bottom: "8px", right: "10px", color: "#c9a14a", fontSize: "14px" }}>⌟</span>

                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "rgba(201, 161, 74, 0.15)",
                      border: "2px solid #c9a14a",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "26px",
                      marginBottom: "16px",
                      color: "#c9a14a",
                    }}
                  >
                    ✓
                  </div>

                  <h3
                    style={{
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: "24px",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      color: "#f5f1e8",
                      margin: "0 0 10px",
                    }}
                  >
                    ขอบคุณสำหรับการประเมินทั้ง 5 ด้านมากครับ!
                  </h3>

                  <p style={{ color: "#94A3B8", maxWidth: "520px", margin: "0 auto 24px", fontSize: "14px", lineHeight: 1.6 }}>
                    คะแนนรายด้าน ({averageScore}/5.0) และข้อเสนอแนะของคุณถูกบันทึกเข้าสู่ระบบเรียบร้อยแล้ว ทีมงานจะนำไปปรับปรุงและพัฒนาความแม่นยำของโมเดลต่อไปครับ
                  </p>

                  <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    {chosenCar && (
                      <button
                        type="button"
                        onClick={() => downloadChecklistText(chosenCar, checklistGroupsFor(chosenCar), checklist)}
                        style={{
                          minHeight: "44px",
                          padding: "10px 22px",
                          background: "#c9a14a",
                          color: "#121419",
                          borderRadius: "8px",
                          border: "none",
                          fontWeight: 700,
                          fontSize: "13.5px",
                          cursor: "pointer",
                        }}
                      >
                        📥 บันทึก Checklist ติดตัว
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={fullRestart}
                      style={{
                        minHeight: "44px",
                        padding: "10px 20px",
                        background: "transparent",
                        color: "#94A3B8",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13.5px",
                      }}
                    >
                      ↺ เริ่มต้นค้นหารถคันใหม่
                    </button>
                  </div>
                </div>
              ) : (
                /* 5 QUESTIONS EVALUATION FORM */
                <div
                  style={{
                    background: "#1f2228",
                    border: "1px solid rgba(201, 161, 74, 0.35)",
                    borderRadius: "16px",
                    padding: "28px 24px",
                    position: "relative",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  <span style={{ position: "absolute", top: "8px", left: "10px", color: "#c9a14a", fontSize: "14px" }}>⌜</span>
                  <span style={{ position: "absolute", top: "8px", right: "10px", color: "#c9a14a", fontSize: "14px" }}>⌝</span>
                  <span style={{ position: "absolute", bottom: "8px", left: "10px", color: "#c9a14a", fontSize: "14px" }}>⌞</span>
                  <span style={{ position: "absolute", bottom: "8px", right: "10px", color: "#c9a14a", fontSize: "14px" }}>⌟</span>

                  {/* Progress Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "12px",
                      paddingBottom: "18px",
                      marginBottom: "24px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: "12.5px",
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "#c9a14a",
                        }}
                      >
                        แบบประเมิน 5 ด้าน · โปรดให้คะแนน 1-5 แต่ละข้อ
                      </span>
                      <h3 style={{ fontSize: "18px", margin: "4px 0 0", color: "#f5f1e8" }}>
                        ความพึงพอใจการใช้งานระบบ (คะแนน 1 = น้อยที่สุด, 5 = มากที่สุด)
                      </h3>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          background: allScored ? "rgba(34, 197, 94, 0.2)" : "rgba(201, 161, 74, 0.2)",
                          border: `1px solid ${allScored ? "#22c55e" : "#c9a14a"}`,
                          color: allScored ? "#22c55e" : "#c9a14a",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        ประเมินแล้ว {scoredCount}/5 ด้าน {allScored ? "(ครบถ้วน ✓)" : ""}
                      </span>
                    </div>
                  </div>

                  {/* 5 Questions List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "28px" }}>
                    {evaluationQuestions.map((q, idx) => {
                      const currentScore = catRatings[q.key] || 0;
                      return (
                        <div
                          key={q.key}
                          style={{
                            background: "rgba(18, 20, 25, 0.6)",
                            border: `1px solid ${currentScore > 0 ? "rgba(201, 161, 74, 0.5)" : "rgba(255, 255, 255, 0.08)"}`,
                            borderRadius: "12px",
                            padding: "18px 20px",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              flexWrap: "wrap",
                              gap: "8px",
                              marginBottom: "10px",
                            }}
                          >
                            <div>
                              <h4
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 700,
                                  color: currentScore > 0 ? "#c9a14a" : "#f5f1e8",
                                  margin: "0 0 4px",
                                }}
                              >
                                {q.title}
                              </h4>
                              <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0, lineHeight: 1.5 }}>
                                {q.subtitle}
                              </p>
                            </div>
                            {currentScore > 0 && (
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color: "#c9a14a",
                                  background: "rgba(201, 161, 74, 0.15)",
                                  padding: "2px 10px",
                                  borderRadius: "6px",
                                }}
                              >
                                ★ {currentScore} / 5
                              </span>
                            )}
                          </div>

                          {/* 1-5 Score Buttons */}
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                            {[1, 2, 3, 4, 5].map((val) => {
                              const isSelected = currentScore === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleRateCategory(q.key, val)}
                                  style={{
                                    flex: "1 1 50px",
                                    minHeight: "46px",
                                    padding: "8px 12px",
                                    borderRadius: "10px",
                                    background: isSelected
                                      ? "rgba(201, 161, 74, 0.3)"
                                      : "rgba(255, 255, 255, 0.04)",
                                    border: isSelected
                                      ? "2px solid #c9a14a"
                                      : "1px solid rgba(255, 255, 255, 0.12)",
                                    color: isSelected ? "#c9a14a" : "#f5f1e8",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "2px",
                                  }}
                                >
                                  <span>{val} ★</span>
                                  <span style={{ fontSize: "9.5px", color: isSelected ? "#f5f1e8" : "#64748B" }}>
                                    {val === 1
                                      ? "ปรับปรุง"
                                      : val === 2
                                      ? "พอใช้"
                                      : val === 3
                                      ? "ปานกลาง"
                                      : val === 4
                                      ? "ดีมาก"
                                      : "ยอดเยี่ยม"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "11px",
                              color: "#64748B",
                              marginTop: "6px",
                            }}
                          >
                            <span>{q.lowLabel}</span>
                            <span>{q.highLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Section 2: Textarea & Purchased Car */}
                  <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "20px" }}>
                    <p
                      style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: "13px",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        color: "#c9a14a",
                        marginBottom: "10px",
                      }}
                    >
                      ข้อเสนอแนะเพิ่มเติม / สิ่งที่ควรปรับปรุงในแต่ละด้าน
                    </p>

                    <div style={{ marginBottom: "16px" }}>
                      <textarea
                        rows={3}
                        value={finalMessage}
                        onChange={(e) => setFinalMessage(e.target.value)}
                        placeholder="พิมพ์ข้อเสนอแนะเพิ่มเติม เช่น อยากให้ปรับปรุงแบบสอบถามข้อไหน, ข้อมูลราคาส่วนใดไม่ตรง, หรือฟังก์ชันที่อยากได้เพิ่ม..."
                        style={{
                          width: "100%",
                          background: "#121419",
                          border: "1px solid rgba(255, 255, 255, 0.16)",
                          borderRadius: "8px",
                          color: "#f5f1e8",
                          padding: "12px 14px",
                          fontSize: "13.5px",
                          fontFamily: "'Space Grotesk', sans-serif",
                          outline: "none",
                          resize: "vertical",
                        }}
                      />
                    </div>

                    {/* Purchased car (optional) */}
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#94A3B8",
                          marginBottom: "6px",
                        }}
                      >
                        รุ่นรถที่คุณตัดสินใจซื้อจริง (ถ้ามี):
                      </label>
                      <input
                        type="text"
                        value={finalPurchasedCar}
                        onChange={(e) => setFinalPurchasedCar(e.target.value)}
                        placeholder={chosenCar ? `เช่น ${chosenCar.name}, หรือรุ่นอื่นๆ...` : "เช่น Honda City, BYD Dolphin..."}
                        style={{
                          width: "100%",
                          minHeight: "44px",
                          background: "#121419",
                          border: "1px solid rgba(255, 255, 255, 0.16)",
                          borderRadius: "8px",
                          color: "#f5f1e8",
                          padding: "0 14px",
                          fontSize: "13.5px",
                          fontFamily: "'Space Grotesk', sans-serif",
                          outline: "none",
                        }}
                      />
                    </div>

                    {/* Submit Action Buttons */}
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                      {!allScored && (
                        <span style={{ fontSize: "12px", color: "#f59e0b", marginRight: "auto" }}>
                          ⚠️ โปรดให้คะแนนครบทั้ง 5 ด้าน ({scoredCount}/5) เพื่อเปิดปุ่มส่ง
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setMacroStage(5)}
                        style={{
                          minHeight: "44px",
                          padding: "8px 16px",
                          background: "transparent",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "8px",
                          color: "#94A3B8",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        ← ย้อนกลับไปดู Checklist
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFinalSubmit()}
                        disabled={!allScored || finalSubmitting}
                        style={{
                          minHeight: "44px",
                          padding: "10px 24px",
                          background: allScored ? "#c9a14a" : "rgba(201, 161, 74, 0.3)",
                          border: "none",
                          borderRadius: "8px",
                          color: allScored ? "#121419" : "#64748B",
                          fontSize: "14px",
                          fontWeight: 700,
                          fontFamily: "'Oswald', sans-serif",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          cursor: allScored && !finalSubmitting ? "pointer" : "not-allowed",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {finalSubmitting ? "กำลังบันทึก..." : "ส่งแบบประเมินและข้อเสนอแนะ ✓"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="stage-nav" style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setMacroStage(5)}
                >
                  ← กลับไปดู Checklist โชว์รูม
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={fullRestart}
                >
                  ↺ เริ่มต้นค้นหารถคันใหม่
                </button>
              </div>
            </section>
          );
        })()}
      </main>

      {/* FOOTER */}
      <footer
        style={{
          marginTop: "60px",
          padding: "36px 24px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(18, 20, 25, 0.95)",
          color: "#f5f1e8",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  background: "#c9a14a",
                  color: "#121419",
                  fontWeight: 800,
                  fontSize: "12px",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontFamily: "'Oswald', sans-serif",
                }}
              >
                AI
              </span>
              <span style={{ fontWeight: 700, fontSize: "16px", color: "#f5f1e8" }}>
                Car Advisor
              </span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "12.5px", color: "#94A3B8" }}>
              เพื่อนคู่คิดเรื่องรถ ช่วยคัดกรองรถที่ใช่ พร้อมวิเคราะห์ต้นทุนรวม 5 ปี (TCO)
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/feedback"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "8px",
                background: "rgba(201, 161, 74, 0.15)",
                border: "1px solid rgba(201, 161, 74, 0.5)",
                color: "#c9a14a",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 600,
                transition: "all 0.2s ease",
                minHeight: "44px", // Tap target
              }}
            >
              <span>💬</span>
              <span>Give Feedback / แจ้งข้อเสนอแนะ</span>
            </Link>

            <Link
              href="/admin"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#94A3B8",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 600,
                transition: "all 0.2s ease",
                minHeight: "44px",
              }}
            >
              <span>📊</span>
              <span>Admin Feedback Dashboard</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* 3D CAR CONFIGURATOR MODAL */}
      <CarConfiguratorModal
        car={configuratorCar}
        isOpen={isConfiguratorOpen}
        onClose={() => setIsConfiguratorOpen(false)}
      />
    </>
  );
}
