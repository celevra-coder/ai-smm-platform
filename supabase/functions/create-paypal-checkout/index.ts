import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const plans: Record<
  string,
  { credits: number; amount: string; name: string }
> = {
  mini: { credits: 30, amount: "4.00", name: "Mini тест пакет - 30 кредита" },
  starter: { credits: 90, amount: "9.00", name: "Starter пакет - 90 кредита" },
  growth: { credits: 180, amount: "15.00", name: "Growth пакет - 180 кредита" },
  pro: { credits: 330, amount: "25.00", name: "Pro пакет - 330 кредита" },
};
async function getPayPalAccessToken() {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_SECRET");

  if (!clientId || !secret) {
    throw new Error("Missing PayPal credentials");
  }

  const auth = btoa(`${clientId}:${secret}`);

  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
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

    if (!siteUrl) {
      throw new Error("Missing SITE_URL");
    }

    const body = await req.json().catch(() => null);
    const planKey = body?.plan;
    const selectedPlan = plans[planKey];

    if (!selectedPlan) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
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

    const paypalAccessToken = await getPayPalAccessToken();
    const paypalReference = `${planKey}_${user.id}_${Date.now()}`;

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
            description: selectedPlan.name,
            amount: {
              currency_code: "EUR",
              value: selectedPlan.amount,
            },
          },
        ],
        application_context: {
          brand_name: "AI SMM Studio",
          user_action: "PAY_NOW",
          return_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/capture-paypal-checkout`,
          cancel_url: `${siteUrl}/pricing?payment=cancelled`,
        },
      }),
    });

    const paypalData = await paypalRes.json();

    if (!paypalRes.ok) {
      console.error("PAYPAL CREATE ORDER ERROR:", paypalData);
      throw new Error("Could not create PayPal order");
    }

    const approveUrl = paypalData.links?.find(
      (link: { rel: string; href: string }) => link.rel === "approve"
    )?.href;

    if (!approveUrl) {
      throw new Error("Missing PayPal approve URL");
    }

    return new Response(JSON.stringify({ url: approveUrl }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("CREATE PAYPAL CHECKOUT ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});