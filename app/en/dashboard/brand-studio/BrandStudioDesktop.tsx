"use client";

import type { RefObject, ReactNode } from "react";
import BrandStudioDesktopBanner from "./BrandStudioDesktopBanner";
import { toPng } from "html-to-image";

type Props = {
  brandName: string;
  brandDescription?: string;
  selectedPostText: string;
  onCopyPostText: () => void;
  onOpenBannerZoom: () => void;
  businessAddress?: string;
phone?: string;
generatedBannerPlan: any;
logoUrl?: string;


  isGenerating: boolean;
  isVideoGenerating: boolean;
  isGeneratingVideoFrames: boolean;
  onGenerateCampaign: () => void;

  generatedBannerUrl: string;
  renderBannerCard: () => ReactNode;
  onGenerateBanner: () => void;
  onDownloadBanner: () => void;
  onCopyBanner: () => void;

  uploadedImageUrl: string;
  setUploadedImageUrl: (value: string) => void;
  imageUsageMode: "exact" | "elements" | "integrate";
  setImageUsageMode: (value: "exact" | "elements" | "integrate") => void;
  bannerSectionRef: RefObject<HTMLDivElement | null>;

  generatedVideoUrl: string;
  videoDuration: 5 | 10;
  setVideoDuration: (value: 5 | 10) => void;
  onGenerateVideo: () => void;

  isAdminUser: boolean;
  useFakeVideo: boolean;
  setUseFakeVideo: (value: (prev: boolean) => boolean) => void;
};

export default function BrandStudioDesktop({
  brandName,
  brandDescription,
  selectedPostText,
  onCopyPostText,
  isGenerating,
  isVideoGenerating,
  isGeneratingVideoFrames,
  onGenerateCampaign,
  generatedBannerUrl,
generatedBannerPlan,
renderBannerCard,
  onGenerateBanner,
  onDownloadBanner,
  onCopyBanner,
  uploadedImageUrl,
  setUploadedImageUrl,
  imageUsageMode,
  setImageUsageMode,
  bannerSectionRef,
  
  generatedVideoUrl,
  videoDuration,
  setVideoDuration,
  onGenerateVideo,
  isAdminUser,
  useFakeVideo,
  setUseFakeVideo,
  onOpenBannerZoom,
  businessAddress,
phone,
logoUrl,
}: Props) {
    // DESKTOP banner data (временно - ще стане независим от mobile)
const hasBanner = !!generatedBannerUrl;
  const isBusy = isGenerating || isVideoGenerating || isGeneratingVideoFrames;
  const headlineText =
  generatedBannerPlan?.headline?.trim() ||
  selectedPostText.split(/[.!?]/)[0];

const subtextText = generatedBannerPlan?.subtext?.trim() || "";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-black">
          Brand Studio
        </h1>
        <p className="mt-2 text-sm text-black/50">
          Създай пост, банер и видео за своя бранд на едно място
        </p>
      </div>

      <div className="mb-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
          Brand
        </p>
        <p className="mt-3 text-xl font-semibold text-black">{brandName}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-black/65">
          {brandDescription || "Няма brand description."}
        </p>
      </div>

      <div className="mb-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
            Избран пост
          </p>

          <button
            type="button"
            onClick={onCopyPostText}
            className="rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-black hover:text-white"
          >
            📋 Копирай
          </button>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-black/80">
          {headlineText}
        </p>
      </div>

      <div className="mb-8">
        <button
          onClick={onGenerateCampaign}
          disabled={isBusy}
          className="rounded-full border border-black/15 bg-white px-6 py-4 font-semibold text-black transition hover:scale-[1.02] hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-black"
        >
          {isBusy ? "Генериране..." : "🚀 Генерирай цялата кампания"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          ref={bannerSectionRef}
          className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
            Рекламен банер
          </p>

          <div
  className="mt-4 cursor-zoom-in overflow-hidden rounded-2xl text-sm"
  style={{ backgroundColor: "#f7f3ee", color: "rgba(0,0,0,0.5)" }}
  onClick={onOpenBannerZoom}
>
           <div className="relative mx-auto w-full max-w-[400px]">
  {hasBanner ? (
    <div ref={bannerSectionRef}>
      <BrandStudioDesktopBanner
        generatedBannerUrl={generatedBannerUrl}
        brandName={brandName}
        headlineText={headlineText}
        subtextText={subtextText}
        phone={phone}
        logoUrl={logoUrl}
      />
    </div>
  ) : (
    <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-black/10 bg-[#f7f3ee] text-sm text-black/45">
  {isGenerating ? (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-black/15 border-t-black" />
      <div className="text-sm font-semibold text-black/55">
        Генериране на банер...
      </div>
    </div>
  ) : (
    "Няма генериран банер"
  )}
</div>
  )}
</div>
</div>

<div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={onGenerateBanner}
              disabled={isGenerating}
              className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isGenerating ? "Генериране..." : "🖼 Генерирай банер"}
            </button>

            <button
  type="button"
  onClick={onDownloadBanner}
  disabled={!generatedBannerUrl || isGenerating}
  className="rounded-full border border-black/15 bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black disabled:hover:scale-100"
>
  ⬇ Изтегли
</button>

            <button
  type="button"
  onClick={onCopyBanner}
  disabled={!generatedBannerUrl || isGenerating}
  className="rounded-full border border-black/15 bg-white px-5 py-2 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-black"
>
  📋 Копирай
</button>
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-[#f7f3ee] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
              Качено изображение
            </p>

            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-white text-sm text-black/40">
              {uploadedImageUrl ? (
                <img
                  src={uploadedImageUrl}
                  alt="Uploaded preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="px-6 text-center leading-relaxed">
                  По желание качи своя снимка, която ще бъде използвана за рекламния банер
                </div>
              )}
            </div>

            {uploadedImageUrl ? (
              <div className="mt-4 grid gap-2">
                <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                  Как да се използва снимката?
                </p>

                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { key: "exact", label: "1:1" },
                    { key: "elements", label: "Само елементи" },
                    { key: "integrate", label: "Интегрирай" },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() =>
                        setImageUsageMode(
                          mode.key as "exact" | "elements" | "integrate"
                        )
                      }
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        imageUsageMode === mode.key
                          ? "bg-black text-white"
                          : "border border-black/15 bg-white text-black hover:bg-black hover:text-white"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex justify-center gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                Качи снимка
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setUploadedImageUrl(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </label>

              {uploadedImageUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setUploadedImageUrl("");
                    setImageUsageMode("integrate");
                  }}
                  className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
                >
                  🗑 Премахни
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
            Видео
          </p>

          <div className="mt-4 flex aspect-[9/16] items-center justify-center overflow-hidden rounded-2xl bg-[#f7f3ee] text-sm text-black/50">
            {generatedVideoUrl ? (
              <video
                src={generatedVideoUrl}
                controls
                className="h-full w-full object-cover"
              />
            ) : isVideoGenerating ? (
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-black/15 border-t-black" />
                <div className="text-sm font-medium text-black/60">
                  Генериране на видео...
                </div>
              </div>
            ) : (
              "Преглед на видеото"
            )}
          </div>

          {generatedVideoUrl ? (
            <div className="mt-2 flex justify-center">
              <a
                href={generatedVideoUrl}
                download="video.mp4"
                className="rounded-full border border-black/15 bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
              >
                ⬇ Изтегли видео
              </a>
            </div>
          ) : null}

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onGenerateVideo}
              disabled={isVideoGenerating || isGeneratingVideoFrames}
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVideoGenerating || isGeneratingVideoFrames
                ? "Генериране..."
                : "🎬 Генерирай видео"}
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            {[5, 10].map((d) => (
              <button
                key={d}
                onClick={() => setVideoDuration(d as 5 | 10)}
                className={`rounded-lg border px-4 py-2 ${
                  videoDuration === d
                    ? "bg-black text-white"
                    : "border-black/20 bg-white text-black"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>

          {isAdminUser ? (
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => setUseFakeVideo((prev) => !prev)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  useFakeVideo
                    ? "border-green-300 bg-green-100 text-green-700"
                    : "border-red-300 bg-red-100 text-red-700"
                }`}
              >
                {useFakeVideo
                  ? "DEV MODE (без кредити)"
                  : "REAL MODE (харчи кредити)"}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}