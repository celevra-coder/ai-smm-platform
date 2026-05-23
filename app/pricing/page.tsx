"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const plans = [
  {
  key: "mini",
  name: "Mini тест",
  price: "4€",
  credits: "40 кредита",
  description: "Подходящ за първи реален тест на платформата.",
},
{
  key: "starter",
  name: "Starter",
  price: "9€",
  credits: "100 кредита",
  description: "За малко съдържание и първи кампании.",
},
{
  key: "growth",
  name: "Growth",
  price: "15€",
  credits: "220 кредита",
  description: "Най-балансираният пакет за активна работа.",
},
  {
  key: "pro",
  name: "Pro",
  price: "25€",
  credits: "420 кредита",
    description: "Най-добра стойност, ако ще създаваш често.",
  },
];

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCheckout = async (plan: string, provider: "stripe" | "paypal") => {
    try {
      setLoadingPlan(plan);
      setErrorMessage("");

      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (!accessToken) {
  localStorage.setItem("pending_checkout_plan", plan);
  localStorage.setItem("pending_checkout_provider", provider);
  window.location.href = "/register";
  return;
}

      const checkoutFunction =
  provider === "stripe" ? "create-stripe-checkout" : "create-paypal-checkout";

const res = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${checkoutFunction}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ plan }),
        }
      );

      const data = await res.json().catch(() => null);

                  if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Неуспешно създаване на плащане.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setErrorMessage("Не успяхме да отворим плащането. Опитай отново.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f1ec] px-4 py-10 text-neutral-900">
      <section className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">
            AI SMM Studio
          </p>

          <h1 className="mt-4 text-[36px] font-black tracking-[-0.04em] text-neutral-950 md:text-[52px]">
            Избери пакет с кредити
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-[1.7] text-neutral-600">
            Плащаш веднъж и използваш кредитите както искаш — за банери,
            постове, контент календар или видео.
          </p>
        </div>

        {errorMessage ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-[18px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            >
              <h2 className="text-[24px] font-black text-neutral-950">
                {plan.name}
              </h2>

              <p className="mt-3 text-[42px] font-black tracking-[-0.04em] text-neutral-950">
                {plan.price}
              </p>

              <p className="mt-2 text-sm font-bold text-neutral-700">
                {plan.credits}
              </p>

              <p className="mt-4 min-h-[52px] text-sm leading-[1.7] text-neutral-600">
                {plan.description}
              </p>

              <div className="mt-6 space-y-3">
  <button
    type="button"
    onClick={() => handleCheckout(plan.key, "stripe")}
    disabled={loadingPlan === plan.key}
    className="w-full rounded-[20px] bg-neutral-950 px-5 py-3 text-[15px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {loadingPlan === plan.key ? "Отварям..." : "Купи с карта"}
  </button>

  <button
    type="button"
    onClick={() => handleCheckout(plan.key, "paypal")}
    disabled={loadingPlan === plan.key}
    className="w-full rounded-[20px] border border-neutral-300 bg-white px-5 py-3 text-[15px] font-bold text-neutral-950 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
  >
    PayPal
  </button>
</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}