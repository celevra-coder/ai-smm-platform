import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createSign } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function signPostData(postData: Record<string, string>, privateKey: string) {
  const orderedKeys = Object.keys(postData).filter((k) => k !== "Signature");

const raw = orderedKeys.map((key) => postData[key]).join("-");
  const bytes = new TextEncoder().encode(raw);

  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  const concatenated = btoa(binary);

  const signer = createSign("RSA-SHA256");
  signer.update(concatenated);
  signer.end();

  return signer.sign(privateKey, "base64");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const siteUrl = Deno.env.get("SITE_URL");
    const myposConfigB64 = Deno.env.get("MYPOS_CONFIG_B64");
    const myposCheckoutUrl = Deno.env.get("MYPOS_CHECKOUT_URL");

    if (!siteUrl || !myposConfigB64 || !myposCheckoutUrl) {
      throw new Error("Missing myPOS configuration");
    }

    const config = JSON.parse(atob(myposConfigB64));

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

    const amount = Number(order.price_eur).toFixed(2);
    
const shortOrderId = String(order.id).replaceAll("-", "").slice(0, 12);
const myposOrderId = `video_order_${shortOrderId}_${Date.now()}`;
    const fields: Record<string, string> = {
      IPCmethod: "IPCPurchase",
      IPCVersion: "1.4",
      IPCLanguage: "BG",
      SID: String(config.sid),
      WalletNumber: String(config.cn),
      Amount: amount,
      Currency: "EUR",
      OrderID: myposOrderId,
      URL_OK: `${siteUrl}/dashboard?payment=success`,
      URL_Cancel: `${siteUrl}/pricing?payment=cancelled`,
      URL_Notify: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mypos-webhook`,
      CardTokenRequest: "0",
      KeyIndex: String(config.idx),
      PaymentParametersRequired: "2",
      PaymentMethod: "1",
      CustomerEmail: user.email || "",
      Note: order.service_title,
      Source: "SMM Creative Studio",
      CartItems: "1",
      Article_1: order.service_title,
      Quantity_1: "1",
      Price_1: amount,
      Currency_1: "EUR",
      Amount_1: amount,
    };

    fields.Signature = signPostData(fields, config.pk);

    const { error: updateError } = await supabase
      .from("video_orders")
      .update({
        payment_provider: "mypos",
        payment_reference: myposOrderId,
        status: "pending_payment",
        payment_status: "unpaid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        action: myposCheckoutUrl,
        fields,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
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