import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fal } from "npm:@fal-ai/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

    const url = new URL(req.url);
    const requestId = url.searchParams.get("request_id") || "";

    if (!requestId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing request_id" }),
        { status: 400, headers: corsHeaders }
      );
    }

    fal.config({ credentials: falKey });

    const status = await fal.queue.status(
      "fal-ai/stable-audio-25/text-to-audio",
      {
        requestId,
        logs: true,
      }
    );

    const result =
      status?.status === "COMPLETED"
        ? await fal.queue.result("fal-ai/stable-audio-25/text-to-audio", {
            requestId,
          })
        : null;

    const audioUrl =
      result?.data?.audio?.url ||
      result?.audio?.url ||
      result?.data?.audios?.[0]?.url ||
      result?.audios?.[0]?.url ||
      "";

    return new Response(
      JSON.stringify({
        success: true,
        status: status?.status || "UNKNOWN",
        audio_url: audioUrl,
        result,
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