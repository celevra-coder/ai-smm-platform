import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fal } from "npm:@fal-ai/client";
import OpenAI from "npm:openai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const falKey = Deno.env.get("FAL_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!falKey) throw new Error("Missing FAL_KEY secret in Supabase.");
    if (!openaiKey) throw new Error("Missing OPENAI_API_KEY secret in Supabase.");

    fal.config({ credentials: falKey });

    const openai = new OpenAI({
      apiKey: openaiKey,
    });

    const body = await req.json();

    const brand = body?.brand_profile || {};
    const post = body?.selected_post || {};

    const context = [
  brand?.brand_name ? `Brand name: ${brand.brand_name}` : "",
  brand?.brand_description ? `Brand description: ${brand.brand_description}` : "",
  post?.headline ? `Post headline/topic: ${post.headline}` : "",
  post?.caption ? `Post caption: ${post.caption}` : "",
  post?.offer ? `Offer: ${post.offer}` : "",
  post?.raw_text ? `Full selected post text: ${post.raw_text}` : "",
]
  .filter(Boolean)
  .join("\n");
const isGeoWaterBusiness =
  /геофиз|гео физ|подземн[а-я\s]*вод|сондаж|сондиран|кладенец|водоизточник|хидрогеолог|земни пластове|подпочвен/i.test(
    context
  );
const hasBodyPartRisk =
  /маникюр|педикюр|нокти|ръце|ръка|пръсти|крак|крака|стъпала|уши|ухо|вежди|мигли|устни|зъби|лице|кожа|lash|brow|nail|manicure|pedicure|feet|foot|hand|ear|lips|teeth|skin/i.test(
    context
  );

const geoWaterRules = isGeoWaterBusiness
  ? `
SPECIAL RULES FOR GEOPHYSICAL / UNDERGROUND WATER BUSINESSES:
- Do NOT show people.
- Do NOT show workers.
- Do NOT show complex or futuristic equipment.
- Show one believable rural Bulgarian/European scene connected to water.
- Good realistic elements: village yard, old stone or concrete well, dry soil, green vegetation, small river, stream, waterfall, wet stones, water drops, grass, soil texture, countryside landscape.
- Avoid holes filled with water.
- Avoid wells placed inside rivers.
- Avoid impossible water sources.
- Avoid fantasy landscapes.
- Avoid symbolic underground water cutaways.
- Avoid fake technical diagrams.
`
  : "";

const safeFrameTypes = hasBodyPartRisk
  ? `
MANDATORY SAFE FRAME STRUCTURE:
Return exactly 3 scenes with this structure:
1. Workspace/tools scene: salon table, tools, products, lamp, towels, clean setup. No visible detailed anatomy.
2. Product/service environment scene: bottles, equipment, chair, mirror, treatment bed, premium interior. No visible detailed anatomy.
3. Natural distance client/result scene: if needed, show a person or body area only from a wider natural distance, with the service context visible. No macro close-up.

For manicure topics:
- Prefer nail polish bottles, manicure table, UV lamp, clean salon tools, towel, premium beauty setup.
- Do not make hands, fingers or nails the central subject.

For pedicure topics:
- Prefer pedicure chair, spa setup, towels, products, tools.
- Do not make feet or toes the central subject.

For piercing / ears:
- Prefer jewelry tray, clean studio setup, mirror, sterile tools.
- Do not make an ear close-up the central subject.

For lashes / brows / face:
- Prefer treatment bed, mirror, tools, product bottles, soft salon scene.
- Do not make eyes, brows, lashes, lips, teeth or skin macro details the central subject.
`
  : "";

const visualResponse = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `
You are an expert advertising visual director.

Your job is to convert the provided brand and post text into THREE different realistic static visual scenes for video starting frames.

CRITICAL RULES:
- The image MUST match the exact business, service and topic from the user text.
- Do NOT switch industry.
- Do NOT create a generic lifestyle image.
- Do NOT create a random beautiful scene if it does not explain the post topic.
- The scene must visually represent the actual service/problem/result described in the post.
- The scene must look like a real photograph from a real place, not an AI fantasy composition.
- Use realistic environments, realistic objects, realistic scale, realistic materials and believable lighting.
- Avoid impossible combinations, symbolic scenes, surreal compositions or artificial-looking concepts.
- If the post is educational, show a clear educational/diagnostic/work process scene.
- If the post is about a technical service, show the realistic environment and service result, but avoid fake futuristic equipment.
- If the post is about training, show the learning environment and practice context, but only if the audience is clearly children/adults from the text.
- If the topic requires body parts such as hands, fingers, nails, feet, legs, ears, face details, skin, eyebrows, lashes, lips or teeth, they may be shown, but only in a natural realistic pose and with correct anatomy.
- Avoid extreme macro close-ups that fill the whole frame with isolated anatomy.
- Prefer controlled beauty/service compositions: one natural hand on a salon table, one foot in a pedicure chair, one ear in a piercing/styling context, or a face detail shown from a realistic distance.
- Always include surrounding context such as tools, chair, products, towel, mirror or workspace.
- Do not show multiple overlapping hands, duplicated fingers, twisted poses, cropped body parts or confusing anatomy.


The image should feel natural, calm and realistic, not technical or industrial.
IMAGE CONTENT:
- One realistic static scene.
- No text in image.
- No logos.
- No signs.
- No letters.
- No numbers.
- No fake UI.
- No before/after collage.
- No exaggerated emotions.
- No chaotic action.
Return ONLY valid JSON.

The JSON must be an array of exactly 3 strings.
Each string must be one different detailed visual scene description in English.
Be concrete, literal and realistic.

Example format:
[
  "Scene description 1...",
  "Scene description 2...",
  "Scene description 3..."
]

${geoWaterRules}
${safeFrameTypes}

${
  hasBodyPartRisk
    ? `
SPECIAL RULES FOR BODY-PART / BEAUTY DETAIL SERVICES:
- Do NOT create macro anatomy scenes.
- Do NOT create close-up hands, fingers, nails, feet, toes, ears, lips, teeth, lashes, brows or skin texture.
- Do NOT make body parts the main focal point.
- Do NOT describe detailed fingers, individual nails, toes, ear shape, teeth, lips or facial anatomy.
- At least 2 of the 3 scenes must contain NO visible detailed anatomy.
- The safest choice is always tools, workspace, products, chair, lamp, towel, mirror, treatment bed or salon environment.
- If one scene includes a client, show the client from a natural distance with the full service context visible.
`
    : ""
}
`,
    },
    {
      role: "user",
      content: context,
    },
  ],
});
    const visualRaw = visualResponse.choices?.[0]?.message?.content || "";

let visuals: string[] = [];

try {
  const parsed = JSON.parse(visualRaw);
  visuals = Array.isArray(parsed)
    ? parsed.filter((item) => typeof item === "string" && item.trim())
    : [];
} catch {
  visuals = [];
}

if (!visuals.length) {
  visuals = [visualRaw].filter(Boolean);
}

visuals = visuals.slice(0, 3);

while (visuals.length < 3) {
  visuals.push(visuals[0] || "A realistic vertical commercial photo matching the exact business topic.");
}
const buildImagePrompt = (visual: string) => {
  const isBodyPartScene =
    /hand|finger|nail|foot|toe|ear|face|skin|lashes|brow|lip|teeth/i.test(
      visual
    );

  const safeBodyPartInstruction = hasBodyPartRisk
    ? `
BODY-PART RISK SAFETY:
- Prioritize the service environment, tools, products, chair, table, lamp, towels, mirror or clean workspace.
- Do not create macro close-ups of anatomy.
- Do not make hands, fingers, nails, feet, toes, ears, lips, teeth, lashes, brows or skin the main subject.
- Body parts must never appear alone, floating, emerging from objects, coming out of bowls, bottles, boxes, towels, lamps, product displays or furniture.
- If hands are visible, they must belong to one clearly visible real human client, in a normal seated salon position.
- Show exactly two human hands only when needed, with five fingers on each hand, natural proportions, natural wrist connection, relaxed pose, and no duplicated, fused, missing or extra fingers.
- Do not show isolated hands, detached hands, partial arms without context, hands inside bowls, hands coming out of products, or surreal anatomy.
- If correct natural hands cannot be shown, show no hands at all and use tools, polish bottles, UV lamp, towel, manicure table and salon environment instead.
`
    : "";

  return `
Ultra photorealistic vertical commercial photo, real life, no CGI.
VISUAL SCENE:
${visual}

FOCUS CONTROL:
- The main focus of the image must be the environment, tools, products or workspace.
- Hands or body parts must NOT be the central focal point.
- If hands are present, they must occupy a small part of the frame and not dominate the composition.
- Prefer compositions where tools, bottles, table setup, lamp or interior are the main subject.
${safeBodyPartInstruction}

MANDATORY:
- The image must clearly match the exact business and post topic.
- Show the actual service context, tools, environment or result implied by the post.
- Use a clean advertising composition with one clear focal point.
- Use believable real-world objects, real proportions, natural perspective and realistic lighting.
- Do not create symbolic, surreal, fantasy or obviously AI-generated scenes.

${
  isBodyPartScene
    ? `
IMPORTANT COMPOSITION RULE:
- Do NOT create an extreme close-up of a body part.
- Show the body part naturally within a wider context such as salon, workspace, tools or environment.
- Show only ONE clear subject: one hand, one foot, one ear area or one face detail.
- The pose must be relaxed, natural and physically correct.
- Include surrounding objects like table, tools, towel, products or chair.
- Avoid cropped, floating, twisted or confusing body parts.
`
    : ""
}

STRICT RULES:
- real photography only, not illustration, not cartoon, not 3D
- no unrelated products
- no unrelated industry
- no text in the image
- no signs
- no logos
- no labels
- no letters
- no numbers
- no watermark
- correct anatomy
- no extra limbs
- no deformed hands
- no distorted fingers
- no extra fingers
- no missing fingers
- no fused fingers
- no unnatural nails
- no warped feet
- no distorted ears
- no malformed face details
- no mutations
- no surreal elements
- no fantasy

CAMERA:
- vertical 9:16 composition
- 50mm lens
- shallow depth of field
- natural cinematic light
- clean realistic commercial look

NEGATIVE:
cartoon, animation, 3d render, cgi, unreal engine, fake, artificial, ai-looking, generated-looking, plastic, deformed, extra limbs, bad anatomy, mutated, weird hands, distorted fingers, extra fingers, missing fingers, fused fingers, broken fingers, unnatural nails, warped feet, distorted toes, malformed ears, distorted face details, extreme distorted anatomy close-up, floating body parts, cropped anatomy, glitch, distorted body, surreal, fantasy, impossible object placement, impossible landscape, symbolic scene, concept art, random stock photo, unrelated industry, text, logo, letters, numbers, watermark
`.replace(/\s+/g, " ").trim();
};

    const images: string[] = [];

for (let i = 0; i < 3; i++) {
  const generationRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: buildImagePrompt(visuals[i]),
      size: "1024x1024",
    }),
  });

  const generationData = await generationRes.json();

  let imageUrl = "";

  if (generationData?.data?.[0]?.b64_json) {
    imageUrl = `data:image/png;base64,${generationData.data[0].b64_json}`;
  }

  if (!imageUrl) {
    throw new Error(
      `OpenAI frame generation failed | status=${generationRes.status} | data=${JSON.stringify(generationData)}`
    );
  }

  images.push(imageUrl);
}

    
    return new Response(
      JSON.stringify({
        success: true,
        images,
      }),
      { headers: corsHeaders }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : "error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});