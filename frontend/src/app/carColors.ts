// -*- coding: utf-8 -*-
/**
 * Official OEM Colors Mapping for Cars Sold in Thailand (2024-2026)
 */

export interface CarColorOption {
  name: string;
  thaiName: string;
  hex: string;
  finish: "metallic" | "pearl" | "gloss" | "matte";
  filter?: string;
  imageFile?: string;
}

// Brand-specific and model-specific authentic palettes
export const BRAND_DEFAULT_COLORS: Record<string, CarColorOption[]> = {
  toyota: [
    { name: "Platinum White Pearl", thaiName: "ขาวมุก", hex: "#f4f5f8", finish: "pearl", filter: "brightness(1.25) contrast(1.05)" },
    { name: "Attitude Black Mica", thaiName: "ดำไมก้า", hex: "#161719", finish: "metallic", filter: "brightness(0.6) contrast(1.3)" },
    { name: "Emotional Red", thaiName: "แดงสปอร์ต", hex: "#b9151e", finish: "metallic", filter: "hue-rotate(150deg) saturate(1.8)" },
    { name: "Silver Metallic", thaiName: "เงินเมทัลลิก", hex: "#a4abb5", finish: "metallic", filter: "brightness(1.1) saturate(0.2)" },
    { name: "Celestite Gray Metallic", thaiName: "เทาบลู", hex: "#5c6b77", finish: "metallic", filter: "hue-rotate(190deg) saturate(0.6)" },
  ],
  honda: [
    { name: "Platinum White Pearl", thaiName: "ขาวมุกพรีเมียม", hex: "#f2f4f7", finish: "pearl", filter: "brightness(1.2)" },
    { name: "Crystal Black Pearl", thaiName: "ดำคริสตัล", hex: "#18191c", finish: "pearl", filter: "brightness(0.6) contrast(1.3)" },
    { name: "Ignite Red Metallic", thaiName: "แดงอิกไนต์", hex: "#c91a24", finish: "metallic", filter: "hue-rotate(145deg) saturate(1.9)" },
    { name: "Sonic Gray Pearl", thaiName: "เทาโซนิค", hex: "#637280", finish: "pearl", filter: "hue-rotate(195deg) saturate(0.5)" },
    { name: "Meteoroid Gray Metallic", thaiName: "เทาเมทิเออรอยด์", hex: "#4b5159", finish: "metallic", filter: "brightness(0.8) contrast(1.1)" },
  ],
  mazda: [
    { name: "Soul Red Crystal", thaiName: "แดงโซลเรด", hex: "#9b0e18", finish: "metallic", filter: "hue-rotate(150deg) saturate(2)" },
    { name: "Machine Gray Metallic", thaiName: "เทาแมชชีน", hex: "#50545b", finish: "metallic", filter: "brightness(0.85) contrast(1.1)" },
    { name: "Platinum Quartz Metallic", thaiName: "ควอตซ์แพลทินัม", hex: "#d5d2c9", finish: "metallic", filter: "brightness(1.15) saturate(0.4)" },
    { name: "Polymetal Gray", thaiName: "เทาโพลีเมทัล", hex: "#6c7784", finish: "gloss", filter: "hue-rotate(200deg) saturate(0.4)" },
    { name: "Jet Black Mica", thaiName: "ดำเจ็ทแบล็ก", hex: "#151618", finish: "metallic", filter: "brightness(0.6)" },
  ],
  nissan: [
    { name: "Storm White", thaiName: "ขาวสตอร์ม", hex: "#f6f7fa", finish: "pearl", filter: "brightness(1.2)" },
    { name: "Black Star", thaiName: "ดำแบล็กสตาร์", hex: "#17181b", finish: "metallic", filter: "brightness(0.6)" },
    { name: "Monarch Orange", thaiName: "ส้มโมนาร์ช", hex: "#d65315", finish: "metallic", filter: "hue-rotate(30deg) saturate(1.7)" },
    { name: "Night Blue", thaiName: "น้ำเงินเข้ม", hex: "#102a5c", finish: "pearl", filter: "hue-rotate(220deg) saturate(1.4)" },
    { name: "Gun Metallic", thaiName: "เทากันเมทัลลิก", hex: "#676c74", finish: "metallic", filter: "brightness(0.9)" },
  ],
  byd: [
    { name: "Skiing White", thaiName: "ขาวหิมะ", hex: "#f5f6f8", finish: "pearl", filter: "brightness(1.2)" },
    { name: "Space Black", thaiName: "ดำอวกาศ", hex: "#18191b", finish: "gloss", filter: "brightness(0.6)" },
    { name: "Surf Blue", thaiName: "ฟ้าเซิร์ฟบลู", hex: "#3b82f6", finish: "metallic", filter: "hue-rotate(210deg) saturate(1.3)" },
    { name: "Atlantis Gray", thaiName: "เทาแอตแลนติส", hex: "#606b76", finish: "metallic", filter: "brightness(0.85)" },
    { name: "Arctic Blue", thaiName: "ฟ้าน้ำทะเล", hex: "#1d4ed8", finish: "metallic", filter: "hue-rotate(215deg) saturate(1.5)" },
  ],
  subaru: [
    { name: "WR Blue Pearl", thaiName: "น้ำเงิน WR Blue แท้", hex: "#0a45a6", finish: "pearl", filter: "hue-rotate(0deg) saturate(1.2)" },
    { name: "Crystal Black Silica", thaiName: "ดำคริสตัลซิลิกา", hex: "#141517", finish: "metallic", filter: "brightness(0.65)" },
    { name: "Ignition Red", thaiName: "แดงอิกนิชั่น", hex: "#cc1822", finish: "gloss", filter: "hue-rotate(145deg) saturate(1.8)" },
    { name: "Crystal White Pearl", thaiName: "ขาวมุกคริสตัล", hex: "#f2f4f7", finish: "pearl", filter: "brightness(1.3)" },
    { name: "Ice Silver Metallic", thaiName: "เงินไอซ์ซิลเวอร์", hex: "#8d96a2", finish: "metallic", filter: "brightness(1.1)" },
  ],
  gwm: [
    { name: "Hamilton White", thaiName: "ขาวแฮมิลตัน", hex: "#f3f5f8", finish: "pearl", filter: "brightness(1.2)" },
    { name: "Sun Black", thaiName: "ดำซันแบล็ก", hex: "#151618", finish: "metallic", filter: "brightness(0.6)" },
    { name: "Energy Green", thaiName: "เขียวเอเนอร์จี้", hex: "#2e7d32", finish: "metallic", filter: "hue-rotate(90deg) saturate(1.5)" },
    { name: "Ayers Gray", thaiName: "เทาแอร์ส", hex: "#5a626d", finish: "metallic", filter: "brightness(0.85)" },
  ],
  ford: [
    { name: "Sedona Orange", thaiName: "ส้มเซโดนา", hex: "#c44d18", finish: "metallic", filter: "hue-rotate(35deg) saturate(1.8)" },
    { name: "Snowflake White Pearl", thaiName: "ขาวสโนว์เฟล็ก", hex: "#f5f6f8", finish: "pearl", filter: "brightness(1.25)" },
    { name: "Absolute Black", thaiName: "ดำแอบโซลูท", hex: "#141517", finish: "metallic", filter: "brightness(0.6)" },
    { name: "Meteor Gray", thaiName: "เทามีทีเออร์", hex: "#565c65", finish: "metallic", filter: "brightness(0.85)" },
    { name: "Blue Lightning", thaiName: "น้ำเงินไลท์นิ่ง", hex: "#1558b0", finish: "metallic", filter: "hue-rotate(210deg) saturate(1.4)" },
  ],
  default: [
    { name: "Pure White", thaiName: "ขาวมุก", hex: "#f3f4f7", finish: "pearl", filter: "brightness(1.2)" },
    { name: "Obsidian Black", thaiName: "ดำเงา", hex: "#161719", finish: "metallic", filter: "brightness(0.6) contrast(1.2)" },
    { name: "Liquid Silver", thaiName: "เงินเมทัลลิก", hex: "#9aa2ad", finish: "metallic", filter: "brightness(1.1)" },
    { name: "Sport Red", thaiName: "แดงสปอร์ต", hex: "#c01722", finish: "metallic", filter: "hue-rotate(150deg) saturate(1.8)" },
    { name: "Deep Blue", thaiName: "น้ำเงินเข้ม", hex: "#123c7a", finish: "pearl", filter: "hue-rotate(210deg) saturate(1.3)" },
  ],
};

// Specific model overrides for famous enthusiast models
export const MODEL_SPECIFIC_COLORS: Record<string, CarColorOption[]> = {
  "Toyota Yaris Ativ": [
    {
      name: "Platinum White Pearl",
      thaiName: "ขาวมุกพรีเมียม",
      hex: "#f4f5f8",
      finish: "pearl",
      imageFile: "01-toyota-yaris-ativ-white.jpg",
    },
    {
      name: "Emotional Red",
      thaiName: "แดงสปอร์ต (Emotional Red)",
      hex: "#b9151e",
      finish: "metallic",
      imageFile: "01-toyota-yaris-ativ-red.jpg",
    },
    {
      name: "Attitude Black Mica",
      thaiName: "ดำไมก้า (Attitude Black)",
      hex: "#161719",
      finish: "metallic",
      imageFile: "01-toyota-yaris-ativ-black.jpg",
    },
    {
      name: "Celestite Gray Metallic",
      thaiName: "เทาบลู (Celestite Gray)",
      hex: "#5c6b77",
      finish: "metallic",
      imageFile: "01-toyota-yaris-ativ-gray.jpg",
    },
    {
      name: "Silver Metallic",
      thaiName: "เงินเมทัลลิก (Silver)",
      hex: "#a4abb5",
      finish: "metallic",
      imageFile: "01-toyota-yaris-ativ-silver.jpg",
    },
  ],
  "Subaru BRZ": [
    { name: "WR Blue Pearl", thaiName: "น้ำเงิน WR Blue", hex: "#0c3b8a", finish: "pearl", filter: "hue-rotate(0deg) saturate(1.2)" },
    { name: "Ignition Red", thaiName: "แดง Ignition Red", hex: "#cf1515", finish: "gloss", filter: "hue-rotate(145deg) saturate(1.8)" },
    { name: "Crystal Black Silica", thaiName: "ดำ Crystal Black", hex: "#151516", finish: "metallic", filter: "brightness(0.65) contrast(1.3)" },
    { name: "Crystal White Pearl", thaiName: "ขาว Crystal White", hex: "#f0f2f5", finish: "pearl", filter: "brightness(1.4)" },
    { name: "Ice Silver Metallic", thaiName: "เงิน Ice Silver", hex: "#8c96a3", finish: "metallic", filter: "brightness(1.1)" },
    { name: "Magnetite Gray Metallic", thaiName: "เทา Magnetite Gray", hex: "#3b3f46", finish: "metallic", filter: "brightness(0.8)" },
  ],
  "Honda Civic Type R": [
    { name: "Championship White", thaiName: "ขาว Championship White แท้", hex: "#f5f4eb", finish: "gloss", filter: "brightness(1.2)" },
    { name: "Rallye Red", thaiName: "แดง Rallye Red", hex: "#d81822", finish: "gloss", filter: "hue-rotate(150deg) saturate(2)" },
    { name: "Racing Blue Pearl", thaiName: "น้ำเงิน Racing Blue", hex: "#0b52c1", finish: "pearl", filter: "hue-rotate(0deg) saturate(1.5)" },
    { name: "Sonic Gray Pearl", thaiName: "เทา Sonic Gray", hex: "#6c7a86", finish: "pearl", filter: "hue-rotate(190deg) saturate(0.5)" },
    { name: "Crystal Black Pearl", thaiName: "ดำ Crystal Black", hex: "#151619", finish: "pearl", filter: "brightness(0.65)" },
  ],
  "Toyota GR86": [
    { name: "Ignition Red", thaiName: "แดง Ignition Red", hex: "#d2141c", finish: "gloss", filter: "hue-rotate(145deg) saturate(1.8)" },
    { name: "Crystal White Pearl", thaiName: "ขาว Crystal White", hex: "#f3f5f8", finish: "pearl", filter: "brightness(1.3)" },
    { name: "Raven Black", thaiName: "ดำ Raven Black", hex: "#141517", finish: "metallic", filter: "brightness(0.6)" },
    { name: "Trueno Blue", thaiName: "น้ำเงิน Trueno Blue", hex: "#0e3e8f", finish: "pearl", filter: "hue-rotate(210deg) saturate(1.3)" },
    { name: "Steel Silver", thaiName: "เงิน Steel Silver", hex: "#949da8", finish: "metallic", filter: "brightness(1.1)" },
  ],
  "MG Cyberster": [
    { name: "Dynamic Red", thaiName: "แดง Dynamic Red", hex: "#cf121e", finish: "metallic", filter: "hue-rotate(150deg) saturate(1.8)" },
    { name: "Inca Yellow", thaiName: "เหลือง Inca Yellow", hex: "#eab308", finish: "gloss", filter: "hue-rotate(85deg) saturate(2.2)" },
    { name: "Andes Gray", thaiName: "เทา Andes Gray", hex: "#4b535d", finish: "metallic", filter: "brightness(0.8)" },
    { name: "English White", thaiName: "ขาว English White", hex: "#f6f7fa", finish: "pearl", filter: "brightness(1.2)" },
  ],
};

export function getCarColors(carName: string): CarColorOption[] {
  // Check exact model override
  for (const [modelKey, colors] of Object.entries(MODEL_SPECIFIC_COLORS)) {
    if (carName.toLowerCase().includes(modelKey.toLowerCase())) {
      return colors;
    }
  }

  // Check brand defaults
  const firstWord = carName.split(" ")[0].toLowerCase();
  if (BRAND_DEFAULT_COLORS[firstWord]) {
    return BRAND_DEFAULT_COLORS[firstWord];
  }

  return BRAND_DEFAULT_COLORS["default"];
}

// Check if car supports Full 3D WebGL mode
export function supportsFull3DWebGL(carName: string): boolean {
  const full3DCars = [
    "subaru brz",
    "toyota gr86",
    "honda civic type r",
    "mg cyberster",
    "bmw 218",
    "ferrari",
    "sports car",
  ];
  return full3DCars.some((c) => carName.toLowerCase().includes(c));
}
