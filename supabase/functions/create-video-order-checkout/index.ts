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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const siteUrl = Deno.env.get("SITE_URL");

    if (!stripeSecretKey || !siteUrl) {
      throw new Error("Missing STRIPE_SECRET_KEY or SITE_URL");
    }

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
      .select("id,user_id,service_title,price_eur,payment_status,status")
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

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      success_url: `${siteUrl}/account?video_payment=success`,
      cancel_url: `${siteUrl}/order-video?video_payment=cancelled`,
      metadata: {
        user_id: user.id,
        order_id: order.id,
        type: "video_order",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(Number(order.price_eur) * 100),
            product_data: {
              name: order.service_title,
            },
          },
        },
      ],
    });

    const { error: updateError } = await supabase
      .from("video_orders")
      .update({
        payment_provider: "stripe",
        payment_reference: session.id,
        status: "pending_payment",
        payment_status: "unpaid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("CREATE VIDEO ORDER CHECKOUT ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});