"use client";

import { useEffect, useState } from "react";

type AnyFeature = {
  type?: string;
  properties?: Record<string, any>;
  geometry?: {
    type?: string;
    coordinates?: any;
  };
};

type GeologyResult = {
  status: string;
  classId?: number;
  unit?: {
    id: number;
    code: string;
    name_bg: string;
    name_en: string;
  } | null;
};

type ReportData = {
  lat: number;
  lon: number;
  geology: GeologyResult | null;
  bodies: AnyFeature[];
  monitoring: {
    feature: AnyFeature;
    distanceKm: number;
  } | null;
};

function pointInRing(
  lon: number,
  lat: number,
  ring: number[][]
) {
  let inside = false;

  for (
    let i = 0, j = ring.length - 1;
    i < ring.length;
    j = i++
  ) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > lat !== yj > lat &&
      lon <
        ((xj - xi) * (lat - yi)) /
          ((yj - yi) || 1e-12) +
        xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function pointInPolygonGeometry(
  lon: number,
  lat: number,
  geometry: any
) {
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates || [];

    if (!rings.length) return false;

    if (!pointInRing(lon, lat, rings[0])) {
      return false;
    }

    for (let i = 1; i < rings.length; i++) {
      if (pointInRing(lon, lat, rings[i])) {
        return false;
      }
    }

    return true;
  }

  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates || []) {
      if (
        pointInPolygonGeometry(
          lon,
          lat,
          {
            type: "Polygon",
            coordinates: polygon,
          }
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371.0088;
  const d2r = Math.PI / 180;

  const dLat = (lat2 - lat1) * d2r;
  const dLon = (lon2 - lon1) * d2r;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * d2r) *
      Math.cos(lat2 * d2r) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    R *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

function lonLatToUTM35(
  lon: number,
  lat: number
) {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);

  const rad = Math.PI / 180;
  const phi = lat * rad;
  const lambda = lon * rad;
  const lambda0 = 27 * rad;

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const N =
    a /
    Math.sqrt(
      1 - e2 * sinPhi * sinPhi
    );

  const T = tanPhi * tanPhi;
  const C = ep2 * cosPhi * cosPhi;
  const A =
    cosPhi * (lambda - lambda0);

  const e4 = e2 * e2;
  const e6 = e4 * e2;

  const M =
    a *
    (
      (1 -
        e2 / 4 -
        (3 * e4) / 64 -
        (5 * e6) / 256) *
        phi -
      (3 * e2 / 8 +
        3 * e4 / 32 +
        45 * e6 / 1024) *
        Math.sin(2 * phi) +
      (15 * e4 / 256 +
        45 * e6 / 1024) *
        Math.sin(4 * phi) -
      (35 * e6 / 3072) *
        Math.sin(6 * phi)
    );

  const easting =
    k0 *
      N *
      (
        A +
        ((1 - T + C) * A ** 3) / 6 +
        ((5 -
          18 * T +
          T * T +
          72 * C -
          58 * ep2) *
          A ** 5) /
          120
      ) +
    500000;

  let northing =
    k0 *
    (
      M +
      N *
        tanPhi *
        (
          A ** 2 / 2 +
          ((5 -
            T +
            9 * C +
            4 * C * C) *
            A ** 4) /
            24 +
          ((61 -
            58 * T +
            T * T +
            600 * C -
            330 * ep2) *
            A ** 6) /
            720
        )
    );

  if (lat < 0) {
    northing += 10000000;
  }

  return { easting, northing };
}

async function loadRaster(url: string) {
  return new Promise<{
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
  }>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas =
        document.createElement("canvas");

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const ctx = canvas.getContext(
        "2d",
        { willReadFrequently: true }
      );

      if (!ctx) {
        reject(
          new Error("Canvas unavailable")
        );
        return;
      }

      ctx.drawImage(image, 0, 0);

      resolve({
        ctx,
        width: canvas.width,
        height: canvas.height,
      });
    };

    image.onerror = () =>
      reject(
        new Error(
          "Raster load failed: " + url
        )
      );

    image.src = url;
  });
}

function pixelValue(
  raster: {
    ctx: CanvasRenderingContext2D;
  },
  x: number,
  y: number
) {
  return raster.ctx.getImageData(
    x,
    y,
    1,
    1
  ).data[0];
}

async function geologyAt(
  lat: number,
  lon: number
): Promise<GeologyResult> {
  const meta = await fetch(
    "/geology-map/data/bd_ibr_geology_lookup.json"
  ).then(r => r.json());

  const [direct, reliable, obscured] =
    await Promise.all([
      loadRaster(meta.rasters.direct),
      loadRaster(meta.rasters.reliable),
      loadRaster(
        meta.rasters.source_obscured
      ),
    ]);

  const utm =
    lonLatToUTM35(lon, lat);

  const inv =
    meta.affine.utm_to_pixel_matrix;

  const offsetE =
    meta.affine.pixel_to_utm_easting[2];

  const offsetN =
    meta.affine.pixel_to_utm_northing[2];

  const de =
    utm.easting - offsetE;

  const dn =
    utm.northing - offsetN;

  const cropX =
    inv[0][0] * de +
    inv[0][1] * dn;

  const cropY =
    inv[1][0] * de +
    inv[1][1] * dn;

  const x = Math.round(
    (cropX + meta.master.crop_x) *
      meta.master.scale_x
  );

  const y = Math.round(
    (cropY + meta.master.crop_y) *
      meta.master.scale_y
  );

  if (
    x < 0 ||
    y < 0 ||
    x >= meta.master.width ||
    y >= meta.master.height
  ) {
    return {
      status: "OUTSIDE_RASTER",
      unit: null,
    };
  }

  const directId =
    pixelValue(direct, x, y);

  const reliableId =
    pixelValue(reliable, x, y);

  const isObscured =
    pixelValue(obscured, x, y) > 0;

  let status = "UNRESOLVED";
  let classId = 0;

  if (isObscured) {
    status = "SOURCE_OBSCURED";
  } else if (reliableId === 0) {
    status = "UNRESOLVED";
  } else if (directId > 0) {
    status = "DIRECT";
    classId = directId;
  } else {
    status = "GAP_FILL";
    classId = reliableId;
  }

  const unit =
    (meta.units || []).find(
      (u: any) =>
        Number(u.id) === classId
    ) || null;

  return {
    status,
    classId,
    unit,
  };
}


function waterTypeExplanation(value: string) {
  const t = String(value || "").toLowerCase();

  if (t.includes("поров")) {
    return "Порови води означава, че водата се намира и се движи основно в празните пространства между песъчинки, чакъл и други зърнести материали. Представи си мокър пясък или чакъл – водата е между отделните частици, а не в голяма подземна кухина.";
  }

  if (t.includes("карст")) {
    return "Карстови води означава, че водата се движи главно по разширени пукнатини, канали и кухини в разтворими скали, най-често варовици. Дебитът може да се променя рязко от място на място.";
  }

  if (
    t.includes("пукнат") ||
    t.includes("пукнатин")
  ) {
    return "Пукнатинни води означава, че основната скала може да е компактна, но водата се събира и движи по пукнатини, разломени и изветрели зони. Затова две близки сондажни точки могат да дадат много различен резултат.";
  }

  return "Това е официалният хидрогеоложки тип на водите. Той описва по какъв начин водата обикновено се съхранява и движи в геоложката среда.";
}


function monitoringMeaning(
  measurementType: string
) {
  if (measurementType === "level") {
    return "„Ниво“ означава, че в този пункт се наблюдава положението на подземната вода – тоест как се изменя водното ниво във времето. Това НЕ е измерен дебит и НЕ означава автоматично дълбочината, на която ще намериш вода в избраната точка. Стойностите в сантиметри са отчетени така, както са публикувани в официалния мониторинг.";
  }

  if (measurementType === "discharge") {
    return "„Дебит“ означава, че в пункта се следи количеството вода, което изтича за единица време. Стойността е ориентир за конкретния наблюдаван източник и не може директно да се пренася като очакван дебит на бъдещ сондаж.";
  }

  return "Мониторинговият пункт показва реално наблюдение на подземните води в района. Данните от него трябва да се използват като ориентир, а не като директна прогноза за конкретния имот.";
}


function groundwaterBodyMeaning(
  p: Record<string, any>
) {
  const type = String(
    p.gwb_type_name_bg || ""
  ).toLowerCase();

  if (type.includes("алувиал")) {
    return "Това водно тяло е свързано основно с речни и алувиални наслаги – пясъци, чакъли, глини и смесени наноси. Такива пластове често са сравнително лесни за пробиване, но могат да бъдат нестабилни.";
  }

  if (
    type.includes("грабен") ||
    type.includes("депрес")
  ) {
    return "Това водно тяло е свързано с понижен структурен басейн, в който могат да са натрупани дебели седиментни пластове. При сондиране е възможно редуване на глини, пясъци, чакъли и по-споени пластове.";
  }

  if (type.includes("карст")) {
    return "Това водно тяло е свързано с карстова среда. Водата може да е концентрирана в пукнатини, канали и кухини, затова водоносността често е неравномерна.";
  }

  if (
    type.includes("пукнат") ||
    type.includes("fract")
  ) {
    return "Това водно тяло е свързано с напукани скали. Най-важни са пукнатините и структурно нарушените зони, а не целият скален масив.";
  }

  return "Това е отделно официално картографирано подземно водно тяло. То описва регионална водоносна система, а не конкретен пласт с известна дълбочина под имота.";
}


function bodyShortName(
  feature: AnyFeature,
  index: number
) {
  const p = feature.properties || {};

  return (
    p.localId ||
    p.nameText ||
    p.nameTxtInt ||
    `ПВТ ${index + 1}`
  );
}

function geologyConfidenceBg(
  status: string
) {
  if (status === "DIRECT") {
    return "Висока за мащаба на картата – единицата е директно класифицирана.";
  }

  if (status === "GAP_FILL") {
    return "Средна – стойността е консервативно попълнена от близка надеждно класифицирана зона.";
  }

  if (
    status === "SOURCE_OBSCURED"
  ) {
    return "Недостатъчна – изходната карта не позволява надеждно определяне.";
  }

  return "Недостатъчна за надеждна интерпретация.";
}


function likelyDrillingMaterials(
  geologyCode: string,
  bodies: AnyFeature[]
) {
  const combined = bodies
    .map(f => {
      const p = f.properties || {};

      return [
        p.water_type_bg,
        p.gwb_type_name_bg,
        p.horizon_bg,
        p.nameText,
        p.nameTxtInt,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    })
    .join(" ");

  const pore =
    combined.includes("поров");

  const alluvial =
    combined.includes("алувиал") ||
    combined.includes("речн");

  const depression =
    combined.includes("депрес") ||
    combined.includes("грабен");

  const karst =
    combined.includes("карст");

  const fractured =
    combined.includes("пукнат");

  if (
    geologyCode === "Q" &&
    pore &&
    alluvial
  ) {
    return {
      title:
        "Пясък, чакъл, глина и смесени речни наноси",
      short:
        "Най-вероятно ще се редуват рохкави и слабо споени материали.",
      details:
        "При пробиването е вероятно да излизат пясък, чакъл, глина, прахови материали и смесени речни наноси. Възможно е отделни пластове да са по-глинести, а други по-песъчливи или чакълести.",
      behavior:
        "Пясъкът и чакълът могат да се свличат в отвора, а глинестите пластове могат да лепнат и да затрудняват промивката. Обсаждането може да е важно.",
      confidence:
        "Добра регионална интерпретация",
    };
  }

  if (
    geologyCode === "Q" &&
    pore
  ) {
    return {
      title:
        "Рохкави до слабо споени седименти",
      short:
        "Вероятни са пясък, чакъл, глина и смесени наноси.",
      details:
        "Кватернерната възраст и поровият тип води насочват към сравнително млади седиментни материали. Възможни са пясъчни, чакълести и глинести пластове, но точната последователност не е известна.",
      behavior:
        "Стените на сондажа могат да бъдат нестабилни в рохкави участъци.",
      confidence:
        "Средна до добра регионална интерпретация",
    };
  }

  if (
    pore &&
    depression
  ) {
    return {
      title:
        "Редуващи се седиментни пластове",
      short:
        "Възможни са глини, пясъци, чакъли и по-споени седименти.",
      details:
        "При сондиране в подобна седиментна депресия може да има често редуване на по-меки глинести пластове, пясъци, чакъли и локално по-споени материали.",
      behavior:
        "Съпротивлението при пробиване може да се променя рязко между отделните пластове.",
      confidence:
        "Средна регионална интерпретация",
    };
  }

  if (karst) {
    return {
      title:
        "Вероятна твърда карстова скална среда",
      short:
        "Очакват се компактни скали с пукнатини и възможни кухини.",
      details:
        "Карстовият тип водоносна среда насочва към твърда разтворима скала с пукнатини, канали и възможни кухини. Самите налични данни не определят точния литоложки състав в сондажната точка.",
      behavior:
        "Възможни са резки преходи от здрава скала към силно напукана зона или кухина.",
      confidence:
        "Средна интерпретация – нуждае се от локална проверка",
    };
  }

  if (fractured) {
    return {
      title:
        "Компактна до твърда напукана скала",
      short:
        "По-вероятно е пробиване в скален масив, а не в рохкави наноси.",
      details:
        "Водоносността вероятно е свързана основно с пукнатини и нарушени участъци. Точният вид скала не може да се определи само от този регионален слой.",
      behavior:
        "Пробиването вероятно ще бъде по-тежко, но може рязко да се облекчи в напукана или изветряла зона.",
      confidence:
        "Средна регионална интерпретация",
    };
  }

  if (
    [
      "K",
      "J-K",
      "J",
      "T-J",
      "T",
      "P",
      "C-P",
      "C",
      "D",
      "S-D",
      "S",
      "O",
      "Cm-O",
      "Cm",
    ].includes(geologyCode)
  ) {
    return {
      title:
        "По-компактна и вероятно по-твърда геоложка основа",
      short:
        "Възможни са споени или масивни скали.",
      details:
        "По-старата геоложка единица насочва към по-компактна среда, но от картата не може надеждно да се каже дали конкретно ще се срещнат варовик, пясъчник, вулканит, метаморфна или друга скала.",
      behavior:
        "Скоростта на пробиване може да е по-ниска и силно зависима от напукаността и изветрянето.",
      confidence:
        "Ограничена – точният материал не е определен от източника",
    };
  }

  return {
    title:
      "Материалът не може да се определи надеждно",
    short:
      "Регионалните данни не са достатъчни за конкретен вид скала.",
    details:
      "Не е коректно да се посочват конкретни материали без допълнителна литоложка или теренна информация.",
    behavior:
      "Нужно е локално проучване.",
    confidence:
      "Ниска",
  };
}


function simpleGroundInterpretation(
  geologyCode: string,
  bodies: AnyFeature[]
) {
  const bodyText = bodies
    .map(f =>
      [
        f.properties?.water_type_bg,
        f.properties
          ?.gwb_type_name_bg,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
    )
    .join(" ");

  const isKarst =
    bodyText.includes("карст");

  const isPore =
    bodyText.includes("поров");

  const isFractured =
    bodyText.includes("пукнат");

  if (isKarst) {
    return {
      headline:
        "По-скоро твърда, напукана/карстова скална среда",
      hardness: "Висока",
      looseness: "Ниска",
      collapse:
        "Нисък до среден, но са възможни кухини и силно нарушени участъци",
      drilling:
        "Вероятно ще се работи в по-компактна скала. Възможни са резки промени при попадане в пукнатини или карстови кухини.",
      water:
        "Водата по-често се концентрира в пукнатини, разломени зони и карстови празнини.",
    };
  }

  if (
    isPore ||
    geologyCode === "Q"
  ) {
    return {
      headline:
        "По-скоро мека до рохкава седиментна среда",
      hardness: "Ниска до средна",
      looseness: "Средна до висока",
      collapse:
        "Среден до висок при пясъчни и чакълести пластове",
      drilling:
        "Пробиването обикновено е сравнително лесно, но стените могат да се свличат. Често трябва да се мисли за своевременно обсаждане.",
      water:
        "Водата най-често се движи в порите между песъчинки, чакъл и други насипни или слабо споени материали.",
    };
  }

  if (isFractured) {
    return {
      headline:
        "По-скоро компактна и напукана скала",
      hardness: "Средна до висока",
      looseness: "Ниска",
      collapse:
        "Обикновено по-нисък, освен в силно нарушени зони",
      drilling:
        "Очаква се по-твърдо пробиване. Водоносността може да се променя рязко според пукнатините.",
      water:
        "Водата се търси главно в пукнатини и структурно нарушени зони.",
    };
  }

  if (
    ["K", "J-K", "J", "T-J", "T",
     "P", "C-P", "C", "D", "S-D",
     "S", "O", "Cm-O", "Cm"]
      .includes(geologyCode)
  ) {
    return {
      headline:
        "По-скоро по-стара и по-компактна геоложка основа",
      hardness: "Средна до висока",
      looseness: "Ниска до средна",
      collapse:
        "Зависи силно от напукаността и изветрянето",
      drilling:
        "По-вероятно е да се срещнат споени или компактни скали. Реалната твърдост може да се мени значително.",
      water:
        "Ако средата е компактна, водата обикновено е по-свързана с пукнатини и нарушени зони, отколкото с целия скален масив.",
    };
  }

  return {
    headline:
      "Смесена или недостатъчно определена геоложка среда",
    hardness: "Не може да се определи надеждно",
    looseness: "Не може да се определи надеждно",
    collapse:
      "Нужна е локална проверка",
    drilling:
      "Регионалните данни не са достатъчни за надеждна оценка на поведението при пробиване.",
    water:
      "Необходима е локална хидрогеоложка/геофизична проверка.",
  };
}

export default function GeologyReportPage() {
  const [data, setData] =
    useState<ReportData | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function run() {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const lat =
          Number(params.get("lat"));

        const lon =
          Number(params.get("lon"));

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon)
        ) {
          throw new Error(
            "Липсват валидни координати lat/lon."
          );
        }

        const [
          geology,
          bodiesData,
          monitoringData,
        ] = await Promise.all([
          geologyAt(lat, lon),

          fetch(
            "/geology-map/data/bd_ibr_groundwater_bodies_enriched.geojson"
          ).then(r => r.json()),

          fetch(
            "/geology-map/data/bd_ibr_monitoring_2019_2020.geojson"
          ).then(r => r.json()),
        ]);

        const bodies =
          (bodiesData.features || [])
            .filter((f: AnyFeature) =>
              pointInPolygonGeometry(
                lon,
                lat,
                f.geometry
              )
            );

        let nearest = null as
          | {
              feature: AnyFeature;
              distanceKm: number;
            }
          | null;

        for (
          const feature of
            monitoringData.features || []
        ) {
          if (
            feature.geometry?.type !==
            "Point"
          ) {
            continue;
          }

          const c =
            feature.geometry.coordinates;

          const d =
            haversineKm(
              lat,
              lon,
              c[1],
              c[0]
            );

          if (
            !nearest ||
            d < nearest.distanceKm
          ) {
            nearest = {
              feature,
              distanceKm: d,
            };
          }
        }

        setData({
          lat,
          lon,
          geology,
          bodies,
          monitoring: nearest,
        });
      } catch (e: any) {
        setError(
          e?.message || String(e)
        );
      }
    }

    run();
  }, []);

  if (error) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1>Подробен геоложки анализ</h1>
          <p>{error}</p>
          <a href="/geology">
            ← Обратно към картата
          </a>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          Зареждане на анализа…
        </div>
      </main>
    );
  }

  const geologyCode =
    data.geology?.unit?.code || "";

  const simple =
    simpleGroundInterpretation(
      geologyCode,
      data.bodies
    );


  const drillingMaterials =
    likelyDrillingMaterials(
      geologyCode,
      data.bodies
    );


  const mp =
    data.monitoring?.feature
      ?.properties || {};

  const monitoringType =
    mp.measurement_type === "level"
      ? "ниво"
      : mp.measurement_type ===
          "discharge"
        ? "дебит"
        : "неуточнено";

  const unit =
    mp.measurement_type === "level"
      ? " cm"
      : mp.measurement_type ===
          "discharge"
        ? " l/s"
        : "";


  const uniqueWaterTypes = Array.from(
    new Set(
      data.bodies
        .map(
          f =>
            String(
              f.properties?.water_type_bg ||
              ""
            ).trim()
        )
        .filter(Boolean)
    )
  );

  const primaryWaterType =
    uniqueWaterTypes[0] || "";


  return (
    <main style={styles.page}>
      <div style={styles.shell}>

        <div style={styles.topbar}>
          <div>
            <div style={styles.eyebrow}>
              AISMM GEOLOGY
            </div>
            <h1 style={styles.h1}>
              Подробен анализ на точка
            </h1>
            <div style={styles.coords}>
              {data.lat.toFixed(6)},{" "}
              {data.lon.toFixed(6)}
            </div>
          </div>

          <a
            href="/geology"
            style={styles.backButton}
          >
            ← Към картата
          </a>
        </div>

        <section style={styles.heroCard}>
          <div style={styles.sectionLabel}>
            С ДВЕ ДУМИ ЗА СОНДАЖИСТА
          </div>

          <h2 style={styles.heroTitle}>
            {simple.headline}
          </h2>

          <p style={styles.lead}>
            Това е практическо обобщение
            на наличните картографски
            данни за района. То не замества
            геофизично измерване или реален
            сондажен разрез.
          </p>

          <div style={styles.grid4}>
            <Metric
              title="Твърдост"
              value={simple.hardness}
            />
            <Metric
              title="Ронливост"
              value={simple.looseness}
            />
            <Metric
              title="Риск от свличане"
              value={simple.collapse}
            />
            <Metric
              title="ПВТ в точката"
              value={String(
                data.bodies.length
              )}
            />
          </div>

          <div style={styles.materialHero}>
            <div style={styles.materialIcon}>
              ⛏
            </div>

            <div>
              <div style={styles.materialLabel}>
                КАКЪВ МАТЕРИАЛ ВЕРОЯТНО ЩЕ ИЗЛИЗА ПРИ ПРОБИВАНЕТО
              </div>

              <div style={styles.materialTitle}>
                {drillingMaterials.title}
              </div>

              <div style={styles.materialShort}>
                {drillingMaterials.short}
              </div>
            </div>
          </div>

          <div style={styles.simpleBox}>
            <strong>
              Как се очаква да се държи
              при пробиване:
            </strong>
            <p>{simple.drilling}</p>

            <strong>
              Къде по-вероятно се движи
              водата:
            </strong>
            <p style={{marginBottom:0}}>
              {simple.water}
            </p>
          </div>
        </section>

        <div style={styles.twoColumns}>

          <section style={styles.card}>
            <div style={styles.sectionLabel}>
              ГЕОЛОГИЯ
            </div>

            <h2 style={styles.h2}>
              {data.geology?.unit
                ? `${data.geology.unit.code} – ${data.geology.unit.name_bg}`
                : "Неопределена геоложка единица"}
            </h2>

            <p style={{marginBottom:10}}>
              Това е регионалната геоложка
              единица според картата.
            </p>

            <div style={styles.note}>
              <strong>Надеждност:</strong>{" "}
              {geologyConfidenceBg(
                data.geology?.status || ""
              )}
            </div>
          </section>


          <section style={styles.card}>
            <div style={styles.sectionLabel}>
              НАЙ-БЛИЗКО РЕАЛНО НАБЛЮДЕНИЕ
            </div>

            {data.monitoring ? (
              <>
                <h2 style={styles.h2}>
                  {mp.station_no ||
                    "Мониторингов пункт"}
                  {mp.location
                    ? ` – ${mp.location}`
                    : ""}
                </h2>

                <p>
                  Разстояние от точката:{" "}
                  <strong>
                    {data.monitoring.distanceKm < 1
                      ? `${Math.round(
                          data.monitoring.distanceKm *
                            1000
                        )} m`
                      : `${data.monitoring.distanceKm.toFixed(
                          2
                        )} km`}
                  </strong>
                </p>

                <p>
                  Следи се:{" "}
                  <strong>
                    {monitoringType}
                  </strong>
                </p>

                {(mp.mean_2019 != null ||
                  mp.mean_2020 != null) && (
                  <div style={styles.measureRow}>
                    {mp.mean_2019 != null && (
                      <div>
                        <span style={styles.measureYear}>
                          2019
                        </span>
                        <strong>
                          {mp.mean_2019}
                          {unit}
                        </strong>
                      </div>
                    )}

                    {mp.mean_2020 != null && (
                      <div>
                        <span style={styles.measureYear}>
                          2020
                        </span>
                        <strong>
                          {mp.mean_2020}
                          {unit}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                <div style={styles.explainBox}>
                  <strong>
                    Какво означава „{monitoringType}“?
                  </strong>

                  <div style={{marginTop:6}}>
                    {monitoringMeaning(
                      mp.measurement_type || ""
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p>
                Няма намерен количествен
                мониторингов пункт.
              </p>
            )}
          </section>
        </div>


        <section style={styles.card}>
          <div style={styles.sectionLabel}>
            ПОДЗЕМНИ ВОДИ
          </div>

          <h2 style={styles.h2}>
            Картографирани ПВТ в точката:{" "}
            {data.bodies.length}
          </h2>

          <div style={styles.bodyGrid}>
            {data.bodies.map(
              (feature, index) => {
                const p =
                  feature.properties || {};

                const code =
                  p.localId || "—";

                return (
                  <div
                    key={
                      code + "-" + index
                    }
                    style={styles.bodyCard}
                  >
                    <div style={styles.bodyNumber}>
                      ПВТ {index + 1}
                    </div>

                    <strong>
                      {code}
                    </strong>

                    <div style={styles.bodyName}>
                      {p.nameText ||
                        p.nameTxtInt ||
                        "Подземно водно тяло"}
                    </div>

                    {p.horizon_bg && (
                      <div>
                        Хоризонт:{" "}
                        <strong>
                          {p.horizon_bg}
                        </strong>
                      </div>
                    )}

                    {p.water_type_bg && (
                      <div>
                        Води:{" "}
                        <strong>
                          {p.water_type_bg}
                        </strong>
                      </div>
                    )}

                    {p.gwb_type_name_bg && (
                      <div>
                        Среда:{" "}
                        <strong>
                          {p.gwb_type_name_bg}
                        </strong>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>

          {primaryWaterType && (
            <div style={styles.explainBox}>
              <strong>
                Какво означава „{primaryWaterType}“?
              </strong>

              <div style={{marginTop:6}}>
                {waterTypeExplanation(
                  primaryWaterType
                )}
              </div>
            </div>
          )}

          {data.bodies.length > 1 && (
            <div style={styles.note}>
              <strong>
                Защо са повече от едно?
              </strong>{" "}
              В една координата могат да се
              припокриват различни регионални
              водоносни системи. От тази карта
              не можем надеждно да кажем коя е
              по-плитка и коя по-дълбока.
            </div>
          )}
        </section>


        <section style={styles.card}>
          <div style={styles.sectionLabel}>
            ВИЗУАЛНА СХЕМА
          </div>

          <h2 style={styles.h2}>
            Как да си представим данните
          </h2>

          <div style={styles.diagramWrap}>

            <div style={styles.diagramSurface}>
              <strong>
                ПОВЪРХНОСТ / ТЕРЕН
              </strong>

              <span>
                {data.lat.toFixed(5)},{" "}
                {data.lon.toFixed(5)}
              </span>
            </div>


            <div style={styles.diagramGround}>
              <div style={styles.diagramTitle}>
                🪨{" "}
                {data.geology?.unit
                  ? `${data.geology.unit.code} – ${data.geology.unit.name_bg}`
                  : "Геоложка среда"}
              </div>

              <div style={styles.diagramText}>
                {simple.headline}
              </div>

              <div style={styles.drillLine}>
                <div style={styles.drillHead}>
                  СОНДАЖ
                </div>

                <div style={styles.drillPipe}>
                  ↓
                  <br />
                  ↓
                  <br />
                  ↓
                </div>
              </div>
            </div>


            <div style={styles.aquiferStack}>
              {data.bodies.map(
                (feature, index) => {
                  const p =
                    feature.properties || {};

                  return (
                    <div
                      key={
                        bodyShortName(
                          feature,
                          index
                        ) + "-diagram"
                      }
                      style={{
                        ...styles.aquiferLayer,
                        opacity:
                          index === 0
                            ? 1
                            : 0.88,
                      }}
                    >
                      <div style={styles.aquiferNumber}>
                        КАРТОГРАФИРАНО ПВТ {index + 1}
                      </div>

                      <div style={styles.diagramBodyCode}>
                        {bodyShortName(
                          feature,
                          index
                        )}
                      </div>

                      {p.horizon_bg && (
                        <div>
                          {p.horizon_bg}
                        </div>
                      )}

                      {p.water_type_bg && (
                        <div style={styles.aquiferType}>
                          💧 {p.water_type_bg}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>


            {data.monitoring && (
              <div style={styles.monitoringDiagram}>
                <div style={styles.monitoringIcon}>
                  ◉
                </div>

                <div>
                  <strong>
                    Реално наблюдение:
                  </strong>{" "}

                  {mp.station_no || "Пункт"}

                  {mp.location
                    ? ` – ${mp.location}`
                    : ""}

                  <div>
                    {data.monitoring.distanceKm < 1
                      ? `${Math.round(
                          data.monitoring.distanceKm *
                            1000
                        )} m`
                      : `${data.monitoring.distanceKm.toFixed(
                          2
                        )} km`}{" "}
                    от избраната точка
                  </div>
                </div>
              </div>
            )}


            <div style={styles.diagramLegend}>
              <div>
                <strong>🟫 Кафяво:</strong>{" "}
                геоложка среда
              </div>

              <div>
                <strong>🟦 Синьо:</strong>{" "}
                картографирани подземни
                водни тела
              </div>

              <div>
                <strong>◉:</strong>{" "}
                реален мониторингов пункт
              </div>
            </div>
          </div>

          <div style={styles.warning}>
            ⚠ Това е обяснителна схема,
            а не реален вертикален разрез.
            Сините полета не показват
            действителни дълбочини или
            дебелини на водоносните пластове.
          </div>
        </section>


        <section style={styles.card}>
          <div style={styles.sectionLabel}>
            МАТЕРИАЛ ПРИ ПРОБИВАНЕ
          </div>

          <h2 style={styles.h2}>
            Какво може да излиза от отвора
          </h2>

          <div style={styles.materialDetailGrid}>
            <div style={styles.materialDetailMain}>
              <div style={styles.materialDetailTitle}>
                {drillingMaterials.title}
              </div>

              <p>
                {drillingMaterials.details}
              </p>
            </div>

            <div style={styles.materialBehavior}>
              <strong>
                Поведение при сондиране
              </strong>

              <div style={{marginTop:7}}>
                {drillingMaterials.behavior}
              </div>
            </div>
          </div>

          <div style={styles.interpretationBadge}>
            <strong>
              Степен на увереност:
            </strong>{" "}
            {drillingMaterials.confidence}
          </div>

          <div style={styles.warning}>
            Това е интерпретация от регионалната
            геоложка и хидрогеоложка информация,
            а не описание на реално извадена
            сондажна проба. Точният материал и
            редуването на пластовете се доказват
            само с теренно проучване или сондаж.
          </div>
        </section>


        <section style={styles.card}>
          <div style={styles.sectionLabel}>
            ПРАКТИЧЕСКИ ИЗВОД
          </div>

          <h2 style={styles.h2}>
            Какво означава това за сондирането
          </h2>

          <div style={styles.recommendGrid}>
            <div style={styles.recommendItem}>
              <strong>
                Вероятна среда
              </strong>
              <span>
                {simple.headline}
              </span>
            </div>

            <div style={styles.recommendItem}>
              <strong>
                При пробиване
              </strong>
              <span>
                {simple.drilling}
              </span>
            </div>

            <div style={styles.recommendItem}>
              <strong>
                Къде се движи водата
              </strong>
              <span>
                {simple.water}
              </span>
            </div>

            <div style={styles.recommendItem}>
              <strong>
                Следваща разумна стъпка
              </strong>
              <span>
                Теренно геофизично проучване
                за определяне на локалните
                водоносни зони и тяхното
                развитие по дълбочина.
              </span>
            </div>
          </div>
        </section>


        <div style={styles.footer}>
          Източници: БД ИБР / ПУРБ 2022–2027,
          геоложка карта 1:850 000 и
          количествен мониторинг НИМХ
          2019–2020.
        </div>

      </div>
    </main>
  );
}

function Metric({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div style={styles.metric}>
      <div style={styles.metricTitle}>
        {title}
      </div>
      <div style={styles.metricValue}>
        {value}
      </div>
    </div>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#eef2f0",
    color: "#17211d",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    padding: "28px 16px 60px",
  },

  shell: {
    maxWidth: 1180,
    margin: "0 auto",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-start",
    marginBottom: 22,
  },

  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 800,
    color: "#0b6b43",
  },

  h1: {
    fontSize: 34,
    margin: "5px 0 5px",
  },

  h2: {
    fontSize: 22,
    margin: "6px 0 14px",
  },

  coords: {
    color: "#5e6863",
    fontFamily: "monospace",
  },

  backButton: {
    textDecoration: "none",
    color: "#fff",
    background: "#173f32",
    padding: "11px 16px",
    borderRadius: 8,
    fontWeight: 700,
  },

  heroCard: {
    background: "#183f33",
    color: "#fff",
    padding: 28,
    borderRadius: 14,
    marginBottom: 18,
    boxShadow:
      "0 8px 28px rgba(0,0,0,.10)",
  },

  heroTitle: {
    fontSize: 30,
    margin: "7px 0 10px",
  },

  lead: {
    maxWidth: 850,
    lineHeight: 1.55,
    opacity: 0.92,
  },

  grid4: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: 12,
    marginTop: 22,
  },

  metric: {
    padding: 14,
    background:
      "rgba(255,255,255,.09)",
    border:
      "1px solid rgba(255,255,255,.14)",
    borderRadius: 9,
  },

  metricTitle: {
    fontSize: 12,
    opacity: 0.75,
    marginBottom: 5,
  },

  metricValue: {
    fontWeight: 800,
    lineHeight: 1.3,
  },

  materialHero: {
    marginTop: 18,
    padding: 18,
    display: "flex",
    gap: 16,
    alignItems: "center",
    background: "rgba(255,255,255,.12)",
    border: "1px solid rgba(255,255,255,.18)",
    borderRadius: 10,
  },

  materialIcon: {
    fontSize: 34,
    minWidth: 44,
    textAlign: "center",
  },

  materialLabel: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.2,
    opacity: 0.75,
    marginBottom: 4,
  },

  materialTitle: {
    fontSize: 20,
    fontWeight: 900,
    lineHeight: 1.25,
  },

  materialShort: {
    marginTop: 5,
    lineHeight: 1.45,
    opacity: 0.92,
  },

  materialDetailGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0,1.4fr) minmax(260px,.6fr)",
    gap: 15,
  },

  materialDetailMain: {
    padding: 16,
    background: "#f7f5ef",
    borderRadius: 8,
    border: "1px solid #e3ded0",
  },

  materialDetailTitle: {
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 8,
  },

  materialBehavior: {
    padding: 16,
    background: "#eef6f2",
    borderRadius: 8,
    borderLeft: "4px solid #0b6b43",
  },

  interpretationBadge: {
    display: "inline-block",
    marginTop: 13,
    padding: "8px 11px",
    background: "#eef2f0",
    borderRadius: 6,
    fontSize: 13,
  },

  simpleBox: {
    marginTop: 18,
    padding: 17,
    borderRadius: 9,
    background:
      "rgba(255,255,255,.08)",
    lineHeight: 1.55,
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(320px,1fr))",
    gap: 18,
    marginBottom: 18,
  },

  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 18,
    boxShadow:
      "0 4px 18px rgba(0,0,0,.06)",
    lineHeight: 1.55,
  },

  sectionLabel: {
    color: "#0b6b43",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1.5,
  },

  note: {
    marginTop: 14,
    background: "#eef6f2",
    borderLeft:
      "4px solid #0b6b43",
    padding: 12,
    borderRadius: 4,
  },

  bodyCard: {
    border: "1px solid #d7e2de",
    background: "#f9fbfa",
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
  },

  diagramWrap: {
    overflow: "hidden",
    borderRadius: 9,
    border: "1px solid #d8ddd9",
    background: "#faf8f2",
  },

  explainBox: {
    marginTop: 10,
    padding: 12,
    background: "#f0f7f4",
    borderLeft: "4px solid #18805d",
    borderRadius: 6,
    fontSize: 14,
    lineHeight: 1.55,
  },

  bodyMeaning: {
    marginTop: 10,
    padding: 11,
    background: "#fff9e9",
    borderLeft: "4px solid #c38b19",
    borderRadius: 6,
    lineHeight: 1.5,
  },

  diagramSurface: {
    padding: "16px 20px",
    background: "#4f7045",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    gap: 15,
    flexWrap: "wrap",
  },

  diagramGround: {
    position: "relative",
    minHeight: 150,
    padding: "24px 150px 24px 24px",
    background:
      "linear-gradient(180deg,#d8c69e,#cbb58a)",
    borderTop: "7px solid #374332",
  },

  diagramTitle: {
    fontSize: 24,
    fontWeight: 800,
  },

  diagramText: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 1.5,
  },

  drillLine: {
    position: "absolute",
    right: 35,
    top: 15,
    width: 80,
    textAlign: "center",
  },

  drillHead: {
    fontSize: 12,
    fontWeight: 900,
    background: "#333",
    color: "#fff",
    padding: 6,
    borderRadius: 4,
  },

  drillPipe: {
    fontSize: 28,
    lineHeight: 0.95,
    color: "#333",
    fontWeight: 900,
  },

  aquiferStack: {
    padding: 18,
    background: "#e5ddd0",
  },

  aquiferLayer: {
    padding: 18,
    marginBottom: 12,
    borderRadius: 9,
    background:
      "linear-gradient(90deg,#b8dfea,#8fc9db)",
    border: "1px solid #78b7ca",
  },

  aquiferNumber: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.5,
    color: "#14566b",
    marginBottom: 3,
  },

  aquiferType: {
    marginTop: 5,
    fontWeight: 800,
  },

  aquiferExplanation: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 1.45,
    maxWidth: 900,
  },

  monitoringDiagram: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    padding: 18,
    background: "#edf4ff",
    borderTop: "1px solid #cad8eb",
  },

  monitoringIcon: {
    minWidth: 42,
    textAlign: "center",
    fontSize: 22,
    lineHeight: 0.9,
    color: "#2867a2",
    fontWeight: 900,
  },

  diagramFlow: {
    padding: 16,
    background: "#f8faf9",
    borderTop: "1px solid #d8ddd9",
    lineHeight: 1.5,
  },

  measureRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    margin: "12px 0",
  },

  measureYear: {
    display: "block",
    fontSize: 11,
    color: "#65736d",
    marginBottom: 2,
  },

  bodyGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(280px,1fr))",
    gap: 12,
  },

  bodyNumber: {
    fontSize: 11,
    fontWeight: 900,
    color: "#247f96",
    letterSpacing: 1,
    marginBottom: 3,
  },

  bodyName: {
    margin: "4px 0 8px",
  },

  diagramBodyCode: {
    fontSize: 18,
    fontWeight: 800,
  },

  diagramLegend: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    padding: 15,
    background: "#f6f8f7",
    borderTop: "1px solid #d8ddd9",
    fontSize: 13,
  },

  recommendGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",
    gap: 12,
  },

  recommendItem: {
    padding: 15,
    background: "#f5f8f6",
    border: "1px solid #dce5e0",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },

  warning: {
    marginTop: 12,
    fontSize: 13,
    background: "#fff6dc",
    borderLeft:
      "4px solid #c58a00",
    padding: 11,
  },

  footer: {
    textAlign: "center",
    color: "#66716c",
    fontSize: 12,
    padding: 12,
  },
};
