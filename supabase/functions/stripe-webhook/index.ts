import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
});

serve(async (req) => {
  try {
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing signature", { status: 400 });
    }

    const body = await req.text();
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

    const event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      endpointSecret
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;

      const userId = session.metadata?.user_id;
      const credits = Number(session.metadata?.credits || 0);
      const orderId = session.metadata?.order_id;
      const type = session.metadata?.type;

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      if (userId && credits > 0) {
        const { error } = await supabase.rpc("add_credits", {
          p_user_id: userId,
          p_credits: credits,
        });

        if (error) {
          console.error("ADD CREDITS ERROR:", error);
        }
      }

      if (type === "video_order" && orderId) {
        const { error } = await supabase
          .from("video_orders")
          .update({
            payment_status: "paid",
            status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (error) {
          console.error("UPDATE VIDEO ORDER ERROR:", error);
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return new Response("Webhook error", { status: 400 });
  }
});