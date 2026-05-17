"use client";

import Link from "next/link";
import { useState } from "react";

export default function QuickVideoPage() {
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [videoIdea, setVideoIdea] = useState("");
  const [phone, setPhone] = useState("");
  const [duration, setDuration] = useState<5 | 10>(5);
  const [showMiniPackageModal, setShowMiniPackageModal] = useState(false);
const [paymentLoading, setPaymentLoading] = useState(false);
const [paymentError, setPaymentError] = useState("");
const handleMiniPackageCheckout = async () => {
  try {
    setPaymentLoading(true);
    setPaymentError("");

    const { createClient } = await import("@/lib/supabase-browser");
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-paypal-checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plan: "quick_video" }),
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.url) {
      throw new Error(data?.error || "Неуспешно създаване на плащане.");
    }

    window.location.href = data.url;
  } catch (error) {
    console.error(error);
    setPaymentError("Не успяхме да отворим плащането. Опитай отново.");
  } finally {
    setPaymentLoading(false);
  }
};
  return (
    <main className="min-h-screen bg-[#f5f1ec] px-4 py-8 text-neutral-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-neutral-600">
            ← Назад към сайта
          </Link>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            Бързо AI видео за реклама
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">
            Попълни кратко описание и създай рекламно видео за социалните мрежи,
            без да минаваш през Brand Studio.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <section className="rounded-[32px] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 rounded-[24px] bg-[#faf8f6] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a6d62]">
                Мини пакет
              </p>
              <h2 className="mt-2 text-2xl font-black">
                2 AI видеа за проба
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Подходящо е, ако искаш първо да пробваш видео генерацията без да
                купуваш цял пакет.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Име на бизнес
                </span>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Напр. Sushi Bar Sakura"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Какво предлага бизнесът?
                </span>
                <textarea
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  rows={4}
                  placeholder="Напр. Суши бар с прясно суши, сетове за двама, доставка и уютна атмосфера."
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Каква е идеята за видеото?
                </span>
                <textarea
                  value={videoIdea}
                  onChange={(e) => setVideoIdea(e.target.value)}
                  rows={4}
                  placeholder="Напр. Кратко апетитно видео за промо сет суши за вечеря."
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Телефон по желание
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Напр. 0888 123 456"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>

              <div>
                <p className="mb-2 text-sm font-bold">Продължителност</p>
                <div className="grid grid-cols-2 gap-3">
                  {[5, 10].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDuration(item as 5 | 10)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                        duration === item
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-black"
                      }`}
                    >
                      {item} секунди
                    </button>
                  ))}
                </div>
              </div>

              <button
  type="button"
  onClick={() => setShowMiniPackageModal(true)}
  className="w-full rounded-full bg-neutral-950 px-5 py-4 text-sm font-black text-white"
>
  Генерирай видео
</button>
            </div>
          </section>

          <section className="rounded-[32px] bg-neutral-950 p-5 text-white shadow-sm sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
              Preview
            </p>

            <h2 className="mt-3 text-2xl font-black">
              Какво ще получиш?
            </h2>

            <div className="mt-5 space-y-3 text-sm leading-6 text-white/75">
              <p>• 2 кратки AI видеа за социални мрежи</p>
              <p>• вертикален формат 9:16</p>
              <p>• текст върху видеото</p>
              <p>• музика и финален екран с бизнес име</p>
              <p>• подходящо за Facebook, Instagram Reels и TikTok</p>
            </div>

            <div className="mt-8 overflow-hidden rounded-[28px] bg-black">
              <video
                src="/showcase/video-1.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="aspect-[9/16] w-full object-cover opacity-90"
              />
            </div>
          </section>
        </div>
      </div>
      {showMiniPackageModal ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-2xl">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a6d62]">
        Мини пакет AI видео
      </p>

      <h2 className="mt-3 text-2xl font-black text-neutral-950">
        2 кратки AI видеа за 4€
      </h2>

      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Получаваш 50 кредита — достатъчни за 2 видеа по 5 секунди.
        Ако избереш 10 секунди, едно видео използва 35 кредита.
      </p>

      {paymentError ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {paymentError}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleMiniPackageCheckout}
          disabled={paymentLoading}
          className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {paymentLoading ? "Отварям PayPal..." : "Купи мини пакет"}
        </button>

        <button
          type="button"
          onClick={() => setShowMiniPackageModal(false)}
          className="text-sm font-semibold text-neutral-500"
        >
          Затвори
        </button>
      </div>
    </div>
  </div>
) : null}
    </main>
  );
}