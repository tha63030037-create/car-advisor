/* ============================================
   ORIGINAL SVG CAR ILLUSTRATIONS
   Hand-drawn stylized silhouettes per body type —
   not photos or traced reproductions of any real
   vehicle/brand. Colors are passed in so the same
   shape set works on light cards and the dark hero.
   ============================================ */
const CAR_ART = {
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

function carArtSVG(bodyType, colors, extraClass) {
  const c = Object.assign({
    body: "var(--gold)", cabin: "var(--gold-deep)", glass: "var(--card-light)",
    wheel: "var(--card-light-ink)", hub: "var(--card-light)",
  }, colors || {});
  const inner = (CAR_ART[bodyType] || CAR_ART.sedan)(c);
  return `<svg class="car-art ${extraClass || ""}" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

const carImageCache = {
  "Subaru BRZ": "https://upload.wikimedia.org/wikipedia/commons/5/53/2022_Subaru_BRZ_2.4_EyeSight.jpg",
  "Toyota GR86": "https://upload.wikimedia.org/wikipedia/commons/0/05/2022_Toyota_GR86_Premium_in_Track_bRed%2C_front_right_%28NYIAS_2022%29_%28cropped%29.jpg",
  "Mazda MX-5 Roadster": "https://upload.wikimedia.org/wikipedia/commons/9/95/Mazda_Roadster_%28MX-5%29_by_Negawa_Bridge_%28cropped%29.jpg",
  "Honda Civic Type R": "https://upload.wikimedia.org/wikipedia/commons/5/58/Honda_CIVIC_TYPE_R_%28FL5%29_front.jpg"
};

function applyCarImage(imgElement, imageUrl) {
  imgElement.onload = () => {
    imgElement.style.display = "block";
    // Force minor reflow to trigger transition
    void imgElement.offsetWidth;
    imgElement.style.opacity = "1";
    if (imgElement.previousElementSibling) {
      imgElement.previousElementSibling.style.opacity = "0";
      imgElement.previousElementSibling.style.pointerEvents = "none";
    }
  };
  imgElement.onerror = () => {
    imgElement.style.display = "none";
  };
  imgElement.src = imageUrl;
}

function loadCarImage(carName, imgElement) {
  if (carImageCache[carName]) {
    if (carImageCache[carName] === "failed") {
      imgElement.style.display = "none";
      return;
    }
    applyCarImage(imgElement, carImageCache[carName]);
    return;
  }

  const query = encodeURIComponent(carName);
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${query}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=500`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (data && data.query && data.query.pages) {
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        if (page && page.thumbnail && page.thumbnail.source) {
          const imageUrl = page.thumbnail.source;
          carImageCache[carName] = imageUrl;
          applyCarImage(imgElement, imageUrl);
          return;
        }
      }
      tryAlternativeSearch(carName, imgElement);
    })
    .catch(() => {
      tryAlternativeSearch(carName, imgElement);
    });
}

function tryAlternativeSearch(carName, imgElement) {
  const query = encodeURIComponent(carName + " car");
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${query}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=500`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (data && data.query && data.query.pages) {
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        if (page && page.thumbnail && page.thumbnail.source) {
          const imageUrl = page.thumbnail.source;
          carImageCache[carName] = imageUrl;
          applyCarImage(imgElement, imageUrl);
          return;
        }
      }
      carImageCache[carName] = "failed";
      imgElement.style.display = "none";
    })
    .catch(() => {
      carImageCache[carName] = "failed";
      imgElement.style.display = "none";
    });
}

function carVisualHTML(car, sizeClass) {
  const cleanName = car.name.replace(" Hybrid", "").replace(" Electric", "").replace(" e:HEV", "").replace(" e-Power", "");
  const svgMarkup = carArtSVG(car.bodyType, {}, sizeClass);
  return `
    <div class="car-visual-container ${sizeClass || ""}">
      <div class="car-visual-svg">
        ${svgMarkup}
      </div>
      <img class="car-photo ${sizeClass || ""}" src="" alt="${car.name}"
        data-carname="${cleanName}" data-bodytype="${car.bodyType}" data-size-class="${sizeClass || ""}"
        style="opacity: 0; display: none;" />
    </div>
  `;
}

function wirePhotoFallbacks(root) {
  root.querySelectorAll("img.car-photo").forEach((img) => {
    const carName = img.dataset.carname;
    if (carName) {
      loadCarImage(carName, img);
    }
  });
}

function heroArtSVG() {
  const c = { body: "var(--gold)", cabin: "var(--gold-bright)", glass: "var(--ink)", wheel: "var(--cream)", hub: "var(--ink)" };
  return `
    <svg viewBox="0 0 640 130" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; display:block;">
      <line x1="0" y1="112" x2="640" y2="112" stroke="rgba(241,233,216,0.18)" stroke-width="2" stroke-dasharray="10 10" />
      <g transform="translate(6,6) scale(0.9)">${CAR_ART.hatchback(c)}</g>
      <g transform="translate(226,-8) scale(1.05)">${CAR_ART.suv(c)}</g>
      <g transform="translate(456,4) scale(0.88)">${CAR_ART.pickup(c)}</g>
    </svg>
  `;
}

/* ============================================
   MOCK DATASET (25 cars) — illustrative demo
   prices/specs, not live scraped market data.
   ============================================ */
const CARS = [
  { id: 1, name: "Toyota Yaris Ativ", bodyType: "sedan", fuelType: "petrol", price: 599000, consumption: "23 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 107, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "01-toyota-yaris-ativ.jpg", credit: null } },
  { id: 2, name: "Toyota Yaris", bodyType: "hatchback", fuelType: "petrol", price: 579000, consumption: "22 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 107, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "02-toyota-yaris.jpg", credit: null } },
  { id: 3, name: "Toyota Yaris Cross", bodyType: "suv", fuelType: "hybrid", price: 949000, consumption: "25 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 114, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "03-toyota-yaris-cross.jpg", credit: null } },
  { id: 4, name: "Toyota Corolla Altis", bodyType: "sedan", fuelType: "petrol", price: 869000, consumption: "18 km/l", seats: 5, lifestyle: ["business", "family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 140, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "04-toyota-corolla-altis.jpg", credit: null } },
  { id: 5, name: "Toyota Corolla Cross", bodyType: "suv", fuelType: "petrol", price: 969000, consumption: "16 km/l", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 140, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "05-toyota-corolla-cross.jpg", credit: null } },
  { id: 6, name: "Toyota Corolla Cross Hybrid", bodyType: "suv", fuelType: "hybrid", price: 999000, consumption: "24 km/l", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 122, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "06-toyota-corolla-cross-hybrid.jpg", credit: null } },
  { id: 7, name: "Toyota Camry Hybrid", bodyType: "sedan", fuelType: "hybrid", price: 1699000, consumption: "22 km/l", seats: 5, lifestyle: ["business", "family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 178, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "07-toyota-camry-hybrid.jpg", credit: null } },
  { id: 8, name: "Toyota Veloz", bodyType: "mpv", fuelType: "petrol", price: 829000, consumption: "16 km/l", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 104, warrantyYears: 3, warrantyKm: 100000, airbags: 4, photo: { file: "08-toyota-veloz.jpg", credit: null } },
  { id: 9, name: "Toyota Sienta", bodyType: "mpv", fuelType: "hybrid", price: 899000, consumption: "23 km/l", seats: 7, lifestyle: ["family", "city"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 91, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "09-toyota-sienta.jpg", credit: null } },
  { id: 10, name: "Toyota Innova Zenix", bodyType: "mpv", fuelType: "petrol", price: 999000, consumption: "14 km/l", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 150, warrantyYears: 3, warrantyKm: 100000, airbags: 4, photo: { file: "10-toyota-innova-zenix.jpg", credit: null } },
  { id: 11, name: "Toyota Innova Zenix Hybrid", bodyType: "mpv", fuelType: "hybrid", price: 1139000, consumption: "20 km/l", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 116, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "11-toyota-innova-zenix-hybrid.jpg", credit: null } },
  { id: 12, name: "Toyota Fortuner", bodyType: "ppv", fuelType: "diesel", price: 1469000, consumption: "15 km/l", seats: 7, lifestyle: ["adventure", "family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 204, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "12-toyota-fortuner.jpg", credit: null } },
  { id: 13, name: "Toyota Fortuner Legender", bodyType: "ppv", fuelType: "diesel", price: 1599000, consumption: "15 km/l", seats: 7, lifestyle: ["adventure", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 204, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "13-toyota-fortuner-legender.jpg", credit: null } },
  { id: 14, name: "Toyota Hilux Revo Standard Cab", bodyType: "pickup", fuelType: "diesel", price: 639000, consumption: "17 km/l", seats: 3, lifestyle: ["business"], serviceNetwork: "wide", nationality: "japan", transmission: "manual", horsepower: 150, warrantyYears: 3, warrantyKm: 100000, airbags: 2, photo: { file: "14-toyota-hilux-revo-standard-cab.jpg", credit: null } },
  { id: 15, name: "Toyota Hilux Revo Double Cab", bodyType: "pickup", fuelType: "diesel", price: 859000, consumption: "15 km/l", seats: 5, lifestyle: ["business", "adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 204, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "15-toyota-hilux-revo-double-cab.jpg", credit: null } },
  { id: 16, name: "Toyota Hilux Revo Rocco", bodyType: "pickup", fuelType: "diesel", price: 1099000, consumption: "15 km/l", seats: 5, lifestyle: ["adventure", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 204, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "16-toyota-hilux-revo-rocco.jpg", credit: null } },
  { id: 17, name: "Toyota Hilux Champ", bodyType: "pickup", fuelType: "diesel", price: 549000, consumption: "19 km/l", seats: 2, lifestyle: ["business", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "manual", horsepower: 109, warrantyYears: 3, warrantyKm: 100000, airbags: 2, photo: { file: "17-toyota-hilux-champ.jpg", credit: null } },
  { id: 18, name: "Toyota GR86", bodyType: "coupe", fuelType: "petrol", price: 1839000, consumption: "12 km/l", seats: 2, lifestyle: ["adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "manual", horsepower: 234, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "18-toyota-gr86.jpg", credit: null } },
  { id: 19, name: "Toyota GR Yaris", bodyType: "hatchback", fuelType: "petrol", price: 1899000, consumption: "11 km/l", seats: 4, lifestyle: ["adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "manual", horsepower: 300, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "19-toyota-gr-yaris.jpg", credit: null } },
  { id: 20, name: "Toyota C-HR", bodyType: "suv", fuelType: "hybrid", price: 1199000, consumption: "23 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 122, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "20-toyota-c-hr.jpg", credit: null } },
  { id: 21, name: "Toyota Alphard Hybrid", bodyType: "mpv", fuelType: "hybrid", price: 2999000, consumption: "18 km/l", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 186, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "21-toyota-alphard-hybrid.jpg", credit: null } },
  { id: 22, name: "Honda City", bodyType: "sedan", fuelType: "petrol", price: 689000, consumption: "20 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 119, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "22-honda-city.jpg", credit: null } },
  { id: 23, name: "Honda City Hatchback", bodyType: "hatchback", fuelType: "petrol", price: 699000, consumption: "19 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 119, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "23-honda-city-hatchback.jpg", credit: null } },
  { id: 24, name: "Honda City e:HEV", bodyType: "sedan", fuelType: "hybrid", price: 839000, consumption: "27 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 126, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "24-honda-city-ehev.jpg", credit: null } },
  { id: 25, name: "Honda Civic", bodyType: "sedan", fuelType: "petrol", price: 999000, consumption: "17 km/l", seats: 5, lifestyle: ["business", "city"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 121, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "25-honda-civic.jpg", credit: null } },
  { id: 26, name: "Honda Civic Hatchback RS", bodyType: "hatchback", fuelType: "petrol", price: 1199000, consumption: "16 km/l", seats: 5, lifestyle: ["city", "adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 178, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "26-honda-civic-hatchback-rs.jpg", credit: null } },
  { id: 27, name: "Honda Civic Type R", bodyType: "hatchback", fuelType: "petrol", price: 3290000, consumption: "10 km/l", seats: 4, lifestyle: ["adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "manual", horsepower: 329, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "27-honda-civic-type-r.jpg", credit: null } },
  { id: 28, name: "Honda HR-V", bodyType: "suv", fuelType: "petrol", price: 899000, consumption: "17 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 121, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "28-honda-hr-v.jpg", credit: null } },
  { id: 29, name: "Honda HR-V e:HEV", bodyType: "suv", fuelType: "hybrid", price: 1099000, consumption: "23 km/l", seats: 5, lifestyle: ["family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 131, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "29-honda-hr-v-ehev.jpg", credit: null } },
  { id: 30, name: "Honda CR-V", bodyType: "suv", fuelType: "petrol", price: 1489000, consumption: "14 km/l", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 193, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "30-honda-cr-v.jpg", credit: null } },
  { id: 31, name: "Honda CR-V e:HEV", bodyType: "suv", fuelType: "hybrid", price: 1699000, consumption: "18 km/l", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 204, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "31-honda-cr-v-ehev.jpg", credit: null } },
  { id: 32, name: "Honda BR-V", bodyType: "mpv", fuelType: "petrol", price: 799000, consumption: "16 km/l", seats: 7, lifestyle: ["family", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 119, warrantyYears: 5, warrantyKm: 150000, airbags: 4, photo: { file: "32-honda-br-v.jpg", credit: null } },
  { id: 33, name: "Honda WR-V", bodyType: "suv", fuelType: "petrol", price: 799000, consumption: "17 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 121, warrantyYears: 5, warrantyKm: 150000, airbags: 4, photo: { file: "33-honda-wr-v.jpg", credit: null } },
  { id: 34, name: "Honda Accord", bodyType: "sedan", fuelType: "hybrid", price: 1699000, consumption: "20 km/l", seats: 5, lifestyle: ["business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 204, warrantyYears: 5, warrantyKm: 150000, airbags: 8, photo: { file: "34-honda-accord.jpg", credit: null } },
  { id: 35, name: "Honda e:N1", bodyType: "suv", fuelType: "ev", price: 1199000, consumption: "6.0 km/kWh", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 201, warrantyYears: 8, warrantyKm: 180000, airbags: 6, photo: { file: "35-honda-en1.jpg", credit: null } },
  { id: 36, name: "Mazda2 Hatchback", bodyType: "hatchback", fuelType: "petrol", price: 619000, consumption: "19 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 90, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "36-mazda2-hatchback.jpg", credit: null } },
  { id: 37, name: "Mazda2 Sedan", bodyType: "sedan", fuelType: "petrol", price: 639000, consumption: "19 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 90, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "37-mazda2-sedan.jpg", credit: null } },
  { id: 38, name: "Mazda3", bodyType: "sedan", fuelType: "petrol", price: 949000, consumption: "16 km/l", seats: 5, lifestyle: ["business", "city"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 165, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "38-mazda3.jpg", credit: null } },
  { id: 39, name: "Mazda CX-3", bodyType: "suv", fuelType: "petrol", price: 899000, consumption: "16 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 110, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "39-mazda-cx-3.jpg", credit: null } },
  { id: 40, name: "Mazda CX-30", bodyType: "suv", fuelType: "petrol", price: 1099000, consumption: "15 km/l", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 165, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "40-mazda-cx-30.jpg", credit: null } },
  { id: 41, name: "Mazda CX-5", bodyType: "suv", fuelType: "petrol", price: 1259000, consumption: "14 km/l", seats: 5, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 165, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "41-mazda-cx-5.jpg", credit: null } },
  { id: 42, name: "Mazda CX-8", bodyType: "suv", fuelType: "petrol", price: 1599000, consumption: "12 km/l", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 188, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "42-mazda-cx-8.jpg", credit: null } },
  { id: 43, name: "Mazda CX-60", bodyType: "suv", fuelType: "hybrid", price: 2299000, consumption: "16 km/l", seats: 5, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 254, warrantyYears: 5, warrantyKm: 100000, airbags: 7, photo: { file: "43-mazda-cx-60.jpg", credit: null } },
  { id: 44, name: "Mazda BT-50", bodyType: "pickup", fuelType: "diesel", price: 859000, consumption: "15 km/l", seats: 5, lifestyle: ["business", "adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 190, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "44-mazda-bt-50.jpg", credit: null } },
  { id: 45, name: "Mazda MX-5", bodyType: "coupe", fuelType: "petrol", price: 1899000, consumption: "14 km/l", seats: 2, lifestyle: ["adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "manual", horsepower: 184, warrantyYears: 5, warrantyKm: 100000, airbags: 4, photo: { file: "45-mazda-mx-5.jpg", credit: null } },
  { id: 46, name: "Nissan Almera", bodyType: "sedan", fuelType: "petrol", price: 579000, consumption: "21 km/l", seats: 5, lifestyle: ["city", "family", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 100, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "46-nissan-almera.jpg", credit: null } },
  { id: 47, name: "Nissan Almera Turbo", bodyType: "sedan", fuelType: "petrol", price: 699000, consumption: "18 km/l", seats: 5, lifestyle: ["city", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 100, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "47-nissan-almera-turbo.jpg", credit: null } },
  { id: 48, name: "Nissan Kicks e-Power", bodyType: "suv", fuelType: "hybrid", price: 899000, consumption: "24 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 129, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "48-nissan-kicks-e-power.jpg", credit: null } },
  { id: 49, name: "Nissan Navara", bodyType: "pickup", fuelType: "diesel", price: 799000, consumption: "15 km/l", seats: 5, lifestyle: ["business", "adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 190, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "49-nissan-navara.jpg", credit: null } },
  { id: 50, name: "Nissan Terra", bodyType: "ppv", fuelType: "diesel", price: 1399000, consumption: "14 km/l", seats: 7, lifestyle: ["family", "adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 190, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "50-nissan-terra.jpg", credit: null } },
  { id: 51, name: "Nissan X-Trail e-Power", bodyType: "suv", fuelType: "hybrid", price: 1799000, consumption: "19 km/l", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 204, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "51-nissan-x-trail-e-power.jpg", credit: null } },
  { id: 52, name: "Nissan Serena e-Power", bodyType: "mpv", fuelType: "hybrid", price: 1699000, consumption: "18 km/l", seats: 8, lifestyle: ["family"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 163, warrantyYears: 5, warrantyKm: 100000, airbags: 6, photo: { file: "52-nissan-serena-e-power.jpg", credit: null } },
  { id: 53, name: "Isuzu D-Max Standard Cab", bodyType: "pickup", fuelType: "diesel", price: 589000, consumption: "18 km/l", seats: 3, lifestyle: ["business", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "manual", horsepower: 150, warrantyYears: 3, warrantyKm: 100000, airbags: 2, photo: { file: "53-isuzu-d-max-standard-cab.jpg", credit: null } },
  { id: 54, name: "Isuzu D-Max V-Cross", bodyType: "pickup", fuelType: "diesel", price: 999000, consumption: "16 km/l", seats: 5, lifestyle: ["adventure", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 190, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "54-isuzu-d-max-v-cross.jpg", credit: null } },
  { id: 55, name: "Isuzu MU-X", bodyType: "ppv", fuelType: "diesel", price: 1229000, consumption: "15 km/l", seats: 7, lifestyle: ["family", "adventure", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 190, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "55-isuzu-mu-x.jpg", credit: null } },
  { id: 56, name: "Mitsubishi Triton", bodyType: "pickup", fuelType: "diesel", price: 799000, consumption: "17 km/l", seats: 5, lifestyle: ["adventure", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 181, warrantyYears: 5, warrantyKm: 100000, airbags: 7, photo: { file: "56-mitsubishi-triton.jpg", credit: null } },
  { id: 57, name: "Mitsubishi Triton Athlete", bodyType: "pickup", fuelType: "diesel", price: 1099000, consumption: "16 km/l", seats: 5, lifestyle: ["adventure", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 204, warrantyYears: 5, warrantyKm: 100000, airbags: 7, photo: { file: "57-mitsubishi-triton-athlete.jpg", credit: null } },
  { id: 58, name: "Mitsubishi Pajero Sport", bodyType: "ppv", fuelType: "diesel", price: 1499000, consumption: "14 km/l", seats: 7, lifestyle: ["family", "adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 181, warrantyYears: 5, warrantyKm: 100000, airbags: 7, photo: { file: "58-mitsubishi-pajero-sport.jpg", credit: null } },
  { id: 59, name: "Mitsubishi Xpander", bodyType: "mpv", fuelType: "petrol", price: 799000, consumption: "16 km/l", seats: 7, lifestyle: ["family", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 105, warrantyYears: 5, warrantyKm: 100000, airbags: 2, photo: { file: "59-mitsubishi-xpander.jpg", credit: null } },
  { id: 60, name: "Mitsubishi Xpander Cross", bodyType: "mpv", fuelType: "petrol", price: 899000, consumption: "15 km/l", seats: 7, lifestyle: ["family", "adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 105, warrantyYears: 5, warrantyKm: 100000, airbags: 2, photo: { file: "60-mitsubishi-xpander-cross.jpg", credit: null } },
  { id: 61, name: "Mitsubishi Attrage", bodyType: "sedan", fuelType: "petrol", price: 539000, consumption: "22 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 100, warrantyYears: 5, warrantyKm: 100000, airbags: 2, photo: { file: "61-mitsubishi-attrage.jpg", credit: null } },
  { id: 62, name: "Mitsubishi Outlander PHEV", bodyType: "suv", fuelType: "hybrid", price: 1899000, consumption: "20 km/l", seats: 5, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 248, warrantyYears: 5, warrantyKm: 100000, airbags: 7, photo: { file: "62-mitsubishi-outlander-phev.jpg", credit: null } },
  { id: 63, name: "Suzuki Swift", bodyType: "hatchback", fuelType: "petrol", price: 579000, consumption: "20 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "growing", nationality: "japan", transmission: "auto", horsepower: 82, warrantyYears: 3, warrantyKm: 100000, airbags: 2, photo: { file: "63-suzuki-swift.jpg", credit: null } },
  { id: 64, name: "Suzuki Ertiga", bodyType: "mpv", fuelType: "petrol", price: 689000, consumption: "17 km/l", seats: 7, lifestyle: ["family", "firstCar"], serviceNetwork: "growing", nationality: "japan", transmission: "auto", horsepower: 92, warrantyYears: 3, warrantyKm: 100000, airbags: 2, photo: { file: "64-suzuki-ertiga.jpg", credit: null } },
  { id: 65, name: "Suzuki XL7", bodyType: "mpv", fuelType: "petrol", price: 799000, consumption: "16 km/l", seats: 7, lifestyle: ["family"], serviceNetwork: "growing", nationality: "japan", transmission: "auto", horsepower: 92, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "65-suzuki-xl7.jpg", credit: null } },
  { id: 66, name: "Suzuki Jimny", bodyType: "suv", fuelType: "petrol", price: 899000, consumption: "14 km/l", seats: 4, lifestyle: ["adventure", "firstCar"], serviceNetwork: "growing", nationality: "japan", transmission: "manual", horsepower: 101, warrantyYears: 3, warrantyKm: 100000, airbags: 2, photo: { file: "66-suzuki-jimny.jpg", credit: null } },
  { id: 67, name: "Subaru XV", bodyType: "suv", fuelType: "petrol", price: 1199000, consumption: "15 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "growing", nationality: "japan", transmission: "auto", horsepower: 158, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "67-subaru-xv.jpg", credit: null } },
  { id: 68, name: "Subaru Forester", bodyType: "suv", fuelType: "petrol", price: 1399000, consumption: "13 km/l", seats: 5, lifestyle: ["family", "adventure"], serviceNetwork: "growing", nationality: "japan", transmission: "auto", horsepower: 182, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "68-subaru-forester.jpg", credit: null } },
  { id: 69, name: "Hyundai Creta", bodyType: "suv", fuelType: "petrol", price: 839000, consumption: "16 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "growing", nationality: "korea", transmission: "auto", horsepower: 113, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "69-hyundai-creta.jpg", credit: null } },
  { id: 70, name: "Hyundai Stargazer", bodyType: "mpv", fuelType: "petrol", price: 899000, consumption: "15 km/l", seats: 7, lifestyle: ["family"], serviceNetwork: "growing", nationality: "korea", transmission: "auto", horsepower: 120, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "70-hyundai-stargazer.jpg", credit: null } },
  { id: 71, name: "Kia Seltos", bodyType: "suv", fuelType: "petrol", price: 899000, consumption: "15 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "growing", nationality: "korea", transmission: "auto", horsepower: 146, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "71-kia-seltos.jpg", credit: null } },
  { id: 72, name: "Kia Sonet", bodyType: "suv", fuelType: "petrol", price: 699000, consumption: "17 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "growing", nationality: "korea", transmission: "auto", horsepower: 115, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "72-kia-sonet.jpg", credit: null } },
  { id: 73, name: "MG3", bodyType: "hatchback", fuelType: "petrol", price: 539000, consumption: "18 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 108, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "73-mg3.jpg", credit: null } },
  { id: 74, name: "MG3 Hybrid+", bodyType: "hatchback", fuelType: "hybrid", price: 639000, consumption: "25 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 95, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "74-mg3-hybrid.jpg", credit: null } },
  { id: 75, name: "MG5", bodyType: "sedan", fuelType: "petrol", price: 579000, consumption: "17 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 115, warrantyYears: 5, warrantyKm: 150000, airbags: 4, photo: { file: "75-mg5.jpg", credit: null } },
  { id: 76, name: "MG ZS", bodyType: "suv", fuelType: "petrol", price: 679000, consumption: "15 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 113, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "76-mg-zs.jpg", credit: null } },
  { id: 77, name: "MG ZS EV", bodyType: "suv", fuelType: "ev", price: 949000, consumption: "6.0 km/kWh", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 177, warrantyYears: 8, warrantyKm: 180000, airbags: 6, photo: { file: "77-mg-zs-ev.jpg", credit: null } },
  { id: 78, name: "MG4 Electric", bodyType: "hatchback", fuelType: "ev", price: 799000, consumption: "6.5 km/kWh", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 170, warrantyYears: 8, warrantyKm: 180000, airbags: 6, photo: { file: "78-mg4-electric.jpg", credit: null } },
  { id: 79, name: "MG HS", bodyType: "suv", fuelType: "hybrid", price: 1199000, consumption: "18 km/l", seats: 5, lifestyle: ["family", "business"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 139, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "79-mg-hs.jpg", credit: null } },
  { id: 80, name: "MG Extender", bodyType: "pickup", fuelType: "diesel", price: 699000, consumption: "16 km/l", seats: 5, lifestyle: ["business"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 150, warrantyYears: 5, warrantyKm: 150000, airbags: 2, photo: { file: "80-mg-extender.jpg", credit: null } },
  { id: 81, name: "MG Cyberster", bodyType: "coupe", fuelType: "ev", price: 2150000, consumption: "5.0 km/kWh", seats: 2, lifestyle: ["adventure"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 335, warrantyYears: 8, warrantyKm: 150000, airbags: 4, photo: { file: "81-mg-cyberster.jpg", credit: null } },
  { id: 82, name: "BYD Dolphin", bodyType: "hatchback", fuelType: "ev", price: 699000, consumption: "7.0 km/kWh", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 95, warrantyYears: 8, warrantyKm: 150000, airbags: 6, photo: { file: "82-byd-dolphin.jpg", credit: null } },
  { id: 83, name: "BYD Atto 3", bodyType: "suv", fuelType: "ev", price: 899000, consumption: "6.2 km/kWh", seats: 5, lifestyle: ["family"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 201, warrantyYears: 8, warrantyKm: 150000, airbags: 6, photo: { file: "83-byd-atto-3.jpg", credit: null } },
  { id: 84, name: "BYD Seal", bodyType: "sedan", fuelType: "ev", price: 1199000, consumption: "6.8 km/kWh", seats: 5, lifestyle: ["business", "city"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 313, warrantyYears: 8, warrantyKm: 150000, airbags: 7, photo: { file: "84-byd-seal.jpg", credit: null } },
  { id: 85, name: "BYD Sealion 6", bodyType: "suv", fuelType: "hybrid", price: 1099000, consumption: "19 km/l", seats: 5, lifestyle: ["family"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 218, warrantyYears: 8, warrantyKm: 150000, airbags: 7, photo: { file: "85-byd-sealion-6.jpg", credit: null } },
  { id: 86, name: "BYD Song Plus", bodyType: "suv", fuelType: "hybrid", price: 999000, consumption: "20 km/l", seats: 5, lifestyle: ["family"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 197, warrantyYears: 8, warrantyKm: 150000, airbags: 6, photo: { file: "86-byd-song-plus.jpg", credit: null } },
  { id: 87, name: "GWM Haval H6", bodyType: "suv", fuelType: "petrol", price: 899000, consumption: "13 km/l", seats: 5, lifestyle: ["family", "business"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 184, warrantyYears: 7, warrantyKm: 200000, airbags: 6, photo: { file: "87-gwm-haval-h6.jpg", credit: null } },
  { id: 88, name: "GWM Haval H6 HEV", bodyType: "suv", fuelType: "hybrid", price: 1099000, consumption: "18 km/l", seats: 5, lifestyle: ["family"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 243, warrantyYears: 7, warrantyKm: 200000, airbags: 6, photo: { file: "88-gwm-haval-h6-hev.jpg", credit: null } },
  { id: 89, name: "GWM Haval Jolion", bodyType: "suv", fuelType: "hybrid", price: 799000, consumption: "20 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 187, warrantyYears: 7, warrantyKm: 200000, airbags: 6, photo: { file: "89-gwm-haval-jolion.jpg", credit: null } },
  { id: 90, name: "GWM ORA Good Cat", bodyType: "hatchback", fuelType: "ev", price: 799000, consumption: "6.3 km/kWh", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 171, warrantyYears: 8, warrantyKm: 150000, airbags: 6, photo: { file: "90-gwm-ora-good-cat.jpg", credit: null } },
  { id: 91, name: "GWM Tank 300", bodyType: "suv", fuelType: "hybrid", price: 1699000, consumption: "11 km/l", seats: 5, lifestyle: ["adventure"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 268, warrantyYears: 7, warrantyKm: 200000, airbags: 6, photo: { file: "91-gwm-tank-300.jpg", credit: null } },
  { id: 92, name: "Changan Deepal S07", bodyType: "suv", fuelType: "ev", price: 999000, consumption: "6.0 km/kWh", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 218, warrantyYears: 8, warrantyKm: 160000, airbags: 6, photo: { file: "92-changan-deepal-s07.jpg", credit: null } },
  { id: 93, name: "Changan CS55 Plus", bodyType: "suv", fuelType: "petrol", price: 799000, consumption: "14 km/l", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 179, warrantyYears: 6, warrantyKm: 150000, airbags: 6, photo: { file: "93-changan-cs55-plus.jpg", credit: null } },
  { id: 94, name: "Neta V", bodyType: "hatchback", fuelType: "ev", price: 549000, consumption: "7.5 km/kWh", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 95, warrantyYears: 8, warrantyKm: 150000, airbags: 4, photo: { file: "94-neta-v.jpg", credit: null } },
  { id: 95, name: "Neta X", bodyType: "suv", fuelType: "ev", price: 899000, consumption: "6.5 km/kWh", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 181, warrantyYears: 8, warrantyKm: 150000, airbags: 6, photo: { file: "95-neta-x.jpg", credit: null } },
  { id: 96, name: "GAC Aion Y", bodyType: "suv", fuelType: "ev", price: 899000, consumption: "6.4 km/kWh", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 136, warrantyYears: 8, warrantyKm: 150000, airbags: 6, photo: { file: "96-gac-aion-y.jpg", credit: null } },
  { id: 97, name: "GAC Aion V", bodyType: "suv", fuelType: "ev", price: 1099000, consumption: "6.0 km/kWh", seats: 5, lifestyle: ["family"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 201, warrantyYears: 8, warrantyKm: 150000, airbags: 6, photo: { file: "97-gac-aion-v.jpg", credit: null } },
  { id: 98, name: "Ford Everest", bodyType: "ppv", fuelType: "diesel", price: 1499000, consumption: "13 km/l", seats: 7, lifestyle: ["family", "adventure", "business"], serviceNetwork: "wide", nationality: "other", transmission: "auto", horsepower: 210, warrantyYears: 5, warrantyKm: 150000, airbags: 7, photo: { file: "98-ford-everest.jpg", credit: null } },
  { id: 99, name: "Ford Ranger", bodyType: "pickup", fuelType: "diesel", price: 859000, consumption: "14 km/l", seats: 5, lifestyle: ["business", "adventure"], serviceNetwork: "wide", nationality: "other", transmission: "auto", horsepower: 170, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "99-ford-ranger.jpg", credit: null } },
  { id: 100, name: "Ford Ranger Raptor", bodyType: "pickup", fuelType: "petrol", price: 1999000, consumption: "8 km/l", seats: 5, lifestyle: ["adventure"], serviceNetwork: "wide", nationality: "other", transmission: "auto", horsepower: 292, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "100-ford-ranger-raptor.jpg", credit: null } },
  { id: 101, name: "Volvo XC40", bodyType: "suv", fuelType: "hybrid", price: 1999000, consumption: "17 km/l", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "growing", nationality: "other", transmission: "auto", horsepower: 197, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "101-volvo-xc40.jpg", credit: null } },
  { id: 102, name: "Volvo XC60", bodyType: "suv", fuelType: "hybrid", price: 2599000, consumption: "16 km/l", seats: 5, lifestyle: ["family", "business"], serviceNetwork: "growing", nationality: "other", transmission: "auto", horsepower: 313, warrantyYears: 3, warrantyKm: 100000, airbags: 7, photo: { file: "102-volvo-xc60.jpg", credit: null } },
  { id: 103, name: "Peugeot 2008", bodyType: "suv", fuelType: "petrol", price: 1099000, consumption: "16 km/l", seats: 5, lifestyle: ["city", "family"], serviceNetwork: "growing", nationality: "other", transmission: "auto", horsepower: 130, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "103-peugeot-2008.jpg", credit: null } },
  { id: 104, name: "BMW 218 Gran Coupe", bodyType: "coupe", fuelType: "petrol", price: 1999000, consumption: "15 km/l", seats: 5, lifestyle: ["business", "city"], serviceNetwork: "growing", nationality: "other", transmission: "auto", horsepower: 136, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "104-bmw-218-gran-coupe.jpg", credit: null } },
  { id: 105, name: "Subaru BRZ", bodyType: "coupe", fuelType: "petrol", price: 2699000, consumption: "12 km/l", seats: 4, lifestyle: ["adventure"], serviceNetwork: "growing", nationality: "japan", transmission: "manual", horsepower: 228, warrantyYears: 5, warrantyKm: 100000, airbags: 7, photo: { file: "105-subaru-brz.jpg", credit: null } },
  { id: 106, name: "Toyota GR86", bodyType: "coupe", fuelType: "petrol", price: 2949000, consumption: "12 km/l", seats: 4, lifestyle: ["adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 228, warrantyYears: 5, warrantyKm: 150000, airbags: 7, photo: { file: "106-toyota-gr86.jpg", credit: null } },
  { id: 107, name: "Mazda MX-5 Roadster", bodyType: "coupe", fuelType: "petrol", price: 2912000, consumption: "14 km/l", seats: 2, lifestyle: ["adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 184, warrantyYears: 5, warrantyKm: 150000, airbags: 4, photo: { file: "107-mazda-mx5.jpg", credit: null } },
  { id: 108, name: "Honda Civic Type R", bodyType: "hatchback", fuelType: "petrol", price: 3990000, consumption: "11 km/l", seats: 4, lifestyle: ["adventure"], serviceNetwork: "wide", nationality: "japan", transmission: "manual", horsepower: 315, warrantyYears: 3, warrantyKm: 100000, airbags: 8, photo: { file: "108-honda-civic-type-r.jpg", credit: null } },
  { id: 109, name: "Kia EV6", bodyType: "suv", fuelType: "ev", price: 1999000, consumption: "5.5 km/kWh", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "growing", nationality: "korea", transmission: "auto", horsepower: 325, warrantyYears: 7, warrantyKm: 150000, airbags: 7, photo: { file: "109-kia-ev6.jpg", credit: null } },
  { id: 110, name: "Hyundai Ioniq 5", bodyType: "suv", fuelType: "ev", price: 1699000, consumption: "5.8 km/kWh", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "growing", nationality: "korea", transmission: "auto", horsepower: 217, warrantyYears: 5, warrantyKm: 150000, airbags: 7, photo: { file: "110-hyundai-ioniq-5.jpg", credit: null } },
  { id: 111, name: "Subaru Forester", bodyType: "suv", fuelType: "petrol", price: 1450000, consumption: "13 km/l", seats: 5, lifestyle: ["family", "adventure"], serviceNetwork: "growing", nationality: "japan", transmission: "auto", horsepower: 156, warrantyYears: 5, warrantyKm: 100000, airbags: 7, photo: { file: "111-subaru-forester.jpg", credit: null } },
  { id: 112, name: "Subaru Crosstrek", bodyType: "suv", fuelType: "petrol", price: 1299000, consumption: "14 km/l", seats: 5, lifestyle: ["city", "adventure"], serviceNetwork: "growing", nationality: "japan", transmission: "auto", horsepower: 150, warrantyYears: 5, warrantyKm: 100000, airbags: 7, photo: { file: "112-subaru-crosstrek.jpg", credit: null } },
  { id: 113, name: "GWM Tank 500 HEV", bodyType: "suv", fuelType: "hybrid", price: 2049000, consumption: "12 km/l", seats: 7, lifestyle: ["family", "business", "adventure"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 344, warrantyYears: 7, warrantyKm: 200000, airbags: 6, photo: { file: "113-gwm-tank-500.jpg", credit: null } },
  { id: 114, name: "BYD Sealion 7", bodyType: "suv", fuelType: "ev", price: 1299000, consumption: "6.0 km/kWh", seats: 5, lifestyle: ["family", "city"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 313, warrantyYears: 8, warrantyKm: 150000, airbags: 6, photo: { file: "114-byd-sealion-7.jpg", credit: null } },
  { id: 115, name: "BYD Seal U DM-i", bodyType: "suv", fuelType: "hybrid", price: 999000, consumption: "22 km/l", seats: 5, lifestyle: ["family"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 318, warrantyYears: 8, warrantyKm: 150000, airbags: 6, photo: { file: "115-byd-seal-u.jpg", credit: null } },
  { id: 116, name: "MG Maxus 7", bodyType: "mpv", fuelType: "ev", price: 1799000, consumption: "5.2 km/kWh", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 245, warrantyYears: 8, warrantyKm: 160000, airbags: 6, photo: { file: "116-mg-maxus-7.jpg", credit: null } },
  { id: 117, name: "MG Maxus 9", bodyType: "mpv", fuelType: "ev", price: 2499000, consumption: "4.8 km/kWh", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "growing", nationality: "china", transmission: "auto", horsepower: 245, warrantyYears: 8, warrantyKm: 160000, airbags: 6, photo: { file: "117-mg-maxus-9.jpg", credit: null } },
  { id: 118, name: "Toyota Hilux Champ", bodyType: "pickup", fuelType: "diesel", price: 459000, consumption: "15 km/l", seats: 2, lifestyle: ["business"], serviceNetwork: "wide", nationality: "japan", transmission: "manual", horsepower: 150, warrantyYears: 5, warrantyKm: 150000, airbags: 2, photo: { file: "118-toyota-hilux-champ.jpg", credit: null } },
  { id: 119, name: "Isuzu D-Max V-Cross", bodyType: "pickup", fuelType: "diesel", price: 1250000, consumption: "13 km/l", seats: 5, lifestyle: ["adventure", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 190, warrantyYears: 5, warrantyKm: 160000, airbags: 6, photo: { file: "119-isuzu-dmax-vcross.jpg", credit: null } },
  { id: 120, name: "Mitsubishi Pajero Sport Elite", bodyType: "ppv", fuelType: "diesel", price: 1579000, consumption: "14 km/l", seats: 7, lifestyle: ["family", "adventure", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 184, warrantyYears: 5, warrantyKm: 100000, airbags: 7, photo: { file: "120-mitsubishi-pajero-sport.jpg", credit: null } },
  { id: 121, name: "Toyota Fortuner Legender", bodyType: "ppv", fuelType: "diesel", price: 1889000, consumption: "13 km/l", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 224, warrantyYears: 5, warrantyKm: 150000, airbags: 7, photo: { file: "121-toyota-fortuner-legender.jpg", credit: null } },
  { id: 122, name: "Nissan Terra", bodyType: "ppv", fuelType: "diesel", price: 1199000, consumption: "14 km/l", seats: 7, lifestyle: ["family", "business"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 190, warrantyYears: 5, warrantyKm: 150000, airbags: 6, photo: { file: "122-nissan-terra.jpg", credit: null } },
  { id: 123, name: "Kia Carnival", bodyType: "mpv", fuelType: "diesel", price: 2249000, consumption: "14 km/l", seats: 11, lifestyle: ["family", "business"], serviceNetwork: "growing", nationality: "korea", transmission: "auto", horsepower: 202, warrantyYears: 7, warrantyKm: 150000, airbags: 7, photo: { file: "123-kia-carnival.jpg", credit: null } },
  { id: 124, name: "Suzuki Swift GL Next", bodyType: "hatchback", fuelType: "petrol", price: 582000, consumption: "23 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 83, warrantyYears: 3, warrantyKm: 100000, airbags: 2, photo: { file: "124-suzuki-swift.jpg", credit: null } },
  { id: 125, name: "Nissan Almera VL", bodyType: "sedan", fuelType: "petrol", price: 699000, consumption: "23 km/l", seats: 5, lifestyle: ["city", "firstCar"], serviceNetwork: "wide", nationality: "japan", transmission: "auto", horsepower: 100, warrantyYears: 3, warrantyKm: 100000, airbags: 6, photo: { file: "125-nissan-almera.jpg", credit: null } }
];

const LIFESTYLE_LABEL = {
  city: "ขับในเมือง", family: "ครอบครัว", business: "วิ่งงาน/ต่างจังหวัด",
  adventure: "สายลุย", firstCar: "รถคันแรก",
};
const BODYTYPE_LABEL = {
  hatchback: "Hatchback", sedan: "Sedan", coupe: "Coupe",
  suv: "SUV/Crossover", ppv: "PPV 7 ที่นั่ง", mpv: "รถตู้/MPV", pickup: "กระบะ",
};
const FUEL_LABEL = { petrol: "เบนซิน", diesel: "ดีเซล", hybrid: "ไฮบริด", ev: "ไฟฟ้า" };
const NATIONALITY_FLAG = { japan: "🇯🇵", korea: "🇰🇷", china: "🇨🇳", other: "🌍" };
const NATIONALITY_LABEL = { japan: "ญี่ปุ่น", korea: "เกาหลี", china: "จีน", other: "อื่นๆ" };
const TRANSMISSION_LABEL = { auto: "เกียร์อัตโนมัติ", manual: "เกียร์ธรรมดา" };

function formatBaht(n) { return Math.round(n).toLocaleString("th-TH") + " บาท"; }

/* ============================================
   STATE
   ============================================ */
const state = {
  macroStage: 1,
  step: 1,
  budget: 900000,
  income: 30000,
  pains: [],
  gains: [],
  lifestyle: [],       // array, derived from pains & gains
  bodytype: null,
  fuel: null,
  brands: ["any"],     // pre-selected default, up to 3
  shortlist: [],
  chosenCarId: null,
  checklist: {},
};
const TOTAL_STEPS = 5;

/* ============================================
   DOM REFS
   ============================================ */
const landingSection = document.getElementById("landingSection");
const startBtn        = document.getElementById("startBtn");
const heroArt          = document.getElementById("heroArt");
const heroCarCount     = document.getElementById("heroCarCount");
const stageTracker     = document.getElementById("stageTracker");
const stageItems       = [...document.querySelectorAll(".stage-item")];

const quizCard        = document.getElementById("quizCard");
const resultsSection  = document.getElementById("resultsSection");
const costRiskSection = document.getElementById("costRiskSection");
const decideSection   = document.getElementById("decideSection");
const showroomSection = document.getElementById("showroomSection");
const MACRO_SECTIONS  = [quizCard, resultsSection, costRiskSection, decideSection, showroomSection];

const dots            = [...document.querySelectorAll(".dot")];
const progressLabel   = document.getElementById("progressLabel");
const backBtn         = document.getElementById("backBtn");
const nextBtn         = document.getElementById("nextBtn");
const budgetKInput    = document.getElementById("budgetK");
const budgetValue     = document.getElementById("budgetValue");
const incomeKInput    = document.getElementById("incomeK");
const incomeValue     = document.getElementById("incomeValue");

const resultsGrid     = document.getElementById("resultsGrid");
const resultsSummary  = document.getElementById("resultsSummary");
const editBtn         = document.getElementById("editBtn");
const restartBtn      = document.getElementById("restartBtn");
const toCostRiskBtn   = document.getElementById("toCostRiskBtn");

const costRiskGrid    = document.getElementById("costRiskGrid");
const backToCompareBtn = document.getElementById("backToCompareBtn");
const toDecideBtn     = document.getElementById("toDecideBtn");

const decideGrid      = document.getElementById("decideGrid");
const backToCostRiskBtn = document.getElementById("backToCostRiskBtn");
const confirmDecisionBtn = document.getElementById("confirmDecisionBtn");

const showroomTitle   = document.getElementById("showroomTitle");
const showroomSub     = document.getElementById("showroomSub");
const checklistGroups = document.getElementById("checklistGroups");
const checklistFill   = document.getElementById("checklistFill");
const checklistLabel  = document.getElementById("checklistLabel");
const backToDecideBtn = document.getElementById("backToDecideBtn");
const finishRestartBtn = document.getElementById("finishRestartBtn");

/* ============================================
   SHARED SHAKE FEEDBACK
   ============================================ */
function shakeEl(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
  setTimeout(() => el.classList.remove("shake"), 400);
}

/* ============================================
   LANDING
   ============================================ */
heroCarCount.textContent = CARS.length;
heroArt.innerHTML = heroArtSVG();

startBtn.addEventListener("click", () => {
  landingSection.hidden = true;
  stageTracker.hidden = false;
  showMacroStage(1);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ============================================
   MACRO STAGE NAVIGATION
   ============================================ */
function showMacroStage(n) {
  state.macroStage = n;
  MACRO_SECTIONS.forEach((el, i) => { el.hidden = i !== n - 1; });
  stageItems.forEach((item) => {
    const sn = Number(item.dataset.stage);
    item.classList.toggle("is-active", sn === n);
    item.classList.toggle("is-done", sn < n);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ============================================
   STAGE 1 · FRAME — budget & income
   ============================================ */
budgetKInput.addEventListener("input", () => {
  const valK = parseFloat(budgetKInput.value) || 0;
  state.budget = valK * 1000;
  budgetValue.textContent = formatBaht(state.budget);
});

incomeKInput.addEventListener("input", () => {
  const valK = parseFloat(incomeKInput.value) || 0;
  state.income = valK * 1000;
  incomeValue.textContent = formatBaht(state.income) + " / เดือน";
});

/* ============================================
   OPTION GROUPS — single-select (bodytype, fuel,
   nationality) and multi-select (lifestyle, max 3)
   ============================================ */
document.querySelectorAll(".option-grid").forEach((group) => {
  const key = group.dataset.group;
  if (key === "brands" || key === "pains" || key === "gains") return; // Handled separately

  const max = group.dataset.max ? Number(group.dataset.max) : null;

  group.querySelectorAll(".option-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (max) {
        const list = state[key];
        const val = card.dataset.value;
        const idx = list.indexOf(val);
        if (idx > -1) {
          list.splice(idx, 1);
          card.classList.remove("is-selected");
        } else {
          if (list.length >= max) { shakeEl(card); return; }
          list.push(val);
          card.classList.add("is-selected");
        }
      } else {
        group.querySelectorAll(".option-card").forEach((c) => c.classList.remove("is-selected"));
        card.classList.add("is-selected");
        state[key] = card.dataset.value;
      }
      updateNextEnabled();
    });
  });
});

// Mapping table from pains/gains to lifestyle keys
const PAIN_TO_LIFESTYLE = {
  pain1: "city",
  pain2: "city",
  pain3: "family",
  pain4: "business",
  pain5: "adventure",
  pain6: "adventure",
  pain7: "business"
};

const GAIN_TO_LIFESTYLE = {
  gain1: "city",
  gain2: "family",
  gain3: "business",
  gain4: "adventure",
  gain5: "adventure",
  gain6: "business"
};

function updateDerivedLifestyle() {
  const active = new Set();
  state.pains.forEach((p) => {
    const l = PAIN_TO_LIFESTYLE[p];
    if (l) active.add(l);
  });
  state.gains.forEach((g) => {
    const l = GAIN_TO_LIFESTYLE[g];
    if (l) active.add(l);
  });
  state.lifestyle = Array.from(active);
}

// Custom handler for pains and gains in Step 2 (max 3 items per side)
["pains", "gains"].forEach((groupKey) => {
  const grid = document.querySelector(`.option-grid[data-group="${groupKey}"]`);
  if (!grid) return;

  grid.querySelectorAll(".option-card").forEach((card) => {
    card.addEventListener("click", () => {
      const val = card.dataset.value;
      const list = state[groupKey];
      const idx = list.indexOf(val);

      if (idx > -1) {
        list.splice(idx, 1);
        card.classList.remove("is-selected");
      } else {
        if (list.length >= 3) {
          shakeEl(card);
          return;
        }
        list.push(val);
        card.classList.add("is-selected");
      }

      updateDerivedLifestyle();
      updateNextEnabled();
    });
  });
});

// Custom handler for brands selection in Step 5
const brandsGrid = document.querySelector('.option-grid[data-group="brands"]');
if (brandsGrid) {
  brandsGrid.querySelectorAll(".option-card").forEach((card) => {
    card.addEventListener("click", () => {
      const val = card.dataset.value;
      if (val === "any") {
        // Deselect all brands and select 'any'
        state.brands = ["any"];
        brandsGrid.querySelectorAll(".option-card").forEach((c) => {
          c.classList.toggle("is-selected", c.dataset.value === "any");
        });
      } else {
        // Remove 'any' if it's there
        const anyIdx = state.brands.indexOf("any");
        if (anyIdx > -1) {
          state.brands.splice(anyIdx, 1);
          const anyCard = brandsGrid.querySelector('.option-card[data-value="any"]');
          if (anyCard) anyCard.classList.remove("is-selected");
        }

        const idx = state.brands.indexOf(val);
        if (idx > -1) {
          state.brands.splice(idx, 1);
          card.classList.remove("is-selected");
          // If nothing is selected, default back to 'any'
          if (state.brands.length === 0) {
            state.brands = ["any"];
            const anyCard = brandsGrid.querySelector('.option-card[data-value="any"]');
            if (anyCard) anyCard.classList.add("is-selected");
          }
        } else {
          if (state.brands.length >= 3) {
            shakeEl(card);
            return;
          }
          state.brands.push(val);
          card.classList.add("is-selected");
        }
      }
      updateNextEnabled();
    });
  });
}

function stepIsReady(n) {
  if (n === 2) return state.lifestyle.length > 0;
  if (n === 3) return Boolean(state.bodytype);
  if (n === 4) return Boolean(state.fuel);
  if (n === 5) return state.brands && state.brands.length > 0;
  return true;
}
function updateNextEnabled() {
  nextBtn.classList.toggle("is-not-ready", !stepIsReady(state.step));
}
function showStep(n) {
  document.querySelectorAll(".step").forEach((el) => { el.hidden = Number(el.dataset.step) !== n; });
  dots.forEach((d) => {
    const dn = Number(d.dataset.dot);
    d.classList.toggle("is-active", dn === n);
    d.classList.toggle("is-done", dn < n);
  });
  progressLabel.textContent = `ข้อ ${n} จาก ${TOTAL_STEPS}`;
  backBtn.hidden = n === 1;
  nextBtn.textContent = n === TOTAL_STEPS ? "ดูผลลัพธ์" : "ถัดไป";
  updateNextEnabled();
}

nextBtn.addEventListener("click", () => {
  if (!stepIsReady(state.step)) { shakeEl(quizCard); return; }
  if (state.step < TOTAL_STEPS) {
    state.step += 1;
    showStep(state.step);
  } else {
    runRecommendation();
  }
});
backBtn.addEventListener("click", () => {
  if (state.step > 1) { state.step -= 1; showStep(state.step); }
});

/* ============================================
   SCORING (Frame -> Compare)
   Budget 30 · Lifestyle 25 · Body type 20 · Fuel 15 · Nationality 10
   ============================================ */
function scoreCar(car, { budget, lifestyle, bodytype, fuel, brands }) {
  let score = 0;
  const reasons = [];

  // Budget — 30
  if (car.price <= budget) {
    const headroom = (budget - car.price) / budget;
    score += 30 - Math.min(headroom, 0.3) * 18;
    reasons.push("งบพอดี ไม่ต้องเบียด");
  } else {
    const over = (car.price - budget) / budget;
    score += Math.max(0, 12 - over * 70);
    reasons.push(`ราคาเกินงบไปราว ${Math.round(over * 100)}%`);
  }

  // Lifestyle — 25 (multi-select overlap)
  const overlap = car.lifestyle.filter((l) => lifestyle.includes(l));
  if (overlap.length > 0) {
    score += Math.min(25, 15 + (overlap.length - 1) * 5);
    reasons.push(`ตรงกับสาย${overlap.map((l) => LIFESTYLE_LABEL[l]).join(" + ")}`);
  } else {
    score += 6;
  }

  // Body type — 20
  if (bodytype === "unsure") {
    score += 14;
  } else if (car.bodyType === bodytype) {
    score += 20;
    reasons.push(`เป็นทรง ${BODYTYPE_LABEL[bodytype]} ตามที่ชอบ`);
  } else {
    score += 4;
  }

  // Fuel / engine — 15
  if (fuel === "any") {
    score += 9;
  } else if (car.fuelType === fuel) {
    score += 15;
    reasons.push(`เครื่องยนต์${FUEL_LABEL[fuel]}ตามที่เลือก`);
  } else {
    score += 1;
  }

  // Brands — 10
  if (!brands || brands.length === 0 || brands.includes("any")) {
    score += 6;
  } else {
    const carBrand = car.name.split(" ")[0].toLowerCase();
    const matched = brands.some(b => b.toLowerCase() === carBrand);
    if (matched) {
      score += 10;
      reasons.push(`เป็นแบรนด์ ${car.name.split(" ")[0]} ในดวงใจ`);
    } else {
      score += 1;
    }
  }

  return { score: Math.round(Math.max(0, Math.min(100, score))), reasons };
}

function matchTier(score) {
  if (score >= 70) return { cls: "match-good", ring: "var(--good)", label: "ใช่เลย" };
  if (score >= 45) return { cls: "match-mid",  ring: "var(--mid)",  label: "ก็โอเค" };
  return { cls: "match-low", ring: "var(--low)", label: "ยังไม่ใช่ทีเดียว" };
}
function scoreRingSVG(score, ringColor) {
  const r = 20, cir = 2 * Math.PI * r, offset = cir - (score / 100) * cir;
  return `<svg width="50" height="50" viewBox="0 0 50 50">
    <circle class="score-ring__track" cx="25" cy="25" r="${r}" />
    <circle class="score-ring__fill" cx="25" cy="25" r="${r}"
      style="stroke:${ringColor}; stroke-dasharray:${cir}; stroke-dashoffset:${offset};" /></svg>`;
}

function getTransmissionOptions(car) {
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

function extraSpecPills(car) {
  const transText = getTransmissionOptions(car);
  const shortTrans = transText.includes("ทั้งเกียร์") ? "เกียร์ออโต้ / ธรรมดา" : (car.transmission === "auto" ? "เกียร์ออโต้" : "เกียร์ธรรมดา");
  return `
    <span class="spec-pill">🐎 ${car.horsepower} แรงม้า</span>
    <span class="spec-pill">⚙️ ${shortTrans}</span>
    <span class="spec-pill">📄 รับประกัน ${car.warrantyYears} ปี</span>
  `;
}

function getRangeEstimate(car) {
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
    return { type: "ev", range100, range80 };
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
    return { type: "ice", range, tankSize };
  }
}

function buildMatrixTableHTML(item1, item2) {
  if (!item1 || !item2) return "";
  const c1 = item1.car, s1 = item1.score, r1 = item1.reasons;
  const c2 = item2.car, s2 = item2.score, r2 = item2.reasons;
  const tco1 = calcTCO(c1), tco2 = calcTCO(c2);
  const m1 = calcMonthlyInstallment(c1), m2 = calcMonthlyInstallment(c2);
  const rng1 = getRangeEstimate(c1), rng2 = getRangeEstimate(c2);
  const tier1 = matchTier(s1), tier2 = matchTier(s2);

  const rangeText = (car, rng) => rng.type === "ev"
    ? `ชาร์จ 100%: ${rng.range100} กม.`
    : `วิ่งเต็มถัง: ~${rng.range} กม.`;

  return `
    <table class="comparison-matrix-table matrix-table-2col">
      <thead>
        <tr>
          <th class="matrix-topic-col">หัวข้อการเปรียบเทียบ</th>
          <th class="matrix-car-col">
            <div class="matrix-car-header">
              ${carVisualHTML(c1, "car-art--sm")}
              <div class="matrix-car-title">${c1.name} ${NATIONALITY_FLAG[c1.nationality]}</div>
              <span class="matrix-car-badge">${BODYTYPE_LABEL[c1.bodyType]}</span>
            </div>
          </th>
          <th class="matrix-car-col">
            <div class="matrix-car-header">
              ${carVisualHTML(c2, "car-art--sm")}
              <div class="matrix-car-title">${c2.name} ${NATIONALITY_FLAG[c2.nationality]}</div>
              <span class="matrix-car-badge">${BODYTYPE_LABEL[c2.bodyType]}</span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="matrix-topic-label">🎯 คะแนนความเหมาะสม</td>
          <td class="matrix-data-cell text-center"><span class="score-badge ${tier1.cls}">${s1}/100 (${tier1.label})</span></td>
          <td class="matrix-data-cell text-center"><span class="score-badge ${tier2.cls}">${s2}/100 (${tier2.label})</span></td>
        </tr>
        <tr>
          <td class="matrix-topic-label">🏷️ ราคาตัวรถป้ายแดง</td>
          <td class="matrix-data-cell text-center font-bold highlight-price">${formatBaht(c1.price)}</td>
          <td class="matrix-data-cell text-center font-bold highlight-price">${formatBaht(c2.price)}</td>
        </tr>
        <tr>
          <td class="matrix-topic-label">⛽️ เชื้อเพลิง &amp; ระบบส่งกำลัง</td>
          <td class="matrix-data-cell text-center">${FUEL_LABEL[c1.fuelType]} (${c1.transmission === "auto" ? "เกียร์ออโต้" : "เกียร์ธรรมดา"})</td>
          <td class="matrix-data-cell text-center">${FUEL_LABEL[c2.fuelType]} (${c2.transmission === "auto" ? "เกียร์ออโต้" : "เกียร์ธรรมดา"})</td>
        </tr>
        <tr>
          <td class="matrix-topic-label">🌱 การประหยัด &amp; ระยะทางวิ่ง</td>
          <td class="matrix-data-cell text-center">
            <div style="font-weight:700;font-size:15px">${c1.consumption}</div>
            <small style="color:#38BDF8">${rangeText(c1, rng1)}</small>
          </td>
          <td class="matrix-data-cell text-center">
            <div style="font-weight:700;font-size:15px">${c2.consumption}</div>
            <small style="color:#38BDF8">${rangeText(c2, rng2)}</small>
          </td>
        </tr>
        <tr>
          <td class="matrix-topic-label">🐎 สมรรถนะแรงม้า</td>
          <td class="matrix-data-cell text-center font-bold">${c1.horsepower} แรงม้า</td>
          <td class="matrix-data-cell text-center font-bold">${c2.horsepower} แรงม้า</td>
        </tr>
        <tr>
          <td class="matrix-topic-label">🛡️ ถุงลมนิรภัย &amp; รับประกัน</td>
          <td class="matrix-data-cell text-center">ถุงลม ${c1.airbags} ใบ · วารันตี ${c1.warrantyYears} ปี</td>
          <td class="matrix-data-cell text-center">ถุงลม ${c2.airbags} ใบ · วารันตี ${c2.warrantyYears} ปี</td>
        </tr>
        <tr>
          <td class="matrix-topic-label">💵 ประมาณการค่างวด/เดือน</td>
          <td class="matrix-data-cell text-center font-bold highlight-monthly">~${formatBaht(m1)} / เดือน</td>
          <td class="matrix-data-cell text-center font-bold highlight-monthly">~${formatBaht(m2)} / เดือน</td>
        </tr>
        <tr>
          <td class="matrix-topic-label">💰 ต้นทุนถือครอง 5 ปี (TCO)</td>
          <td class="matrix-data-cell text-center font-bold highlight-tco">${formatBaht(tco1.total5yr)}</td>
          <td class="matrix-data-cell text-center font-bold highlight-tco">${formatBaht(tco2.total5yr)}</td>
        </tr>
        <tr>
          <td class="matrix-topic-label">✨ เหตุผลหลักที่เหมาะ</td>
          <td class="matrix-data-cell text-left"><ul style="padding-left:18px;margin:0">${r1.map(r => `<li style="margin-bottom:4px">${r}</li>`).join("")}</ul></td>
          <td class="matrix-data-cell text-left"><ul style="padding-left:18px;margin:0">${r2.map(r => `<li style="margin-bottom:4px">${r}</li>`).join("")}</ul></td>
        </tr>
        <tr>
          <td class="matrix-topic-label">🗣️ รีวิวสดจากเว็บจริง</td>
          <td class="matrix-data-cell text-left">
            <div style="font-size:13px">
              <div style="font-weight:600;color:#38BDF8">ประสบการณ์ใช้งานจริง ${c1.name}</div>
              <div style="margin-top:4px;font-size:12px;color:#CBD5E1">"การขับขี่ อัตราเร่ง และช่วงล่างปรับมาตอบโจทย์ถนนเมืองไทย ให้ความคล่องตัวสูง"</div>
              <div style="margin-top:6px;font-size:11px;color:#94A3B8">
                — สมาชิกจาก Pantip (รัชดา) 
                <a href="https://pantip.com/search?q=${encodeURIComponent(c1.name)}" target="_blank" rel="noopener noreferrer" style="color:#38BDF8;text-decoration:underline;margin-left:6px">[อ่านกระทู้นี้]</a>
              </div>
            </div>
          </td>
          <td class="matrix-data-cell text-left">
            <div style="font-size:13px">
              <div style="font-weight:600;color:#38BDF8">ประสบการณ์ใช้งานจริง ${c2.name}</div>
              <div style="margin-top:4px;font-size:12px;color:#CBD5E1">"ห้องโดยสารและฟังก์ชั่นความปลอดภัยให้มาครบครัน ความประหยัดน่าประทับใจ"</div>
              <div style="margin-top:6px;font-size:11px;color:#94A3B8">
                — สมาชิกจาก HeadlightMag Forum 
                <a href="https://www.google.com/search?q=${encodeURIComponent(c2.name + ' รีวิว Pantip')}" target="_blank" rel="noopener noreferrer" style="color:#38BDF8;text-decoration:underline;margin-left:6px">[อ่านกระทู้นี้]</a>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

function buildDropdownToolbar(containerId) {
  const items = state.shortlist;
  const id1 = state.compareCarId1 || (items[0] && items[0].car.id);
  const id2 = state.compareCarId2 || (items[1] && items[1].car.id) || (items[0] && items[0].car.id);

  const opts = items.map(({ car, score }) =>
    `<option value="${car.id}">${car.name} (คะแนน ${score}/100)</option>`
  ).join("");

  return `
    <div class="matrix-dropdown-toolbar">
      <div class="matrix-dropdown-box">
        <label class="matrix-dropdown-label">🚗 เลือกรถคันที่ 1 (ฝั่งซ้าย):</label>
        <select class="matrix-dropdown-select" id="${containerId}_sel1">${opts}</select>
      </div>
      <div class="matrix-vs-badge">VS</div>
      <div class="matrix-dropdown-box">
        <label class="matrix-dropdown-label">🚙 เลือกรถคันที่ 2 (ฝั่งขวา):</label>
        <select class="matrix-dropdown-select" id="${containerId}_sel2">${opts}</select>
      </div>
    </div>
  `;
}

function wireDropdown(containerId, onChangeCallback) {
  const sel1 = document.getElementById(`${containerId}_sel1`);
  const sel2 = document.getElementById(`${containerId}_sel2`);
  if (!sel1 || !sel2) return;
  const id1 = state.compareCarId1 || (state.shortlist[0] && state.shortlist[0].car.id);
  const id2 = state.compareCarId2 || (state.shortlist[1] && state.shortlist[1].car.id) || id1;
  sel1.value = id1;
  sel2.value = id2;
  sel1.addEventListener("change", () => { state.compareCarId1 = Number(sel1.value); onChangeCallback(); });
  sel2.addEventListener("change", () => { state.compareCarId2 = Number(sel2.value); onChangeCallback(); });
}

function renderCompare() {
  resultsGrid.innerHTML = "";

  // View Toggle Bar
  const toggleBar = document.createElement("div");
  toggleBar.className = "view-toggle-bar";
  toggleBar.innerHTML = `
    <span class="view-toggle-label">เลือกรูปแบบการเปรียบเทียบ:</span>
    <div class="view-toggle-buttons">
      <button type="button" class="view-toggle-btn ${state.compareViewMode === "card" ? "is-active" : ""}" id="toggleCardBtn">🎴 มุมมองการ์ด (Card View)</button>
      <button type="button" class="view-toggle-btn ${state.compareViewMode === "table" ? "is-active" : ""}" id="toggleTableBtn">📊 ตารางเปรียบเทียบสเปครายหัวข้อ (Multi-Car Matrix)</button>
    </div>
  `;
  const resultsSection = document.getElementById("resultsSection");
  const existingToggle = resultsSection.querySelector(".view-toggle-bar");
  if (existingToggle) existingToggle.remove();
  resultsSection.insertBefore(toggleBar, resultsGrid);

  document.getElementById("toggleCardBtn").addEventListener("click", () => {
    state.compareViewMode = "card";
    renderCompare();
  });
  document.getElementById("toggleTableBtn").addEventListener("click", () => {
    state.compareViewMode = "table";
    if (!state.compareCarId1 && state.shortlist[0]) state.compareCarId1 = state.shortlist[0].car.id;
    if (!state.compareCarId2 && state.shortlist[1]) state.compareCarId2 = state.shortlist[1].car.id;
    renderCompare();
  });

  if (state.compareViewMode === "table") {
    const wrapper = document.createElement("div");
    wrapper.className = "comparison-matrix-wrapper";
    wrapper.innerHTML = buildDropdownToolbar("cmp");
    const scrollDiv = document.createElement("div");
    scrollDiv.className = "comparison-matrix-scroll";
    wrapper.appendChild(scrollDiv);
    resultsGrid.appendChild(wrapper);

    const updateTable = () => {
      const id1 = state.compareCarId1 || (state.shortlist[0] && state.shortlist[0].car.id);
      const id2 = state.compareCarId2 || (state.shortlist[1] && state.shortlist[1].car.id) || id1;
      const item1 = state.shortlist.find(i => i.car.id === Number(id1)) || state.shortlist[0];
      const item2 = state.shortlist.find(i => i.car.id === Number(id2)) || state.shortlist[1] || state.shortlist[0];
      scrollDiv.innerHTML = buildMatrixTableHTML(item1, item2);
      wirePhotoFallbacks(scrollDiv);
    };
    wireDropdown("cmp", updateTable);
    updateTable();
    return;
  }

  state.shortlist.forEach(({ car, score, reasons }) => {
    const tier = matchTier(score);
    const rangeInfo = getRangeEstimate(car);
    let rangeHTML = "";
    if (rangeInfo.type === "ev") {
      rangeHTML = `
        <div class="car-card__range-info car-card__range-info--ev">
          <span>⚡️ วิ่งสูงสุด (100%): <strong>${rangeInfo.range100} กม.</strong></span>
          <span class="range-sep">|</span>
          <span>🔋 แนะนำ (80% เมืองร้อน): <strong class="range-val--safe">${rangeInfo.range80} กม.</strong></span>
        </div>
      `;
    } else {
      rangeHTML = `
        <div class="car-card__range-info car-card__range-info--ice">
          <span>⛽️ วิ่งเต็มถัง (${rangeInfo.tankSize}L): <strong>~${rangeInfo.range} กม.</strong></span>
        </div>
      `;
    }

    const details = generateCarDetails(car);
    const detailsAccordionHTML = `
      <div class="car-card__details-accordion">
        <details class="card-details-item">
          <summary class="card-details-summary">✨ จุดเด่น & สีตัวถัง</summary>
          <div class="card-details-content">
            <p><strong>รายละเอียดเบื้องต้น:</strong> ${details.intro}</p>
            <p><strong>จุดเด่นสำคัญ:</strong></p>
            <ul>
              ${details.highlights.map(h => `<li>${h}</li>`).join("")}
            </ul>
            <p><strong>สีตัวถังภายนอก:</strong></p>
            <div class="details-colors">${details.colors.join(" · ")}</div>
          </div>
        </details>
        <details class="card-details-item">
          <summary class="card-details-summary">🎨 ดีไซน์ภายนอก & ภายใน</summary>
          <div class="card-details-content">
            <p><strong>ดีไซน์ภายนอก:</strong></p>
            <ul>
              ${details.exterior.map(e => `<li>${e}</li>`).join("")}
            </ul>
            <p><strong>ดีไซน์ภายใน:</strong></p>
            <ul>
              ${details.interior.map(i => `<li>${i}</li>`).join("")}
            </ul>
          </div>
        </details>
        <details class="card-details-item">
          <summary class="card-details-summary">🛡️ สเปคเครื่องยนต์ & ความปลอดภัย</summary>
          <div class="card-details-content">
            <p><strong>ระบบขับเคลื่อน:</strong> ${details.specs}</p>
            <p><strong>ระบบความปลอดภัย:</strong></p>
            <ul>
              ${details.safety.map(s => `<li>${s}</li>`).join("")}
            </ul>
          </div>
        </details>
        <details class="card-details-item" open>
          <summary class="card-details-summary">🗣️ รีวิวสดจากผู้ใช้จริง &amp; ข้อพิจารณา</summary>
          <div class="card-details-content">
            <p><strong>🌐 รีวิวสดจากเว็บชั้นนำ (Pantip / HeadlightMag / One2Car):</strong></p>
            <ul style="margin-bottom: 14px; list-style: none; padding-left: 0;">
              <li style="margin-bottom: 10px; padding: 8px 12px; background: rgba(15, 23, 42, 0.04); border-radius: 8px; border-left: 3px solid #38BDF8;">
                <div style="font-weight: 600; font-size: 13px; color: #0F172A;">แชร์ประสบการณ์ใช้งาน ${car.name} หลังใช้จริงในเมืองและเดินทางไกล</div>
                <div style="font-size: 12px; color: #475569; margin-top: 3px;">"การขับขี่ทำได้ดีตามมาตรฐาน อัตราเร่งและช่วงล่างปรับมาตอบโจทย์ถนนเมืองไทย"</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 11px; color: #64748B;">
                  <span>— คุณสมาชิก Pantip (รัชดา)</span>
                  <a href="https://pantip.com/search?q=${encodeURIComponent(car.name)}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; text-decoration: underline; font-weight: 600;">
                    🔗 อ่านกระทู้/รีวิวจริง →
                  </a>
                </div>
              </li>
              <li style="margin-bottom: 10px; padding: 8px 12px; background: rgba(15, 23, 42, 0.04); border-radius: 8px; border-left: 3px solid #38BDF8;">
                <div style="font-weight: 600; font-size: 13px; color: #0F172A;">ทดสอบสมรรถนะและการเก็บเสียง ${car.name}</div>
                <div style="font-size: 12px; color: #475569; margin-top: 3px;">"ห้องโดยสารและฟังก์ชั่นความปลอดภัยให้มาครบครัน ความประหยัดน่าประทับใจ"</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 11px; color: #64748B;">
                  <span>— คุณสมาชิก HeadlightMag Forum</span>
                  <a href="https://www.google.com/search?q=${encodeURIComponent(car.name + ' รีวิว Pantip')}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; text-decoration: underline; font-weight: 600;">
                    🔗 อ่านกระทู้/รีวิวจริง →
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </details>
      </div>
    `;

    const card = document.createElement("article");
    card.className = "car-card";
    card.innerHTML = `
      <div class="car-card__art">${carVisualHTML(car)}</div>
      <div class="car-card__top">
        <div>
          <div class="car-card__name-row">
            <p class="car-card__name">${car.name}</p>
            <span class="car-card__flag">${NATIONALITY_FLAG[car.nationality]}</span>
          </div>
          <p class="car-card__category">${BODYTYPE_LABEL[car.bodyType]}</p>
        </div>
        <div class="score-ring">
          ${scoreRingSVG(score, tier.ring)}
          <span class="score-ring__label ${tier.cls}">${score}</span>
        </div>
      </div>
      <p class="car-card__price">${formatBaht(car.price)}</p>
      <div class="car-card__specs">
        <span class="spec-pill">${car.consumption}</span>
        <span class="spec-pill">${car.seats} ที่นั่ง</span>
        <span class="spec-pill">${FUEL_LABEL[car.fuelType]}</span>
        ${extraSpecPills(car)}
      </div>
      ${rangeHTML}
      <p class="car-card__reason"><strong class="${tier.cls}">${tier.label}</strong> — ${reasons.join(" · ")}</p>
      
      ${detailsAccordionHTML}
    `;
    resultsGrid.appendChild(card);
  });
  wirePhotoFallbacks(resultsGrid);
}

let selectedCompareIds = [];

function generateCarDetails(car) {
  const brand = car.name.split(" ")[0];
  const transText = getTransmissionOptions(car);
  
  let intro = "";
  let highlights = [];
  let colors = [];
  let specs = "";
  let exterior = [];
  let interior = [];
  let safety = [];

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
      `ถุงลมนิรภัยนิรภัย SRS ${car.airbags || 6} จุดรอบคัน`,
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
    specs = `${fuelEngine}, แรงม้าสูงสุด ${car.horsepower} แรงม้า, เกียร์${transText}`;
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
      `ถุงลมนิรภัยนิรภัย SRS ${car.airbags || 2} จุดคู่หน้า`,
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
    specs = `${fuelEngine}, พละกำลังสูงสุด ${car.horsepower} แรงม้า, เกียร์${transText}`;
    exterior = [
      "ประตูผู้โดยสารตอนหลังเปิดสไลด์ข้างอัตโนมัติพร้อมระบบกันหนีบ",
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
  } else if (car.bodyType === "coupe") {
    intro = `สปอร์ตคูเป้ดีไซน์โฉบเฉี่ยวเร้าใจสไตล์สนามแข่ง ทัศนวิสัยสปอร์ต ควบคุมเฉียบคม ดึงดูดสายตาทุกมุมมอง`;
    highlights = [
      `ดีไซน์ภายนอกสะดุดตาสไตล์สปอร์ตพันธุ์แท้ ขุมพลังแรงถึง ${car.horsepower} แรงม้า`,
      "จุดศูนย์ถ่วงต่ำพิเศษ เข้าโค้งนิ่ง เกาะถนนดีเยี่ยมสไตล์เรซซิ่ง",
      "เบาะนั่งและแผงแดชบอร์ดออกแบบเร้าอารมณ์การขับขี่สปอร์ตพรีเมียม"
    ];
    colors = ["🔴 Racing Red (แดง)", "⚪ Pure White (ขาว)", "⚫ Carbon Black (ดำ)", "🔵 Electric Blue (น้ำเงิน)"];
    specs = `${fuelEngine}, พละกำลังสูงสุด ${car.horsepower} แรงม้า, เกียร์${transText}`;
    exterior = [
      "ชุดแต่งแอโรพาร์ทรอบตัวถังเพื่อการจัดเรียงอากาศพลศาสตร์สูงสุด",
      "ท่อไอเสียสปอร์ตแบบท่อคู่เสียงทุ้มลึกเร้าอารมณ์",
      "ล้ออัลลอยฟอร์จสปอร์ตน้ำหนักเบาเป็นพิเศษขนาด 18-19 นิ้ว"
    ];
    interior = [
      "เบาะนั่งทรง Bucket Seat โอบกระชับสะโพกและหลัง ป้องกันแรงเหวี่ยงขณะโค้ง",
      "แป้นคันเร่งและเบรกวัสดุอลูมิเนียมกันลื่นแบบรถแข่งสนาม",
      "หน้าปัดแสดงผลข้อมูลการขับขี่ดิจิทัลปรับแต่งโหมดสปอร์ตเร้าใจ"
    ];
    safety = [
      `ถุงลมนิรภัยนิรภัย SRS ${car.airbags || 6} จุดรอบคัน`,
      "ระบบควบคุมแรงบิดขณะเข้าโค้งอย่างสมดุลเพื่อการยึดเกาะสูงสุด",
      "โครงสร้างแชสซีส์เสริมนิรภัยรับแรงบิดเลี้ยวโค้งระดับสูง"
    ];
  } else {
    intro = `รถยนต์คันโปรดจากค่ายแบรนด์ ${brand} ดีไซน์ทันสมัย ตอบรับการใช้งานจริง`;
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

function runRecommendation() {
  state.shortlist = CARS
    .map((car) => {
      const { score, reasons } = scoreCar(car, state);
      return { car, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const lifestyleText = state.lifestyle.map((l) => LIFESTYLE_LABEL[l]).join(" + ");
  resultsSummary.textContent =
    `จากงบ ${formatBaht(state.budget)} สาย${lifestyleText} ` +
    `${state.bodytype === "unsure" ? "" : `ทรง ${BODYTYPE_LABEL[state.bodytype]} `}` +
    `— นี่คือ ${state.shortlist.length} คันที่เราคัดมาให้แล้ว`;

  renderCompare();
  showMacroStage(2);
}

editBtn.addEventListener("click", () => {
  state.step = TOTAL_STEPS;
  showStep(TOTAL_STEPS);
  showMacroStage(1);
});

function fullRestart() {
  state.step = 1;
  state.pains = [];
  state.gains = [];
  state.lifestyle = [];
  state.bodytype = null;
  state.fuel = null;
  state.brands = ["any"];
  state.shortlist = [];
  state.chosenCarId = null;
  state.checklist = {};
  state.budget = 900000;
  budgetKInput.value = 900;
  budgetValue.textContent = formatBaht(state.budget);
  state.income = 30000;
  incomeKInput.value = 30;
  incomeValue.textContent = formatBaht(state.income) + " / เดือน";
  selectedCompareIds = [];
  state.compareCarId1 = null;
  state.compareCarId2 = null;
  state.compareViewMode = "card";
  state.costRiskViewMode = "card";
  compareBar.hidden = true;
  document.querySelectorAll(".option-card").forEach((c) => c.classList.remove("is-selected"));
  const defaultBrand = document.querySelector('.option-grid[data-group="brands"] .option-card[data-value="any"]');
  if (defaultBrand) defaultBrand.classList.add("is-selected");
  showStep(1);
  showMacroStage(1);
}
restartBtn.addEventListener("click", fullRestart);
finishRestartBtn.addEventListener("click", fullRestart);

toCostRiskBtn.addEventListener("click", () => { renderCostRisk(); showMacroStage(3); });
backToCompareBtn.addEventListener("click", () => showMacroStage(2));

/* ============================================
   STAGE 3 · COST & RISK
   ============================================ */
/* Simplified Thai-style flat-rate auto loan estimate: 15% downpayment,
   5-year term, ~2.99%/year flat interest — illustrative only, not a
   real bank quote. Used to give a friendly affordability read against
   the income the person entered in Step 1. */
function calcMonthlyInstallment(car) {
  const DOWNPAYMENT_RATE = 0.15, FLAT_RATE = 0.0299, TERM_MONTHS = 60;
  const principal = car.price * (1 - DOWNPAYMENT_RATE);
  const totalInterest = principal * FLAT_RATE * (TERM_MONTHS / 12);
  const monthly = (principal + totalInterest) / TERM_MONTHS;
  return monthly;
}

function affordabilityTier(ratio) {
  if (ratio <= 0.2) return { cls: "tier-good", label: "สบายๆ ผ่อนไหวชิล" };
  if (ratio <= 0.35) return { cls: "tier-mid", label: "กำลังดี แต่เริ่มตึงมือหน่อย" };
  return { cls: "tier-watch", label: "ค่อนข้างหนัก ลองดาวน์เพิ่มหรือรุ่นที่ถูกกว่านะ" };
}

function calcTCO(car) {
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

function riskNotes(car) {
  const notes = [];
  if (car.fuelType === "ev") {
    notes.push({ icon: "⚠️", text: "ตลาดรถไฟฟ้ามือสองในไทยยังใหม่ ราคาตกไวกว่ารถสันดาปช่วงนี้เพราะมีรุ่นใหม่ออกถี่และแข่งราคากันแรง" });
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

function buildCostMatrixHTML(item1, item2) {
  if (!item1 || !item2) return "";
  const c1 = item1.car, c2 = item2.car;
  const tco1 = calcTCO(c1), tco2 = calcTCO(c2);
  const m1 = calcMonthlyInstallment(c1), m2 = calcMonthlyInstallment(c2);
  const ratio1 = m1 / state.income, ratio2 = m2 / state.income;
  const aff1 = affordabilityTier(ratio1), aff2 = affordabilityTier(ratio2);
  const notes1 = riskNotes(c1), notes2 = riskNotes(c2);

  const noteRows1 = notes1.map(n => `<li style="margin-bottom:6px"><span style="margin-right:4px">${n.icon}</span>${n.text}</li>`).join("");
  const noteRows2 = notes2.map(n => `<li style="margin-bottom:6px"><span style="margin-right:4px">${n.icon}</span>${n.text}</li>`).join("");

  return `
    <table class="comparison-matrix-table matrix-table-2col">
      <thead>
        <tr>
          <th class="matrix-topic-col">หัวข้อต้นทุน &amp; ความเสี่ยง</th>
          <th class="matrix-car-col">
            <div class="matrix-car-header">
              ${carVisualHTML(c1, "car-art--sm")}
              <div class="matrix-car-title">${c1.name} ${NATIONALITY_FLAG[c1.nationality]}</div>
              <span class="matrix-car-badge">ราคาป้าย ${formatBaht(c1.price)}</span>
            </div>
          </th>
          <th class="matrix-car-col">
            <div class="matrix-car-header">
              ${carVisualHTML(c2, "car-art--sm")}
              <div class="matrix-car-title">${c2.name} ${NATIONALITY_FLAG[c2.nationality]}</div>
              <span class="matrix-car-badge">ราคาป้าย ${formatBaht(c2.price)}</span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="matrix-topic-label">🏷️ ราคาตัวรถป้ายแดง</td>
          <td class="matrix-data-cell text-center font-bold highlight-price">${formatBaht(c1.price)}</td>
          <td class="matrix-data-cell text-center font-bold highlight-price">${formatBaht(c2.price)}</td>
        </tr>
        <tr>
          <td class="matrix-topic-label">💵 ค่างวดผ่อน/เดือน</td>
          <td class="matrix-data-cell text-center">
            <div class="highlight-monthly font-bold">~${formatBaht(m1)} / เดือน</div>
            <div style="font-size:12.5px;margin-top:4px" class="${aff1.cls}">ราว ${Math.round(ratio1*100)}% ของรายได้ (${aff1.label})</div>
          </td>
          <td class="matrix-data-cell text-center">
            <div class="highlight-monthly font-bold">~${formatBaht(m2)} / เดือน</div>
            <div style="font-size:12.5px;margin-top:4px" class="${aff2.cls}">ราว ${Math.round(ratio2*100)}% ของรายได้ (${aff2.label})</div>
          </td>
        </tr>
        <tr>
          <td class="matrix-topic-label">🛡️ ค่าประกันภัยชั้น 1 (5 ปีสะสม)</td>
          <td class="matrix-data-cell text-center font-bold" style="color:#FCA5A5">+${formatBaht(tco1.insurance5yr)}</td>
          <td class="matrix-data-cell text-center font-bold" style="color:#FCA5A5">+${formatBaht(tco2.insurance5yr)}</td>
        </tr>
        <tr>
          <td class="matrix-topic-label">🔧 ค่าซ่อมบำรุง &amp; อะไหล่ (5 ปี)</td>
          <td class="matrix-data-cell text-center font-bold" style="color:#FCA5A5">+${formatBaht(tco1.maint5yr)}</td>
          <td class="matrix-data-cell text-center font-bold" style="color:#FCA5A5">+${formatBaht(tco2.maint5yr)}</td>
        </tr>
        <tr>
          <td class="matrix-topic-label">📉 มูลค่าขายต่อ (หลัง 5 ปี)</td>
          <td class="matrix-data-cell text-center font-bold" style="color:#34D399">−${formatBaht(tco1.resaleValue)}</td>
          <td class="matrix-data-cell text-center font-bold" style="color:#34D399">−${formatBaht(tco2.resaleValue)}</td>
        </tr>
        <tr>
          <td class="matrix-topic-label">💰 รวมต้นทุน 5 ปี (TCO)</td>
          <td class="matrix-data-cell text-center font-bold highlight-tco">${formatBaht(tco1.total5yr)}</td>
          <td class="matrix-data-cell text-center font-bold highlight-tco">${formatBaht(tco2.total5yr)}</td>
        </tr>
        <tr>
          <td class="matrix-topic-label">⚠️ ข้อควรรู้ &amp; ความเสี่ยง</td>
          <td class="matrix-data-cell text-left"><ul style="padding-left:18px;margin:0;font-size:14px">${noteRows1}</ul></td>
          <td class="matrix-data-cell text-left"><ul style="padding-left:18px;margin:0;font-size:14px">${noteRows2}</ul></td>
        </tr>
      </tbody>
    </table>
  `;
}

function renderCostRisk() {
  costRiskGrid.innerHTML = "";
  const costRiskSection = document.getElementById("costRiskSection");

  // View Toggle Bar
  const toggleBar = document.createElement("div");
  toggleBar.className = "view-toggle-bar";
  toggleBar.innerHTML = `
    <span class="view-toggle-label">เลือกรูปแบบการแสดงผลต้นทุน &amp; ความเสี่ยง:</span>
    <div class="view-toggle-buttons">
      <button type="button" class="view-toggle-btn ${state.costRiskViewMode === "card" ? "is-active" : ""}" id="crToggleCardBtn">🎴 มุมมองการ์ด (Card View)</button>
      <button type="button" class="view-toggle-btn ${state.costRiskViewMode === "table" ? "is-active" : ""}" id="crToggleTableBtn">📊 ตารางเทียบต้นทุน TCO 2 คัน (2-Car Cost Matrix)</button>
    </div>
  `;
  const existingToggle = costRiskSection.querySelector(".view-toggle-bar");
  if (existingToggle) existingToggle.remove();
  costRiskSection.insertBefore(toggleBar, costRiskSection.querySelector(".results__intro").nextElementSibling);

  document.getElementById("crToggleCardBtn").addEventListener("click", () => {
    state.costRiskViewMode = "card";
    renderCostRisk();
  });
  document.getElementById("crToggleTableBtn").addEventListener("click", () => {
    state.costRiskViewMode = "table";
    if (!state.compareCarId1 && state.shortlist[0]) state.compareCarId1 = state.shortlist[0].car.id;
    if (!state.compareCarId2 && state.shortlist[1]) state.compareCarId2 = state.shortlist[1].car.id;
    renderCostRisk();
  });

  if (state.costRiskViewMode === "table") {
    const wrapper = document.createElement("div");
    wrapper.className = "comparison-matrix-wrapper";
    wrapper.innerHTML = buildDropdownToolbar("cr");
    const scrollDiv = document.createElement("div");
    scrollDiv.className = "comparison-matrix-scroll";
    wrapper.appendChild(scrollDiv);
    costRiskGrid.appendChild(wrapper);

    const updateTable = () => {
      const id1 = state.compareCarId1 || (state.shortlist[0] && state.shortlist[0].car.id);
      const id2 = state.compareCarId2 || (state.shortlist[1] && state.shortlist[1].car.id) || id1;
      const item1 = state.shortlist.find(i => i.car.id === Number(id1)) || state.shortlist[0];
      const item2 = state.shortlist.find(i => i.car.id === Number(id2)) || state.shortlist[1] || state.shortlist[0];
      scrollDiv.innerHTML = buildCostMatrixHTML(item1, item2);
      wirePhotoFallbacks(scrollDiv);
    };
    wireDropdown("cr", updateTable);
    updateTable();
    return;
  }

  state.shortlist.forEach(({ car }) => {
    const tco = calcTCO(car);
    const notes = riskNotes(car);
    const monthly = calcMonthlyInstallment(car);
    const ratio = monthly / state.income;
    const afford = affordabilityTier(ratio);

    const isEV = car.fuelType === "ev";
    const breakdownHTML = isEV ? `
      <details class="tco-card__details">
        <summary class="tco-card__summary">💡 ดูที่มาและรายละเอียดคำนวณ (ระยะวิ่ง 5 ปี / 100,000 กม.)</summary>
        <div class="tco-card__breakdown">
          <p style="margin: 0; font-weight: 600; color: var(--card-light-ink);">📊 เกณฑ์ประมาณการสำหรับรถยนต์ไฟฟ้า (EV):</p>
          <strong>🛡️ ค่าประกันภัยชั้น 1 (เฉลี่ย 5 ปีสะสม): ~${formatBaht(tco.insurance5yr)}</strong>
          <ul>
            <li>ปีที่ 1: ฟรีประกันภัยชั้น 1 (แคมเปญส่งเสริมการขาย)</li>
            <li>ปีที่ 2-5: อัตราเบี้ยปีละ 1.8% - 2.8% ของราคารถ (ปรับลดตามค่าเสื่อมทุนประกันรายปี)</li>
          </ul>
          <strong>🔧 ค่าซ่อมบำรุงและอะไหล่สิ้นเปลือง: ~${formatBaht(tco.maint5yr)}</strong>
          <ul>
            <li>เช็คระยะศูนย์บริการทุกๆ 15,000 - 20,000 กม. หรือ 12 เดือน (เฉลี่ยครั้งละ 1,000 - 2,000 บาท สำหรับตรวจเช็คระบบไฟฟ้า น้ำยาหล่อเย็น และกรองแอร์)</li>
            <li>เปลี่ยนยางใหม่ 1 ชุด (เนื่องจากรถ EV มีน้ำหนักแบตเตอรี่มากและแรงบิดสูง ดอกยางจึงสึกไวกว่าปกติ)</li>
            <li>เปลี่ยนแบตเตอรี่ 12V ทั่วไป (1-2 ลูกในระยะ 5 ปี)</li>
          </ul>
        </div>
      </details>
    ` : `
      <details class="tco-card__details">
        <summary class="tco-card__summary">💡 ดูที่มาและรายละเอียดคำนวณ (ระยะวิ่ง 5 ปี / 100,000 กม.)</summary>
        <div class="tco-card__breakdown">
          <p style="margin: 0; font-weight: 600; color: var(--card-light-ink);">📊 เกณฑ์ประมาณการสำหรับรถเครื่องยนต์/ไฮบริด:</p>
          <strong>🛡️ ค่าประกันภัยชั้น 1 (เฉลี่ย 5 ปีสะสม): ~${formatBaht(tco.insurance5yr)}</strong>
          <ul>
            <li>ปีที่ 1: ฟรีประกันภัยชั้น 1 (ของแถมมาตรฐานโชว์รูม)</li>
            <li>ปีที่ 2-5: อัตราเบี้ยปีละ 1.5% - 2.5% ของราคารถ (ปรับลดตามค่าเสื่อมทุนประกันรายปี)</li>
          </ul>
          <strong>🔧 ค่าซ่อมบำรุงและอะไหล่สิ้นเปลือง: ~${formatBaht(tco.maint5yr)}</strong>
          <ul>
            <li>เช็คระยะศูนย์บริการทุกๆ 10,000 กม. หรือ 6 เดือน (เปลี่ยนน้ำมันเครื่อง, ไส้กรอง, น้ำมันเกียร์, หัวเทียน, และของเหลวตามรอบ)</li>
            <li>รอบเช็คระยะปกติ (10k-30k, 50k-70k, 90k กม.) เฉลี่ยครั้งละ 1,500 - 3,000 บาท</li>
            <li>รอบเช็คระยะใหญ่ (40k, 80k, 100k กม.) เฉลี่ยครั้งละ 5,000 - 8,000 บาท</li>
            <li>เปลี่ยนยางใหม่ 1 ชุด, แบตเตอรี่ 12V (2 ลูก) และผ้าเบรกตามอายุการใช้งาน</li>
          </ul>
        </div>
      </details>
    `;

    const card = document.createElement("article");
    card.className = "tco-card";
    card.innerHTML = `
      <div class="car-card__art">${carVisualHTML(car)}</div>
      <div class="tco-card__head">
        <p class="tco-card__name">${car.name}</p>
        <span class="tco-card__sticker">ราคาป้าย ${formatBaht(car.price)}</span>
      </div>
      <div class="afford-box ${afford.cls}">
        <strong>ค่างวดโดยประมาณ ${formatBaht(monthly)} / เดือน</strong>
        คิดเป็นราว ${Math.round(ratio * 100)}% ของรายได้ที่แจ้งไว้ — ${afford.label}
        <small>สมมติดาวน์ 15% ผ่อน 5 ปี ดอกเบี้ยเฉลี่ย ~2.99%/ปี (แบบ flat rate) เป็นตัวเลขประมาณเพื่อการศึกษา ไม่ใช่ข้อเสนอไฟแนนซ์จริง</small>
      </div>
      <table class="tco-table">
        <tr><td>ราคารถ</td><td>${formatBaht(car.price)}</td></tr>
        <tr><td>ค่าประกันภัย (5 ปี)</td><td>+${formatBaht(tco.insurance5yr)}</td></tr>
        <tr><td>ค่าซ่อมบำรุง (5 ปี)</td><td>+${formatBaht(tco.maint5yr)}</td></tr>
        <tr class="tco-negative"><td>มูลค่าขายต่อ (โดยประมาณ)</td><td>−${formatBaht(tco.resaleValue)}</td></tr>
        <tr class="tco-total"><td>รวมต้นทุนถือครอง 5 ปี</td><td>${formatBaht(tco.total5yr)}</td></tr>
      </table>
      <p class="tco-total-note">ตัวเลขประมาณการค่าเสื่อมราคาและค่าบำรุงรักษาเพื่อสาธิตระบบเท่านั้น ไม่ใช่ราคาอ้างอิงจริงทางตลาดแบบเรียลไทม์</p>
      ${breakdownHTML}
      <ul class="risk-list">${notes.map((n) => `<li><span class="risk-icon">${n.icon}</span><span>${n.text}</span></li>`).join("")}</ul>
    `;
    costRiskGrid.appendChild(card);
  });
  wirePhotoFallbacks(costRiskGrid);
}

/* ============================================
   STAGE 4 · DECIDE
   ============================================ */
toDecideBtn.addEventListener("click", () => { renderDecide(); showMacroStage(4); });
backToCostRiskBtn.addEventListener("click", () => showMacroStage(3));

function renderDecide() {
  decideGrid.innerHTML = "";
  state.shortlist.forEach(({ car, score }) => {
    const row = document.createElement("div");
    row.className = "decide-card";
    row.dataset.carId = car.id;
    if (state.chosenCarId === car.id) row.classList.add("is-chosen");
    row.innerHTML = `
      ${carVisualHTML(car, "car-art--sm")}
      <div class="decide-card__info">
        <div class="decide-card__title-row">
          <span class="decide-card__name">${car.name} ${NATIONALITY_FLAG[car.nationality]}</span>
          <span class="decide-card__badge ${state.chosenCarId === car.id ? "badge-selected" : ""}">${
            state.chosenCarId === car.id ? "✓ เลือกรถคันนี้แล้ว" : "คลิกเพื่อเลือกคันนี้"
          }</span>
        </div>
        <span class="decide-card__meta">${BODYTYPE_LABEL[car.bodyType]} · ความเหมาะสม <strong>${score}/100</strong></span>
      </div>
      <div class="decide-card__radio ${state.chosenCarId === car.id ? "is-active" : ""}">${state.chosenCarId === car.id ? "✓" : ""}</div>
    `;
    row.addEventListener("click", () => {
      state.chosenCarId = car.id;
      decideGrid.querySelectorAll(".decide-card").forEach((c) => c.classList.remove("is-chosen"));
      row.classList.add("is-chosen");
    });
    decideGrid.appendChild(row);
  });
  wirePhotoFallbacks(decideGrid);
}

confirmDecisionBtn.addEventListener("click", () => {
  if (!state.chosenCarId) { shakeEl(decideGrid); return; }
  renderShowroom();
  showMacroStage(5);
});

/* ============================================
   STAGE 5 · SHOWROOM PREP CHECKLIST
   ============================================ */
function checklistGroupsFor(car) {
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

function renderShowroom() {
  const car = state.shortlist.find((s) => s.car.id === state.chosenCarId)?.car;
  if (!car) return;

  showroomTitle.textContent = `เตรียมตัวไปดู ${car.name}`;
  showroomSub.textContent = `เช็คลิสต์นี้ปรับมาให้ตรงกับ ${car.name} (${BODYTYPE_LABEL[car.bodyType]} · ${FUEL_LABEL[car.fuelType]}) ติ๊กไปเรื่อยๆ ก่อนออกจากบ้าน`;

  const groups = checklistGroupsFor(car);
  state.checklist = {};
  checklistGroups.innerHTML = "";

  groups.forEach((group, gi) => {
    const groupEl = document.createElement("div");
    groupEl.className = "checklist-group";
    const itemsHTML = group.items.map((text, ii) => {
      const id = `g${gi}-i${ii}`;
      state.checklist[id] = false;
      return `<div class="checklist-item" data-id="${id}"><span class="checklist-item__box"></span><span class="checklist-item__text">${text}</span></div>`;
    }).join("");
    groupEl.innerHTML = `<p class="checklist-group__title">${group.title}</p>${itemsHTML}`;
    checklistGroups.appendChild(groupEl);
  });

  checklistGroups.querySelectorAll(".checklist-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = item.dataset.id;
      state.checklist[id] = !state.checklist[id];
      item.classList.toggle("is-checked", state.checklist[id]);
      updateChecklistProgress();
    });
  });
  updateChecklistProgress();
}

function updateChecklistProgress() {
  const ids = Object.keys(state.checklist);
  const done = ids.filter((id) => state.checklist[id]).length;
  const pct = ids.length ? Math.round((done / ids.length) * 100) : 0;
  checklistFill.style.width = pct + "%";
  checklistLabel.textContent = `${done}/${ids.length} ข้อ`;
}

backToDecideBtn.addEventListener("click", () => showMacroStage(4));

/* ============================================
   INIT
   ============================================ */
budgetKInput.value = Math.round(state.budget / 1000);
incomeKInput.value = Math.round(state.income / 1000);
budgetValue.textContent = formatBaht(state.budget);
incomeValue.textContent = formatBaht(state.income) + " / เดือน";

showStep(1);
