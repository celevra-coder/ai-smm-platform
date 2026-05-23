import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
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
  { credits: number; amount: number; name: string }
> = {
  mini: { credits: 40, amount: 400, name: "Mini тест пакет - 40 кредита" },
  starter: { credits: 100, amount: 900, name: "Starter пакет - 100 кредита" },
  growth: { credits: 220, amount: 1500, name: "Growth пакет - 220 кредита" },
  pro: { credits: 420, amount: 2500, name: "Pro пакет - 420 кредита" },
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
});

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: selectedPlan.name,
            },
            unit_amount: selectedPlan.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/dashboard/quick-video?payment=package_success`,
      cancel_url: `${siteUrl}/pricing?payment=cancelled`,
      metadata: {
        type: "credits_package",
        user_id: user.id,
        plan: planKey,
        credits: String(selectedPlan.credits),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("CREATE STRIPE CHECKOUT ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});