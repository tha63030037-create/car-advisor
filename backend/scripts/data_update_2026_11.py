# -*- coding: utf-8 -*-
"""One-off data refresh (25 Nov 2026): current Thai list prices for existing cars,
duplicates / discontinued models, and new models on sale in Thailand.

Every price carries its source URL + date in data/car_specs_overrides.json.
Base specs of NEW cars that no source in this pass confirmed (horsepower,
airbags, consumption, warranty) are listed under "estimated" so the UI and the
explainer label them as estimates.

Run once:  python3 scripts/data_update_2026_11.py && python3 scripts/build_car_specs.py
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, "..", "app", "database.py")
OV = os.path.join(HERE, "..", "app", "data", "car_specs_overrides.json")
D = "2026-11-25"

# ---------------------------------------------------------------- sources
S = {
    "toyota": "car250.com/?p=446253 (Toyota all-model list, updated 29 Aug 2026)",
    "honda": "9carthai.com/honda-price/ (updated 1 Oct 2026; regular price, launch promo noted separately)",
    "mazda": "9carthai.com/mazda-price/ (7 Oct 2026)",
    "nissan": "9carthai.com/nissan-price/ (2 Jun 2026)",
    "kicks": "checkraka.com/car/nissan (Kicks e-POWER 2026: V 839,000)",
    "isuzu": "9carthai.com/isuzu-price/ (5 Nov 2026)",
    "mitsu": "9carthai.com/mitsubishi-price (19 Oct 2026)",
    "suzuki": "9carthai.com/suzuki-price/ (7 Jul 2026)",
    "hyundai": "9carthai.com/hyundai-price/ (16 Sep 2026)",
    "volvo": "9carthai.com/volvo-price/ (updated 4 Jun 2026)",
    "deepal": "9carthai.com/deepal-price/ (24 Feb 2026)",
    "aion": "9carthai.com/aion-price/ (31 Mar 2026)",
    "zeekr": "9carthai.com/zeekr-price/ (4 May 2026)",
    "byd": "car250.com/?p=292626 (BYD price table, updated 19 May 2026)",
    "seal6": "car250.com price/ราคา-byd (Seal 6 Standard 799,900, 6 Jul 2026)",
    "mg": "car250.com/?p=70714 (MG price list, 10 Apr 2026)",
    "mgurban": "car250.com (MG URBAN 549,900–729,900, 4 Aug 2026)",
    "gwm": "9carthai.com/?p=456278 (GWM Tank prices, 24 Feb 2026)",
    "ora5": "car250.com (GWM ORA 5 EV 649,000–719,000, 11 May 2026); pptvhd36.com/automotive/news/271555 (ORA 5 HEV Pro 709,000)",
    "xpeng": "en.thairath.co.th/news/auto/2921643 (New XPENG X9 Premium 2,399,000, Mar 2026)",
    "avatr": "autolifethailand.tv (AVATR 11 MY2026 official 2,299,000–2,499,000, 18 Jul 2026)",
    "geely": "autolifethailand.tv/tag/geely-ex2 (EX2 official 429,990–459,990); autolifethailand.tv/tag/geely-ex5 (EX5 official 759,000–929,000 from 5 May 2026)",
    "chery": "car250.com/chery-q-ev-2026-11.html (Chery Q QLICK 469,900 regular); thansettakij.com/motor/654699 (V23 759,900)",
    "omoda": "pptvhd36.com/automotive/news/271609 (OMODA C5 EV MAX+ launch price 629,000, Motor Show 2026); 9carthai.com EV price list (JAECOO 5 EV 549,000)",
    "ford": "9carthai.com/ford-price/ (20 May 2026)",
    "tesla": "9carthai.com/tesla-price/ (30 Mar 2026; detailed sections: Model 3 Standard RWD 1,149,000, Model Y RWD 1,719,000 — the page's summary list shows older figures)",
}

# ---------------------------------------------------------------- price / field updates
# id: (changes, source key, note)
UPDATES = {
    2: ({"price": 584000}, "toyota", ""),
    3: ({"price": 809000}, "toyota", ""),
    4: ({"price": 909000}, "toyota", "MY2026 drops the 1.6; 1.8G is the entry trim"),
    6: ({"price": 989000}, "toyota", "Corolla Cross is sold as HEV only in 2026"),
    7: ({"price": 1475000}, "toyota", ""),
    12: ({"price": 1239000}, "toyota", "entry of the Fortuner line (Leader)"),
    14: ({"price": 584000}, "toyota", "Revo kept in base/fleet trims; Hilux TRAVO is the successor"),
    17: ({"price": 519000}, "toyota", ""),
    18: ({"price": 2999000}, "toyota", ""),
    19: ({"price": 3499000}, "toyota", ""),
    21: ({"price": 4269000}, "toyota", ""),
    106: ({"price": 4199000}, "toyota", ""),
    9: ({"price": 1149000}, "tesla", ""),
    20: ({"price": 1719000}, "tesla", ""),
    23: ({"price": 599000}, "honda", "City Hatchback S regular 599,000 (launch 579,000)"),
    25: ({"price": 949000, "name": "Honda Civic e:HEV", "fuelType": "hybrid", "consumption": "24 km/l"},
         "honda", "Thai Civic is now e:HEV; consumption is an estimate"),
    27: ({"price": 3990000}, "honda", ""),
    29: ({"price": 959000}, "honda", "autolifethailand.tv/tag/hr-v-ehev: 959,000–1,189,000 from 1 May 2026 (9carthai shows 899,000 for E; the dated official list wins)"),
    31: ({"price": 1409000}, "honda", ""),
    34: ({"price": 1479000}, "honda", ""),
    36: ({"price": 529000}, "mazda", ""),
    37: ({"price": 529000}, "mazda", ""),
    38: ({"price": 979000}, "mazda", "regular 979,000 (promo 859,000)"),
    40: ({"price": 899000}, "mazda", "CX-30 Essential 2.0 Prime"),
    41: ({"price": 1219000}, "mazda", ""),
    42: ({"price": 1499000}, "mazda", ""),
    44: ({"price": 992000}, "mazda", "Double Cab Hi-Racer 2.2 XT 6AT (entry Freestyle Cab 762,000)"),
    45: ({"price": 2820000}, "mazda", "MX-5 2.0 RF"),
    46: ({"price": 573000}, "nissan", ""),
    48: ({"price": 839000}, "kicks", "new-generation Kicks e-POWER (Motor Show 2026)"),
    49: ({"price": 792000}, "nissan", "Double Cab Calibre SL 6MT"),
    50: ({"price": 1199000}, "nissan", ""),
    52: ({"price": 1690000}, "nissan", ""),
    53: ({"price": 561000}, "isuzu", ""),
    54: ({"price": 940000}, "isuzu", ""),
    55: ({"price": 1197000}, "isuzu", ""),
    56: ({"price": 727000}, "mitsu", "Double Cab 2.4 PRO"),
    57: ({"price": 1299000}, "mitsu", ""),
    59: ({"price": 939000, "fuelType": "hybrid", "name": "Mitsubishi Xpander HEV"}, "mitsu", "Xpander is sold as HEV only"),
    60: ({"price": 969000, "fuelType": "hybrid", "name": "Mitsubishi Xpander Cross HEV"}, "mitsu", "Xpander Cross is sold as HEV only"),
    61: ({"price": 564000}, "mitsu", ""),
    63: ({"price": 567000}, "suzuki", ""),
    69: ({"price": 929000}, "hyundai", ""),
    110: ({"price": 1399000}, "hyundai", ""),
    122: ({"price": 1999000}, "hyundai", ""),
    102: ({"price": 3390000}, "volvo", "XC60 Ultra T8 PHEV"),
    92: ({"price": 1099000}, "deepal", "page also shows 1,119,000 in a later list"),
    97: ({"price": 799900}, "aion", ""),
    119: ({"price": 1249000}, "aion", ""),
    108: ({"price": 2399000}, "zeekr", "009 7-seat single motor"),
    82: ({"price": 509900}, "byd", ""),
    83: ({"price": 669900}, "byd", "after BYD's 2026 price cut (was 799,900)"),
    51: ({"price": 769900}, "byd", "after BYD's 2026 price cut (Jan list was 909,900); M6 Dynamic is 6 seats"),
    84: ({"price": 989900}, "byd", ""),
    85: ({"price": 859900, "name": "BYD Sealion 6 DM-i"}, "byd", ""),
    114: ({"price": 1199900}, "byd", ""),
    78: ({"price": 599900}, "mg", "MG4 Electric MY2026 D Standard"),
    116: ({"price": 1399900}, "mg", ""),
    117: ({"price": 1799000}, "mg", ""),
    91: ({"price": 1549000, "name": "GWM Tank 300 HEV"}, "gwm", ""),
    86: ({"price": 2299000}, "avatr", ""),
    98: ({"price": 1379000}, "ford", ""),
    99: ({"price": 939000}, "ford", "Double Cab XLS 2.0L Turbo HR"),
    100: ({"price": 1804000, "fuelType": "diesel"}, "ford", "entry Raptor is the 2.0L bi-turbo diesel"),
}

# ---------------------------------------------------------------- removed from recommendations
DISCONTINUE = {
    5: "Corolla Cross is sold as HEV only in 2026 (petrol not on Toyota's list)",
    10: "Innova Zenix is sold as HEV only (petrol trim not on Toyota's 2026 list)",
    28: "duplicate: Honda sells the HR-V in Thailand as e:HEV only (see id 29)",
    47: "duplicate: every Thai Almera is the 1.0 turbo (see id 46)",
    115: "duplicate: BYD Seal U DM-i is sold in Thailand as Sealion 6 DM-i (see id 85)",
}
# carry the verified HR-V specs to the e:HEV entry that stays
MOVE_OVERRIDES = {28: 29}

# ---------------------------------------------------------------- new models
EST = ["horsepower", "airbags", "consumption", "warranty"]


def car(name, body, fuel, price, cons, seats, hp, airbags, life, net, nat, wy, wkm, src, note=""):
    return dict(name=name, bodyType=body, fuelType=fuel, price=price, consumption=cons, seats=seats,
                lifestyle=life, serviceNetwork=net, nationality=nat, transmission="auto",
                horsepower=hp, warrantyYears=wy, warrantyKm=wkm, airbags=airbags, _src=src, _note=note)


NEW = [
    car("Toyota bZ4X", "suv", "ev", 1529000, "6.2 km/kWh", 5, 218, 7, ["family", "city"], "wide", "japan", 5, 150000, "toyota"),
    car("Toyota Land Cruiser FJ", "suv", "petrol", 1269000, "10 km/l", 5, 163, 7, ["adventure"], "wide", "japan", 5, 150000, "toyota", "made in Thailand, 2.7 petrol 4WD"),
    car("Toyota Hilux Travo", "pickup", "diesel", 767000, "15 km/l", 5, 150, 7, ["business", "adventure"], "wide", "japan", 5, 150000, "toyota", "successor to Hilux Revo"),
    car("Honda e:N1", "suv", "ev", 1199000, "6.5 km/kWh", 5, 204, 6, ["city", "family"], "wide", "japan", 5, 150000, "honda"),
    car("Mazda 6e", "sedan", "ev", 1169000, "6.0 km/kWh", 5, 258, 7, ["business", "family"], "medium", "japan", 5, 150000, "mazda", "CBU China, 654 km NEDC"),
    car("Mazda CX-6e", "suv", "ev", 1259000, "5.8 km/kWh", 5, 258, 7, ["family"], "medium", "japan", 5, 150000, "mazda"),
    car("Mitsubishi Xforce HEV", "suv", "hybrid", 899000, "24.4 km/l", 5, 116, 6, ["city", "family"], "wide", "japan", 7, 150000, "mitsu", "24.4 km/l and 7-yr/150,000 km warranty: car250.com/price/new-mitsubishi"),
    car("Mitsubishi Outlander PHEV", "suv", "hybrid", 1640000, "40 km/l", 5, 248, 8, ["family", "adventure"], "wide", "japan", 5, 100000, "mitsu"),
    car("Suzuki Fronx", "suv", "petrol", 689000, "20 km/l", 5, 103, 6, ["city", "firstCar"], "medium", "japan", 5, 100000, "suzuki"),
    car("Deepal S05", "suv", "ev", 799000, "6.3 km/kWh", 5, 218, 6, ["city", "family"], "growing", "china", 8, 160000, "deepal", "S05 LITE BEV"),
    car("GAC AION UT", "hatchback", "ev", 469900, "7.0 km/kWh", 5, 136, 6, ["city", "firstCar"], "growing", "china", 8, 160000, "aion"),
    car("Zeekr 7X", "suv", "ev", 1399000, "5.6 km/kWh", 5, 421, 7, ["family", "business"], "growing", "china", 8, 160000, "zeekr"),
    car("BYD Atto 1", "hatchback", "ev", 429900, "7.5 km/kWh", 4, 75, 4, ["city", "firstCar"], "growing", "china", 8, 160000, "byd"),
    car("BYD Atto 2", "suv", "ev", 629900, "6.8 km/kWh", 5, 174, 6, ["city", "family"], "growing", "china", 8, 160000, "byd"),
    car("BYD Seal 5 DM-i", "sedan", "hybrid", 599900, "26.3 km/l", 5, 180, 6, ["city", "family"], "growing", "china", 8, 160000, "byd", "plug-in hybrid"),
    car("BYD Sealion 5 DM-i", "suv", "hybrid", 759900, "25 km/l", 5, 212, 6, ["family", "city"], "growing", "china", 8, 160000, "byd", "plug-in hybrid"),
    car("BYD Seal 6", "sedan", "ev", 799900, "6.5 km/kWh", 5, 218, 6, ["family", "business"], "growing", "china", 8, 160000, "seal6"),
    car("Denza D9", "mpv", "ev", 1949900, "5.0 km/kWh", 7, 313, 9, ["family", "business"], "growing", "china", 8, 160000, "byd"),
    car("MG S5 EV", "suv", "ev", 649900, "6.5 km/kWh", 5, 170, 6, ["city", "family"], "wide", "china", 5, 150000, "mg"),
    car("MG IM5", "sedan", "ev", 1449000, "6.0 km/kWh", 5, 400, 7, ["business"], "wide", "china", 5, 150000, "mg", "860 km NEDC, 100 kWh"),
    car("MG URBAN", "hatchback", "ev", 549900, "7.0 km/kWh", 5, 136, 6, ["city", "firstCar"], "wide", "china", 5, 150000, "mgurban"),
    car("GWM Tank 300 Diesel", "suv", "diesel", 1049000, "11 km/l", 5, 184, 6, ["adventure"], "medium", "china", 7, 200000, "gwm"),
    car("GWM ORA 5 EV", "suv", "ev", 649000, "6.5 km/kWh", 5, 204, 6, ["city", "family"], "medium", "china", 8, 160000, "ora5"),
    car("GWM ORA 5 HEV", "suv", "hybrid", 709000, "20 km/l", 5, 190, 6, ["city", "family"], "medium", "china", 7, 200000, "ora5"),
    car("XPENG X9", "mpv", "ev", 2399000, "5.0 km/kWh", 7, 315, 7, ["family", "business"], "growing", "china", 7, 160000, "xpeng"),
    car("Geely EX2", "hatchback", "ev", 429990, "7.5 km/kWh", 5, 116, 6, ["city", "firstCar"], "growing", "china", 8, 160000, "geely"),
    car("Geely EX5", "suv", "ev", 759000, "6.3 km/kWh", 5, 218, 6, ["family", "city"], "growing", "china", 8, 160000, "geely", "ground clearance 173 mm, cargo 461 L: headlightmag.com/?p=336644"),
    car("Chery Q", "hatchback", "ev", 469900, "7.0 km/kWh", 5, 122, 6, ["city", "firstCar"], "growing", "china", 8, 160000, "chery", "6 airbags, 360 camera: 9carthai.com/?p=480322"),
    car("Chery V23", "suv", "ev", 759900, "6.5 km/kWh", 5, 184, 6, ["city", "adventure"], "growing", "china", 8, 160000, "chery"),
    car("Omoda C5 EV", "suv", "ev", 629000, "6.5 km/kWh", 5, 211, 6, ["city"], "growing", "china", 8, 200000, "omoda", "launch price; 211 hp, 422 km"),
    car("Jaecoo 5 EV", "suv", "ev", 549000, "6.8 km/kWh", 5, 211, 6, ["city", "family"], "growing", "china", 8, 200000, "omoda", "assembled in Thailand"),
]
VERIFIED_NEW_FIELDS = {  # base fields a source in this pass did state
    "Mitsubishi Xforce HEV": ["consumption", "warranty"],
    "BYD Seal 5 DM-i": ["consumption"],
    "Chery Q": ["airbags", "horsepower"],
    "Omoda C5 EV": ["horsepower"],
}
EXTRA_OV = {
    "Geely EX5": {"ground_clearance_mm": 173, "cargo_l": 461},
}

# ---------------------------------------------------------------- apply


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def main():
    s = open(DB, encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    o = json.load(open(OV, encoding="utf-8"))

    def line_of(i):
        m = re.search(r"    \{'id': %d, [^\r\n]*\}," % i, s)
        assert m, i
        return m.group(0)

    # updates
    for i, (chg, src, note) in UPDATES.items():
        line = line_of(i)
        new = line
        for k, v in chg.items():
            pat = r"'%s': (\d+|'[^']*')" % k
            rep = "'%s': %s" % (k, v if isinstance(v, int) else repr(v))
            new, n = re.subn(pat, lambda _m: rep, new, count=1)
            assert n == 1, (i, k)
        s = s.replace(line, new)
        e = o.setdefault(str(i), {})
        if "price" in chg:
            e["price_thb_entry"] = chg["price"]
        txt = "Price %s%s: %s" % (format(chg["price"], ","), (" — " + note) if note else "", S[src])
        e["source"] = txt + (" · Earlier: " + e["source"] if e.get("source") else "")
        e["collected_on"] = D
        if "consumption" in chg:
            e.setdefault("estimated", [])
            if "economy" not in e["estimated"]:
                e["estimated"].append("economy")

    for old, new in MOVE_OVERRIDES.items():
        src = dict(o.get(str(old), {}))
        dst = o.setdefault(str(new), {})
        for k in ("ground_clearance_mm", "asean_ncap_stars"):
            if k in src:
                dst[k] = src[k]
        if src.get("source"):
            dst["source"] = dst.get("source", "") + " · (moved from duplicate id %d) %s" % (old, src["source"])

    # discontinued map
    m = re.search(r"DISCONTINUED = \{" + nl + r"(.*?)" + nl + r"\}", s, re.S)
    body = m.group(1)
    for i, why in DISCONTINUE.items():
        if "    %d:" % i not in body:
            body += nl + "    %d: %r," % (i, why)
    s = s[:m.start(1)] + body + s[m.end(1):]

    # new cars, appended before the closing bracket of the CARS list
    ids = [int(x) for x in re.findall(r"\{'id': (\d+),", s)]
    next_id = max(ids) + 1
    existing = set(re.findall(r"'name': '([^']+)'", s))
    end = s.index(nl + "]" + nl)
    new_lines = []
    for c in NEW:
        if c["name"] in existing:
            continue
        cid = next_id
        next_id += 1
        src, note = c.pop("_src"), c.pop("_note")
        rec = {"id": cid}
        rec.update(c)
        rec["photo"] = {"file": "%d-%s.jpg" % (cid, slug(c["name"])), "credit": None}
        new_lines.append("    " + repr(rec) + ",")
        est = [f for f in EST if f not in VERIFIED_NEW_FIELDS.get(c["name"], [])]
        e = {"price_thb_entry": c["price"],
             "source": "New model added 25 Nov 2026. Price %s%s: %s. Not yet verified: %s"
                       % (format(c["price"], ","), (" — " + note) if note else "", S[src], ", ".join(est)),
             "collected_on": D}
        if "consumption" in est:
            e["estimated"] = ["economy"]
        e.update(EXTRA_OV.get(c["name"], {}))
        o[str(cid)] = e
    if new_lines:
        s = s[:end] + nl + nl.join(new_lines) + s[end:]

    open(DB, "w", encoding="utf-8", newline="").write(s)
    json.dump(o, open(OV, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("updated %d, discontinued %d, added %d" % (len(UPDATES), len(DISCONTINUE), len(new_lines)))


if __name__ == "__main__":
    main()
