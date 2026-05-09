import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  try {
    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) throw new Error("Missing SITE_URL");

    const url = new URL(req.url);
    const paypalOrderId = url.searchParams.get("token");

    if (!paypalOrderId) {
      return Response.redirect(`${siteUrl}/order-video?payment=failed`, 302);
    }

    const paypalAccessToken = await getPayPalAccessToken();

    const captureRes = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paypalAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = await captureRes.json();

    if (!captureRes.ok) {
      console.error("PAYPAL VIDEO CAPTURE ERROR:", captureData);
      return Response.redirect(`${siteUrl}/order-video?payment=failed`, 302);
    }

    const purchaseUnit = captureData.purchase_units?.[0];
    const customId = purchaseUnit?.custom_id || purchaseUnit?.reference_id || "";

    if (!String(customId).startsWith("video_order_")) {
      console.error("PAYPAL INVALID VIDEO CUSTOM ID:", customId);
      return Response.redirect(`${siteUrl}/order-video?payment=failed`, 302);
    }

    const videoOrderId = String(customId).replace("video_order_", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("video_orders")
      .update({
        payment_status: "paid",
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoOrderId)
      .eq("payment_reference", customId);

    if (error) {
      console.error("PAYPAL VIDEO ORDER UPDATE ERROR:", error);
      return Response.redirect(`${siteUrl}/order-video?payment=failed`, 302);
    }

    return Response.redirect(`${siteUrl}/?payment=video_success`, 302);
  } catch (error) {
    console.error("CAPTURE VIDEO PAYPAL CHECKOUT ERROR:", error);

    const siteUrl = Deno.env.get("SITE_URL") || "https://www.aismmstudio.com";
    return Response.redirect(`${siteUrl}/order-video?payment=failed`, 302);
  }
});