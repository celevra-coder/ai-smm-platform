import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createSign } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const plans: Record<
  string,
  { credits: number; amount: string; name: string }
> = {
  starter: { credits: 150, amount: "15.00", name: "Starter пакет - 150 кредита" },
  growth: { credits: 300, amount: "25.00", name: "Growth пакет - 300 кредита" },
  pro: { credits: 400, amount: "30.00", name: "Pro пакет - 400 кредита" },
};

function signPostData(postData: Record<string, string>, privateKey: string) {
  const raw = Object.values(postData).join("-");
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
    const body = await req.json().catch(() => null);
    const planKey = body?.plan;
    const selectedPlan = plans[planKey];

    if (!selectedPlan) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = Deno.env.get("SITE_URL");
    const myposConfigB64 = Deno.env.get("MYPOS_CONFIG_B64");
    const myposCheckoutUrl = Deno.env.get("MYPOS_CHECKOUT_URL");

    if (!siteUrl || !myposConfigB64 || !myposCheckoutUrl) {
      throw new Error("Missing myPOS configuration");
    }

    const config = JSON.parse(atob(myposConfigB64));

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

    const orderId = `${planKey}_${user.id}_${Date.now()}`;

    const fields: Record<string, string> = {
      IPCmethod: "IPCPurchase",
      IPCVersion: "1.4",
      IPCLanguage: "BG",
      SID: String(config.sid),
      WalletNumber: String(config.cn),
      Amount: selectedPlan.amount,
      Currency: "EUR",
      OrderID: orderId,
      URL_OK: `${siteUrl}/dashboard?payment=success`,
      URL_Cancel: `${siteUrl}/pricing?payment=cancelled`,
      URL_Notify: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mypos-webhook`,
      CardTokenRequest: "0",
      KeyIndex: String(config.idx),
      PaymentParametersRequired: "2",
      PaymentMethod: "1",
      CustomerEmail: user.email || "",
      Note: selectedPlan.name,
      Source: "SMM Creative Studio",
      CartItems: "1",
      Article_1: selectedPlan.name,
      Quantity_1: "1",
      Price_1: selectedPlan.amount,
      Currency_1: "EUR",
      Amount_1: selectedPlan.amount,
    };

    fields.Signature = signPostData(fields, config.pk);

    return new Response(
      JSON.stringify({
        action: myposCheckoutUrl,
        fields,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("CREATE MYPOS CHECKOUT ERROR:", error);

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