
import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
type LayoutFamily =
  | "hero-left"
  | "centered-offer"
  | "split-layout"
  | "promo-heavy"
  | "bottom-card";

type OverlayStrength = "soft" | "medium" | "strong";
type SupportStyle = "chips" | "plain_list" | "mixed";
type OfferShape = "pill" | "circle";

type BannerPlan = {
  layout_family: LayoutFamily;
  headline: string;
  subtext: string;
  offer_badge: string;
  phone: string;
  support_lines: string[];
  cta: string;
  scene_intent: string;
  color_direction: string;
  mood: string;
  overlay_strength: OverlayStrength;
  accent_style: string;
  support_style: SupportStyle;
  offer_shape: OfferShape;
};
const buildScenePrompts = (plan: BannerPlan) => {
  const base = `
Realistic premium commercial photography.

Business context:
${plan.scene_intent}

Style:
${plan.mood}, ${plan.color_direction}

Rules:
- no text
- no logo
- no watermark
- no labels
- no numbers
- no typography
`.trim();

  return [
    `${base}

Scene 1:
Show the main service or product clearly in a realistic environment.`,

    `${base}

Scene 2:
Show the process, usage, or benefit in a believable commercial scene.`,

    `${base}

Scene 3:
Show a clean premium closing shot with strong visual appeal.`
  ];
};

type RequestBody = {
  description?: string;
  address?: string;
  offer?: string;
  discount?: string;
  price?: string;
  period?: string;
  phone?: string;
  exact_text?: string;
  extra_requirements?: string;
  logo_url?: string;
  image_url?: string;
  image_usage_mode?: string;
  design_mode?: string;
source?: string;
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
serve(async (req) => {
console.log("FUNCTION STARTED");

let shouldRefundCredits = false;
let refundUserId = "";
let refundActionType = "";
let refundCost = 0;
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// взимаме user от Authorization header, ако има
const authHeader = req.headers.get("Authorization") || "";
const token = authHeader.replace("Bearer ", "").trim();

const source = body?.source || "quick_banner";
console.log("GENERATE BANER SOURCE DEBUG:", {
  source,
  bodySource: body?.source,
  hasAuthHeader: Boolean(authHeader),
  hasToken: Boolean(token),
});

let user = null;
let userError = null;

if (token) {
  const authResult = await supabase.auth.getUser(token);
  user = authResult.data.user;
  userError = authResult.error;
}

const isGuestBrandBanner = source === "brand_banner" && !user;

if (!isGuestBrandBanner && (userError || !user)) {
  return new Response(
    JSON.stringify({ error: "Unauthorized", source }),
    { status: 401, headers: corsHeaders }
  );
}


// free режимът важи само за quick banner
if (source === "quick_banner" || source === "en_quick_banner") {
  const quickBannerCost = 2;

  const { data: hasCredits, error: creditError } = await supabase.rpc(
  "spend_action_credit",
  {
    p_user_id: user.id,
    p_action_type: "quick_banner",
    p_cost: quickBannerCost,
  }
);

  if (creditError || !hasCredits) {
    return new Response(
      JSON.stringify({
        error: "NO_CREDITS",
        message: "Безплатните банери са изчерпани.",
      }),
      { status: 402, headers: corsHeaders }
    );
  }
shouldRefundCredits = true;
refundUserId = user.id;
refundActionType = "quick_banner";
refundCost = quickBannerCost;
} else if (source === "brand_banner") {
  // brand banner вече е таксуван от frontend през spend-credit
  // позволяваме генерацията да продължи
} else {
  return new Response(
    JSON.stringify({
      error: "PAYMENT_REQUIRED",
      message: "Тази генерация изисква активен план.",
    }),
    { status: 402, headers: corsHeaders }
  );
}
console.log("BODY:", body);

    const {
      description,
      address,
      offer,
      discount,
      price,
      period,
      phone,
      exact_text,
      extra_requirements,
      image_url: input_image_url,
      image_usage_mode,
    } = body;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const clean = (value?: string) =>
      typeof value === "string" ? value.trim() : "";

    const normalizeSpaces = (value?: string) =>
      clean(value).replace(/\s+/g, " ").trim();

    const clampText = (value: string, max: number) => {
  const normalized = normalizeSpaces(value);
  if (!normalized) return "";
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}…`;
};

const downloadImageAsBlob = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to download input image: ${res.status}`);
  }

  return await res.blob();
};

const dedupeLines = (lines: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const normalized = normalizeSpaces(line).toLowerCase();
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalizeSpaces(line));
  }

  return result;
};

const normalizeForCompare = (value: string) =>
  normalizeSpaces(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

const isMeaningRepeated = (value: string, existing: string[]) => {
  const current = normalizeForCompare(value);
  if (!current) return true;

  return existing.some((item) => {
    const previous = normalizeForCompare(item);
    if (!previous) return false;

    return (
      previous === current ||
      previous.includes(current) ||
      current.includes(previous)
    );
  });
};

const exactLines = clean(exact_text)
  .split("\n")
  .map((line) => normalizeSpaces(line))
  .filter(Boolean);
    const safeDescription = normalizeSpaces(description);
    const safeAddress = normalizeSpaces(address);
    const safeOffer = normalizeSpaces(offer);
    const safeDiscount = normalizeSpaces(discount);
    const safePrice = normalizeSpaces(price);
    const safePeriod = normalizeSpaces(period);
    const safePhoneInput = normalizeSpaces(phone);
    const safeExactText = clean(exact_text);
    const safeExtraRequirements = clean(extra_requirements);
    const safeImageUrl = normalizeSpaces(input_image_url);
    let safeImageUsageMode = normalizeSpaces(image_usage_mode);

if (!["exact", "elements", "integrate", "auto"].includes(safeImageUsageMode)) {
  safeImageUsageMode = "integrate";
}

const hasExactText = Boolean(safeExactText);

    const extractPhone = (...sources: string[]) => {
      for (const source of sources) {
        const text = source || "";
        const match = text.match(
          /(?<!\d)(?:\+?\d[\d\s\-()]{7,}\d)(?!\d)/
        );

        if (!match) continue;

        const raw = normalizeSpaces(match[0]);
        const digitsOnly = raw.replace(/[^\d+]/g, "");

        if (digitsOnly.replace(/\D/g, "").length < 8) continue;

        return raw;
      }

      return "";
    };

    const safePhone =
      safePhoneInput ||
      extractPhone(safeExactText, safeDescription, safeExtraRequirements);

    const derivedOfferFromText = (() => {
      if (safeOffer) return safeOffer;

      const text = [safeExactText, safeDescription].filter(Boolean).join(" ");
      if (!text) return "";

      const patterns = [
        /поръчк[аи]\s+на\s+торта/gi,
        /дамско\s+подстригване/gi,
        /лазерна\s+епилация/gi,
        /курс\s+за\s+соларни\s+специалисти/gi,
        /минерална\s+вода/gi,
        /доставка\s+на\s+вода/gi,
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[0]) return normalizeSpaces(match[0]);
      }

      return "";
    })();

    const safeOfferResolved = safeOffer || derivedOfferFromText;

    const extractGiftOrBonusLine = (...sources: string[]) => {
      const joined = sources.filter(Boolean).join(" ");
      if (!joined) return "";

      const normalized = normalizeSpaces(joined);

      const patterns = [
        /(при|със|с)\s+поръчк[аи][^.!?\n]{0,90}(получават|получаваш|получавате|вземи|получи)[^.!?\n]{0,90}/i,
        /(подарък[^.!?\n]{0,90})/i,
        /(безплат[^.!?\n]{0,90})/i,
        /(бонус[^.!?\n]{0,90})/i,
        /(доставка[^.!?\n]{0,90})/i,
      ];

      for (const pattern of patterns) {
        const match = normalized.match(pattern);
        if (match?.[0]) return clampText(match[0], 88);
      }

      return "";
    };

    const derivedGiftLine = extractGiftOrBonusLine(
      safeExactText,
      safeDescription,
      safeExtraRequirements
    );

    const factualOfferBadge = [safeDiscount || safePrice, safePeriod]
      .filter(Boolean)
      .join(" • ")
      .trim();

    const hasInputPercent = /\d+\s*%/.test(
      [safeDiscount, safePrice, safeExactText, safeDescription]
        .filter(Boolean)
        .join(" ")
    );

    const hasInputPrice = /\d+\s*(лв\.?|лева?|eur|€)/i.test(
      [safeDiscount, safePrice, safeExactText, safeDescription]
        .filter(Boolean)
        .join(" ")
    );

    const hasAnyInputNumber = /\d/.test(
      [safeDiscount, safePrice, safePhone, safeExactText, safeDescription]
        .filter(Boolean)
        .join(" ")
    );

    const allowedLayouts: LayoutFamily[] = [
      "hero-left",
      "centered-offer",
      "split-layout",
      "promo-heavy",
      "bottom-card",
    ];

    const allowedOverlayStrengths: OverlayStrength[] = [
      "soft",
      "medium",
      "strong",
    ];

    const allowedSupportStyles: SupportStyle[] = [
      "chips",
      "plain_list",
      "mixed",
    ];

    const allowedOfferShapes: OfferShape[] = ["pill", "circle"];

    const escapeForPrompt = (value: string) =>
      value.replaceAll("\\", "\\\\").replaceAll(`"`, '\\"');

    const removePromptLikeFragments = (value: string) => {
      const bannedPatterns = [
        /scene:/gi,
        /requirements:/gi,
        /ultra realistic/gi,
        /professional lighting/gi,
        /shallow depth of field/gi,
        /modern commercial photography/gi,
        /no text/gi,
        /no logo/gi,
        /no watermark/gi,
        /facebook ads designer/gi,
        /create a realistic advertising photo/gi,
        /input:/gi,
        /format:/gi,
      ];

      let result = value;
      for (const pattern of bannedPatterns) {
        result = result.replace(pattern, "");
      }

      return normalizeSpaces(result);
    };

    const looksLikePhoneOnly = (value: string) => {
      if (!value) return false;
      const stripped = value.replace(/[^\d+]/g, "");
      return stripped.length >= 8 && stripped.length <= 16;
    };

    const topicSource = [
      safeDescription,
      safeOfferResolved,
      safeExactText,
      safeExtraRequirements,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const isBeauty = /подстриг|козмет|beauty|салон|студио|hair|lash|brow/.test(
      topicSource
    );
    const isFood = /торта|сладкар|dessert|pastry|cake|храна|сок|напит/.test(
      topicSource
    );
    const isWater = /вода|mineral|минерал|devin|доставка на вода/.test(
      topicSource
    );
    const isEducation = /курс|обучен|сертификат|обучение|academy|академ/.test(
      topicSource
    );

    const safeHeadlineFallback = (() => {
      if (exactLines[0] && !looksLikePhoneOnly(exactLines[0])) {
        return clampText(exactLines[0], 64);
      }

      if (safeOfferResolved) return clampText(safeOfferResolved, 64);

      if (derivedGiftLine) return clampText(derivedGiftLine, 64);

      if (safeDescription) return clampText(safeDescription, 64);

      return "Професионална услуга";
    })();

    const safeSubtextFallback = (() => {
      if (exactLines[1] && !looksLikePhoneOnly(exactLines[1])) {
        return clampText(exactLines[1], 88);
      }

      if (derivedGiftLine) return clampText(derivedGiftLine, 88);

      if (safeOfferResolved && safeAddress) {
        return clampText(`${safeOfferResolved} • ${safeAddress}`, 88);
      }

      if (safeOfferResolved) return clampText(safeOfferResolved, 88);
      if (safePeriod) return clampText(safePeriod, 88);
      if (safeAddress) return clampText(safeAddress, 88);

      return "";
    })();

    const supportFallbackLines = (() => {
      const lines: string[] = [];

      if (exactLines.length > 2) {
        lines.push(
          ...exactLines.filter((line) => !looksLikePhoneOnly(line)).slice(2, 5)
        );
      }

      if (safeAddress) {
        lines.push(safeAddress);
      }

      if (derivedGiftLine && !lines.some((x) => x.includes(derivedGiftLine))) {
        lines.push(derivedGiftLine);
      }

      if (safePeriod && !lines.some((x) => x.includes(safePeriod))) {
        lines.push(safePeriod);
      }

      if (
        safeOfferResolved &&
        !lines.some((x) =>
          x.toLowerCase().includes(safeOfferResolved.toLowerCase())
        )
      ) {
        lines.push(safeOfferResolved);
      }

      return dedupeLines(
        lines
          .map((line) => clampText(line, 52))
          .filter(Boolean)
      ).slice(0, 3);
    })();
const ctaFallback = "";

const isEnglishBanner = source === "en_quick_banner";
const bannerLanguageName = isEnglishBanner ? "English" : "Bulgarian";

const visibleTextLanguageRules = isEnglishBanner
  ? `
ENGLISH BANNER MODE:
- All visible banner text must be in English only.
- Do not use Bulgarian words.
- Do not use Cyrillic text.
- Do not translate the user input into Bulgarian.
- Use the user's English offer, discount, period, phone and address as the source of truth.
- Keep the layout clean and not overcrowded.
- Use maximum 3 short visible text blocks plus phone/address if provided.
- Make the headline large, short and readable.
- Make supporting text smaller and clearly separated.
- Prefer clean premium ad composition, not too many text chips.
`
  : `
BULGARIAN BANNER MODE:
- All visible banner text must be in Bulgarian.
- Use natural Bulgarian marketing copy.
`;

const exactModeInstruction = hasExactText
          ? `
EXACT TEXT MODE:
- exact_text is the PRIMARY source for banner copy.
- Preserve the user's intended meaning very closely.
- Use exact_text first for headline, subtext and support_lines.
- You may shorten, split, clean and improve wording for readability.
- Do NOT replace the user's message with a totally different slogan.
- Do NOT drift away from the meaning of exact_text.
- If exact_text already contains the core offer, keep that core offer central.
- Prefer extracting:
  - headline from line 1 or strongest phrase
  - subtext from line 2 or next supporting phrase
  - support_lines from remaining useful phrases
- Only add small supportive wording when needed for fluency.
`
      : `
CREATIVE MODE:
- There is NO exact_text.
- You should create the banner copy yourself based on the provided facts.
- Be more creative, persuasive and ad-oriented.
- Make the service and offer clearer than the raw input.
- You may invent phrasing and marketing wording, but not facts.
- Write like a strong local business ad in ${bannerLanguageName}.
- Make it feel sellable, not generic.
- The headline should be punchy and not too long.
- The subtext should clearly explain the offer.
- support_lines should add useful selling details like gift, address, period, delivery, how to order.
`;

    const planningPrompt = `
${
  isEnglishBanner
    ? "You are a senior English-speaking performance creative director for local business Facebook and Instagram ads."
    : "You are a senior Bulgarian-speaking performance creative director for local business Facebook and Instagram ads."
}

Return ONLY valid JSON. No markdown. No explanation.

${visibleTextLanguageRules}
Your job:
Create a banner plan that balances:
1) factual safety
2) stronger ad copy
3) visual variation
4) text composition variety
HEADLINE QUALITY RULES:

- Never produce a headline that ends with weak dangling words like:
  "само", "за", "с", "на", "от", "до"
- Never produce a headline that is incomplete, vague, or sounds cut off
- Never use "само" unless it is immediately followed by a meaningful offer, price, deadline, or quantity
- The headline must clearly name the actual service or product
- The headline must sound like finished ad copy, not like a fragment from the user's prompt

SERVICE / PRODUCT SPECIFICITY RULES:

- The generated visual must clearly show the advertised service or product
- If the ad is for a beauty service, the image must visually emphasize the exact beauty result
- For "френски маникюр" / "French manicure", the image must clearly show close-up elegant nails with visible French manicure tips
- Do not generate a generic beauty image when the request is about a specific beauty service
- The image should visually confirm the promise from the text

COPYWRITING RULES:
- Never use generic headline text like "Рекламна оферта", "Специална оферта", "Нова оферта" or "Промо оферта". The headline must describe the actual business/service/offer from the user input.
- Prefer headlines like:
  "Френски маникюр на специална цена"
  "Елегантен френски маникюр за безупречна визия"
  "Перфектен френски маникюр този месец"
- Avoid headlines like:
  "Френски маникюр само!"
  "Маникюр за..."
  "Красота само..."

CRITICAL FACT RULES:
- Never invent discounts, percentages, prices, phone numbers, addresses, periods, or offer facts.
- Never output a percentage unless the input explicitly contains a percentage.
- Never output a price unless the input explicitly contains a price.
- Never invent a phone number.
- Never invent a new offer.
- Do not copy raw prompt fragments into banner copy.
- If a phone exists in input, use that same phone only.
- If there is a gift/bonus in the input, you may highlight it, but do not change it.
Also return visual styling decisions for the frontend:

- headline_style: choose one of ["compact", "editorial", "impact"]
- text_align: choose one of ["left", "center"]
- phone_style: choose one of ["pill", "card"]
- badge_style: choose one of ["rounded", "circle"]

Rules:
- Vary these choices naturally between generations
- Match them to the scene, business type, and offer intensity
- Do not always return the same combination
- Use "impact" for strong promo/service ads
- Use "editorial" for cleaner premium looks
- Use "compact" when headline is long

COPY RULES:

- Do NOT copy the user's request literally into the banner text.
- Do NOT use phrases like "make a banner", "create a banner", "ad for", "banner for", or instruction-like wording in headline, subtext, support_lines, or offer_badge.
- Treat the user's description as source meaning, not final ad copy.

- Never turn constraints or ins- Rewrite the text into short, natural, sales-oriented ${bannerLanguageName} marketing copy.tructions into visible banner text.
- If the user says things like "without people", "use only the machine", "do not use background", these are visual instructions only and must never appear in headline, subtext, support_lines, or offer_badge.
- Avoid repeating the same information across headline, subtext, offer_badge, and support_lines.
- If price or discount exists, show it only once as the main promo element unless a second mention is clearly necessary.
- Headline must be rewritten ad copy, not copied prompt text.
- If there is a strong offer (like 2 for 1, discount, free item), ALWAYS prioritize it in the headline.
- The headline MUST highlight the main offer, not generic branding.
- Avoid generic phrases like "Вкусна неделя", "Нашите продукти".
- If there is a strong offer (like 2 for 1, discount, free item), ALWAYS prioritize it in the headline.
- The headline MUST highlight the main offer, not generic branding.
- Avoid generic phrases like "Вкусна неделя", "Нашите продукти".
- Focus on conversion, not decoration.
- Use numbers visually when present (2 for 1, % etc.)
- Numbers should feel dominant in the composition.
- You ARE allowed to improve wording, compress the message, and make it more persuasive.
- Keep text commercially strong, readable, and natural in ${bannerLanguageName}.
- headline: strong and punchy, max 64 chars
- subtext: useful support line, max 88 chars
- support_lines: up to 3 short lines, max 52 chars each
- cta: short CTA, max 22 chars
- offer_badge: only from actual discount/price/period data
- phone: only from input phone
- Make the offer clear fast.
- Avoid dry generic wording.

${exactModeInstruction}

VISUAL RULES:
- Vary layout_family, color_direction, mood, overlay_strength, accent_style
- Vary support_style and offer_shape too
- The result should not feel repetitive
- It should feel like a real local business ad
- Avoid infographic clutter
- For food / pastry / dessert / bakery offers, prefer warmer premium appetizing direction
- For beauty offers, prefer elegant premium direction
- For education / courses, prefer clear trust-building direction
- For water / beverage delivery, prefer fresh clean direction

TEXT COMPOSITION RULES:
- support_style can be:
  - "chips" = all support lines work as soft visual labels
  - "plain_list" = support lines should read as a cleaner bullet list
  - "mixed" = one line can be more prominent and others softer
- offer_shape can be:
  - "pill" = classic horizontal badge
  - "circle" = circular promo accent
- Use "circle" only when the offer_badge is short and visually suitable
- Do not force circle if the badge text is long
- Do not make every banner look like the same template

Allowed layout_family values:
hero-left | centered-offer | split-layout | promo-heavy | bottom-card

Allowed overlay_strength values:
soft | medium | strong

Allowed support_style values:
chips | plain_list | mixed

Allowed offer_shape values:
pill | circle

Input facts:
{
  "description": "${escapeForPrompt(safeDescription)}",
  "offer": "${escapeForPrompt(safeOfferResolved)}",
  "discount": "${escapeForPrompt(safeDiscount)}",
  "price": "${escapeForPrompt(safePrice)}",
  "period": "${escapeForPrompt(safePeriod)}",
  "phone": "${escapeForPrompt(safePhone)}",
  "address": "${escapeForPrompt(safeAddress)}",
  "exact_text": "${escapeForPrompt(safeExactText)}",
  "extra_requirements": "${escapeForPrompt(safeExtraRequirements)}",
  "derived_bonus_or_gift_line": "${escapeForPrompt(derivedGiftLine)}",
  "image_url_present": "${safeImageUrl ? "yes" : "no"}",
  "image_usage_mode": "${escapeForPrompt(safeImageUsageMode)}"
}

SCENE RULES:
- scene_intent must describe only the visual scene/background
- no text in image
- no logo in image
- no watermark
- realistic photo direction only
- reflect extra requirements visually when appropriate
- if the service is food or pastry, show an appetizing realistic commercial food scene
- if the service is water delivery, show clean freshness and believable product-commercial direction
- if there is a user image, respect the image usage mode

Return JSON exactly in this shape:
{
  "layout_family": "",
  "headline": "",
  "subtext": "",
  "offer_badge": "",
  "phone": "",
  "support_lines": [],
  "cta": "",
  "scene_intent": "",
  "color_direction": "",
  "mood": "",
  "overlay_strength": "",
  "accent_style": "",
  "support_style": "",
  "offer_shape": ""
}
`;

    const planRes = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: "gpt-4.1",
    messages: [{ role: "user", content: planningPrompt }],
    temperature: hasExactText ? 0.45 : 0.9,
  }),
});
    const planData = await planRes.json();
    const text = planData?.choices?.[0]?.message?.content;

    let rawPlan: Partial<BannerPlan> = {};

if (!text) {
  console.error("No planning response:", planData);

  rawPlan = {
    layout_family: "hero-left",
    headline: "",
    subtext: "",
    offer_badge: "",
    phone: "",
    support_lines: [],
    cta: "",
    scene_intent: "",
    color_direction: "",
    mood: "",
    overlay_strength: "medium",
    accent_style: "",
    support_style: "chips",
    offer_shape: "pill",
  };
} 
else {
  try {
    rawPlan = JSON.parse(text);
  } catch {
    console.error("PLAN RAW:", text);
    throw new Error("Invalid plan JSON");
  }
}    const sanitizeLayoutFamily = (value?: string): LayoutFamily => {
      const normalized = normalizeSpaces(value).toLowerCase();

      if (allowedLayouts.includes(normalized as LayoutFamily)) {
        return normalized as LayoutFamily;
      }

      if (normalized.includes("center")) return "centered-offer";
      if (normalized.includes("split")) return "split-layout";
      if (normalized.includes("promo")) return "promo-heavy";
      if (normalized.includes("bottom") || normalized.includes("card")) {
        return "bottom-card";
      }

      return "hero-left";
    };

    const sanitizeOverlayStrength = (value?: string): OverlayStrength => {
      const normalized = normalizeSpaces(value).toLowerCase();

      if (allowedOverlayStrengths.includes(normalized as OverlayStrength)) {
        return normalized as OverlayStrength;
      }

      if (normalized.includes("strong")) return "strong";
      if (normalized.includes("soft")) return "soft";
      return "medium";
    };

    const sanitizeSupportStyle = (value?: string): SupportStyle => {
      const normalized = normalizeSpaces(value).toLowerCase();

      if (allowedSupportStyles.includes(normalized as SupportStyle)) {
        return normalized as SupportStyle;
      }

      if (normalized.includes("plain")) return "plain_list";
      if (normalized.includes("mix")) return "mixed";
      return isWater ? "plain_list" : "chips";
    };

    const sanitizeOfferShape = (value?: string): OfferShape => {
      const normalized = normalizeSpaces(value).toLowerCase();

      if (allowedOfferShapes.includes(normalized as OfferShape)) {
        return normalized as OfferShape;
      }

      if (normalized.includes("circle")) return "circle";
      return "pill";
    };

    const sanitizeHeadline = (value?: string) => {
      const candidate = removePromptLikeFragments(normalizeSpaces(value));

      if (hasExactText && exactLines[0] && !looksLikePhoneOnly(exactLines[0])) {
        if (!candidate) return clampText(exactLines[0], 64);
        return clampText(candidate, 64);
      }

      const source = candidate || safeHeadlineFallback;
      return clampText(source, 64);
    };

    const sanitizeSubtext = (value?: string) => {
      const candidate = removePromptLikeFragments(normalizeSpaces(value));

      if (hasExactText && exactLines[1] && !looksLikePhoneOnly(exactLines[1])) {
        if (!candidate) return clampText(exactLines[1], 88);
        return clampText(candidate, 88);
      }

      const source = candidate || safeSubtextFallback;
      return clampText(source, 88);
    };

    const sanitizeOfferBadge = (value?: string) => {
      const candidate = removePromptLikeFragments(normalizeSpaces(value));

      if (!factualOfferBadge) return "";
      if (!candidate) return clampText(factualOfferBadge, 40);

      if (!hasInputPercent && /\d+\s*%/.test(candidate)) {
        return clampText(factualOfferBadge, 40);
      }

      if (!hasInputPrice && /\d+\s*(лв\.?|лева?|eur|€)/i.test(candidate)) {
        return clampText(factualOfferBadge, 40);
      }

      if (!hasAnyInputNumber && /\d/.test(candidate)) {
        return clampText(factualOfferBadge, 40);
      }

      return clampText(candidate, 40);
    };

    const sanitizePhone = (value?: string) => {
      if (!safePhone) return "";
      const candidate = normalizeSpaces(value);
      if (!candidate) return safePhone;
      if (candidate !== safePhone) return safePhone;
      return clampText(candidate, 24);
    };

    const sanitizeSupportLines = (value?: string[]) => {
      const modelLines = Array.isArray(value)
        ? value
            .map((line) => removePromptLikeFragments(normalizeSpaces(line)))
            .filter(Boolean)
            .map((line) => clampText(line, 52))
            .filter(Boolean)
        : [];

      if (hasExactText) {
        const exactSupport = exactLines
          .filter((line) => !looksLikePhoneOnly(line))
          .slice(2, 5)
          .map((line) => clampText(line, 52))
          .filter(Boolean);

        return dedupeLines([...exactSupport, ...modelLines, ...supportFallbackLines]).slice(0, 3);
      }

      const merged = dedupeLines([...modelLines, ...supportFallbackLines]);
      return merged.slice(0, 2);
    };

    const sanitizeCta = () => {
  return "";
};
    const sanitizeSceneIntent = (value?: string) => {
      const candidate = removePromptLikeFragments(normalizeSpaces(value));

      if (candidate) {
        return clampText(candidate, 260);
      }

      const sceneFallbackParts = [
        safeDescription
          ? `Realistic commercial scene inspired by: ${safeDescription}.`
          : "",
        safeExtraRequirements
          ? `Visual requirements: ${safeExtraRequirements}.`
          : "",
        derivedGiftLine
          ? `Visually hint at the bonus or gift naturally without text: ${derivedGiftLine}.`
          : "",
        safeImageUrl
          ? safeImageUsageMode === "exact"
            ? "A user-provided image should be preserved as closely as possible."
            : safeImageUsageMode === "integrate"
            ? "A user-provided image should be integrated naturally into the scene."
            : "A user-provided image may be used intelligently if appropriate."
          : "",
        "No text, no logos, no watermark, realistic ad photography.",
      ]
        .filter(Boolean)
        .join(" ");

      return clampText(sceneFallbackParts, 260);
    };

    const sanitizeStyleField = (
      value: string | undefined,
      fallback: string,
      max: number
    ) => {
      const candidate = removePromptLikeFragments(normalizeSpaces(value));
      return clampText(candidate || fallback, max);
    };

    const preliminaryOfferBadge = sanitizeOfferBadge(rawPlan.offer_badge);
    let sanitizedOfferShape = sanitizeOfferShape(rawPlan.offer_shape);
    const forcedOfferBadge =
    preliminaryOfferBadge ||
    (safeOfferResolved.includes("2") ? "2 за 1" : "");

    if (!preliminaryOfferBadge) {
      sanitizedOfferShape = "pill";
    }

    if (preliminaryOfferBadge && preliminaryOfferBadge.length > 22) {
      sanitizedOfferShape = "pill";
    }

    const plan: BannerPlan = {
      layout_family: sanitizeLayoutFamily(rawPlan.layout_family),
      headline: sanitizeHeadline(rawPlan.headline),
      subtext: sanitizeSubtext(rawPlan.subtext),
      offer_badge: forcedOfferBadge,
      phone: sanitizePhone(rawPlan.phone),
      support_lines: sanitizeSupportLines(rawPlan.support_lines),
      cta: sanitizeCta(rawPlan.cta),
      scene_intent: sanitizeSceneIntent(rawPlan.scene_intent),
      color_direction: sanitizeStyleField(
  rawPlan.color_direction,
  isFood
    ? [
        "bright natural daylight with clean neutral tones",
        "soft pastel dessert palette with airy light",
        "rich premium dessert tones with balanced contrast",
        "clean bakery styling with white and cream tones",
        "editorial food photography with fresh natural color"
      ][Math.floor(Math.random() * 5)]
    : isWater
    ? [
        "fresh cool blue tones with clean contrast",
        "neutral clean outdoor tones with realistic light",
        "soft natural earth tones with balanced contrast"
      ][Math.floor(Math.random() * 3)]
    : [
        "balanced commercial tones with contrast",
        "clean neutral tones with natural daylight",
        "editorial realistic tones with soft contrast",
        "fresh natural tones with depth"
      ][Math.floor(Math.random() * 4)],
  90
),
mood: sanitizeStyleField(
        rawPlan.mood,
        hasExactText
          ? "controlled, premium, readable, realistic"
          : isWater
          ? "fresh, clean, trustworthy, realistic"
          : "realistic, clear, commercially strong",
        90
      ),
      overlay_strength:
  Math.random() > 0.6
    ? "soft"
    : sanitizeOverlayStrength(rawPlan.overlay_strength),
      accent_style: sanitizeStyleField(
        rawPlan.accent_style,
        hasExactText
          ? "clean premium accents with readable hierarchy"
          : "clean premium accents with variation and readable hierarchy",
        90
      ),
      support_style: sanitizeSupportStyle(rawPlan.support_style),
      offer_shape: sanitizedOfferShape,
    };

    const usedCopyParts: string[] = [];

    if (plan.headline) {
      usedCopyParts.push(plan.headline);
    }

    if (plan.subtext && isMeaningRepeated(plan.subtext, usedCopyParts)) {
      plan.subtext = "";
    }

    if (plan.subtext) {
      usedCopyParts.push(plan.subtext);
    }

    if (plan.offer_badge && isMeaningRepeated(plan.offer_badge, usedCopyParts)) {
      plan.offer_badge = "";
      plan.offer_shape = "pill";
    }

    if (plan.offer_badge) {
      usedCopyParts.push(plan.offer_badge);
    }

    plan.support_lines = plan.support_lines.filter((line) => {
      if (isMeaningRepeated(line, usedCopyParts)) return false;
      usedCopyParts.push(line);
      return true;
    });

    const randomStyleSeed = Math.floor(Math.random() * 10000);
const imagePrompt = `
${
  safeImageUrl
    ? `Create a realistic, premium, scroll-stopping square advertising image by using the uploaded image as the main visual source.

PRIMARY TASK:
Use the uploaded image as the base reference and integrate its real subject/product/object into a premium advertising composition.

The uploaded image must remain visually recognizable.
Do not generate a new unrelated product, object, model, room, service, or scene.

SCENE DIRECTION:
${plan.scene_intent}`
    : `Create a realistic, premium, scroll-stopping square advertising image.

SCENE:
${plan.scene_intent}`
}

${
  safeImageUrl && safeImageUsageMode === "exact"
    ? `REFERENCE IMAGE INSTRUCTION:
A user has provided an image.
Use the uploaded image in STRICT 1:1 reference mode.
- Preserve the main subject, product, person, object, colors, identity, shape, pose, and composition as closely as possible
- Do not replace the subject
- Do not invent a different product, person, room, background, service, or object
- Only improve lighting, sharpness, premium advertising feel, and clean composition
- The result must still clearly look like the uploaded image`
    : ""
}

${
  safeImageUrl && safeImageUsageMode === "elements"
    ? `REFERENCE IMAGE INSTRUCTION:
A user has provided an image.
Use only selected visual elements from the uploaded image.
- You may use colors, textures, background style, product elements, or atmosphere
- You may redesign the scene as an advertising image
- Do not copy the whole image 1:1
- Do not replace the business topic with something unrelated`
    : ""
}

${
  safeImageUrl &&
  (safeImageUsageMode === "integrate" || safeImageUsageMode === "auto")
    ? `REFERENCE IMAGE INSTRUCTION:
A user has provided an image. The uploaded image is the PRIMARY visual source.
Do NOT create a new unrelated image.

Strict rules:
- Preserve the main subject/product/object from the uploaded image
- The final image must clearly look like it came from the uploaded image
- Do not replace the uploaded subject with another product, object, model, room, background, or service
- Do not invent a different scene if the uploaded image already has a clear subject
- You may improve lighting, contrast, sharpness, crop, background cleanliness, and premium advertising feel
- You may slightly extend or polish the scene, but the uploaded image must remain recognizable
- If unsure, keep the uploaded image closer to original instead of redesigning it`
    : ""
}

STYLE:
- mood: ${plan.mood}
- color direction: ${plan.color_direction}
- accent style: ${plan.accent_style}

${
  isBeauty
    ? `BEAUTY / HAIR SALON VISUAL RULES:
- do not show a hairdresser, barber, stylist, employee, or staff member
- do not show haircut process
- do not show styling in progress
- do not show salon staff working on a client
- do not show scissors, combs, dryers, or tools being used on hair
- prefer premium beauty advertising look
- prefer elegant salon interior, mirrors, refined lighting, healthy styled hair
- a person is optional
- if a person appears, show only one elegant adult woman as a beauty model or client presence
- do not make it look like documentary salon work`
    : ""
}

COMPOSITION VARIETY:
- avoid repeating the same composition every time
- vary camera angle naturally
- sometimes close-up, sometimes wider framing
- sometimes minimal scene, sometimes richer environment
- avoid the same warm dark cinematic look every time
- use realistic commercial photography
- keep the result visually strong for text overlay

LIGHTING:
- realistic
- varied
- sometimes bright daylight
- sometimes soft studio light
- sometimes premium contrast
- avoid always using dark golden tones

HARD RULES:
- no text
- no logo
- no watermark
- no UI
- no letters or numbers

RANDOM SEED: ${randomStyleSeed}
`;
 // 🔥 EXACT MODE → използваме качената снимка 1:1, без AI редакция
if (safeImageUrl && safeImageUsageMode === "exact") {
const { data: logRow } = await supabase
  .from("generation_logs")
  .insert({
    user_id: user?.id || null,
user_email: user?.email || null,
    generation_type: source,
    input_text: description || "",
    output_text: plan.headline + "\n" + plan.subtext,
    metadata: {
      ...plan,
      image_url: safeImageUrl,
    },
  })
  .select("id")
  .single();
  return new Response(
    JSON.stringify({
      ok: true,
      banner_url: "",
      headline: plan.headline,
      subtext: plan.subtext,
      cta: plan.cta,
      image_url: safeImageUrl,
       plan,
generation_log_id: logRow?.id || null, 
 }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    }
  );
}

// 🔥 AUTO / ELEMENTS / INTEGRATE MODE → ако има изображение, ползваме EDITS
if (safeImageUrl) {
  
const inputBlob = await downloadImageAsBlob(safeImageUrl);
  const inputFile = new File([inputBlob], "input.png", {
    type: inputBlob.type || "image/png",
  });

  const formData = new FormData();
  formData.append("model", "gpt-image-1");
  formData.append("prompt", imagePrompt);
  formData.append("size", "1024x1024");
  formData.append("image", inputFile);
  const editRes = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  const editData = await editRes.json();

  let image_url: string | null = null;

  if (editData?.data?.[0]?.b64_json) {
    image_url = `data:image/png;base64,${editData.data[0].b64_json}`;
  }

  if (!image_url) {
    throw new Error(
      `Auto mode failed | status=${editRes.status} | data=${JSON.stringify(editData)}`
    );
  }
const { data: logRow } = await supabase
  .from("generation_logs")
  .insert({
    user_id: user?.id || null,
user_email: user?.email || null,
    generation_type: source,
    input_text: description || "",
    output_text: plan.headline + "\n" + plan.subtext,
    metadata: {
      ...plan,
      image_url,
    },
  })
  .select("id")
  .single();
  return new Response(
    JSON.stringify({
      ok: true,
      banner_url: "",
      headline: plan.headline,
      subtext: plan.subtext,
      cta: plan.cta,
      image_url,
      plan,
generation_log_id: logRow?.id || null,
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    }
  );
}

// 🔥 NO IMAGE MODE → само 1 генерация
const generationRes = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: "gpt-image-1",
    prompt: imagePrompt,
    size: "1024x1024",
  }),
});

const generationData = await generationRes.json();

let generatedImageUrl: string | null = null;

if (generationData?.data?.[0]?.b64_json) {
  generatedImageUrl = `data:image/png;base64,${generationData.data[0].b64_json}`;
}

if (!generatedImageUrl) {
  throw new Error("Image generation failed");
}

const { data: logRow } = await supabase
  .from("generation_logs")
  .insert({
    user_id: user?.id || null,
user_email: user?.email || null,
    generation_type: source,
    input_text: description || "",
    output_text: plan.headline + "\n" + plan.subtext,
    metadata: {
      ...plan,
      image_url: generatedImageUrl,
    },
  })
  .select("id")
  .single();

return new Response(
  JSON.stringify({
    ok: true,
    banner_url: "",
    headline: plan.headline,
    subtext: plan.subtext,
    cta: plan.cta,
    image_url: generatedImageUrl,
    plan,
generation_log_id: logRow?.id || null,
  }),
  {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status: 200,
  }
);
} catch (error) {
  console.error("GENERATE-BANER ERROR:", error);

  if (shouldRefundCredits && refundUserId && refundActionType && refundCost > 0) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: refundError } = await supabase.rpc("refund_action_credit", {
      p_user_id: refundUserId,
      p_action_type: refundActionType,
      p_cost: refundCost,
    });

    console.log("GENERATE-BANER REFUND RESULT:", {
      refundUserId,
      refundActionType,
      refundCost,
      refundError,
    });
  }
const isEnglishBanner = source === "en_quick_banner";

return new Response(
  JSON.stringify({
    error: "GENERATION_FAILED",
    message: isEnglishBanner
      ? "A system error occurred. Your credits were restored."
      : "Възникна системна грешка. Кредитите бяха възстановени.",
    details: error instanceof Error ? error.message : "Unknown error",
  }),
  {
    status: 500,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  }
);
}
});