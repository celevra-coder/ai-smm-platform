"use client";

import { useState } from "react";

export default function AdsAssistantPage() {
  const [businessInput, setBusinessInput] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
  if (!businessInput.trim()) {
    setAnalysis({
      error: "Моля, опиши бизнеса си и какво искаш да постигнеш с рекламата.",
    });
    return;
  }

  try {
    setLoading(true);
    setAnalysis(null);

    const res = await fetch("/api/ads-assistant/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ businessInput }),
    });

    const data = await res.json();

    if (!res.ok || !data?.success) {
      throw new Error(data?.error || "Analysis failed");
    }

    setAnalysis(data.analysis);
  } catch (error) {
    console.error(error);
    setAnalysis({
      error: "Не успяхме да анализираме рекламата. Опитай отново.",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-[#f5f1ec] px-4 py-8 text-neutral-950">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[32px] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
            Facebook Ads Assistant
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Кажи каква реклама искаш — AI ще ти покаже как да я пуснеш
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Опиши бизнеса си, какво рекламираш и какъв резултат искаш.
            AI ще прецени коя Facebook реклама е подходяща и ще зареди
            конкретни стъпки с видео инструкция.
          </p>

          <textarea
            value={businessInput}
            onChange={(e) => setBusinessInput(e.target.value)}
            placeholder="Пример: Имам салон за лазерна епилация в Пловдив и искам повече записвания чрез Instagram и Facebook..."
            className="mt-8 min-h-[190px] w-full rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-5 text-sm leading-6 text-neutral-900 outline-none transition focus:border-black"
          />

          <button
            type="button"
            onClick={handleAnalyze}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-black px-6 py-4 text-sm font-black text-white transition hover:opacity-90 sm:w-auto"
          >
            {loading ? "AI анализира..." : "Анализирай рекламата"}
          </button>

          {analysis ? (
  <div className="mt-8 rounded-[28px] border border-neutral-200 bg-[#faf8f6] p-5">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
      AI препоръка
    </p>

    {analysis.error ? (
      <p className="mt-3 text-sm font-semibold leading-6 text-red-700">
        {analysis.error}
      </p>
    ) : (
      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Подходящ тип реклама
          </p>
          <p className="mt-2 text-lg font-black text-neutral-950">
            {analysis.recommendedGuide}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Защо
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {analysis.reason}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
              Бизнес
            </p>
            <p className="mt-2 text-sm font-bold text-neutral-900">
              {analysis.businessType}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
              Цел
            </p>
            <p className="mt-2 text-sm font-bold text-neutral-900">
              {analysis.goal}
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
) : null}
        </div>
      </section>
    </main>
  );
}