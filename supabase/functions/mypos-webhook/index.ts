
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const plans: Record<string, { credits: number }> = {
  starter: { credits: 150 },
  growth: { credits: 300 },
  pro: { credits: 400 },
};

serve(async (req) => {
  try {
    const formData = await req.formData();

    const orderId = String(formData.get("OrderID") || "");
    const status = String(formData.get("Status") || "");

    console.log("MYPOS WEBHOOK:", { orderId, status });

    if (!orderId) {
      return new Response("Missing OrderID", { status: 400 });
    }

    const [planKey, userId] = orderId.split("_");
    const selectedPlan = plans[planKey];

    if (!selectedPlan || !userId) {
      return new Response("Invalid OrderID", { status: 400 });
    }

    const isPaid =
      status === "0" ||
      status.toLowerCase() === "success" ||
      status.toLowerCase() === "paid";

    if (!isPaid) {
      return new Response("OK", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.rpc("add_credits", {
      p_user_id: userId,
      p_credits: selectedPlan.credits,
    });

    if (error) {
      console.error("MYPOS ADD CREDITS ERROR:", error);
      return new Response("Credit error", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("MYPOS WEBHOOK ERROR:", err);
    return new Response("Webhook error", { status: 400 });
  }
});