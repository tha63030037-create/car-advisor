# คู่มือใส่รูปรถจริง (Wikimedia Commons)

โค้ดพร้อมรองรับรูปจริงแล้ว — แค่โหลดรูปมาใส่ในโฟลเดอร์ `images/` ด้วย**ชื่อไฟล์ตรงตามตารางด้านล่างเป๊ะๆ** ระบบจะโชว์รูปจริงทันที ถ้าไฟล์ไหนยังไม่มี แอปจะโชว์ภาพวาด SVG แทนโดยอัตโนมัติ (ไม่มีทางเห็นไอคอนรูปหักแน่นอน) — ตอนนี้มีรถทั้งหมด 104 รุ่น ไม่จำเป็นต้องใส่รูปครบทุกคัน เลือกใส่เฉพาะคันที่พี่คิดว่าจะโชว์บ่อยๆ ก่อนก็ได้

## วิธีหาแต่ละคัน (ทำเอง ~1 นาที/คัน)

1. เข้า https://commons.wikimedia.org
2. ค้นหาตามคำที่แนะนำในตาราง (คอลัมน์ขวาสุด)
3. เลือกไฟล์ที่หน้า License เขียนว่า **"Creative Commons Attribution-Share Alike"** (CC BY-SA) หรือ **Public Domain / CC0** เท่านั้น — หลีกเลี่ยงไฟล์ที่เขียนว่า "All rights reserved" หรือไม่มี license ระบุชัดเจน
4. คลิกรูปเต็มขนาด (Original file) แล้ว **Save image as...**
5. เปลี่ยนชื่อไฟล์ตามตารางด้านล่าง แล้วโยนใส่โฟลเดอร์ `images/`
6. ถ้า license เป็น CC BY-SA (ต้องให้เครดิต) ให้เปิด `app.js` หาบรรทัดของคันนั้น แล้วเติมชื่อผู้ถ่ายใน `credit:` เช่น
   ```js
   photo: { file: "01-toyota-yaris-ativ.jpg", credit: "ชื่อผู้ถ่าย, CC BY-SA 4.0 (Wikimedia Commons)" }
   ```
   ถ้าไม่เติม ระบบจะโชว์รูปได้ปกติแต่จะไม่ขึ้นเครดิตใต้ภาพ — ทางที่ดีควรใส่เครดิตให้ครบเพื่อทำตามเงื่อนไข license

## ตัวอย่างที่เช็คแล้ว (พร้อมใช้ได้เลย)

| # | รถ | ไฟล์ที่ต้องใช้ | แหล่งที่ตรวจสอบแล้ว | License |
|---|---|---|---|---|
| 1 | Toyota Yaris Ativ | `01-toyota-yaris-ativ.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2022_Toyota_Yaris_ATIV_1.2_Premium_Luxury.jpg) | CC BY-SA 4.0 |
| 22 | Honda City | `22-honda-city.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Honda_City_(7th_generation)_sedan_in_Jambi_City.jpg) | CC BY-SA 4.0 |

## รายชื่อทั้งหมด 104 คัน (หาเองตามขั้นตอนด้านบน)

| # | รถ | ไฟล์ที่ต้องใช้ | ค้นหาด้วยคำว่า |
|---|---|---|---|
| 1 | Toyota Yaris Ativ | `01-toyota-yaris-ativ.jpg` | Toyota Yaris Ativ wikimedia commons |
| 2 | Toyota Yaris | `02-toyota-yaris.jpg` | Toyota Yaris wikimedia commons |
| 3 | Toyota Yaris Cross | `03-toyota-yaris-cross.jpg` | Toyota Yaris Cross wikimedia commons |
| 4 | Toyota Corolla Altis | `04-toyota-corolla-altis.jpg` | Toyota Corolla Altis wikimedia commons |
| 5 | Toyota Corolla Cross | `05-toyota-corolla-cross.jpg` | Toyota Corolla Cross wikimedia commons |
| 6 | Toyota Corolla Cross Hybrid | `06-toyota-corolla-cross-hybrid.jpg` | Toyota Corolla Cross Hybrid wikimedia commons |
| 7 | Toyota Camry Hybrid | `07-toyota-camry-hybrid.jpg` | Toyota Camry Hybrid wikimedia commons |
| 8 | Toyota Veloz | `08-toyota-veloz.jpg` | Toyota Veloz wikimedia commons |
| 9 | Toyota Sienta | `09-toyota-sienta.jpg` | Toyota Sienta wikimedia commons |
| 10 | Toyota Innova Zenix | `10-toyota-innova-zenix.jpg` | Toyota Innova Zenix wikimedia commons |
| 11 | Toyota Innova Zenix Hybrid | `11-toyota-innova-zenix-hybrid.jpg` | Toyota Innova Zenix Hybrid wikimedia commons |
| 12 | Toyota Fortuner | `12-toyota-fortuner.jpg` | Toyota Fortuner wikimedia commons |
| 13 | Toyota Fortuner Legender | `13-toyota-fortuner-legender.jpg` | Toyota Fortuner Legender wikimedia commons |
| 14 | Toyota Hilux Revo Standard Cab | `14-toyota-hilux-revo-standard-cab.jpg` | Toyota Hilux Revo Standard Cab wikimedia commons |
| 15 | Toyota Hilux Revo Double Cab | `15-toyota-hilux-revo-double-cab.jpg` | Toyota Hilux Revo Double Cab wikimedia commons |
| 16 | Toyota Hilux Revo Rocco | `16-toyota-hilux-revo-rocco.jpg` | Toyota Hilux Revo Rocco wikimedia commons |
| 17 | Toyota Hilux Champ | `17-toyota-hilux-champ.jpg` | Toyota Hilux Champ wikimedia commons |
| 18 | Toyota GR86 | `18-toyota-gr86.jpg` | Toyota GR86 wikimedia commons |
| 19 | Toyota GR Yaris | `19-toyota-gr-yaris.jpg` | Toyota GR Yaris wikimedia commons |
| 20 | Toyota C-HR | `20-toyota-c-hr.jpg` | Toyota C-HR wikimedia commons |
| 21 | Toyota Alphard Hybrid | `21-toyota-alphard-hybrid.jpg` | Toyota Alphard Hybrid wikimedia commons |
| 22 | Honda City | `22-honda-city.jpg` | Honda City wikimedia commons |
| 23 | Honda City Hatchback | `23-honda-city-hatchback.jpg` | Honda City Hatchback wikimedia commons |
| 24 | Honda City e:HEV | `24-honda-city-ehev.jpg` | Honda City e:HEV wikimedia commons |
| 25 | Honda Civic | `25-honda-civic.jpg` | Honda Civic wikimedia commons |
| 26 | Honda Civic Hatchback RS | `26-honda-civic-hatchback-rs.jpg` | Honda Civic Hatchback RS wikimedia commons |
| 27 | Honda Civic Type R | `27-honda-civic-type-r.jpg` | Honda Civic Type R wikimedia commons |
| 28 | Honda HR-V | `28-honda-hr-v.jpg` | Honda HR-V wikimedia commons |
| 29 | Honda HR-V e:HEV | `29-honda-hr-v-ehev.jpg` | Honda HR-V e:HEV wikimedia commons |
| 30 | Honda CR-V | `30-honda-cr-v.jpg` | Honda CR-V wikimedia commons |
| 31 | Honda CR-V e:HEV | `31-honda-cr-v-ehev.jpg` | Honda CR-V e:HEV wikimedia commons |
| 32 | Honda BR-V | `32-honda-br-v.jpg` | Honda BR-V wikimedia commons |
| 33 | Honda WR-V | `33-honda-wr-v.jpg` | Honda WR-V wikimedia commons |
| 34 | Honda Accord | `34-honda-accord.jpg` | Honda Accord wikimedia commons |
| 35 | Honda e:N1 | `35-honda-en1.jpg` | Honda e:N1 wikimedia commons |
| 36 | Mazda2 Hatchback | `36-mazda2-hatchback.jpg` | Mazda2 Hatchback wikimedia commons |
| 37 | Mazda2 Sedan | `37-mazda2-sedan.jpg` | Mazda2 Sedan wikimedia commons |
| 38 | Mazda3 | `38-mazda3.jpg` | Mazda3 wikimedia commons |
| 39 | Mazda CX-3 | `39-mazda-cx-3.jpg` | Mazda CX-3 wikimedia commons |
| 40 | Mazda CX-30 | `40-mazda-cx-30.jpg` | Mazda CX-30 wikimedia commons |
| 41 | Mazda CX-5 | `41-mazda-cx-5.jpg` | Mazda CX-5 wikimedia commons |
| 42 | Mazda CX-8 | `42-mazda-cx-8.jpg` | Mazda CX-8 wikimedia commons |
| 43 | Mazda CX-60 | `43-mazda-cx-60.jpg` | Mazda CX-60 wikimedia commons |
| 44 | Mazda BT-50 | `44-mazda-bt-50.jpg` | Mazda BT-50 wikimedia commons |
| 45 | Mazda MX-5 | `45-mazda-mx-5.jpg` | Mazda MX-5 wikimedia commons |
| 46 | Nissan Almera | `46-nissan-almera.jpg` | Nissan Almera wikimedia commons |
| 47 | Nissan Almera Turbo | `47-nissan-almera-turbo.jpg` | Nissan Almera Turbo wikimedia commons |
| 48 | Nissan Kicks e-Power | `48-nissan-kicks-e-power.jpg` | Nissan Kicks e-Power wikimedia commons |
| 49 | Nissan Navara | `49-nissan-navara.jpg` | Nissan Navara wikimedia commons |
| 50 | Nissan Terra | `50-nissan-terra.jpg` | Nissan Terra wikimedia commons |
| 51 | Nissan X-Trail e-Power | `51-nissan-x-trail-e-power.jpg` | Nissan X-Trail e-Power wikimedia commons |
| 52 | Nissan Serena e-Power | `52-nissan-serena-e-power.jpg` | Nissan Serena e-Power wikimedia commons |
| 53 | Isuzu D-Max Standard Cab | `53-isuzu-d-max-standard-cab.jpg` | Isuzu D-Max Standard Cab wikimedia commons |
| 54 | Isuzu D-Max V-Cross | `54-isuzu-d-max-v-cross.jpg` | Isuzu D-Max V-Cross wikimedia commons |
| 55 | Isuzu MU-X | `55-isuzu-mu-x.jpg` | Isuzu MU-X wikimedia commons |
| 56 | Mitsubishi Triton | `56-mitsubishi-triton.jpg` | Mitsubishi Triton wikimedia commons |
| 57 | Mitsubishi Triton Athlete | `57-mitsubishi-triton-athlete.jpg` | Mitsubishi Triton Athlete wikimedia commons |
| 58 | Mitsubishi Pajero Sport | `58-mitsubishi-pajero-sport.jpg` | Mitsubishi Pajero Sport wikimedia commons |
| 59 | Mitsubishi Xpander | `59-mitsubishi-xpander.jpg` | Mitsubishi Xpander wikimedia commons |
| 60 | Mitsubishi Xpander Cross | `60-mitsubishi-xpander-cross.jpg` | Mitsubishi Xpander Cross wikimedia commons |
| 61 | Mitsubishi Attrage | `61-mitsubishi-attrage.jpg` | Mitsubishi Attrage wikimedia commons |
| 62 | Mitsubishi Outlander PHEV | `62-mitsubishi-outlander-phev.jpg` | Mitsubishi Outlander PHEV wikimedia commons |
| 63 | Suzuki Swift | `63-suzuki-swift.jpg` | Suzuki Swift wikimedia commons |
| 64 | Suzuki Ertiga | `64-suzuki-ertiga.jpg` | Suzuki Ertiga wikimedia commons |
| 65 | Suzuki XL7 | `65-suzuki-xl7.jpg` | Suzuki XL7 wikimedia commons |
| 66 | Suzuki Jimny | `66-suzuki-jimny.jpg` | Suzuki Jimny wikimedia commons |
| 67 | Subaru XV | `67-subaru-xv.jpg` | Subaru XV wikimedia commons |
| 68 | Subaru Forester | `68-subaru-forester.jpg` | Subaru Forester wikimedia commons |
| 69 | Hyundai Creta | `69-hyundai-creta.jpg` | Hyundai Creta wikimedia commons |
| 70 | Hyundai Stargazer | `70-hyundai-stargazer.jpg` | Hyundai Stargazer wikimedia commons |
| 71 | Kia Seltos | `71-kia-seltos.jpg` | Kia Seltos wikimedia commons |
| 72 | Kia Sonet | `72-kia-sonet.jpg` | Kia Sonet wikimedia commons |
| 73 | MG3 | `73-mg3.jpg` | MG3 wikimedia commons |
| 74 | MG3 Hybrid+ | `74-mg3-hybrid.jpg` | MG3 Hybrid+ wikimedia commons |
| 75 | MG5 | `75-mg5.jpg` | MG5 wikimedia commons |
| 76 | MG ZS | `76-mg-zs.jpg` | MG ZS wikimedia commons |
| 77 | MG ZS EV | `77-mg-zs-ev.jpg` | MG ZS EV wikimedia commons |
| 78 | MG4 Electric | `78-mg4-electric.jpg` | MG4 Electric wikimedia commons |
| 79 | MG HS | `79-mg-hs.jpg` | MG HS wikimedia commons |
| 80 | MG Extender | `80-mg-extender.jpg` | MG Extender wikimedia commons |
| 81 | MG Cyberster | `81-mg-cyberster.jpg` | MG Cyberster wikimedia commons |
| 82 | BYD Dolphin | `82-byd-dolphin.jpg` | BYD Dolphin wikimedia commons |
| 83 | BYD Atto 3 | `83-byd-atto-3.jpg` | BYD Atto 3 wikimedia commons |
| 84 | BYD Seal | `84-byd-seal.jpg` | BYD Seal wikimedia commons |
| 85 | BYD Sealion 6 | `85-byd-sealion-6.jpg` | BYD Sealion 6 wikimedia commons |
| 86 | BYD Song Plus | `86-byd-song-plus.jpg` | BYD Song Plus wikimedia commons |
| 87 | GWM Haval H6 | `87-gwm-haval-h6.jpg` | GWM Haval H6 wikimedia commons |
| 88 | GWM Haval H6 HEV | `88-gwm-haval-h6-hev.jpg` | GWM Haval H6 HEV wikimedia commons |
| 89 | GWM Haval Jolion | `89-gwm-haval-jolion.jpg` | GWM Haval Jolion wikimedia commons |
| 90 | GWM ORA Good Cat | `90-gwm-ora-good-cat.jpg` | GWM ORA Good Cat wikimedia commons |
| 91 | GWM Tank 300 | `91-gwm-tank-300.jpg` | GWM Tank 300 wikimedia commons |
| 92 | Changan Deepal S07 | `92-changan-deepal-s07.jpg` | Changan Deepal S07 wikimedia commons |
| 93 | Changan CS55 Plus | `93-changan-cs55-plus.jpg` | Changan CS55 Plus wikimedia commons |
| 94 | Neta V | `94-neta-v.jpg` | Neta V wikimedia commons |
| 95 | Neta X | `95-neta-x.jpg` | Neta X wikimedia commons |
| 96 | GAC Aion Y | `96-gac-aion-y.jpg` | GAC Aion Y wikimedia commons |
| 97 | GAC Aion V | `97-gac-aion-v.jpg` | GAC Aion V wikimedia commons |
| 98 | Ford Everest | `98-ford-everest.jpg` | Ford Everest wikimedia commons |
| 99 | Ford Ranger | `99-ford-ranger.jpg` | Ford Ranger wikimedia commons |
| 100 | Ford Ranger Raptor | `100-ford-ranger-raptor.jpg` | Ford Ranger Raptor wikimedia commons |
| 101 | Volvo XC40 | `101-volvo-xc40.jpg` | Volvo XC40 wikimedia commons |
| 102 | Volvo XC60 | `102-volvo-xc60.jpg` | Volvo XC60 wikimedia commons |
| 103 | Peugeot 2008 | `103-peugeot-2008.jpg` | Peugeot 2008 wikimedia commons |
| 104 | BMW 218 Gran Coupe | `104-bmw-218-gran-coupe.jpg` | BMW 218 Gran Coupe wikimedia commons |

## ทำไมผมหาให้ทั้งหมดตรงๆ ไม่ได้

เครื่องมือของผมเปิดหน้า Wikimedia Commons ตรงๆ ไม่ได้ (โดเมนนี้ระบบล็อกไว้เป็น cache-only) และเครื่องมือค้นรูปก็คืนมาแค่ให้ดูในแชท ไม่ได้คืนลิงก์ไฟล์จริงที่เอาไปแปะในโค้ดได้ เลยทำได้แค่ตรวจสอบและยืนยัน license ให้ 2 คันเป็นตัวอย่าง ที่เหลือพี่ต้องเข้าไปคลิกเลือกเองตามขั้นตอนด้านบน — ไม่จำเป็นต้องทำครบ 104 คันทีเดียว ทยอยใส่คันที่ใช้บ่อยก่อนได้เลย ระบบใช้งานได้ปกติแม้ยังไม่มีรูปจริงเลยสักคัน (ใช้ภาพวาด SVG แทน)
