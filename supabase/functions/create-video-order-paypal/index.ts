import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

async function getPayPalAccessToken() {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_SECRET");

  if (!clientId || !secret) throw new Error("Missing PayPal credentials");

  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    console.error("PAYPAL TOKEN ERROR:", data);
    throw new Error("Could not get PayPal access token");
  }

  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) throw new Error("Missing SITE_URL");

    const body = await req.json().catch(() => null);
    const orderId = body?.order_id;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: order, error: orderError } = await supabase
      .from("video_orders")
      .select("id,user_id,service_title,price_eur,payment_status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (order.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "Order already paid" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const paypalAccessToken = await getPayPalAccessToken();
    const paypalReference = `video_order_${order.id}`;

    const paypalRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paypalAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: paypalReference,
            custom_id: paypalReference,
            description: order.service_title,
            amount: {
              currency_code: "EUR",
              value: Number(order.price_eur).toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "AI SMM Studio",
          user_action: "PAY_NOW",
          return_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/capture-video-order-paypal`,
          cancel_url: `${siteUrl}/order-video?payment=cancelled`,
        },
      }),
    });

    const paypalData = await paypalRes.json();

    if (!paypalRes.ok) {
      console.error("PAYPAL VIDEO CREATE ORDER ERROR:", paypalData);
      throw new Error("Could not create PayPal video order");
    }

    const approveUrl = paypalData.links?.find(
      (link: { rel: string; href: string }) => link.rel === "approve"
    )?.href;

    if (!approveUrl) throw new Error("Missing PayPal approve URL");

    const { error: updateError } = await supabase
      .from("video_orders")
      .update({
        payment_provider: "paypal",
        payment_reference: paypalReference,
        status: "pending_payment",
        payment_status: "unpaid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ url: approveUrl }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("CREATE VIDEO PAYPAL CHECKOUT ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});