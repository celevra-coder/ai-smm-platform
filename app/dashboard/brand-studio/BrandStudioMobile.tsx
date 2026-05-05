 "use client";
 import { useState } from "react";

type BrandProfile = {
  brand_name?: string;
  business_address?: string;
  phone?: string;
  brand_description?: string;
  preferred_colors?: string;
  logo_url?: string;
};

type Props = {
  brandName: string;
  selectedPostText: string;

  workspace: {
    brand_profile?: BrandProfile;
  };

  generatedBannerUrl: string;
  generatedVideoUrl: string;
  uploadedImageUrl: string;
  imageUsageMode: "exact" | "elements" | "integrate";
  videoDuration: 5 | 10;

  isGenerating: boolean;
  isVideoGenerating: boolean;
  isGeneratingVideoFrames: boolean;
  isAdminUser: boolean;
  useFakeVideo: boolean;

  renderBannerCard: () => React.ReactNode;

  onCopyPostText: () => void;
  onGenerateCampaign: () => void;
  onGenerateBanner: () => void;
  onDownloadBanner: () => void;
  onCopyBanner: () => void;
  onOpenVideoSetup: () => void;
  onVideoDurationChange: (value: 5 | 10) => void;
  onUseFakeVideoToggle: () => void;

  onImageUpload: (value: string) => void;
  onClearImage: () => void;
  onImageUsageModeChange: (value: "exact" | "elements" | "integrate") => void;

  videoFrameOptions: string[];
  selectedVideoFrameUrl: string;
  setSelectedVideoFrameUrl: (value: string) => void;

  uploadedVideoImageUrl: string;
  setUploadedVideoImageUrl: (value: string) => void;
  setUploadedVideoImageName: (value: string) => void;

  videoErrorText: string;

  showVideoSetupModal: boolean;
  setShowVideoSetupModal: (value: boolean) => void;

  videoSetupMode: "campaign" | "video";
  onContinueFromVideoSetup: () => void;
};

export default function BrandStudioMobile({
  brandName,
  selectedPostText,
  workspace,
  generatedBannerUrl,
  generatedVideoUrl,
  uploadedImageUrl,
  imageUsageMode,
  videoDuration,
  isGenerating,
  isVideoGenerating,
  isGeneratingVideoFrames,
  isAdminUser,
  useFakeVideo,
  renderBannerCard,
  onCopyPostText,
  onGenerateCampaign,
  onGenerateBanner,
  onDownloadBanner,
  onCopyBanner,
  onOpenVideoSetup,
  onVideoDurationChange,
  onUseFakeVideoToggle,
  onImageUpload,
  onClearImage,
  onImageUsageModeChange,
    videoFrameOptions,
  selectedVideoFrameUrl,
  setSelectedVideoFrameUrl,
  uploadedVideoImageUrl,
  setUploadedVideoImageUrl,
  setUploadedVideoImageName,
  videoErrorText,
  showVideoSetupModal,
  setShowVideoSetupModal,
  videoSetupMode,
  onContinueFromVideoSetup,
}: Props) {
  const [isBannerZoomed, setIsBannerZoomed] = useState(false);

  return (
    <main className="min-h-screen bg-[#f5f1ec] px-3 py-4 text-black">
      <section className="rounded-[26px] bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
          Brand Studio
        </p>

        <h1 className="mt-2 text-[28px] font-black leading-none tracking-[-0.04em]">
          Кампания
        </h1>

        <p className="mt-2 text-xs leading-5 text-neutral-500">
          Създай банер и видео за избрания пост.
        </p>
      </section>

      <section className="mt-3 rounded-[26px] bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
          Бранд
        </p>

        <div className="mt-3 flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f7f3ee]">
            {workspace.brand_profile?.logo_url ? (
              <img
                src={workspace.brand_profile.logo_url}
                alt={brandName}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <span className="text-xs font-black text-neutral-400">AI</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-black">{brandName}</h2>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
              {workspace.brand_profile?.brand_description ||
                "Няма brand description."}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-3 rounded-[26px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
            Избран пост
          </p>

          <button
            type="button"
            onClick={onCopyPostText}
            className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold"
          >
            📋 Копирай
          </button>
        </div>

        <details className="mt-3 rounded-[18px] bg-[#f7f3ee] p-3">
          <summary className="cursor-pointer text-sm font-black">
            Виж текста
          </summary>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
            {selectedPostText}
          </p>
        </details>
      </section>

      <button
        type="button"
        onClick={onGenerateCampaign}
        disabled={isGenerating || isGeneratingVideoFrames || isVideoGenerating}
        className="mt-3 w-full rounded-[22px] bg-black px-5 py-4 text-sm font-black text-white disabled:opacity-60"
      >
        {isGenerating || isGeneratingVideoFrames || isVideoGenerating
          ? "Генериране..."
          : "🚀 Генерирай цялата кампания"}
      </button>

      <section className="mt-3 rounded-[26px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-black tracking-[-0.03em]">
            Банер
          </h2>

          <button
            type="button"
            onClick={onGenerateBanner}
            disabled={isGenerating}
            className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {isGenerating ? "..." : "Генерирай"}
          </button>
        </div>

                <div
          className="mt-4 cursor-zoom-in overflow-hidden rounded-[22px] bg-[#f7f3ee]"
          onDoubleClick={() => generatedBannerUrl && setIsBannerZoomed(true)}
        >
          {renderBannerCard()}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDownloadBanner}
            disabled={!generatedBannerUrl}
            className="rounded-[18px] bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            ⬇ Свали
          </button>

          <button
            type="button"
            onClick={onCopyBanner}
            disabled={!generatedBannerUrl}
            className="rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm font-bold disabled:opacity-40"
          >
            📋 Копирай
          </button>
        </div>

        <details className="mt-4 rounded-[18px] bg-[#f7f3ee] p-3">
          <summary className="cursor-pointer text-sm font-black">
            Качи снимка за банера
          </summary>

          <div className="mt-3 flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[18px] bg-white text-center text-xs text-neutral-400">
            {uploadedImageUrl ? (
              <img
                src={uploadedImageUrl}
                alt="Uploaded preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="px-5 leading-5">
                По желание качи снимка за рекламния банер.
              </span>
            )}
          </div>

          {uploadedImageUrl ? (
            <div className="mt-3 grid gap-2">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                Как да се използва?
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "exact", label: "1:1" },
                  { key: "elements", label: "Елементи" },
                  { key: "integrate", label: "Интегрирай" },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() =>
                      onImageUsageModeChange(
                        mode.key as "exact" | "elements" | "integrate"
                      )
                    }
                    className={`rounded-[14px] px-2 py-2 text-[11px] font-bold ${
                      imageUsageMode === mode.key
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center justify-center rounded-[18px] bg-black px-4 py-3 text-sm font-bold text-white">
              Качи
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onloadend = () => {
                    onImageUpload(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={onClearImage}
              disabled={!uploadedImageUrl}
              className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 disabled:opacity-40"
            >
              Премахни
            </button>
          </div>
        </details>
      </section>

      <section className="mt-3 rounded-[26px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-black tracking-[-0.03em]">
            Видео
          </h2>

          <button
            type="button"
            onClick={onOpenVideoSetup}
            disabled={isVideoGenerating || isGeneratingVideoFrames}
            className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {isVideoGenerating || isGeneratingVideoFrames ? "..." : "Генерирай"}
          </button>
        </div>

        <div className="mt-4 flex aspect-[9/16] items-center justify-center overflow-hidden rounded-[22px] bg-[#f7f3ee] text-sm text-black/50">
          {generatedVideoUrl ? (
            <video
              src={generatedVideoUrl}
              controls
              className="h-full w-full object-cover"
            />
          ) : isVideoGenerating ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-black/15 border-t-black" />
              <p className="text-sm font-bold text-neutral-600">
                Генериране на видео...
              </p>
            </div>
          ) : (
            "Преглед на видеото"
          )}
        </div>

        {generatedVideoUrl ? (
          <a
            href={generatedVideoUrl}
            download="video.mp4"
            className="mt-3 flex w-full items-center justify-center rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm font-bold"
          >
            ⬇ Свали видео
          </a>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {[5, 10].map((duration) => (
            <button
              key={duration}
              type="button"
              onClick={() => onVideoDurationChange(duration as 5 | 10)}
              className={`rounded-[16px] border px-4 py-3 text-sm font-black ${
                videoDuration === duration
                  ? "bg-black text-white"
                  : "border-black/10 bg-white text-black"
              }`}
            >
              {duration}s
            </button>
          ))}
        </div>

        {isAdminUser ? (
          <button
            type="button"
            onClick={onUseFakeVideoToggle}
            className={`mt-3 w-full rounded-[18px] border px-4 py-3 text-xs font-bold ${
              useFakeVideo
                ? "border-green-300 bg-green-100 text-green-700"
                : "border-red-300 bg-red-100 text-red-700"
            }`}
          >
            {useFakeVideo ? "DEV MODE" : "REAL MODE"}
          </button>
        ) : null}
      </section>
      {showVideoSetupModal ? (
  <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 pt-6 pb-24">
    <div className="w-full max-w-md rounded-[24px] bg-white p-4">
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black">Избери кадър</h3>

        <button
          onClick={() => setShowVideoSetupModal(false)}
          className="text-sm text-neutral-500"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 max-h-[65vh] space-y-3 overflow-y-auto pr-1">
        {isGeneratingVideoFrames ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-black/15 border-t-black" />
            <p className="text-sm text-neutral-500">Генерирам кадри...</p>
          </div>
        ) : (
          videoFrameOptions.map((frame, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedVideoFrameUrl(frame);
                setUploadedVideoImageUrl("");
              }}
              className={`w-full overflow-hidden rounded-2xl border ${
                selectedVideoFrameUrl === frame
                  ? "border-black"
                  : "border-black/10"
              }`}
            >
              <img
                src={frame}
                className="aspect-[9/16] w-full object-cover"
              />
            </button>
          ))
        )}
      </div>

      {videoErrorText ? (
        <div className="mt-3 text-sm text-red-500">
          {videoErrorText}
        </div>
      ) : null}

      <div className="sticky bottom-0 mt-4 bg-white pt-3">
  <button
    onClick={onContinueFromVideoSetup}
    disabled={!selectedVideoFrameUrl && !uploadedVideoImageUrl}
    className="w-full rounded-full bg-black py-3 text-sm font-bold text-white disabled:opacity-40"
  >
    Продължи
  </button>
</div>
    </div>
  </div>
) : null}

{isBannerZoomed && generatedBannerUrl ? (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
    onClick={() => setIsBannerZoomed(false)}
  >
    <div
      className="relative w-full max-w-[430px]"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setIsBannerZoomed(false)}
        className="absolute -right-2 -top-2 z-10 rounded-full bg-white px-3 py-2 text-sm font-black text-black shadow-lg"
      >
        ✕
      </button>

      <div className="overflow-hidden rounded-[28px] bg-[#f7f3ee] shadow-2xl">
        {renderBannerCard()}
      </div>
    </div>
  </div>
) : null}
    </main>
  );
}