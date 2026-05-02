
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.56.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type BrandProfile = {
  brand_name?: string | null;
  brand_description?: string | null;
  phone?: string | null;
};

type Tone = "soft" | "luxury" | "aggressive";

function getToneInstructions(tone: Tone) {
  if (tone === "luxury") {
    return "Луксозен, елегантен, премиум тон. По-малко емотикони.";
  }
   if (tone === "aggressive") {
  return "Силен продаващ тон, но без крещене, без прекалено много удивителни, без прекалено пискливи фрази. Да звучи уверено, директно и убедително. Силен CTA и urgency, но по-умно и по-професионално.";
} 
return "Нежен, емоционален и приятен тон.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
try {
  const { brand_profile, user_request, tone, source } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: corsHeaders }
    );
  }

  if (source === "brand_post") {
    const { data: hasCredits, error: creditError } = await supabase.rpc(
  "spend_action_credit",
  {
    p_user_id: user.id,
    p_action_type: "brand_post",
    p_cost: 5,
  }
);
    if (creditError || !hasCredits) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "NO_CREDITS",
          message: "Безплатната генерация на постове е изчерпана.",
        }),
        { status: 402, headers: corsHeaders }
      );
    }
  } else {
    return new Response(
      JSON.stringify({
        success: false,
        error: "PAYMENT_REQUIRED",
        message: "Тази генерация изисква активен план.",
      }),
      { status: 402, headers: corsHeaders }
    );
  }

  const openai = new OpenAI({
        apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    const toneInstructions = getToneInstructions(tone || "soft");

    const prompt = `
Създай 3 различни варианта на социален пост на български език.

${toneInstructions}

ВАЖНИ ПРАВИЛА ЗА ВСИЧКИ ВАРИАНТИ:
- Всеки вариант да е различен като структура и изразяване
- Да е готов за публикуване
- Да има hook и CTA
- Да има емотикони, но използвани смислено
- НЕ слепвай целия текст в един абзац
- Използвай празни редове между отделните части на текста
- Структурата да бъде ясно разделена с нови редове, както в реален социален пост
- Ако темата или форматът е Reel, видео идея, short video, video post или подобно, текстът НЕ трябва да говори за самото видео
- Не използвай фрази като: "Виж нашето ново видео", "Гледай видеото", "В това видео", "Пусни reels-а", "виж reels", "ново reel видео"
- При Reel / видео идея пиши така, сякаш продаваш услугата, резултата, усещането или офертата, а не формата на съдържанието
- Текстът трябва да работи еднакво добре дори ако човек не знае, че постът е видео
- Примерна структура (задължителна):
  Hook (1–2 реда)

  Основен текст (1–2 реда)

  🚗 Важен елемент
  📍 Важен елемент
  📞 Важен елемент

  Финален CTA (на отделен ред)

- Всеки логически блок трябва да е отделен с празен ред
- Не прави текста „слят“ – трябва да се чете лесно в Instagram/Facebook
- Ако има градове, цена, оферта, телефон, период, те да се изписват на отделни редове, а не да се губят вътре в абзац
- Ако в PHONE има реално подаден телефон, той ЗАДЪЛЖИТЕЛНО да присъства вътре в post_text
- Ако в PHONE пише "няма подаден телефон", НЕ добавяй телефон
- Ако в user request има цена, тя ЗАДЪЛЖИТЕЛНО да присъства вътре в post_text
- Ако в user request има локации като градове или райони, те ЗАДЪЛЖИТЕЛНО да присъстват вътре в post_text
- Ако в user request НЯМА подадена локация, град, район или адрес, НЕ измисляй и НЕ добавяй никакви локации
- Не добавяй факти, оферти, адреси, телефони, цени, срокове, градове или райони, които не са изрично дадени в BRAND или REQUEST
- Не пиши неща като "само 110 евро" вътре в средата на изречение, ако може да бъде отделено по-ясно на нов ред
- Не прави целия текст само от отделни точки; трябва да има и нормален рекламен текст
- Структурата да е:
  1. hook / opening line
  2. кратък рекламен текст
  3. 2 до 4 отделени важни реда с емотикони
  4. финален CTA
- Важните отделени редове може да изглеждат така, но БЕЗ да копираш примерни данни:
  📍 [само ако има реално подадена локация]
  💶 [само ако има реално подадена цена]
  📞 [само ако има реално подаден телефон]
  💧 [конкретната услуга от заявката]
- Никога не използвай примерни телефони, примерни цени или примерни локации.

ПРАВИЛА ПО СТИЛ:
- soft: по-мек, приятен, емоционален, но пак с ясно отделена важна информация
- luxury: по-елегантен, по-премиум, по-изчистен, с по-малко емотикони, но пак с отделени важни редове
- aggressive: силен продаващ стил, urgency и CTA, но без крещящ тон, без излишни главни букви, без прекаляване с удивителни и без евтино звучащи фрази; да е директно, стегнато и професионално, с ясно отделени ключови елементи на нови редове

ХАШТАГОВЕ:
- Дай отделно поле hashtags
- Хаштаговете да са подходящи за темата
- Да не са прекалено много

Върни САМО JSON:

{
  "variations": [
    { "post_text": "...", "hashtags": "..." },
    { "post_text": "...", "hashtags": "..." },
    { "post_text": "...", "hashtags": "..." }
  ]
}
BRAND:
${brand_profile?.brand_name}

DESCRIPTION:
${brand_profile?.brand_description}

PHONE:
${brand_profile?.phone || "няма подаден телефон"}

REQUEST:
${user_request}
`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 1,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    return new Response(
      JSON.stringify({
        success: true,
        variations: parsed.variations,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      { headers: corsHeaders }
    );
  }
});