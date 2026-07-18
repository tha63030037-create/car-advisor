"use client";

import React, { useState, useEffect } from "react";

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
    <rect x="12" y="62" width="182" height="16" rx="8" fill="${c.body}" />
    <polygon points="68,62 82,40 130,38 158,50 168,62" fill="${c.cabin}" />
    <polygon points="86,56 94,44 122,43 140,52 144,56" fill="${c.glass}" opacity="0.9" />
    <circle cx="52" cy="86" r="14" fill="${c.wheel}" /><circle cx="52" cy="86" r="6" fill="${c.hub}" />
    <circle cx="172" cy="86" r="14" fill="${c.wheel}" /><circle cx="172" cy="86" r="6" fill="${c.hub}" />
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
    <polygon points="32,44 46,20 150,20 166,34 178,44" fill="${c.cabin}" />
    <polygon points="50,38 58,26 143,26 156,36 158,38" fill="${c.glass}" opacity="0.9" />
    <circle cx="52" cy="88" r="15" fill="${c.wheel}" /><circle cx="52" cy="88" r="6.5" fill="${c.hub}" />
    <circle cx="164" cy="88" r="15" fill="${c.wheel}" /><circle cx="164" cy="88" r="6.5" fill="${c.hub}" />
  `,
  mpv: (c) => `
    <rect x="20" y="20" width="158" height="58" rx="16" fill="${c.body}" />
    <rect x="38" y="32" width="122" height="22" rx="8" fill="${c.glass}" opacity="0.85" />
    <line x1="118" y1="34" x2="118" y2="70" stroke="${c.cabin}" stroke-width="3" />
    <circle cx="55" cy="86" r="14" fill="${c.wheel}" /><circle cx="55" cy="86" r="6" fill="${c.hub}" />
    <circle cx="163" cy="86" r="14" fill="${c.wheel}" /><circle cx="163" cy="86" r="6" fill="${c.hub}" />
  `,
  pickup: (c) => `
    <rect x="18" y="56" width="92" height="22" rx="8" fill="${c.body}" />
    <polygon points="38,56 50,32 86,32 96,42 104,56" fill="${c.cabin}" />
    <polygon points="53,50 60,38 82,38 88,46 90,50" fill="${c.glass}" opacity="0.9" />
    <path d="M112,62 L112,78 L188,78 L188,62" fill="none" stroke="${c.cabin}" stroke-width="4" stroke-linecap="round" />
    <circle cx="55" cy="86" r="14" fill="${c.wheel}" /><circle cx="55" cy="86" r="6" fill="${c.hub}" />
    <circle cx="165" cy="86" r="14" fill="${c.wheel}" /><circle cx="165" cy="86" r="6" fill="${c.hub}" />
  `,
};

const WIKI_OVERRIDE_CACHE: Record<string, string> = {
  "Subaru BRZ": "https://upload.wikimedia.org/wikipedia/commons/5/53/2022_Subaru_BRZ_2.4_EyeSight.jpg",
  "Toyota GR86": "https://upload.wikimedia.org/wikipedia/commons/0/05/2022_Toyota_GR86_Premium_in_Track_bRed%2C_front_right_%28NYIAS_2022%29_%28cropped%29.jpg",
  "Mazda MX-5 Roadster": "https://upload.wikimedia.org/wikipedia/commons/9/95/Mazda_Roadster_%28MX-5%29_by_Negawa_Bridge_%28cropped%29.jpg",
  "Honda Civic Type R": "https://upload.wikimedia.org/wikipedia/commons/5/58/Honda_CIVIC_TYPE_R_%28FL5%29_front.jpg",
};

const runtimeImageCache: Record<string, string> = { ...WIKI_OVERRIDE_CACHE };

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
    specs = `${fuelEngine}, พละกำลังสูงสุด ${car.horsepower} แรงม้า, เกียร์ ${transText}`;
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
      `ถุงลมนิรภัย SRS ${car.airbags || 6} จุดรอบคัน`,
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
    specs = `${fuelEngine}, แรงม้าสูงสุด ${car.horsepower} แรงม้า, เกียร์ ${transText} ตอบสนองฉับไว`;
    exterior = [
      "ไฟส่องสว่างหน้าโปรเจกเตอร์ LED พร้อมไฟส่องสว่างกลางวันดีไซน์เอกลักษณ์",
      "สปอยเลอร์หลังดีไซน์สปอร์ตพร้อมราวหลังคารองรับแร็คขนของอเนกประสงค์",
      "ล้ออัลลอยสปอร์ตขนาด 17-18 นิ้ว ลุยได้อย่างมั่นใจ"
    ];
    interior = [
      "ระบบปรับอากาศแบบอัตโนมัติพร้อมช่องกระจายความเย็นสำหรับเบาะแถวหลัง",
      "เบาะนั่งฝั่งคนขับปรับด้วยระบบไฟฟ้า 6-8 ทิศทางพร้อมตัวดันหลังลดความเมื่อยล้า",
      "แผงแดชบอร์ดหุ้มบุนุ่มพรีเมียมพร้อมจอแสดงผลการขับขี่ดิจิทัลขนาดใหญ่"
    ];
    safety = [
      `ถุงลมนิรภัย SRS ${car.airbags || 6} จุดรอบคัน`,
      "ระบบตรวจจับและเตือนก่อนการชนด้านหน้าพร้อมช่วยเบรกอัตโนมัติ (FCW & AEB)",
      "กล้องแสดงภาพรอบทิศทาง 360 องศา (Panoramic View Monitor)"
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
      body: "var(--gold)",
      cabin: "var(--gold-deep)",
      glass: "var(--card-light)",
      wheel: "var(--card-light-ink)",
      hub: "var(--card-light)",
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

// Double view component: SVG Art + Dynamic Wiki Image Loading
const CarVisual: React.FC<{ car: Car; sizeClass?: string }> = ({ car, sizeClass }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const cleanName = car.name
      .replace(" Hybrid", "")
      .replace(" Electric", "")
      .replace(" e:HEV", "")
      .replace(" e-Power", "");

    if (runtimeImageCache[cleanName]) {
      if (runtimeImageCache[cleanName] === "failed") {
        setFailed(true);
      } else {
        setImgUrl(runtimeImageCache[cleanName]);
      }
      return;
    }

    const query = encodeURIComponent(cleanName);
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${query}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=500`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.query && data.query.pages) {
          const pages = data.query.pages;
          const pageId = Object.keys(pages)[0];
          const page = pages[pageId];
          if (page.thumbnail && page.thumbnail.source) {
            runtimeImageCache[cleanName] = page.thumbnail.source;
            setImgUrl(page.thumbnail.source);
            setFailed(false);
          } else {
            tryAlternative(cleanName);
          }
        } else {
          tryAlternative(cleanName);
        }
      })
      .catch(() => {
        tryAlternative(cleanName);
      });

    function tryAlternative(name: string) {
      const altQuery = encodeURIComponent(name + " " + car.bodyType);
      const altUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${altQuery}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=500`;
      fetch(altUrl)
        .then((r) => r.json())
        .then((data) => {
          if (data.query && data.query.pages) {
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            const page = pages[pageId];
            if (page.thumbnail && page.thumbnail.source) {
              runtimeImageCache[name] = page.thumbnail.source;
              setImgUrl(page.thumbnail.source);
              setFailed(false);
              return;
            }
          }
          runtimeImageCache[name] = "failed";
          setFailed(true);
        })
        .catch(() => {
          runtimeImageCache[name] = "failed";
          setFailed(true);
        });
    }
  }, [car]);

  return (
    <div className={`car-visual-container ${sizeClass || ""}`}>
      <div
        className="car-visual-svg"
        style={{
          opacity: imgUrl && !failed ? 0 : 1,
          transition: "opacity 0.4s ease",
          position: imgUrl && !failed ? "absolute" : "relative",
          pointerEvents: imgUrl && !failed ? "none" : "auto",
          width: "100%",
        }}
      >
        <CarArt bodyType={car.bodyType} />
      </div>

      {imgUrl && !failed && (
        <img
          className={`car-photo ${sizeClass || ""}`}
          src={imgUrl}
          alt={car.name}
          style={{
            opacity: 1,
            display: "block",
            transition: "opacity 0.4s ease",
          }}
          onError={() => setFailed(true)}
        />
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
function calcMonthlyInstallment(car: Car): number {
  const DOWNPAYMENT_RATE = 0.15, FLAT_RATE = 0.0299, TERM_MONTHS = 60;
  const principal = car.price * (1 - DOWNPAYMENT_RATE);
  const totalInterest = principal * FLAT_RATE * (TERM_MONTHS / 12);
  const monthly = (principal + totalInterest) / TERM_MONTHS;
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
    return true;
  };

  const handleNext = async () => {
    if (!stepIsReady(step)) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (step < 5) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
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
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setShortlist(data); // Auto shortlist top matching cars
          if (data.length > 0) setCompareCarId1(data[0].car.id);
          if (data.length > 1) setCompareCarId2(data[1].car.id);
          else if (data.length > 0) setCompareCarId2(data[0].car.id);
          setMacroStage(2);
        } else {
          alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        }
      } catch (err) {
        console.error(err);
        alert("กรุณาเปิดเซิร์ฟเวอร์ backend (FastAPI) ก่อนใช้งาน");
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
  };

  return (
    <>
      {/* HEADER */}
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <span className="brand__mark">AI</span>
            <span className="brand__name">Car Advisor</span>
          </div>
          <p className="brand__tag">เพื่อนคู่คิดเรื่องรถ อยู่ข้างพี่ทุกขั้นตอน</p>
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
              มาหารถที่ใช่<br />ไปด้วยกัน<br /><span className="hero__title-accent">นะ</span>
            </h1>
            <p className="hero__sub">
              ตอบคำถามสั้นๆ ให้เราเข้าใจพี่ก่อน แล้วช่วยกันคัดรถ เทียบต้นทุนจริง ดูว่าผ่อนไหวไหม จนพร้อมเดินเข้าโชว์รูมแบบมั่นใจสุดๆ
            </p>

            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-num">125</span>
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
                {[1, 2, 3, 4, 5].map((d) => (
                  <span
                    key={d}
                    className={`dot ${step === d ? "is-active" : step > d ? "is-done" : ""}`}
                    data-dot={d}
                  />
                ))}
              </div>
              <span className="progress-label" id="progressLabel">
                ข้อ {step} จาก 5
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
                }— นี่คือ ${shortlist.length} คันที่เราคัดมาให้แล้ว`}
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
                {shortlist.map(({ car, score, reasons, reviews, complaints }) => {
                  const tier = matchTier(score);
                  const rangeInfo = getRangeEstimate(car);
                  const details = generateCarDetails(car);

                  return (
                    <article key={car.id} className="car-card">
                      <div className="car-card__art">
                        <CarVisual car={car} />
                      </div>
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
                          <summary className="card-details-summary">🗣️ รีวิวสดจากผู้ใช้จริง &amp; ข้อพิจารณา</summary>
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
                    </article>
                  );
                })}
              </div>
            ) : (() => {
              const car1Item = shortlist.find((item) => item.car.id === compareCarId1) || shortlist[0];
              const car2Item = shortlist.find((item) => item.car.id === compareCarId2) || shortlist[1] || shortlist[0];

              const renderCarCol = (item: RecommendationResult | undefined) => {
                if (!item) return null;
                const { car, score, reasons, reviews, complaints, monthlyInstallment, tco } = item;
                const tier = matchTier(score);
                const r = getRangeEstimate(car);
                const calc = calcTCO(car);

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
                        value={compareCarId1 || ""}
                        onChange={(e) => setCompareCarId1(Number(e.target.value))}
                      >
                        {shortlist.map(({ car, score }) => (
                          <option key={car.id} value={car.id}>
                            {car.name} (คะแนน {score}/100)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="matrix-vs-badge">VS</div>

                    <div className="matrix-dropdown-box">
                      <label className="matrix-dropdown-label">🚙 เลือกรถคันที่ 2 (ฝั่งขวา):</label>
                      <select
                        className="matrix-dropdown-select"
                        value={compareCarId2 || ""}
                        onChange={(e) => setCompareCarId2(Number(e.target.value))}
                      >
                        {shortlist.map(({ car, score }) => (
                          <option key={car.id} value={car.id}>
                            {car.name} (คะแนน {score}/100)
                          </option>
                        ))}
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
                  const monthly = calcMonthlyInstallment(car);
                  const ratio = monthly / (incomeK * 1000);
                  const afford = affordabilityTier(ratio);
                  const isEV = car.fuelType === "ev";

                  return (
                    <article key={car.id} className="tco-card">
                      <div className="car-card__art">
                        <CarVisual car={car} />
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
              const item1 = shortlist.find((item) => item.car.id === compareCarId1) || shortlist[0];
              const item2 = shortlist.find((item) => item.car.id === compareCarId2) || shortlist[1] || shortlist[0];

              const getCostData = (item: RecommendationResult | undefined) => {
                if (!item) return null;
                const car = item.car;
                const tco = item.tco || calcTCO(car);
                const notes = riskNotes(car);
                const monthly = item.monthlyInstallment || calcMonthlyInstallment(car);
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
                        value={compareCarId1 || ""}
                        onChange={(e) => setCompareCarId1(Number(e.target.value))}
                      >
                        {shortlist.map(({ car, score }) => (
                          <option key={car.id} value={car.id}>
                            {car.name} (คะแนน {score}/100)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="matrix-vs-badge">VS</div>

                    <div className="matrix-dropdown-box">
                      <label className="matrix-dropdown-label">🚙 เลือกรถคันที่ 2 (ฝั่งขวา):</label>
                      <select
                        className="matrix-dropdown-select"
                        value={compareCarId2 || ""}
                        onChange={(e) => setCompareCarId2(Number(e.target.value))}
                      >
                        {shortlist.map(({ car, score }) => (
                          <option key={car.id} value={car.id}>
                            {car.name} (คะแนน {score}/100)
                          </option>
                        ))}
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
                      <CarVisual car={car} sizeClass="car-art--sm" />
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
                  ↺ เริ่มต้นทั้งหมดใหม่
                </button>
              </div>
            </section>
          );
        })()}
      </main>

    </>
  );
}
