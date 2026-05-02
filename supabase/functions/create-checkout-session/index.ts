import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const plans: Record<
  string,
  { credits: number; amount: number; name: string }
> = {
  starter: {
    credits: 150,
    amount: 1500,
    name: "Starter пакет - 150 кредита",
  },
  growth: {
    credits: 300,
    amount: 2500,
    name: "Growth пакет - 300 кредита",
  },
  pro: {
    credits: 400,
    amount: 3000,
    name: "Pro пакет - 400 кредита",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const planKey = body?.plan;

    const selectedPlan = plans[planKey];

    if (!selectedPlan) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const siteUrl = Deno.env.get("SITE_URL");

    if (!stripeSecretKey || !siteUrl) {
      throw new Error("Missing STRIPE_SECRET_KEY or SITE_URL");
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      success_url: `${siteUrl}/dashboard?payment=success`,
      cancel_url: `${siteUrl}/pricing?payment=cancelled`,
      metadata: {
        user_id: user.id,
        plan: planKey,
        credits: String(selectedPlan.credits),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: selectedPlan.amount,
            product_data: {
              name: selectedPlan.name,
            },
          },
        },
      ],
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("CREATE CHECKOUT ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});