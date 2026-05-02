"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BrandProfile = {
  id?: string;
  brand_name: string;
  website?: string | null;
  phone?: string | null;
  social_links?: string | null;
  brand_description?: string | null;
  preferred_colors?: string | null;
  logo_url?: string | null;
};

type ExportVariation = {
  post_text?: string;
  hashtags?: string;
};

type ExportPayload = {
  brand_profile: BrandProfile;
  user_request: string;
  tone: "soft" | "luxury" | "aggressive";
  selected_variation: ExportVariation;
  exported_at: string;
};

export default function BrandExportPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<ExportPayload | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("active_brand_export");

      if (stored) {
        const parsed = JSON.parse(stored) as ExportPayload;
        setPayload(parsed);
      }
    } catch (err) {
      console.error("Failed to load active_brand_export:", err);
    } finally {
      setPageLoading(false);
    }
  }, []);

  function handleGoBack() {
    router.push("/dashboard/brand-workspace");
  }

  function handlePrepareBannerOnly() {
    if (!payload) return;

    const bannerPayload = {
      mode: "banner",
      source: "brand-export",
      brand_profile: payload.brand_profile,
      post_text: payload.selected_variation?.post_text || "",
      hashtags: payload.selected_variation?.hashtags || "",
      user_request: payload.user_request || "",
    };

    localStorage.setItem("brand_media_export", JSON.stringify(bannerPayload));
    router.push("/dashboard?mode=quick");
  }

  function handlePrepareVideoOnly() {
    if (!payload) return;

    const videoPayload = {
      mode: "video",
      source: "brand-export",
      brand_profile: payload.brand_profile,
      post_text: payload.selected_variation?.post_text || "",
      hashtags: payload.selected_variation?.hashtags || "",
      user_request: payload.user_request || "",
    };

    localStorage.setItem("brand_media_export", JSON.stringify(videoPayload));
    alert("Video flow ще вържем в следващата стъпка.");
  }

  function handlePrepareBannerAndVideo() {
    if (!payload) return;

    const comboPayload = {
      mode: "banner_video",
      source: "brand-export",
      brand_profile: payload.brand_profile,
      post_text: payload.selected_variation?.post_text || "",
      hashtags: payload.selected_variation?.hashtags || "",
      user_request: payload.user_request || "",
    };

    localStorage.setItem("brand_media_export", JSON.stringify(comboPayload));
    router.push("/dashboard?mode=quick");
  }

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-[#0b1020] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-8">
            Зареждане...
          </div>
        </div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="min-h-screen bg-[#0b1020] px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-200">
            Няма export данни. Върни се в Brand Workspace и избери вариант за export.
          </div>

          <button
            type="button"
            onClick={handleGoBack}
            className="rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Назад към Brand Workspace
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand Export</h1>
            <p className="mt-2 text-white/70">
              Подготви следващата стъпка: банер, видео или и двете.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoBack}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
          >
            Назад
          </button>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
            Активен бранд
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{payload.brand_profile.brand_name}</h2>

              {payload.brand_profile.brand_description ? (
                <p className="mt-3 max-w-3xl text-white/75">
                  {payload.brand_profile.brand_description}
                </p>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {payload.brand_profile.website ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wider text-white/50">Сайт</p>
                    <p className="mt-1 break-words text-sm text-white/90">
                      {payload.brand_profile.website}
                    </p>
                  </div>
                ) : null}

                {payload.brand_profile.phone ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wider text-white/50">Телефон</p>
                    <p className="mt-1 text-sm text-white/90">{payload.brand_profile.phone}</p>
                  </div>
                ) : null}

                {payload.brand_profile.preferred_colors ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-white/50">
                      Предпочитани цветове
                    </p>
                    <p className="mt-1 text-sm text-white/90">
                      {payload.brand_profile.preferred_colors}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {payload.brand_profile.logo_url ? (
              <div className="w-full md:w-48">
                <div className="rounded-3xl border border-white/10 bg-white p-4">
                  <img
                    src={payload.brand_profile.logo_url}
                    alt={payload.brand_profile.brand_name}
                    className="h-32 w-full object-contain"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
              Избран пост
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm text-white/60">Текст</p>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="whitespace-pre-line text-[15px] leading-7 text-white/90">
                    {payload.selected_variation?.post_text || "Няма текст."}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-white/60">Хаштагове</p>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="whitespace-pre-line text-sm leading-6 text-white/85">
                    {payload.selected_variation?.hashtags || "Няма хаштагове."}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-white/60">Original request</p>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="whitespace-pre-line text-sm leading-6 text-white/80">
                    {payload.user_request}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4 inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-sm text-fuchsia-300">
              Следваща стъпка
            </div>

            <div className="grid gap-4">
              <button
                type="button"
                onClick={handlePrepareBannerOnly}
                className="rounded-3xl border border-white/10 bg-black/20 p-5 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
              >
                <div className="text-lg font-semibold text-white">🖼️ Генерирай банер</div>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Използвай избрания пост и активния бранд като основа за рекламен банер.
                </p>
              </button>

              <button
                type="button"
                onClick={handlePrepareVideoOnly}
                className="rounded-3xl border border-white/10 bg-black/20 p-5 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
              >
                <div className="text-lg font-semibold text-white">🎬 Генерирай видео</div>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Подготви следващ workflow за видео content на база същия пост.
                </p>
              </button>

              <button
                type="button"
                onClick={handlePrepareBannerAndVideo}
                className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/15"
              >
                <div className="text-lg font-semibold text-white">🚀 Генерирай банер + видео</div>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Подготви комбиниран workflow за visual assets по избрания пост.
                </p>
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
              На този етап банер бутонът ще води към quick mode, за да вържем следващата логика спокойно и подредено.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}