import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fal } from "npm:@fal-ai/client";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

const FAL_VIDEO_ENDPOINTS = [
  "wan/v2.6/text-to-video",
  "wan/v2.6/image-to-video/flash",
] as const;
serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Method not allowed",
        }),
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

    const url = new URL(req.url);
    const requestId = url.searchParams.get("request_id");

    if (!requestId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing request_id.",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    fal.config({
      credentials: falKey,
    });

        let resolvedEndpoint: (typeof FAL_VIDEO_ENDPOINTS)[number] | null = null;
    let resolvedStatus: any = null;
    const endpointErrors: Array<{ endpoint: string; error: string }> = [];

    for (const endpoint of FAL_VIDEO_ENDPOINTS) {
      try {
        const status = await fal.queue.status(endpoint, {
          requestId,
          logs: true,
        });

        resolvedEndpoint = endpoint;
        resolvedStatus = status;
        break;
      } catch (error) {
        endpointErrors.push({
          endpoint,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    if (!resolvedEndpoint || !resolvedStatus) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not resolve FAL request status for this request_id.",
          checked_endpoints: FAL_VIDEO_ENDPOINTS,
          endpoint_errors: endpointErrors,
          request_id: requestId,
        }),
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

        if (resolvedStatus.status === "COMPLETED") {
      try {
const result = await fal.queue.result(resolvedEndpoint, {
  requestId,
});

const videoUrl = result.data?.video?.url || "";

try {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  await supabase.from("generation_logs").insert({
    generation_type: "video",
    input_text: requestId,
    output_text: videoUrl,
    metadata: {
      fal_request_id: requestId,
      fal_endpoint: resolvedEndpoint,
      video_url: videoUrl,
      fal_response: result.data,
    },
  });
} catch (logError) {
  console.error("VIDEO LOG INSERT ERROR:", logError);
}

return new Response(
  JSON.stringify({
    success: true,
                    status: "COMPLETED",
            fal_endpoint: resolvedEndpoint,
            fal_response: result.data,
            video: result.data?.video,
            video_url: videoUrl,
          }),
          {
            status: 200,
            headers: corsHeaders,
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: true,
            status: "PROCESSING",
            fal_endpoint: resolvedEndpoint,
            request_id: requestId,
            note: "FAL marked the job as completed, but the result is not ready yet.",
            result_error:
              error instanceof Error ? error.message : "Unknown error",
          }),
          {
            status: 200,
            headers: corsHeaders,
          }
        );
      }
    }
return new Response(
  JSON.stringify({
    success: true,
    status: resolvedStatus.status,
    fal_endpoint: resolvedEndpoint,
    logs: resolvedStatus.logs || [],
    error:
      resolvedStatus.error ||
      resolvedStatus.message ||
      resolvedStatus.logs?.map((log: any) => log.message).filter(Boolean).join("\n") ||
      "",
  }),
          {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    const errorDetails =
      error && typeof error === "object"
        ? JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
        : null;

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: errorDetails,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});