# -*- coding: utf-8 -*-
"""25 Nov 2026 (part 2): premium brands that were missing (Mercedes-Benz, more BMW,
MINI, Lexus, Audi, Porsche). Prices = cheapest trim on the current Thai list; base
specs not confirmed by a source are listed per car as "Not yet verified"."""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from data_update_2026_11 import DB, OV, D, EST, car, slug

S = {
    "benz": "9carthai.com/mercedes-benz-price/ (Mercedes-Benz Thailand list, 2026)",
    "bmw": "9carthai.com/bmw-price/ (BMW Thailand list, updated 27 Mar 2026)",
    "mini": "autolifethailand.tv (MINI Cooper SE official 1,555,000–1,799,000 and Aceman SE 1,755,000–1,999,000, 26 Nov 2025)",
    "lexus": "9carthai.com/lexus-price/ (Lexus Thailand list)",
    "audi": "sanook.com/auto/98344 (All-new Audi Q3 official from 2,499,000; 150 hp 1.5 mild hybrid, 18.2 km/l)",
    "porsche": "autolifethailand.tv/tag/macan-ev-turbo (Macan EV official from 5,290,000, 5 Nov 2025). Porsche has announced 7,890,000 from 1 Jan 2027 when the excise on imported EVs rises from 10% to 35% (autolifethailand.tv/?p=183901)",
}
NEW = [
    car("Mercedes-Benz CLA 250+ EV", "sedan", "ev", 2290000, "6.5 km/kWh", 5, 272, 8, ["business", "city"], "medium", "other", 5, 999999, "benz", "electric CLA"),
    car("Mercedes-Benz C 220 d", "sedan", "diesel", 2690000, "18 km/l", 5, 197, 8, ["business", "family"], "medium", "other", 5, 999999, "benz"),
    car("Mercedes-Benz E 220", "sedan", "petrol", 3490000, "14 km/l", 5, 204, 8, ["business", "family"], "medium", "other", 5, 999999, "benz"),
    car("Mercedes-Benz GLA 200", "suv", "petrol", 2580000, "15 km/l", 5, 163, 8, ["city", "family"], "medium", "other", 5, 999999, "benz"),
    car("Mercedes-Benz GLC 220 d", "suv", "diesel", 3490000, "16 km/l", 5, 197, 8, ["family", "business"], "medium", "other", 5, 999999, "benz"),
    car("Mercedes-Benz GLE 300 d", "suv", "diesel", 4950000, "13 km/l", 5, 269, 9, ["family", "business"], "medium", "other", 5, 999999, "benz"),
    car("BMW 320d", "sedan", "diesel", 2799000, "19 km/l", 5, 190, 6, ["business", "family"], "medium", "other", 5, 999999, "bmw", "320d M Sport"),
    car("BMW 530e", "sedan", "hybrid", 3299000, "40 km/l", 5, 299, 8, ["business", "family"], "medium", "other", 5, 999999, "bmw", "plug-in hybrid, 530e Inspiring"),
    car("BMW X1", "suv", "petrol", 2399000, "14 km/l", 5, 204, 8, ["family", "city"], "medium", "other", 5, 999999, "bmw", "xDrive20i M Sport"),
    car("BMW iX1", "suv", "ev", 2499000, "6.0 km/kWh", 5, 204, 8, ["family", "city"], "medium", "other", 5, 999999, "bmw", "eDrive20L M Sport (long wheelbase)"),
    car("BMW X3", "suv", "diesel", 3799000, "16 km/l", 5, 197, 8, ["family", "business"], "medium", "other", 5, 999999, "bmw", "xDrive20d M Sport Pro"),
    car("BMW iX3", "suv", "ev", 2999000, "5.8 km/kWh", 5, 286, 8, ["family", "business"], "medium", "other", 5, 999999, "bmw", "iX3 M Sport (Inspiring)"),
    car("BMW X5", "suv", "diesel", 5159000, "12 km/l", 5, 298, 8, ["family", "business", "adventure"], "medium", "other", 5, 999999, "bmw", "xDrive30d M Sport"),
    car("BMW i5", "sedan", "ev", 4599000, "5.5 km/kWh", 5, 340, 8, ["business"], "medium", "other", 5, 999999, "bmw", "eDrive40 M Sport (Inspiring)"),
    car("BMW iX", "suv", "ev", 5999000, "5.0 km/kWh", 5, 408, 8, ["family", "business"], "medium", "other", 5, 999999, "bmw", "xDrive45 M Sport"),
    car("MINI Cooper SE", "hatchback", "ev", 1555000, "6.5 km/kWh", 4, 218, 6, ["city", "firstCar"], "medium", "other", 4, 999999, "mini", "J01 Classic; 54.2 kWh, 218 hp"),
    car("MINI Aceman SE", "suv", "ev", 1755000, "6.3 km/kWh", 5, 218, 6, ["city", "firstCar"], "medium", "other", 4, 999999, "mini", "Classic; 218 hp, 54.2 kWh; warranty 4 yr unlimited km"),
    car("Lexus LBX", "suv", "hybrid", 2430000, "25 km/l", 5, 136, 8, ["city", "firstCar"], "medium", "japan", 5, 150000, "lexus"),
    car("Lexus UX 300h", "suv", "hybrid", 2780000, "22 km/l", 5, 199, 8, ["city", "family"], "medium", "japan", 5, 150000, "lexus"),
    car("Lexus NX 350h", "suv", "hybrid", 3310000, "19 km/l", 5, 243, 8, ["family", "business"], "medium", "japan", 5, 150000, "lexus"),
    car("Lexus RX 350h", "suv", "hybrid", 4520000, "17 km/l", 5, 250, 10, ["family", "business"], "medium", "japan", 5, 150000, "lexus"),
    car("Lexus RZ 350e", "suv", "ev", 2990000, "5.8 km/kWh", 5, 224, 8, ["family", "city"], "medium", "japan", 5, 150000, "lexus"),
    car("Lexus IS 300h", "sedan", "hybrid", 2799000, "18 km/l", 5, 223, 8, ["business"], "medium", "japan", 5, 150000, "lexus"),
    car("Lexus ES 350e", "sedan", "ev", 3290000, "6.0 km/kWh", 5, 224, 9, ["business", "family"], "medium", "japan", 5, 150000, "lexus", "new-generation ES, electric"),
    car("Lexus LM 350h", "mpv", "hybrid", 6290000, "13 km/l", 7, 250, 8, ["family", "business"], "medium", "japan", 5, 150000, "lexus", "Executive 7-seater"),
    car("Audi Q3", "suv", "petrol", 2499000, "18.2 km/l", 5, 150, 6, ["city", "family"], "medium", "other", 3, 999999, "audi", "all-new 3rd gen, 1.5 TFSI mild hybrid"),
    car("Porsche Macan EV", "suv", "ev", 5290000, "5.3 km/kWh", 5, 360, 8, ["business", "family"], "medium", "other", 2, 999999, "porsche", "RWD"),
]
VERIFIED = {"Audi Q3": ["horsepower", "consumption"], "MINI Cooper SE": ["horsepower"], "MINI Aceman SE": ["horsepower", "warranty"]}

def main():
    s = open(DB, encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    o = json.load(open(OV, encoding="utf-8"))
    # BMW 218 Gran Coupe is now sold as 220 Gran Coupe
    m = re.search(r"    \{'id': 104, [^\r\n]*\},", s); line = m.group(0)
    new = line.replace("'BMW 218 Gran Coupe'", "'BMW 220 Gran Coupe'").replace("'price': 1999000", "'price': 2199000").replace("'horsepower': 136", "'horsepower': 156")
    s = s.replace(line, new)
    e = o.setdefault("104", {}); e["price_thb_entry"] = 2199000; e["collected_on"] = D
    e["source"] = "Price 2,199,000 — 220 Gran Coupe M Sport Pro (218 no longer listed): " + S["bmw"] + (" · Earlier: " + e["source"] if e.get("source") else "")
    ids = [int(x) for x in re.findall(r"\{'id': (\d+),", s)]
    nid = max(ids) + 1
    existing = set(re.findall(r"'name': '([^']+)'", s))
    end = s.index(nl + "]" + nl)
    lines = []
    for c in NEW:
        if c["name"] in existing: continue
        src, note = c.pop("_src"), c.pop("_note")
        rec = {"id": nid}; rec.update(c)
        rec["photo"] = {"file": "%d-%s.jpg" % (nid, slug(c["name"])), "credit": None}
        lines.append("    " + repr(rec) + ",")
        est = [f for f in EST if f not in VERIFIED.get(c["name"], [])]
        ov = {"price_thb_entry": c["price"], "collected_on": D,
              "source": "New model added 25 Nov 2026. Price %s%s: %s. Not yet verified: %s" % (format(c["price"], ","), (" — " + note) if note else "", S[src], ", ".join(est))}
        if "consumption" in est: ov["estimated"] = ["economy"]
        o[str(nid)] = ov; nid += 1
    s = s[:end] + nl + nl.join(lines) + s[end:]
    open(DB, "w", encoding="utf-8", newline="").write(s)
    json.dump(o, open(OV, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("added", len(lines))

if __name__ == "__main__":
    main()
