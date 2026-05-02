import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fal } from "npm:@fal-ai/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: corsHeaders,
        }
      );
    }

    const falKey = Deno.env.get("FAL_KEY");

    if (!falKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing FAL_KEY secret in Supabase.",
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const body = await req.json();

    const duration = Number(body?.duration) || 5;
    const videoImageUrl = body?.video_image_url || "";

    const brandName = body?.brand_profile?.brand_name || "Brand";
    const brandDescription = body?.brand_profile?.brand_description || "";
    const selectedHeadline = body?.selected_post?.headline || "";
    const selectedCaption = body?.selected_post?.caption || "";
    const selectedOffer = body?.selected_post?.offer || "";

    const selectedTone = (
      body?.selected_post?.tone ||
      body?.selected_post?.angle ||
      "soft"
    )
      .toString()
      .toLowerCase();

    const styleDirection =
      selectedTone === "luxury"
        ? "luxury premium advertising style, elegant cinematic motion, refined composition, upscale presentation"
        : selectedTone === "aggressive"
        ? "bold promo advertising style, fast dynamic motion, strong contrast, offer-driven composition"
        : "soft premium social ad style, warm elegant motion, airy composition, friendly emotional presentation";

    const scenes = Array.isArray(body?.video_plan?.scenes)
      ? body.video_plan.scenes
      : [];

    const scenePrompt = scenes
      .slice(0, 5)
      .map((scene: any, index: number) => {
        const title = scene?.title || `Scene ${index + 1}`;
        const visual = (scene?.visual_prompt || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180);
        const motion = (scene?.motion_idea || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 80);

        return `${title}: ${visual}. Motion: ${motion}. Visual storytelling only. No written text in frame.`;
      })
      .join(" ");

    const compact = (value: string, max: number) =>
      (value || "")
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);

    const compactBrand = compact(brandName, 40);
    const compactBusiness = compact(brandDescription, 120);
    const compactHeadline = compact(selectedHeadline, 80);
    const compactCaption = compact(selectedCaption, 180);
    const compactOffer = compact(selectedOffer, 80);
    const compactScenePrompt = compact(scenePrompt, 260);

 const visualBusiness = compactBusiness
  .replace(/\b\d+[.,]?\d*\b/g, " ")
  .replace(/(?:цена|евро|лв|лева|телефон|phone|обади|запази|сега|днес|регион|пловдив|пазарджик)/giu, " ")
  .replace(/\s+/g, " ")
  .trim();

const visualHeadline = compactHeadline
  .replace(/\b\d+[.,]?\d*\b/g, " ")
.replace(/(?:цена|евро|лв|лева)/giu, " ")    .replace(/\s+/g, " ")
  .trim();

const visualCaption = compactCaption
  .replace(/\b\d+[.,]?\d*\b/g, " ")
  .replace(/(?:цена|евро|лв|лева)/giu, " ")
  .replace(/\s+/g, " ")
  .trim();

const visualContext = compact(
  [compactBrand, visualBusiness, visualHeadline, visualCaption]
    .filter(Boolean)
    .join(". "),
  220
);
const detectMainCategory = (context: string) => {
  const normalized = (context || "").toLowerCase();

  if (
    /(замерв|монтаж|ремонт|диагност|инсталац|сондаж|строеж|строител|кладен|геофиз|електро|вик|сервиз|машин|оборудв|техника|индустр|терен|сонда|доставка|логист|обект|измерв|поддръж|подзем|вода)/i.test(
      normalized
    )
  ) {
    return "technical_service";
  }

  if (
    /(автосервиз|car service|auto service|авто|гуми|tire|tyre|oil change|смяна на масло|детайлинг|car wash|автомивка|diagnostics|диагностика на кола|repair shop)/i.test(
      normalized
    )
  ) {
    return "auto_service";
  }

  if (
    /(фитнес|фитнес зала|gym|workout|training|trainer|personal training|персонални тренировки|треньор|тренировк|кардио|силова тренировка|силови тренировки|weights|dumbbell|barbell|muscle|body transformation|group training|pilates|йога|yoga|crossfit|functional training|spinning|cardio|exercise)/i.test(
      normalized
    )
  ) {
    return "fitness";
  }
  if (
    /(басейн|pool|аквапарк|aquapark|джакузи|jacuzzi|сауна|sauna|хамам|steam room|spa zone|релакс зона|минерален басейн|water park|waterpark|slides|водни пързалки)/i.test(
      normalized
    )
  ) {
    return "pool_spa_leisure";
  }

  if (
    /(аптека|дрогерия|фармац|лекарств|медикамент|витамин|добавк|оптика)/i.test(
      normalized
    )
  ) {
    return "pharmacy_medical_retail";
  }
    if (
    /(ресторант|restaurant|кафе|cafe|бистро|bistro|меню|menu|кухня|десерт|dessert|brunch|вечеря|обяд|храна|food|пицария|pizza|burger|grill|grill house|сладкарница|bakery|пекарна)/i.test(
      normalized
    )
  ) {
    return "food_place";
  }

  if (
    /(бар|bar|cocktail|коктейл|club|клуб|дискотека|disco|nightclub|нощен клуб|party|dj|lounge)/i.test(
      normalized
    )
  ) {
    return "nightlife";
  }

  if (
    /(зоомагазин|pet shop|pet store|pet grooming|grooming salon|ветеринар|veterinary|vet clinic|animal care|куче|котка|dog|cat|pet food|аксесоари за домашни любимци)/i.test(
      normalized
    )
  ) {
    return "pet_business";
  }

  if (detectBeautySubtype(normalized)) {
    return "beauty";
  }

    if (
    /(телефон|phone store|gsm|iphone|samsung|xiaomi|smartphone|смартфон|mobile phone|tablet|таблет|laptop|лаптоп|electronics|електроника|tech store|gadget|аксесоари за телефон|phone accessories|computer store|компютри)/i.test(
      normalized
    )
  ) {
    return "electronics_store";
  }

  if (
    /(дрех|облекло|boutique|бутик|fashion|moda|мода|shoes|обувки|bag|чанта|jewelry|бижу|аксесоар|accessories|showroom fashion)/i.test(
      normalized
    )
  ) {
    return "fashion_retail";
  }
  if (
    /(хотел|hotel|guest house|къща за гости|апартамент за гости|airbnb|вила|villa|resort|курорт|real estate|недвижими имоти|апартамент|жилище|property)/i.test(
      normalized
    )
  ) {
    return "hospitality_real_estate";
  }

  if (
    /(продукт|колекция|модел|артикул|серум|крем|дрех|бижу|аксесоар|product|collection)/i.test(
      normalized
    )
  ) {
    return "product";
  }
  if (
    /(студио|клиника|кабинет|магазин|shop|store|офис|шоурум|academy|академ|училищ|център|зала)/i.test(
      normalized
    )
  ) {
    return "general_place_business";
  }

  return "general_place_business";
};
const detectLeisureSubtype = (context: string) => {
  const normalized = (context || "").toLowerCase();

  if (
    /(аквапарк|aquapark|water park|waterpark|водни пързалки|water slides|lazy river|splash zone)/i.test(
      normalized
    )
  ) {
    return "aquapark";
  }

  if (
    /(басейн|pool|swimming pool|infinity pool|outdoor pool|indoor pool)/i.test(
      normalized
    )
  ) {
    return "pool";
  }

  if (
    /(spa|спа|сауна|sauna|джакузи|jacuzzi|хамам|steam room|релакс зона|massage zone|wellness zone)/i.test(
      normalized
    )
  ) {
    return "spa_relax";
  }

  return "pool";
};
  const detectBeautySubtype = (context: string) => {
  const normalized = (context || "").toLowerCase();

  const hasHair =
    /(фризьор|фризьорски|hair|hairstyle|hairstylist|barber|barbershop|подстриж|прическ|боядисв|изправян|къдрен|styling)/i.test(
      normalized
    );

  const hasSkincare =
    /(козметич|козметика|козметично студио|facial|face cleansing|почистване на лице|лице|skin care|skincare|hydrafacial|хидрафейшъл|терапия за лице|грижа за лице|акне|anti[- ]?age|antiage|peeling|пилинг|микродермабразио)/i.test(
      normalized
    );

  const hasNails =
    /(маникюр|педикюр|nails|nail studio|гел лак|gel polish|нокти)/i.test(
      normalized
    );

  const hasMassage =
    /(масаж|massage|therap(y|ies)|релакс|relax massage|deep tissue|lymphatic|лимфен дренаж|антицелулит)/i.test(
      normalized
    );

  const hasMakeup =
    /(грим|makeup|make-up|bridal makeup|вечерен грим|дневен грим|mua|визаж)/i.test(
      normalized
    );

  const hasGeneralBeauty =
    /(beauty|салон за красота|beauty studio|beauty salon|студио за красота|козметично студио|spa|спа)/i.test(
      normalized
    );

  const matchedCount = [
    hasHair,
    hasSkincare,
    hasNails,
    hasMassage,
    hasMakeup,
  ].filter(Boolean).length;

  if (matchedCount > 1) return "mixed_beauty_studio";
  if (hasHair) return "hair";
  if (hasSkincare) return "skincare";
  if (hasNails) return "nails";
  if (hasMassage) return "massage";
  if (hasMakeup) return "makeup";
  if (hasGeneralBeauty) return "mixed_beauty_studio";

  return null;
};

const buildScenesFromText = (
  headline: string,
  caption: string,
  business: string
) => {
 
  const context = [headline, caption, business]
    .filter(Boolean)
    .join(". ")
    .toLowerCase();

      const mainCategory = detectMainCategory(context);
  const beautySubtype = detectBeautySubtype(context);

  const looksLikeEnvironmentService = mainCategory === "technical_service";
  const looksLikeAutoService = mainCategory === "auto_service";
  const looksLikeFitness = mainCategory === "fitness";
  const looksLikePharmacyHealth = mainCategory === "pharmacy_medical_retail";
  const looksLikePoolSpaLeisure = mainCategory === "pool_spa_leisure";
  const looksLikeFoodPlace = mainCategory === "food_place";
  const looksLikeNightlife = mainCategory === "nightlife";
    const looksLikePetBusiness = mainCategory === "pet_business";
  const looksLikeBeautySalon = mainCategory === "beauty";
  const looksLikeElectronicsStore = mainCategory === "electronics_store";
  const looksLikeFashionRetail = mainCategory === "fashion_retail";
  const looksLikeHospitalityRealEstate =
    mainCategory === "hospitality_real_estate";
  const looksLikePlaceBusiness =
    mainCategory === "food_place" ||
        mainCategory === "nightlife" ||
    mainCategory === "pet_business" ||
    mainCategory === "pool_spa_leisure" ||
    mainCategory === "electronics_store" ||
    mainCategory === "fashion_retail" ||
    mainCategory === "hospitality_real_estate" ||
    mainCategory === "general_place_business";
  const looksLikeProduct = mainCategory === "product";
if (looksLikeEnvironmentService) {
  return [
    "hyper-realistic documentary-style nature footage of a real clean river, natural spring, small waterfall, mountain stream, stone well, wet rocks, sand, soil, greenery, and rural landscape. Pure nature only. No humans, no pipes, no holes, no artificial water feature, no fantasy elements, no construction, no magazine, no indoor space",
    "photorealistic close outdoor nature shot of clear flowing water over real stones, natural stream, spring water, riverbank, wet rocks, sand, soil, and believable countryside terrain. No people, no pipe, no drain, no hole, no puddle pit, no artificial object, no tools",
    "calm hyper-realistic closing shot of a natural water source: clean stream, river, spring, waterfall, or traditional stone well in nature. Pure realistic landscape only, no humans, no excavation, no pipe, no strange invented water system",
  ];
}
      if (looksLikeFitness) {
    return [
      "realistic premium fitness commercial scene in a modern gym or training studio environment, focused on athletic atmosphere, workout equipment, strong healthy body language, clean interior detail, and dynamic but believable advertising composition",
      "clean cinematic fitness ad shot with believable gym interior, training equipment, active adult fitness model presence, premium sporty aesthetic, and realistic exercise atmosphere, without medical retail or pharmacy visuals",
      "believable closing fitness-commercial shot in a gym or workout studio setting, elegant and realistic, focused on strength, movement, energy, premium training atmosphere, and ad-style visual polish, with no text",
    ];
  }

  if (looksLikeAutoService) {
    return [
      "realistic premium auto-service commercial scene showing clean workshop environment, polished car surfaces, tools, diagnostics atmosphere, refined garage interior, and believable automotive service mood",
      "clean cinematic auto-service ad shot with realistic car-service interior, vehicle detail, equipment, premium workshop aesthetic, and natural adult technician presence if needed",
      "believable closing automotive commercial shot focused on clean garage atmosphere, vehicle detail, polished surfaces, and professional service environment, with no text",
    ];
  }

  if (looksLikePharmacyHealth) {
    return [
      "realistic pharmacy or medical retail commercial scene with clean shelves, medicine-related retail atmosphere, organized counters, pharmacy products, trustworthy clinical cleanliness, and adult people in natural pharmacist-client interaction",
      "clean cinematic pharmacy retail environment with believable shelves, medicine and healthcare retail context, premium medical shop mood, and realistic adult people, without gym equipment or training visuals",
      "believable closing shot of a pharmacy or medical retail space, elegant and realistic, with subtle adult human presence and no text",
    ];
  }

      if (looksLikeFoodPlace) {
    return [
      "realistic premium restaurant or cafe commercial scene showing elegant food-service interior, warm atmosphere, refined table setting, believable dining environment, and appetizing hospitality mood",
      "clean cinematic food-place ad shot with realistic restaurant or cafe interior, plated food or drinks, refined ambience, premium hospitality aesthetic, and natural adult presence if needed",
      "believable closing restaurant or cafe commercial shot focused on ambience, table styling, food-and-drink presentation, and premium hospitality atmosphere, with no text",
    ];
  }

  if (looksLikeNightlife) {
    return [
      "realistic premium nightlife commercial scene showing elegant bar, lounge, or club interior with cinematic low light, stylish drinks, music atmosphere, refined crowd mood, and believable evening energy",
      "clean cinematic nightlife ad shot with realistic bar or club interior, cocktail presentation, ambient lighting, premium social atmosphere, and natural adult nightlife presence",
      "believable closing nightlife commercial shot focused on elegant evening ambience, bar detail, lighting, drinks, and premium entertainment mood, with no text",
    ];
  }

  if (looksLikePetBusiness) {
    return [
      "realistic premium pet-business commercial scene showing clean pet shop, grooming salon, or animal-care environment, organized shelves, pet accessories, warm atmosphere, and believable animal-friendly mood",
      "clean cinematic pet-business ad shot with realistic pet-store or grooming interior, pet products, refined retail detail, and natural presence of a dog or cat if needed",
      "believable closing pet-business commercial shot focused on clean interior, pet-care atmosphere, accessories, and friendly premium retail mood, with no text",
    ];
  }

  if (looksLikePoolSpaLeisure) {
  if (detectLeisureSubtype(context) === "aquapark") {
    return [
      "realistic premium aquapark commercial scene in a clearly outdoor water-park environment, focused on open-air pools, visible water slides, sunny summer atmosphere, splashing water, playful family leisure mood, and believable aquapark architecture",
      "clean cinematic aquapark ad shot with realistic outdoor water-park details, water slides, bright daylight, cheerful leisure energy, and natural family-friendly atmosphere, without indoor spa mood or medical-looking interior",
      "believable closing aquapark commercial shot focused on outdoor pools, water slides, sunny ambience, joyful summer energy, and polished family leisure atmosphere, with no text",
    ];
  }

  if (detectLeisureSubtype(context) === "spa_relax") {
    return [
      "realistic premium spa commercial scene showing elegant indoor relaxation-zone environment, refined surfaces, ambient lighting, calm wellness atmosphere, and believable luxury spa mood",
      "clean cinematic spa ad shot with realistic indoor wellness interior, soft light, refined textures, premium relaxation ambience, and polished hospitality aesthetic",
      "believable closing spa commercial shot focused on calm indoor ambience, premium environment, relaxation mood, and elegant wellness atmosphere, with no text",
    ];
  }

  return [
    "realistic premium pool commercial scene showing believable pool environment, clean water, refined surfaces, ambient lighting, and polished resort-style atmosphere",
    "clean cinematic pool ad shot with realistic pool area, water detail, elegant leisure ambience, premium hospitality aesthetic, and believable resort mood",
    "believable closing pool commercial shot focused on clean pool ambience, premium environment, water reflections, and refined leisure atmosphere, with no text",
  ];
}
    if (looksLikeElectronicsStore) {
    return [
      "realistic premium electronics retail commercial scene showing modern tech-store interior, smartphones, tablets, laptops, accessories, clean display counters, refined lighting, and believable consumer-electronics atmosphere",
      "clean cinematic electronics ad shot with realistic tech-store interior, phone or gadget product detail, elegant materials, premium merchandising, and realistic retail presentation without fake futuristic devices",
      "believable closing electronics retail commercial shot focused on device detail, store ambience, premium display styling, and modern technology retail mood, with no text",
    ];
  }

  if (looksLikeFashionRetail) {
    return [
      "realistic premium fashion retail commercial scene showing elegant boutique or showroom interior, clothing racks, refined styling atmosphere, premium retail detail, and believable fashion mood",
      "clean cinematic fashion ad shot with realistic boutique interior, clothing detail, accessories, elegant materials, premium merchandising, and natural adult model presence if needed",
      "believable closing fashion retail commercial shot focused on boutique ambience, apparel detail, elegant styling atmosphere, and premium showroom mood, with no text",
    ];
  }
  if (looksLikeHospitalityRealEstate) {
    return [
      "realistic premium hospitality or property commercial scene showing elegant hotel, guest house, villa, or apartment environment, refined interior, natural light, premium decor, and welcoming atmosphere",
      "clean cinematic hospitality ad shot with realistic room or property interior, polished surfaces, ambient lighting, premium accommodation mood, and believable lifestyle atmosphere",
      "believable closing hospitality or property commercial shot focused on room ambience, architecture, decor, and premium stay-or-living mood, with no text",
    ];
  }

  if (looksLikeBeautySalon) {   if (beautySubtype === "hair") {
      return [
        "realistic premium beauty commercial scene in a hair salon environment, focused on beautiful healthy styled hair, elegant lighting, polished interior detail, mirror reflections, hair texture, and advertising composition, with no haircut process and no staff-client action",
        "clean cinematic hair beauty ad shot with believable salon interior, premium feminine aesthetic, hair shine, and polished styling result, without scissors, blow drying, or employee action in progress",
        "believable closing hair-commercial shot in a salon setting, elegant and realistic, focused on hair detail, refined mood, premium interior atmosphere, and ad-style visual polish, with no working stylist in frame and no text",
      ];
    }
if (beautySubtype === "skincare") {
  return [
    "realistic premium skincare commercial scene in an elegant cosmetic studio interior, focused on calm beauty atmosphere, soft lighting, clean treatment room environment, and one elegant adult female model with healthy glowing skin, standing or sitting naturally, with no procedure happening",
    "clean cinematic skincare ad shot with a believable cosmetic studio interior, neatly arranged skincare products on a table, towels, bottles, jars, premium cosmetic setup, and one static elegant adult female beauty model with clear skin, with no hands near the face and no interaction",
    "believable closing skincare-commercial shot showing fresh natural facial beauty, calm expression, elegant cosmetic studio ambience, and premium product styling, with one static model only, no staff, no procedure, and no action",
  ];
}
           if (beautySubtype === "nails") {
      return [
        "realistic premium nail studio commercial scene focused on elegant manicure or pedicure beauty atmosphere, polished nail-care setting, refined lighting, premium studio interior detail, and advertising composition, with no manicure procedure happening in frame",
        "clean cinematic nail beauty ad shot with believable nail studio interior, beautiful finished groomed hands, nail detail, premium feminine aesthetic, and realistic salon atmosphere, with no hand applying polish, no fingers smearing product, and no unrealistic tool use",
        "believable closing nail-commercial shot in a manicure or pedicure studio setting, elegant and realistic, focused on finished nail beauty detail, refined mood, premium interior atmosphere, and ad-style visual polish, with no text",
      ];
    }

    if (beautySubtype === "massage") {
  return [
    "realistic premium massage studio commercial scene focused on calm wellness atmosphere, elegant treatment room interior, soft lighting, spa-like relaxation mood, clean towels, refined surfaces, and one adult client lying face down on a massage table in a natural relaxed position, with no therapist in frame",
    "clean cinematic massage ad shot with believable wellness studio interior, treatment bed details, relaxing premium atmosphere, and one adult client lying on the stomach (face down) on the massage table, with stable natural posture, no unnatural body positions, and no staff interaction",
    "believable closing massage-commercial shot in a massage or wellness studio setting, elegant and realistic, focused on calm ambience, refined mood, premium treatment-room atmosphere, and one relaxed client lying face down, with no therapist, no procedure, and no action",
  ];
}

    if (beautySubtype === "makeup") {
      return [
        "realistic premium makeup studio commercial scene focused on elegant beauty styling atmosphere, refined vanity or makeup station details, soft cinematic lighting, polished cosmetics mood, and premium advertising composition",
        "clean cinematic makeup beauty ad shot with believable beauty studio interior, refined facial beauty detail, premium feminine aesthetic, elegant finished makeup look, and realistic commercial atmosphere, without unrelated salon procedures",
        "believable closing makeup-commercial shot in a beauty or makeup studio setting, elegant and realistic, focused on refined facial detail, polished glamour mood, premium interior atmosphere, and ad-style visual polish, with no text",
      ];
    }
    return [
      "realistic premium beauty studio commercial scene showing a multi-service beauty environment with elegant interior detail, soft lighting, refined atmosphere, and a balanced beauty advertising composition. Show visual variety across beauty categories such as styled hair, finished manicure, and fresh glowing facial beauty, without focusing on only one service",
      "clean cinematic beauty ad shot with believable studio interior, premium feminine aesthetic, and quick distinct beauty-focused visuals that suggest hair, nails, and skincare as separate beauty highlights, with no staff interaction and no one performing a procedure",
      "believable closing beauty-commercial shot in a mixed beauty studio setting, elegant and realistic, focused on premium ambience, refined mood, multi-service beauty identity, and ad-style visual polish, showing a general beauty brand feeling instead of a single treatment scene, with no text",
    ];

      }
         if (looksLikePlaceBusiness) {
    return [
      "realistic premium business environment showing the interior, exterior, atmosphere, decor, textures, and service setting, with adult people appearing naturally in the space",
      "clean cinematic view of the business space or location details, with realistic light and subtle adult human presence",
      "believable closing shot of the place and ambience, elegant and realistic, without text",
    ];
  }

  if (looksLikeProduct) {
    return [
      "realistic premium product-focused commercial footage showing the actual product category clearly in a believable environment, without turning it into a fake futuristic object",
      "clean close product detail with realistic materials, textures, and commercial styling",
      "authentic closing product beauty shot in a realistic setting with subtle cinematic motion",
    ];
  }

  return [
    "realistic business-related commercial environment connected to the brand, showing place, atmosphere, surfaces, materials, or spatial detail",
    "clean believable visual detail that suggests the service or offer through environment and mood",
    "simple realistic closing scene showing business atmosphere or result mood, without text",
  ];
};

const sceneDirections = buildScenesFromText(
  visualHeadline,
  visualCaption,
  visualBusiness
);

const visualDirection = sceneDirections[0] || "";
const contextForType = [visualHeadline, visualCaption, visualBusiness]
  .filter(Boolean)
  .join(". ")
  .toLowerCase();
const mainCategory = detectMainCategory(contextForType);
const beautySubtype = detectBeautySubtype(contextForType);
const leisureSubtype = detectLeisureSubtype(contextForType);

const looksLikeEnvironmentService = mainCategory === "technical_service";
const looksLikeAutoService = mainCategory === "auto_service";
const looksLikeFitness = mainCategory === "fitness";
const looksLikePharmacyHealth = mainCategory === "pharmacy_medical_retail";
const looksLikePoolSpaLeisure = mainCategory === "pool_spa_leisure";
const looksLikeFoodPlace = mainCategory === "food_place";
const looksLikeNightlife = mainCategory === "nightlife";
const looksLikePetBusiness = mainCategory === "pet_business";
const looksLikeBeautySalon = mainCategory === "beauty";
const looksLikeElectronicsStore = mainCategory === "electronics_store";
const looksLikeFashionRetail = mainCategory === "fashion_retail";
const looksLikeHospitalityRealEstate =
  mainCategory === "hospitality_real_estate";
const looksLikePlaceBusiness =
  mainCategory === "food_place" ||
    mainCategory === "nightlife" ||
  mainCategory === "pet_business" ||
  mainCategory === "pool_spa_leisure" ||
  mainCategory === "electronics_store" ||
  mainCategory === "fashion_retail" || 
  mainCategory === "hospitality_real_estate" ||
  mainCategory === "general_place_business";
const looksLikeProduct = mainCategory === "product";
const leisureSubjectInstruction =
  leisureSubtype === "aquapark"
    ? "Show a realistic premium aquapark commercial in a clearly outdoor water-park environment. Focus on open-air pools, water slides, sunny weather, joyful family leisure mood, splashing water, dynamic summer atmosphere, and believable aquapark architecture. If people appear, they should look like realistic families or children enjoying the water park naturally. Do not switch to indoor spa, pharmacy, clinic, medical retail, beauty salon procedure, or gym."
    : leisureSubtype === "spa_relax"
    ? "Show a realistic premium spa or wellness commercial. Focus on calm elegant indoor relaxation atmosphere, refined surfaces, ambient lighting, believable spa environment, premium resort mood, and peaceful hospitality visuals. Do not switch to aquapark, pharmacy, clinic, medical retail, beauty salon procedure, or gym."
    : "Show a realistic premium pool commercial. Focus on believable pool environment, clean water, pool architecture, refined surfaces, ambient lighting, premium resort mood, and calm hospitality visuals. Prefer outdoor or resort-style pool atmosphere unless the prompt clearly suggests indoor pool. Do not switch to pharmacy, clinic, medical retail, beauty salon procedure, or gym.";

const beautySubjectInstruction=
  beautySubtype === "hair"
    ? "Show a realistic premium hair salon commercial. Focus on beautiful healthy styled hair, elegant salon interior, mirrors, soft lighting, refined beauty atmosphere, and polished advertising composition. Do not show skincare treatment rooms, massage rooms, manicure tables, pharmacy interiors, street scenes, strange tools, or unrelated equipment. Never show haircut process, styling in progress, or staff working in frame. Prefer finished result, salon atmosphere, mirror shots, hair movement, and realistic beauty close-ups."
: beautySubtype === "skincare"
? "Show a realistic premium skincare commercial in an elegant cosmetic studio environment. Focus on healthy glowing skin, refined interior, product setup, towels, equipment, lighting, and overall beauty atmosphere. Show only one elegant adult female beauty model with clear natural skin and calm facial expression. The model must remain static and must not interact with anything. No cosmetician, no client-service interaction, no staff, no procedure, no treatment, no hands near the face, and no product application. Only show a finished beauty look in a premium skincare setting."
    : beautySubtype === "nails"
    ? "Show a realistic premium manicure or pedicure commercial in an elegant nail studio environment. Focus on nail beauty, groomed hands, refined salon detail, polished interior, and premium advertising composition. Do not switch to hair salon, skincare room, massage room, or unrelated retail space. Do not show hands applying polish unless the brush, bottle, and polish are clearly realistic. Prefer finished manicure result, elegant hand poses, table styling, studio detail, and beauty close-ups instead of procedure action."
: beautySubtype === "massage"
? "Show a realistic premium massage or wellness commercial in an elegant treatment room or spa-style studio. Focus on calm ambience, relaxation mood, premium room detail, soft lighting, and believable wellness atmosphere. If a client is present, they must be lying face down on a massage table in a natural relaxed position. Avoid side-lying or unnatural poses. Do not show any massage therapist, staff member, hands-on treatment, bodywork, rubbing, pressing, or procedure in progress. Do not show strange movements, awkward body positions, or unrealistic interaction. Do not switch to hair salon, manicure table, pharmacy interior, or strange technical environment."
        : beautySubtype === "makeup"
    ? "Show a realistic premium makeup beauty commercial in an elegant beauty studio environment. Focus on refined facial beauty, polished finished makeup look, vanity or makeup station detail, soft cinematic lighting, and premium advertising composition. Do not switch to hair salon unless the prompt is actually about hair. Prefer finished beauty look and elegant face close-ups instead of makeup being applied in action."
        : looksLikeBeautySalon
    ? "Show a realistic premium multi-service beauty studio commercial. The visual must feel like a beauty studio with a balanced beauty identity and must not lock into only hair unless the prompt is specifically about hair. Show elegant interior detail, soft lighting, refined beauty atmosphere, and believable commercial composition. Present separate beauty highlights such as finished hair, finished nails, and fresh facial beauty as distinct visual moments. Do not show one continuous salon procedure. Do not show staff surrounding one client. Do not show multiple people touching the same person. Prefer quick service-variety beauty visuals and realistic environment details instead of procedures happening in frame."
    : "";
const subjectInstruction = looksLikeEnvironmentService
  ? "Create hyper-realistic, documentary-style pure nature footage related to underground water discovery. Show only real natural water and landscape: clean river, mountain stream, natural spring, small waterfall, traditional stone well, wet rocks, sand, soil, greenery, rural land, countryside or mountain terrain. It must look like real camera footage, not AI fantasy. No people at all. No human figures, no man, no woman, no workers, no magazines. No pipes, no drains, no water flowing from a pipe, no artificial fountain, no decorative water feature, no hole filled with water, no pit, no trench, no excavation, no construction site, no tools, no office, no shop, no pharmacy, no indoor space."
  : looksLikeAutoService
  ? "Show a realistic premium automotive service commercial in a clean garage, detailing studio, or car-service environment. Focus on vehicle detail, workshop atmosphere, tools, diagnostics mood, and believable professional automotive setting. Do not switch to gym, pharmacy, beauty salon, or restaurant."
  : looksLikeFitness
  ? "Show a realistic premium fitness commercial in a gym, workout studio, or training environment. Focus on athletic energy, believable exercise atmosphere, gym equipment, weights, cardio or strength-training setting, healthy strong adult models, and dynamic but realistic movement. Do not switch to pharmacy, clinic, medical retail, supplement store, beauty salon, or unrelated interior. Never show pharmacists, medicine shelves, retail counters, or pharmacy-like environment."
  : looksLikePharmacyHealth
  ? "Show a realistic pharmacy or health-focused commercial environment with clean shelves, medicine-related retail atmosphere, clinical cleanliness, organized counters, and trustworthy healthcare visual mood. Include adult people in a natural commercial interaction, such as pharmacist and client, with realistic appearance."
  : looksLikePoolSpaLeisure
  ? leisureSubjectInstruction
  : looksLikeFoodPlace
  ? "Show a realistic premium restaurant, cafe, or food-place commercial. Focus on warm hospitality atmosphere, elegant interior, believable food or drink presentation, table styling, ambient lighting, and authentic dining mood. Do not switch to pharmacy, gym, beauty salon, or unrelated retail."
  : looksLikeNightlife
  ? "Show a realistic premium nightlife commercial for a bar, lounge, or club. Focus on stylish drinks, ambient low light, elegant interior, believable evening energy, premium social mood, and entertainment atmosphere. Do not switch to restaurant daylight service, gym, pharmacy, or beauty salon."
  : looksLikePetBusiness
  ? "Show a realistic premium pet-business commercial. Focus on clean pet-friendly environment, pet products, shelves, grooming or care atmosphere, warm retail mood, and believable presence of pets only where natural. Do not switch to pharmacy, gym, or unrelated business interiors."
  : looksLikeBeautySalon
  ? beautySubjectInstruction
  : looksLikeElectronicsStore
  ? "Show a realistic premium electronics retail commercial in a modern tech-store or gadget-shop environment. Focus on smartphones, tablets, laptops, accessories, clean display counters, realistic device detail, elegant retail interior, and modern commercial atmosphere. Do not switch to pharmacy, gym, restaurant, beauty salon, or fake futuristic machinery."
  : looksLikeFashionRetail
  ? "Show a realistic premium fashion retail commercial in a boutique or showroom environment. Focus on clothing, accessories, materials, merchandising, elegant retail interior, and stylish commercial atmosphere. Do not switch to pharmacy, gym, restaurant, or beauty treatment room."
  : looksLikeHospitalityRealEstate
  ? "Show a realistic premium hospitality or property commercial. Focus on elegant room or property interior, architecture, decor, natural light, premium accommodation mood, and welcoming atmosphere. Do not switch to pharmacy, gym, restaurant kitchen, or beauty salon."
  : looksLikePlaceBusiness
  ? "Show the real business environment, interior, exterior, shelves, counters, decor, space, and atmosphere. Adult people may appear naturally in the setting."
  : looksLikeProduct
  ? "Show the actual product category clearly in a realistic commercial setting, without turning it into a fake futuristic object."
  : "Show realistic business-related environment and atmosphere connected to the brand.";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

let aiVideoVisualInstruction = subjectInstruction;
let aiVideoNegativeInstruction = "";

if (OPENAI_API_KEY) {
  try {
    const videoPlannerPrompt = `
You are a senior commercial video creative director.

Your job is to create a visual brief for a realistic vertical 9:16 social media ad video.

CRITICAL RULES:
- Read the business context carefully.
- Do NOT guess a different industry.
- Do NOT switch the business type.
- The video must visually match the exact business, service, product, offer, and audience from the text.
- If the context is a pet shop, show pet shop / pets / pet products, not restaurant.
- If the context is a course or academy, show training / classroom / workshop / adult students / instructor, not pharmacy.
- If the context is beauty, show the exact beauty service, not a generic salon.
- If the context is technical service, show realistic service-related environment, not random shops.
- If unsure, choose a neutral realistic scene directly connected to the words in the context.
- No text, no labels, no signage, no logos, no watermark in the generated video.

Return ONLY valid JSON:
{
  "visual_instruction": "",
  "negative_instruction": ""
}

Business context:
${visualContext}

Brand:
${compactBrand}

Business description:
${compactBusiness}

Post headline:
${compactHeadline}

Post caption:
${compactCaption}

Offer:
${compactOffer}
`;

    const plannerRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        temperature: 0.25,
        messages: [{ role: "user", content: videoPlannerPrompt }],
      }),
    });

    const plannerData = await plannerRes.json();
    const plannerText = plannerData?.choices?.[0]?.message?.content || "";

    if (plannerText) {
      const parsed = JSON.parse(plannerText);

      if (typeof parsed?.visual_instruction === "string") {
        aiVideoVisualInstruction = parsed.visual_instruction;
      }

      if (typeof parsed?.negative_instruction === "string") {
        aiVideoNegativeInstruction = parsed.negative_instruction;
      }
    }
  } catch (error) {
    console.error("VIDEO PLANNER FALLBACK:", error);
  }
}
const finalPrompt = videoImageUrl
  ? `
Cinematic vertical 9:16 commercial video.

Animate the uploaded image only.
The uploaded image is the only source of truth.

Preserve:
- same scene
- same environment
- same objects
- same composition
- same business category
- same visual mood

Allowed motion:
- slow premium camera push-in
- subtle parallax
- gentle natural light movement
- slight atmospheric movement
- soft depth movement
- realistic commercial camera feel

Forbidden:
- no new people
- no human figures if they are not already in the image
- no new objects
- no new room
- no scene change
- no second scene
- no storytelling
- no spa
- no massage room
- no salon
- no clinic
- no shop
- no restaurant
- no office
- no beach
- no pool
- no unrelated environment
- no text
- no logo
- no watermark

Make it feel premium, cinematic and alive, but keep the original image unchanged.
`
  : `
Vertical 9:16 realistic commercial video.
Show one single coherent real-world scene for the entire video.
The scene must be realistic and believable.
Humans may appear only if the scene represents a real business environment such as salon, pharmacy, retail, or service interaction. All people must look like realistic adult commercial models in a natural setting.
No text is allowed anywhere.
Business context: ${visualContext}.
The video must follow the AI visual brief below and must not switch to another business category.
AI visual brief: ${aiVideoVisualInstruction}
Visual direction: ${visualDirection}.
Prefer realistic advertising shots that directly match the business context, clean environment, believable detail, and elegant commercial close-ups.
Avoid any procedure action.
Do not show hands applying products unless the product and tool are clearly visible and physically correct.
If unsure, do not show application at all.
For mixed beauty studio category: show variety across separate beauty results such as hair, nails, and skincare as distinct ad-style visual moments. Do not show one person being actively worked on by staff. Do not show multiple people around one client.
For massage category: allow only one relaxed adult client lying face down on a massage table. No therapist, no staff, no touching, no procedure, and no interaction. If unsure, keep the client still and show room atmosphere only.
For pool and leisure category: match the exact subtype. Aquapark should look outdoor, sunny, open-air, and family-oriented with visible water slides. Spa should look calm, indoor, elegant, and relaxation-focused. Pool should look like a believable pool environment, not a pharmacy or clinic.
If unsure, do not show application at all.
Do not show unclear substances, melted textures, slime-like materials, fake cosmetic application, or hand interaction that looks anatomically wrong.
Do not invent product behavior, tools, or treatment materials.
No fake futuristic machinery.
No absurd invented devices.
No collage.
No storyboard.
No split-screen.
Natural realistic camera look.
`
  .replace(/\s+/g, " ")
  .trim();

const wanDuration =
  duration >= 15 ? "15" : duration >= 10 ? "10" : "5";
const beautyNegativePrompt =
  beautySubtype === "hair"
    ? "street scene, sidewalk, outdoor city, random street portrait, strange tool, strange device, unrelated equipment, chinese street scene, public walking scene, documentary look, industrial equipment, technical field work, terrain inspection, excavation, drilling machine, geophysical device, pharmacy shelves, supermarket, bakery, skincare treatment bed, facial procedure, nail table, massage room, manicure close-up"
: beautySubtype === "skincare"
? "cosmetician, beautician, therapist, staff, worker serving client, second person, multiple people, hands near face, fingers touching face, applying product, cream application, gel application, mask application, serum application, facial procedure, treatment in progress, wiping face, cleaning face, skincare action, weird skincare, slime, goo, foam, melted substance, interaction, service, demonstration, touching face, hand on face"
    : beautySubtype === "massage"
? "massage therapist, masseuse, staff member, worker, hands on body, rubbing back, pressing back, treatment in progress, massage action, bodywork, therapist-client interaction, side lying, face up position, awkward pose, unnatural body position, twisted body, floating body, unrealistic massage pose, strange interaction, weird movement, distorted anatomy, extra limbs, broken posture, sitting massage, standing massage, random touching, chaotic movement"
    : looksLikeBeautySalon
    ? "street scene, sidewalk, outdoor city, random street portrait, strange tool, strange device, unrelated equipment, chinese street scene, public walking scene, documentary look, industrial equipment, technical field work, terrain inspection, excavation, drilling machine, geophysical device, pharmacy shelves, supermarket, bakery, salon worker, employee, tutorial scene, training scene, staff-client interaction, salon procedure, multiple people touching one client, group around one client, hairdresser working on client, hairstylist touching hair, blow drying in progress, combing by staff, haircut process, one single continuous treatment scene, crowded salon action"
        : "";
const leisureNegativePrompt =
  leisureSubtype === "aquapark"
    ? "pharmacy shelves, medicine store, pharmacist, clinic reception, medical shop, drugstore, gym workout scene, beauty treatment procedure, restaurant dining table, nightclub crowd, car service garage, pharmacy interior, indoor spa room, massage table, treatment room, quiet indoor pool"
    : leisureSubtype === "spa_relax"
    ? "pharmacy shelves, medicine store, pharmacist, clinic reception, medical shop, drugstore, gym workout scene, beauty treatment procedure, restaurant dining table, nightclub crowd, car service garage, pharmacy interior, water slides, aquapark, splash zone, outdoor water park"
    : "pharmacy shelves, medicine store, pharmacist, clinic reception, medical shop, drugstore, gym workout scene, beauty treatment procedure, restaurant dining table, nightclub crowd, car service garage, pharmacy interior, water slides, aquapark";
const categoryNegativePrompt = looksLikeBeautySalon
  ? beautyNegativePrompt
  : looksLikeFitness
  ? "pharmacy shelves, medicine store, pharmacist, pharmacist uniform, retail counter, clinic reception, medical shop, medicine boxes, drugstore, optical shop, beauty salon, manicure table, massage room, facial treatment room, supermarket, bakery, random office, checkout counter, pharmacy interior"
  : looksLikeAutoService
  ? "gym equipment, pharmacy shelves, beauty salon, manicure table, facial treatment room, restaurant interior, cafe table, nightclub lighting"
  : looksLikeFoodPlace
  ? "gym equipment, pharmacy shelves, beauty salon procedure, car service garage, nightclub dance floor, pet grooming table"
  : looksLikeNightlife
  ? "daylight restaurant service, pharmacy shelves, gym equipment, beauty salon procedure, supermarket checkout, office reception"
  : looksLikePetBusiness
  ? "pharmacy shelves, gym equipment, nightclub dance floor, restaurant dining table, beauty salon procedure, car workshop"
  : looksLikePoolSpaLeisure
  ? leisureNegativePrompt
  : looksLikeFashionRetail
  ? "pharmacy shelves, gym equipment, restaurant kitchen, beauty treatment procedure, car workshop, nightclub dance floor"
  : looksLikeHospitalityRealEstate
  ? "pharmacy shelves, gym workout scene, beauty treatment procedure, car workshop, nightclub dance floor, supermarket checkout"
  : looksLikeEnvironmentService
  ? "person, people, human, man, woman, worker, sitting person, magazine, book, reading, clipboard, office, reception desk, pharmacy, clinic, shop, supermarket, cafe interior, restaurant interior, salon interior, spa, massage table, swimming pool, retail counter, indoor business space, pipe, water pipe, drain, sewer pipe, water flowing from pipe, artificial fountain, decorative water feature, hole, pit, puddle hole, water-filled hole, trench, excavation, construction site, bulldozer, excavator, machinery, dark cave, sewer, tunnel, fantasy landscape, surreal water, impossible water flow, water flowing into a hole, AI artifact, distorted rocks"
  : mainCategory !== "product" && mainCategory !== "fashion_retail"
  ? "smartphone close-up, phone product showcase, mobile device focus"
  : "";
const wanInput = {
  prompt: finalPrompt,
negative_prompt: [
  videoImageUrl
? "scene change, second scene, new location, different room, different environment, new people, extra people, human figure, man, woman, worker, therapist, model, new object, invented object, unrelated object, unrelated product, unrelated tools, spa, spa center, massage room, massage table, salon, beauty salon, clinic, pharmacy, restaurant, shop interior, office, pool, beach, hotel room, changing business category, changing topic, storytelling, action scene, interaction, text, words, letters, numbers, symbols, typography, title, caption, subtitle, logo, watermark, label, signage, split-screen, collage, storyboard"
    : "text, words, letters, numbers, symbols, typography, title, title card, caption, subtitle, slogan, signage, sign, label, logo, watermark, poster, billboard, packaging text, interface text, control panel, split-screen, collage, storyboard, triptych, fantasy, futuristic devices, fake machines, excavator, bulldozer, construction vehicle, decorative water feature, canal, trench, hole in ground, pit, excavation",
  videoImageUrl ? "" : categoryNegativePrompt,
  videoImageUrl ? "" : aiVideoNegativeInstruction,
]
        .filter(Boolean)
    .join(", "),
  seed: Math.floor(Math.random() * 1000000),
  duration: wanDuration,
  resolution: "720p",
  aspect_ratio: "9:16",
  multi_shots: false,
  enable_prompt_expansion: false,
};
fal.config({
  credentials: falKey,
});

const falEndpoint = videoImageUrl
  ? "wan/v2.6/image-to-video/flash"
  : "wan/v2.6/text-to-video";

const falInput = videoImageUrl
  ? {
      ...wanInput,
      image_url: videoImageUrl,
    }
  : wanInput;

const submitResult = await fal.queue.submit(falEndpoint, {
  input: falInput,
});
    return new Response(
      JSON.stringify({
        success: true,
        queued: true,
        fal_request_id:
          submitResult?.requestId ||
          submitResult?.request_id ||
          "",
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    const errorDetails =
      error && typeof error === "object"
        ? JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
        : null;

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: errorDetails,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});