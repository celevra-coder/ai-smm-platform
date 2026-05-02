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
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const falKey = Deno.env.get("FAL_KEY");

    if (!falKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing FAL_KEY" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const body = await req.json();

    const style = (body?.style || "premium commercial").toLowerCase();
const duration = Number(body?.duration) || 10;

const brandName = body?.brand_profile?.brand_name || "";
const brandDescription = body?.brand_profile?.brand_description || "";
const selectedHeadline = body?.selected_post?.headline || "";
const selectedCaption = body?.selected_post?.caption || "";
const selectedOffer = body?.selected_post?.offer || "";
const selectedCta = body?.selected_post?.cta || "";
const bannerHeadline = body?.banner_plan?.headline || "";
const bannerSubtext = body?.banner_plan?.subtext || "";

const compact = (value: string, max: number) =>
  (value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const musicContext = [
  compact(brandName, 50),
  compact(brandDescription, 120),
  compact(selectedHeadline, 100),
  compact(selectedCaption, 140),
  compact(selectedOffer, 80),
  compact(selectedCta, 80),
  compact(bannerHeadline, 100),
  compact(bannerSubtext, 120),
]
  .filter(Boolean)
  .join(". ");

const prompt = `
High quality instrumental background music for a ${style} social media advertisement.
Brand and ad context: ${musicContext}.
No vocals. No lyrics. No speech.
Create a clean, modern, premium commercial soundtrack.
The music should feel emotionally aligned with the business and promotional message.
Suitable for short-form vertical social media ad video.
Duration around ${duration} seconds.
`.replace(/\s+/g, " ").trim();

    fal.config({ credentials: falKey });

    const result = await fal.queue.submit(
      "fal-ai/stable-audio-25/text-to-audio",
      {
        input: {
          prompt,
          duration_seconds: duration,
        },
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        request_id: result?.requestId || result?.request_id,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});