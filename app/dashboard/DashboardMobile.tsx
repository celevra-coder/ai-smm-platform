"use client";
import React from "react";
import MobileBannerComposition from "./MobileBannerComposition";
type ImageUsageMode = "auto" | "integrate" | "exact";

type Props = {
  description: string;
  setDescription: (value: string) => void;
  offerText: string;
  setOfferText: (value: string) => void;
  discountText: string;
  setDiscountText: (value: string) => void;
  periodText: string;
  setPeriodText: (value: string) => void;
  quickPhone: string;
  setQuickPhone: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  exactText: string;
  setExactText: (value: string) => void;
  extraText: string;
  setExtraText: (value: string) => void;
  previewRef: React.RefObject<HTMLDivElement | null>;
  mobileBannerHeadline: string;
mobileBannerSubtext: string;
mobileBannerOfferBadge: string;
mobileBannerSupportLines: string[];
mobileBannerPhone: string;

  logoUrl: string;
  logoFileName: string;
  logoUploading: boolean;
  logoUploadMessage: string;
  onLogoClick: () => void;
  onClearLogo: () => void;

  imageUrl: string;
  imageFileName: string;
  imageUploading: boolean;
  imageUploadMessage: string;
  imageUsageMode: ImageUsageMode;
  setImageUsageMode: (value: ImageUsageMode) => void;
  onImageClick: () => void;
  onClearImage: () => void;

  loading: boolean;
  message: string;
  generatedImageUrl: string;
  previewImageSource: string;
  renderBanner: () => React.ReactNode;

  onGenerate: () => void;
  onCopy: () => void;
  onFullscreen: () => void;
  onDownloadPng: () => void;
  onDownloadJpg: () => void;
  copyingBanner: boolean;
};

export default function DashboardMobile({
  description,
  setDescription,
  offerText,
  setOfferText,
  discountText,
  setDiscountText,
  periodText,
  setPeriodText,
  quickPhone,
  setQuickPhone,
  address,
  setAddress,
  exactText,
  setExactText,
  extraText,
  setExtraText,

  logoUrl,
  logoFileName,
  logoUploading,
  logoUploadMessage,
  onLogoClick,
  onClearLogo,

  imageUrl,
  imageFileName,
  imageUploading,
  imageUploadMessage,
  imageUsageMode,
  setImageUsageMode,
  onImageClick,
  onClearImage,

  loading,
  message,
  generatedImageUrl,
  previewImageSource,
  previewRef,
  mobileBannerHeadline,
mobileBannerSubtext,
mobileBannerOfferBadge,
mobileBannerSupportLines,
mobileBannerPhone,
  renderBanner,

  onGenerate,
  onCopy,
  onFullscreen,
  onDownloadPng,
  onDownloadJpg,
  copyingBanner,
}: Props) {
  return (
    <main className="min-h-screen bg-[#f5f1ec] px-3 py-4 text-black">
      <section className="rounded-[26px] bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
          Quick Banner
        </p>

        <h1 className="mt-2 text-[28px] font-black leading-none tracking-[-0.04em] text-neutral-950">
          Бърз рекламен банер
        </h1>

        

        <div className="mt-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-neutral-800">
              Описание
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Напр. Банер за курс, салон, оферта, услуга..."
              className="w-full rounded-[20px] border border-black/10 bg-[#fcfaf7] px-4 py-3 text-sm outline-none"
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-neutral-700">
              Оферта
            </span>
            <input
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              placeholder="Оферта"
              className="w-full rounded-[18px] border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-neutral-700">
              Цена / %
            </span>
            <input
              value={discountText}
              onChange={(e) => setDiscountText(e.target.value)}
              placeholder="-20%"
              className="w-full rounded-[18px] border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-neutral-700">
              Период
            </span>
            <input
              value={periodText}
              onChange={(e) => setPeriodText(e.target.value)}
              placeholder="Само днес"
              className="w-full rounded-[18px] border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-neutral-700">
              Телефон
            </span>
            <input
              value={quickPhone}
              onChange={(e) => setQuickPhone(e.target.value)}
              placeholder="0888..."
              className="w-full rounded-[18px] border border-black/10 bg-white px-3 py-3 text-sm outline-none"
            />
          </label>
        </div>

        <details className="mt-3 rounded-[20px] border border-black/10 bg-[#fcfaf7] p-4">
          <summary className="cursor-pointer text-sm font-black">
            Допълнителни настройки
          </summary>

          <div className="mt-4 grid gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-neutral-700">
                Адрес
              </span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Адрес / град"
                className="w-full rounded-[18px] border border-black/10 bg-white px-3 py-3 text-sm outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-neutral-700">
                Точен текст
              </span>
              <textarea
                value={exactText}
                onChange={(e) => setExactText(e.target.value)}
                rows={2}
                className="w-full rounded-[18px] border border-black/10 bg-white px-3 py-3 text-sm outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-neutral-700">
                Допълнителни изисквания
              </span>
              <textarea
                value={extraText}
                onChange={(e) => setExtraText(e.target.value)}
                rows={2}
                className="w-full rounded-[18px] border border-black/10 bg-white px-3 py-3 text-sm outline-none"
              />
            </label>
          </div>
        </details>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onLogoClick}
            disabled={logoUploading}
            className="rounded-[18px] border border-black/10 bg-white px-3 py-3 text-sm font-bold disabled:opacity-60"
          >
            {logoUploading ? "Качване..." : logoUrl ? "Смени лого" : "Качи лого"}
          </button>

          <button
            type="button"
            onClick={onImageClick}
            disabled={imageUploading}
            className="rounded-[18px] border border-black/10 bg-white px-3 py-3 text-sm font-bold disabled:opacity-60"
          >
            {imageUploading ? "Качване..." : imageUrl ? "Смени снимка" : "Качи снимка"}
          </button>
        </div>

        {logoUrl || imageUrl ? (
          <div className="mt-3 grid gap-2">
            {logoUrl ? (
              <div className="flex items-center justify-between rounded-[18px] bg-[#fcfaf7] px-3 py-3">
                <span className="min-w-0 truncate text-xs font-semibold text-neutral-600">
                  Лого: {logoFileName || "качено"}
                </span>
                <button
                  type="button"
                  onClick={onClearLogo}
                  className="text-xs font-bold text-red-700"
                >
                  Махни
                </button>
              </div>
            ) : null}

            {imageUrl ? (
              <div className="rounded-[18px] bg-[#fcfaf7] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-xs font-semibold text-neutral-600">
                    Снимка: {imageFileName || "качена"}
                  </span>
                  <button
                    type="button"
                    onClick={onClearImage}
                    className="text-xs font-bold text-red-700"
                  >
                    Махни
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[
                    { key: "auto", label: "Авто" },
                    { key: "integrate", label: "Вграждане" },
                    { key: "exact", label: "Точно" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setImageUsageMode(item.key as ImageUsageMode)}
                      className={`rounded-xl px-2 py-2 text-[11px] font-bold ${
                        imageUsageMode === item.key
                          ? "bg-black text-white"
                          : "bg-white text-neutral-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onGenerate}
          disabled={loading || logoUploading || imageUploading}
          className="mt-4 w-full rounded-[20px] bg-neutral-950 px-5 py-4 text-sm font-black text-white disabled:opacity-60"
        >
          {loading ? "Генериране..." : "Генерирай банер"}
        </button>

        {message ? (
          <div className="mt-3 rounded-[18px] bg-[#f8f5ef] px-4 py-3 text-xs font-semibold text-neutral-700">
            {message}
          </div>
        ) : null}
      </section>

      <section className="mt-3 rounded-[26px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-black tracking-[-0.03em]">
            Преглед
          </h2>

          {generatedImageUrl ? (
            <button
              type="button"
              onClick={onFullscreen}
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-bold"
            >
              Цял екран
            </button>
          ) : null}
        </div>

       <div className="mt-4 overflow-hidden rounded-[22px] border border-black/10 bg-[#f5f1ec]">
  <div ref={previewRef} className="bg-[#f5f1ec]">

    {loading ? (
      <div className="flex aspect-square items-center justify-center p-6 text-center">
        <div>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
          <p className="mt-4 text-sm font-bold">
            Генерираме рекламата...
          </p>
        </div>
      </div>
       ) : generatedImageUrl ? (
      renderBanner()
    ) : (
      <div className="flex aspect-square items-center justify-center p-6 text-center">
        <p className="text-sm font-bold text-neutral-500">
          Все още няма генериран банер.
        </p>
      </div>
    )}

  </div>
</div>

        {previewImageSource ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCopy}
              disabled={copyingBanner}
              className="rounded-[18px] border border-black/10 bg-white px-3 py-3 text-xs font-bold disabled:opacity-60"
            >
              {copyingBanner ? "Копиране..." : "Копирай"}
            </button>

            <button
  type="button"
  onClick={onDownloadPng}
  className="w-full rounded-[20px] bg-black px-5 py-3 text-[15px] font-bold text-white"
>
  Свали банера
</button>
          </div>
        ) : null}
      </section>
    </main>
  );
}