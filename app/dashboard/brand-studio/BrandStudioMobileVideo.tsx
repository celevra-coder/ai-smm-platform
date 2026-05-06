"use client";

type Props = {
  generatedVideoUrl: string;
  videoDuration: 5 | 10;

  isVideoGenerating: boolean;
  isGeneratingVideoFrames: boolean;
  isAdminUser: boolean;
  useFakeVideo: boolean;

  onOpenVideoSetup: () => void;
  onVideoDurationChange: (value: 5 | 10) => void;
  onUseFakeVideoToggle: () => void;

  videoFrameOptions: string[];
  selectedVideoFrameUrl: string;
  setSelectedVideoFrameUrl: (value: string) => void;

  uploadedVideoImageUrl: string;
  setUploadedVideoImageUrl: (value: string) => void;
  setUploadedVideoImageName: (value: string) => void;

  videoErrorText: string;

  showVideoSetupModal: boolean;
setShowVideoSetupModal: (value: boolean) => void;

mobileVideoText: string;
setMobileVideoText: (value: string) => void;

onGenerateVideoFrames: () => void;
  onContinueFromVideoSetup: () => void;
};

export default function BrandStudioMobileVideo({
  generatedVideoUrl,
  videoDuration,
  isVideoGenerating,
  isGeneratingVideoFrames,
  isAdminUser,
  useFakeVideo,
  onOpenVideoSetup,
  onVideoDurationChange,
  onUseFakeVideoToggle,
  videoFrameOptions,
  selectedVideoFrameUrl,
  setSelectedVideoFrameUrl,
  uploadedVideoImageUrl,
  setUploadedVideoImageUrl,
  setUploadedVideoImageName,
  videoErrorText,
  showVideoSetupModal,
setShowVideoSetupModal,
mobileVideoText,
setMobileVideoText,
onGenerateVideoFrames,
  onContinueFromVideoSetup,
}: Props) {
  return (
    <>
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
            <div className="px-6 text-center">
              <p className="text-sm font-black text-neutral-600">
                Видеото още не е генерирано
              </p>
              <p className="mt-2 text-xs leading-5 text-neutral-400">
                Натисни „Генерирай“, избери кадър или качи изображение, после продължи към създаване на видео.
              </p>
            </div>
                    )}
                </div>

        {!generatedVideoUrl && (selectedVideoFrameUrl || uploadedVideoImageUrl) ? (
          <div className="mt-3 rounded-[18px] bg-[#f7f3ee] px-4 py-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Избран кадър за видеото
            </p>
            <p className="mt-1 text-sm font-black text-neutral-700">
              {uploadedVideoImageUrl ? "Качено изображение" : "AI генериран кадър"}
            </p>
          </div>
        ) : null}

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
              ) : videoFrameOptions.length === 0 ? (
                <div className="rounded-2xl bg-[#f7f3ee] p-4 text-center">
                  <p className="text-sm leading-6 text-neutral-500">
                    Генерирай кадри за видеото или качи свое изображение.
                  </p>

                  <button
                    type="button"
                    onClick={onGenerateVideoFrames}
                    className="mt-4 w-full rounded-full bg-black px-5 py-3 text-sm font-bold text-white"
                  >
                    ✨ Генерирай кадри
                  </button>
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
                        ? "border-black ring-4 ring-black"
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

            <div className="mt-4 rounded-2xl bg-[#f7f3ee] p-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                Или качи свое изображение
              </p>

              <div className="mt-3 flex min-h-[160px] items-center justify-center overflow-hidden rounded-2xl bg-white text-center text-xs text-neutral-400">
                {uploadedVideoImageUrl ? (
                  <img
                    src={uploadedVideoImageUrl}
                    alt="Uploaded video image"
                    className="max-h-[260px] w-full object-contain"
                  />
                ) : (
                  "Няма качено изображение"
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="flex cursor-pointer items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-bold text-white">
                  Качи
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();

                      reader.onloadend = () => {
                        setUploadedVideoImageUrl(reader.result as string);
                        setUploadedVideoImageName(file.name);
                        setSelectedVideoFrameUrl("");
                      };

                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setUploadedVideoImageUrl("");
                    setUploadedVideoImageName("");
                  }}
                  disabled={!uploadedVideoImageUrl}
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 disabled:opacity-40"
                >
                  Премахни
                </button>
              </div>
            </div>

                        <div className="mt-4 rounded-2xl bg-[#f7f3ee] p-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                Текст във видеото
              </p>

              <textarea
                value={mobileVideoText}
                onChange={(e) => setMobileVideoText(e.target.value)}
                placeholder="Напиши точния текст, който искаш да се вижда във видеото."
                className="mt-3 min-h-[96px] w-full resize-none rounded-2xl border border-black/10 bg-white p-3 text-sm font-semibold text-black outline-none"
              />
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
    </>
  );
}