"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function EnglishQuickVideoPage() {
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [videoIdea, setVideoIdea] = useState("");
  const [phone, setPhone] = useState("");
  const [duration, setDuration] = useState<5 | 10>(5);

  const [generating, setGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const [generationError, setGenerationError] = useState("");

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const buildQuickOverlayText = () => {
    const source = `${businessName} ${businessDescription} ${videoIdea}`.toLowerCase();

    if (/dog|cat|pet|animal|barf|raw food/.test(source)) {
      return "Real food pets love";
    }

    if (/sushi/.test(source)) {
      return "Fresh sushi made to impress";
    }

    if (/restaurant|food|pizza|burger|coffee|dessert|cake|bakery/.test(source)) {
      return "A taste people notice";
    }

    if (/salon|beauty|hair|nails|massage|spa|cosmetic/.test(source)) {
      return "Professional care with visible results";
    }

    if (/gym|fitness|training|sport/.test(source)) {
      return "Start your change today";
    }

    if (businessDescription.trim()) {
      return "A realistic ad video for your business";
    }

    return "Create something worth noticing";
  };

  const buildQuickVideoPrompt = () => {
    const source = `${businessName} ${businessDescription} ${videoIdea}`.toLowerCase();

    let realismRules =
      "Create realistic vertical 9:16 commercial video footage. No text, no letters, no subtitles, no logos, no signs, no labels, no fake typography inside the raw video. Natural camera movement, believable real-world physics, realistic textures, realistic lighting, no plastic-looking objects, no AI fantasy, no distorted anatomy.";

    if (/dog|cat|pet|barf|raw food/.test(source)) {
      realismRules +=
        " Realistic home-style pet feeding scene. One realistic dog or cat eating soft natural pet food from a simple neutral bowl. No bones, no chew toys, no dry food, no kibble, no pellets, no biscuits, no pet snacks. Cozy warm home interior, wooden floor, soft natural lighting. Camera should focus on the pet and the bowl. Realistic food texture is extremely important.";
    }

    if (/sushi/.test(source)) {
      realismRules +=
        " Show realistic fresh sushi, real rice texture, fish texture, nori, wooden board or plate, restaurant lighting. Avoid plastic-looking food, fake glossy surfaces, impossible ingredients, or artificial shapes.";
    }

    return `
Main video scene:
${videoIdea.trim()}.

Business context only:
${businessDescription.trim()}.

Important:
The MAIN visual action and camera focus must follow ONLY the video idea section.
The business context is background information only and must NOT force unrelated objects, body parts, services, or scenes into the same shot.

Create one clean coherent commercial scene.
ABSOLUTELY NO TEXT INSIDE THE RAW VIDEO.
Do not generate captions, subtitles, typography, titles, labels, logos, UI elements, watermarks, posters, signs, product packaging text, or any readable letters.
The generated video must contain ONLY clean cinematic footage.
Any text overlay will be added later externally.

${realismRules}

Negative details:
text, subtitles, captions, letters, typography, logo, watermark, UI, distorted anatomy, plastic objects, fake labels, fake signs, unreadable text
`;
  };

  const savePendingQuickVideo = () => {
    localStorage.setItem(
      "pending_quick_video",
      JSON.stringify({
        businessName: businessName.trim(),
        businessDescription: businessDescription.trim(),
        videoIdea: videoIdea.trim(),
        phone: phone.trim(),
        duration,
      })
    );

    localStorage.setItem("pending_quick_video_locale", "en");
  };

  const handleGeneratePreview = async () => {
    try {
      setGenerationError("");

      if (!businessName.trim()) {
        setGenerationError("Please enter your business name.");
        return;
      }

      if (!businessDescription.trim()) {
        setGenerationError("Please describe what your business offers.");
        return;
      }

      if (!videoIdea.trim()) {
        setGenerationError("Please describe the video idea.");
        return;
      }

      setPreviewImages([]);
      setPreviewLoading(true);
      setShowPreviewModal(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video-frames`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            brand_profile: {
              brand_name: businessName,
              brand_description: businessDescription,
            },
            selected_post: {
              headline: videoIdea,
              caption: videoIdea,
              raw_text: videoIdea,
            },
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !Array.isArray(data?.images)) {
        throw new Error(
          data?.error ||
            data?.details ||
            `Preview failed. Status: ${res.status}.`
        );
      }

      setPreviewImages(data.images);
    } catch (error) {
      console.error(error);
      setShowPreviewModal(false);
      setGenerationError(
        error instanceof Error
          ? error.message
          : "We could not create the preview. Please try again."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    try {
      setGenerating(true);
      console.log("EN QUICK VIDEO: handleGenerateVideo started");
console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      setGenerationError("");
      setGeneratedVideoUrl("");

      if (!businessName.trim()) {
        setGenerationError("Please enter your business name.");
        return;
      }

      if (!businessDescription.trim()) {
        setGenerationError("Please describe what your business offers.");
        return;
      }

      if (!videoIdea.trim()) {
        setGenerationError("Please describe the video idea.");
        return;
      }

      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (!accessToken) {
        savePendingQuickVideo();
        window.location.href = "/en/pricing?source=quick-video";
        return;
      }

      console.log(
  "EN QUICK VIDEO: calling consume-credit",
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/consume-credit`
);

const creditRes = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/spend-credit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            action_type: "video",
            cost: duration === 5 ? 25 : 35,
          }),
        }
      );

      const creditData = await creditRes.json().catch(() => null);

      if (!creditRes.ok || !creditData?.success) {
        savePendingQuickVideo();
        window.location.href = "/en/pricing?source=quick-video";
        return;
      }

      console.log(
  "EN QUICK VIDEO: calling spend-credit",
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/spend-credit`
);

const generateRes = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            video_image_url: "",
            source_type: "text-only",
            duration,
            brand_profile: {
              brand_name: businessName.trim(),
              brand_description: businessDescription.trim(),
              phone: phone.trim(),
            },
            selected_post: {
              headline: buildQuickOverlayText(),
              caption: buildQuickVideoPrompt(),
              offer: "",
              cta: phone.trim() ? "Call now" : "Message us now",
            },
          }),
        }
      );

      const generateData = await generateRes.json().catch(() => null);

      if (!generateRes.ok) {
        throw new Error(
          generateData?.error ||
            generateData?.details ||
            "Could not start video generation."
        );
      }

      const requestId = generateData?.fal_request_id || generateData?.request_id;

      if (!requestId) {
        throw new Error("Missing video request ID.");
      }

      let rawVideoUrl = "";

      for (let i = 0; i < 40; i++) {
        await new Promise((resolve) => setTimeout(resolve, 4000));

        console.log(
  "EN QUICK VIDEO: calling generate-video-status",
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video-status?request_id=${requestId}`
);

const statusRes = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video-status?request_id=${requestId}`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const statusData = await statusRes.json().catch(() => null);

        rawVideoUrl =
          statusData?.video?.url ||
          statusData?.video_url ||
          statusData?.fal_response?.video?.url ||
          "";

        if (rawVideoUrl) break;
      }

      if (!rawVideoUrl) {
        throw new Error("The video was not ready in time. Please try again.");
      }

      console.log("EN QUICK VIDEO: calling /api/render-video", rawVideoUrl);

const renderRes = await fetch("/api/render-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: rawVideoUrl,
          headline: videoIdea.trim(),
          brandName: businessName.trim(),
          scenes: [
            {
              title: "Quick video",
              overlay_text: buildQuickOverlayText(),
              duration_sec: duration,
            },
          ],
          totalDurationSec: duration,
          cta: phone.trim() ? "Call now" : "Message us now",
          phone: phone.trim(),
          address: "",
          musicStyle: "modern social ad",
        }),
      });

      if (!renderRes.ok) {
        const renderError = await renderRes.json().catch(() => null);
        throw new Error(renderError?.error || "Could not render the final video.");
      }

      const blob = await renderRes.blob();
      const finalUrl = URL.createObjectURL(blob);

      setGeneratedVideoUrl(finalUrl);
    } catch (error) {
      console.error(error);
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the video."
      );
    } finally {
      setGenerating(false);
    }
  };
const handleMainVideoClick = async () => {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    await handleGenerateVideo();
    return;
  }

  await handleGeneratePreview();
};
  return (
    <main className="min-h-screen bg-[#f5f1ec] px-4 py-8 text-neutral-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href="/en" className="text-sm font-semibold text-neutral-600">
            ← Back to home
          </Link>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            Quick AI video for your business
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">
            Fill in a short brief and create an AI video preview for social media,
            without going through a complex production process.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <section className="rounded-[32px] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 rounded-[24px] bg-[#faf8f6] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a6d62]">
                Quick video
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Create a short AI ad video
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Perfect for restaurants, salons, shops, gyms and local services
                that need fast social media content.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Business name
                </span>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Example: Sushi Bar Sakura"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  What does the business offer?
                </span>
                <textarea
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  rows={4}
                  placeholder="Example: Fresh sushi, dinner sets for two, delivery and a cozy restaurant atmosphere."
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Video idea
                </span>
                <textarea
                  value={videoIdea}
                  onChange={(e) => setVideoIdea(e.target.value)}
                  rows={4}
                  placeholder="Example: A short appetizing video for a sushi dinner promo."
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Phone, optional
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Leave empty if you do not want a phone number"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>

              <div>
                <p className="mb-2 text-sm font-bold">Duration</p>
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
                      {item} seconds
                    </button>
                  ))}
                </div>
              </div>

              <button
  type="button"
  onClick={() => void handleMainVideoClick()}
  disabled={generating || previewLoading}
  className="w-full rounded-full bg-neutral-950 px-5 py-4 text-sm font-black text-white disabled:opacity-60"
>
  {previewLoading
    ? "Preparing preview..."
    : generating
      ? "Generating video..."
      : "Generate video"}
</button>

              {generationError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {generationError}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[32px] bg-neutral-950 p-5 text-white shadow-sm sm:p-7">
            <div className="overflow-hidden rounded-[28px] bg-black">
              {generating ? (
                <div className="flex aspect-[9/16] w-full flex-col items-center justify-center bg-neutral-950 px-6 text-center">
                  <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />

                  <h3 className="mt-6 text-xl font-black text-white">
                    Generating your video...
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-white/60">
                    This may take a little while. We are preparing the visual,
                    movement, music and final ad text.
                  </p>
                </div>
              ) : generatedVideoUrl ? (
                <video
                  src={generatedVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="aspect-[9/16] w-full object-cover"
                />
              ) : (
                <video
                  src="/showcase/video-1.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="aspect-[9/16] w-full object-cover opacity-90"
                />
              )}
            </div>

            {generatedVideoUrl ? (
              <a
                href={generatedVideoUrl}
                download="ai-smm-video.mp4"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-black"
              >
                Download video
              </a>
            ) : null}
          </section>
        </div>
      </div>

      {showPreviewModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-5 shadow-2xl">
            {previewLoading ? (
              <div>
                <div className="mb-5 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                    AI preview
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-neutral-950">
                    Preparing the first frames...
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    This may take a little while. Please keep this window open.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="aspect-[9/16] animate-pulse rounded-2xl bg-gradient-to-b from-neutral-200 via-neutral-100 to-neutral-300" />
                  <div className="aspect-[9/16] animate-pulse rounded-2xl bg-gradient-to-b from-neutral-300 via-neutral-100 to-neutral-200" />
                </div>

                <div className="mt-5 overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-black" />
                </div>

                <div className="mt-5 space-y-3 text-sm font-semibold text-neutral-700">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#faf8f6] p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                      1
                    </span>
                    <p>AI analyzes your business and offer...</p>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-[#faf8f6] p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                      2
                    </span>
                    <p>It creates realistic ad scenes...</p>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-[#faf8f6] p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                      3
                    </span>
                    <p>It prepares a preview before the full video...</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                    Preview ready
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-neutral-950">
                    Your first AI frames are ready
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    This is the visual direction for your video. The full video
                    is unlocked after confirmation.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {previewImages.map((image, index) => (
                    <img
                      key={`${image.slice(0, 24)}-${index}`}
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="aspect-[9/16] rounded-2xl object-cover"
                    />
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-neutral-100 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
                    Video idea
                  </p>

                  <p className="mt-2 text-sm font-bold text-neutral-900">
                    {videoIdea || "Your AI video idea will appear here."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    void handleGenerateVideo();
                  }}
                  className="mt-5 w-full rounded-full bg-black px-5 py-4 text-sm font-black text-white"
                >
                  Unlock full video
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="mt-3 w-full text-sm font-semibold text-neutral-500"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}