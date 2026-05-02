import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.56.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      businessType,
      services,
      notes,
      tone,
      days = 7,
    } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 🔹 credit check
    const { data: hasCredits } = await supabase.rpc(
      "spend_action_credit",
      {
        p_user_id: user.id,
        p_action_type: "content_calendar",
        p_cost: 5,
      }
    );

    if (!hasCredits) {
      return new Response(
        JSON.stringify({ success: false, error: "NO_CREDITS" }),
        { status: 402, headers: corsHeaders }
      );
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    const prompt = `
Създай content календар за социални мрежи.

БИЗНЕС:
${businessType}

УСЛУГИ:
${services}

ДОПЪЛНИТЕЛНО:
${notes}

ВАЖНО:

1. Върни точно ${days} идеи
2. Всеки ден да има различен тип пост
3. Не повтаряй едни и същи идеи

ТИПОВЕ ПОСТОВЕ:
- educational (образователен)
- promo (САМО ако има реална оферта, цена, бонус)
- trust (доверие / резултати / ревю)
- authority (експертност)
- general (лек / ангажиращ)

❗ КРИТИЧНО:
- НЕ маркирай като "promo", ако няма реална оферта
- Образователни теми = educational
- Въпроси / съвети = educational или authority
- Само реални оферти = promo

Върни САМО JSON:

{
  "items": [
    {
      "day": "Ден 1",
      "title": "...",
      "format": "post | reel",
      "description": "...",
      "postType": "educational"
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    return new Response(
      JSON.stringify({
        success: true,
        items: parsed.items || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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