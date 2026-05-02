"use client";
<style jsx global>{`
@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}
`}</style>

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type VideoScene = {
  id: string;
  title: string;
  purpose: string;
  visual_prompt: string;
  motion_idea: string;
  overlay_text: string;
  duration_sec: number;
};

type VideoPlan = {
  format: "9:16";
  objective: string;
  hook: string;
  headline: string;
  subheadline: string;
  cta: string;
  tone: string;
  audience: string;
  platform: string;
  total_duration_sec: number;
  scenes: VideoScene[];
};

type BrandProfile = {
  brand_name?: string;
  website?: string;
  phone?: string;
  social_links?: string;
  brand_description?: string;
  preferred_colors?: string;
  logo_url?: string;
};

type SelectedPost = {
  id?: string;
  headline?: string;
  caption?: string;
  offer?: string;
  cta?: string;
  angle?: string;
  audience?: string;
  raw_text?: string;
};

type VideoWorkspacePayload = {
  source?: "brand-post" | "quick-flow" | "manual";
  user_request?: string;
  brand_profile?: BrandProfile;
  selected_post?: SelectedPost;
};

const STORAGE_KEY = "ai_smm_video_workspace_v1";
const USE_FAKE_VIDEO = true;
const LAST_REAL_VIDEO_URL_KEY = "ai_smm_last_real_video_url";

const emptyPlan: VideoPlan = {
  format: "9:16",
  objective: "Lead generation",
  hook: "",
  headline: "",
  subheadline: "",
  cta: "",
  tone: "Modern, direct, promotional",
  audience: "",
  platform: "Instagram Reels / Story / TikTok",
  total_duration_sec: 15,
  scenes: [],
};

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function buildFallbackPlan(payload: VideoWorkspacePayload): VideoPlan {
  const brandName = payload.brand_profile?.brand_name?.trim() || "Вашият бизнес";
  const postText =
    payload.selected_post?.caption?.trim() ||
    payload.selected_post?.raw_text?.trim() ||
    payload.selected_post?.headline?.trim() ||
    payload.selected_post?.offer?.trim() ||
    "Специално предложение";
  const postCta = payload.selected_post?.cta?.trim() || "Пиши ни сега";
  const brandDesc = payload.brand_profile?.brand_description?.trim() || "";
  const audience = payload.selected_post?.audience?.trim() || "Локални клиенти";
  const userRequest = payload.user_request?.trim() || "";

  const splitSentences = (text: string) =>
    text
      .split(/[\n.!?]+/)
      .map((item) => item.trim())
      .filter(Boolean);

  const cleanMarketingText = (text: string, max = 70) => {
    if (!text) return "";

    let clean = text
      .replace(/\s+/g, " ")
      .replace(/[✨🔥💖💎⚡🎂🍰🍩🧁😍🥰❤️💕🌸🎉🎁]/g, "")
      .replace(/^[-–•:,\s]+/, "")
      .trim();

    if (clean.length <= max) return clean;

    const sliced = clean.slice(0, max).trim();
    const lastSpace = sliced.lastIndexOf(" ");
    return `${(lastSpace > 24 ? sliced.slice(0, lastSpace) : sliced).trim()}...`;
  };

  const firstSentence = cleanMarketingText(splitSentences(postText)[0] || "", 80);
  const secondSentence = cleanMarketingText(splitSentences(postText)[1] || "", 72);

  const lowerCombined = `${postText} ${brandDesc} ${userRequest}`.toLowerCase();

  const hasCake =
    lowerCombined.includes("торт") ||
    lowerCombined.includes("сладк") ||
    lowerCombined.includes("десерт") ||
    lowerCombined.includes("cake") ||
    lowerCombined.includes("pastry");

  const hasBeauty =
    lowerCombined.includes("козмет") ||
    lowerCombined.includes("епилац") ||
    lowerCombined.includes("beauty") ||
    lowerCombined.includes("skin") ||
    lowerCombined.includes("лице");

  const hasFood =
    lowerCombined.includes("храна") ||
    lowerCombined.includes("ресторант") ||
    lowerCombined.includes("меню") ||
    lowerCombined.includes("вкус") ||
    lowerCombined.includes("food");

  const offerText = cleanMarketingText(payload.selected_post?.offer?.trim() || "", 36);

  let hook = "";
  let headline = "";
  let subheadline = "";
  let trustLine = "";
  let scene2Overlay = "";
  let scene3Overlay = offerText || "Специална оферта";
  let scene4Overlay = "";
  let objective = "Promote offer";
  let tone = "Bold, clean, social-first";

  if (hasCake) {
    hook = "Сладко изкушение, което не се пропуска";
    headline = `${brandName} прави деня по-вкусен`;
    subheadline =
      secondSentence ||
      "Торти и сладки моменти, създадени с внимание към всеки детайл.";
    trustLine = "Ръчно създадени торти";
    scene2Overlay = "Създадени с любов";
    scene4Overlay = "Качество и стил";
    tone = "Warm, elegant, appetizing";
  } else if (hasBeauty) {
    hook = "Красота, която се забелязва веднага";
    headline = `${brandName} подчертава естествената красота`;
    subheadline =
      secondSentence ||
      "Професионална грижа, модерен подход и резултат, който впечатлява.";
    trustLine = "Професионална грижа";
    scene2Overlay = "Видим резултат";
    scene4Overlay = "Доверие и качество";
    tone = "Premium, feminine, polished";
  } else if (hasFood) {
    hook = "Вкус, който ти се иска веднага";
    headline = `${brandName} предлага нещо наистина апетитно`;
    subheadline =
      secondSentence ||
      "Свежа визия, силно предложение и вкусно изживяване за всеки клиент.";
    trustLine = "Свежо и апетитно";
    scene2Overlay = "Защо точно това?";
    scene4Overlay = "Вкус и качество";
    tone = "Dynamic, appetizing, social-first";
  } else {
    hook = firstSentence || "Открий предложение, което си струва";
    headline = `${brandName} предлага решение с характер`;
    subheadline =
      secondSentence ||
      cleanMarketingText(brandDesc, 90) ||
      "Силно представяне, ясен акцент и модерна рекламна визия.";
    trustLine = "Професионален подход";
    scene2Overlay = "Защо точно това?";
    scene4Overlay = "Доверие и резултат";
  }

  if (offerText) {
    objective = "Promote special offer";
    scene3Overlay = offerText;
  }

  const finalHook = cleanMarketingText(hook, 52);
  const finalHeadline = cleanMarketingText(headline, 58);
  const finalSubheadline = cleanMarketingText(subheadline, 110);
  const finalTrustLine = cleanMarketingText(trustLine, 34);
  const finalScene2Overlay = cleanMarketingText(scene2Overlay, 30);
  const finalScene4Overlay = cleanMarketingText(scene4Overlay, 30);
  const finalCta = cleanMarketingText(postCta || "Пиши ни сега", 24);

  return {
    format: "9:16",
    objective,
    hook: finalHook,
    headline: finalHeadline,
    subheadline: finalSubheadline,
    cta: finalCta,
    tone,
    audience,
    platform: "Instagram Reels / Story / TikTok",
    total_duration_sec: 15,
        scenes: [
      {
        id: "scene-1",
        title: "Hook scene",
        purpose: "Grab attention immediately",
        visual_prompt: `Vertical product-focused commercial shot for ${brandName}, realistic business visuals, strong focal point, clean composition, cinematic lighting, premium social media look, 9:16`,
        motion_idea: "Quick cinematic push-in",
        overlay_text: finalHook,
        duration_sec: 3,
      },
      {
        id: "scene-2",
        title: "Problem / desire",
        purpose: "Build desire and relevance",
        visual_prompt: `Vertical realistic lifestyle or product-use shot for ${brandName}, polished commercial quality, emotional but natural presentation, product and environment in focus, 9:16`,
        motion_idea: "Slow smooth camera movement",
        overlay_text: finalScene2Overlay,
        duration_sec: 3,
      },
      {
        id: "scene-3",
        title: "Offer reveal",
        purpose: "Present the main offer clearly",
        visual_prompt: `Vertical realistic product detail shot for ${brandName}, close-up commercial visuals, premium materials, packaging, product details, clean branded atmosphere, 9:16`,
        motion_idea: "Gentle scale-in on product details",
        overlay_text: scene3Overlay,
        duration_sec: 3,
      },
      {
        id: "scene-4",
        title: "Trust / details",
        purpose: "Support the offer with confidence",
        visual_prompt: `Vertical trust-building commercial shot for ${brandName}, realistic workspace or service environment, clean premium visuals, believable business atmosphere, 9:16`,
        motion_idea: "Soft side camera drift",
        overlay_text: finalScene4Overlay || finalTrustLine,
        duration_sec: 3,
      },
      {
        id: "scene-5",
        title: "CTA ending",
        purpose: "Drive action",
        visual_prompt: `Vertical premium closing product shot for ${brandName}, realistic final hero visual, clean environment, elegant commercial framing, 9:16`,
        motion_idea: "Slow end hold on hero shot",
        overlay_text: finalCta,
        duration_sec: 3,
      },
    ],
  };
}

export default function VideoPage() {
  const [workspace, setWorkspace] = useState<VideoWorkspacePayload>({
    source: "manual",
    user_request: "",
    brand_profile: {},
    selected_post: {},
  });

  const [videoPlan, setVideoPlan] = useState<VideoPlan>(emptyPlan);
  const [userRequest, setUserRequest] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [hasLoadedWorkspace, setHasLoadedWorkspace] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState("");
const [isVideoReady, setIsVideoReady] = useState(false);
const [activeOverlayIndex, setActiveOverlayIndex] = useState(0);
const [videoDuration, setVideoDuration] = useState<5 | 10 | 15>(5);
const [useFakeVideo, setUseFakeVideo] = useState(true);

  useEffect(() => {
    const stored = safeJsonParse<VideoWorkspacePayload>(localStorage.getItem(STORAGE_KEY), {
      source: "manual",
      user_request: "",
      brand_profile: {},
      selected_post: {},
    });

    setWorkspace(stored);
    setUserRequest(stored.user_request || "");
    setVideoPlan(buildFallbackPlan(stored));
    setHasLoadedWorkspace(true);
  }, []);
  useEffect(() => {
  if (!isVideoReady || !videoPlan.scenes?.length) {
    setActiveOverlayIndex(0);
    return;
  }

  const durations = videoPlan.scenes.map((scene) => Math.max(scene.duration_sec || 3, 1));
  const totalMs = durations.reduce((sum, sec) => sum + sec * 1000, 0);

  let currentIndex = 0;
  setActiveOverlayIndex(0);

  const interval = window.setInterval(() => {
    currentIndex += 1;

    if (currentIndex >= videoPlan.scenes.length) {
      currentIndex = videoPlan.scenes.length - 1;
    }

    setActiveOverlayIndex(currentIndex);
  }, totalMs / videoPlan.scenes.length);

  return () => {
    window.clearInterval(interval);
  };
}, [isVideoReady, videoPlan]);
const handleGenerateVideo = async () => {
  setIsRendering(true);
  setIsVideoReady(false);
  setRenderedVideoUrl("");
  setErrorText("");

  try {
    let videoUrl = "";

    console.log("VIDEO MODE:", useFakeVideo ? "DEV_FAKE" : "REAL_FAL");

        if (useFakeVideo) {
      videoUrl = localStorage.getItem(LAST_REAL_VIDEO_URL_KEY) || "";

      if (!videoUrl) {
        throw new Error("Няма последно генерирано реално видео.");
      }

      console.log("USING LAST REAL VIDEO URL:", videoUrl);
    } else {
      console.log("STEP 1: calling generate-video");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            brand_profile: workspace.brand_profile || {},
            selected_post: workspace.selected_post || {},
            video_plan: {
              ...videoPlan,
              total_duration_sec: videoDuration,
            },
            user_request: userRequest || workspace.user_request || "",
            duration: videoDuration,
          }),
        }
      );

      const data = await response.json().catch(() => null);
      console.log("STEP 1 RESULT:", response.status, data);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.details ||
            `generate-video failed with status ${response.status}`
        );
      }

      const requestId = data?.fal_request_id;

      if (!requestId) {
        throw new Error("Missing request_id from generate-video.");
      }

      console.log("STEP 2: polling status with requestId:", requestId);

      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 3000));

        const statusRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video-status?request_id=${requestId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
          }
        );

        const statusData = await statusRes.json().catch(() => null);
        console.log(`POLL ${i + 1}:`, statusRes.status, statusData);

        if (!statusRes.ok) {
          throw new Error(
            statusData?.error ||
              `generate-video-status failed with status ${statusRes.status}`
          );
        }

        videoUrl =
          statusData?.video?.url ||
          statusData?.video_url ||
          statusData?.fal_response?.video?.url ||
          "";

        if (videoUrl) break;
      }

      if (!videoUrl) {
        throw new Error("Video generation timeout.");
      }

            console.log("REAL GENERATED VIDEO URL:", videoUrl);
      localStorage.setItem(LAST_REAL_VIDEO_URL_KEY, videoUrl);
    }

    const renderResponse = await fetch("/api/render-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoUrl,
        headline:
          videoPlan?.headline ||
          workspace.brand_profile?.brand_name ||
          "Видео реклама",
        brandName: workspace.brand_profile?.brand_name || "",
        scenes: videoPlan?.scenes || [],
        totalDurationSec: videoDuration,
        cta: videoPlan?.cta || "",
        website: workspace.brand_profile?.website || "",
        phone: workspace.brand_profile?.phone || "",
        musicStyle: videoPlan?.tone || "",
      }),
    });

    if (!renderResponse.ok) {
      const renderError = await renderResponse.json().catch(() => null);
      throw new Error(renderError?.error || "Render video failed");
    }

    const blob = await renderResponse.blob();
    const url = URL.createObjectURL(blob);

    setRenderedVideoUrl(url);
    setIsVideoReady(true);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video error";
    setErrorText(message);
  } finally {
    setIsRendering(false);
  }
};
const brandName = useMemo(() => {
  return workspace.brand_profile?.brand_name?.trim() || "Без избран бранд";
}, [workspace]);

const selectedPostText = useMemo(() => {
  return (
    workspace.selected_post?.headline ||
    workspace.selected_post?.caption ||
    workspace.selected_post?.raw_text ||
    "Няма избран post"
  );
}, [workspace]);
const handleGeneratePlan = async () => {
  setIsGenerating(true);
  setErrorText("");

  try {
    const nextPlan = buildFallbackPlan({
      ...workspace,
      user_request: userRequest,
    });

    setVideoPlan(nextPlan);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Plan generation error";
    setErrorText(message);
  } finally {
    setIsGenerating(false);
  }
};

  if (!hasLoadedWorkspace) {
    return (
      <main className="min-h-screen bg-[#f5f1ec] px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-sm text-black/60">Loading video workspace...</p>
        </div>
      </main>
    );
  }
  const activeScene = videoPlan.scenes?.[activeOverlayIndex];
const activeOverlayText =
  activeScene?.overlay_text ||
  activeScene?.title ||
  videoPlan.headline ||
  "";

  return (
    <main className="min-h-screen bg-[#f5f1ec] px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-black/45">
              Video V1 Workspace
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-black">
              AI Video Concept Builder
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/65">
              Отделен flow за video planning. Без да пипаме banner logic.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-black">Input</h2>
              <p className="mt-1 text-sm text-black/60">
                Данните идват от brand workspace / selected post.
              </p>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl bg-[#f7f3ee] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                  Brand
                </p>
                <p className="mt-2 text-base font-semibold text-black">{brandName}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/65">
                  {workspace.brand_profile?.brand_description || "Няма brand description."}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f3ee] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                  Selected Post
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/80">
                  {selectedPostText}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  User request for video
                </label>
                <textarea
                  value={userRequest}
                  onChange={(e) => setUserRequest(e.target.value)}
                  rows={6}
                  placeholder="Например: Искам по-динамично видео, по-луксозно усещане, силен hook и CTA за директни съобщения."
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black/25"
                />
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                className="w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? "Generating video plan..." : "Generate Video Plan"}
              </button>

              {errorText ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorText}
                </div>
              ) : null}
            </div>
          </section>

         <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-semibold text-black">Video Preview Stage</h2>
      <p className="mt-1 text-sm text-black/60">
        Тук ще се визуализира самото видео в следващата версия.
      </p>
    </div>

    <div className="rounded-full bg-[#f7f3ee] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
      {videoPlan.format} · {videoPlan.platform}
    </div>
  </div>

  <div className="flex flex-col items-center gap-6">
    <div className="flex justify-center">
      <div className="w-full max-w-[280px] rounded-[32px] border border-black/10 bg-[#111111] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#2d241d_0%,#151515_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_42%)]" />
          <div className="absolute left-1/2 top-3 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/20" />

          <div className="relative z-10 h-full">
            {isVideoReady && renderedVideoUrl ? (
  <div className="relative h-full w-full">
    <video
      src={renderedVideoUrl}
      controls
      autoPlay
      muted
      loop
      playsInline
      className="h-full w-full object-cover"
    />

    <></>
  </div>
) : (
  <div className="flex h-full flex-col justify-between p-4 text-white">
    <div>
      <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
        Preview
      </div>

      <h3 className="mt-4 text-[22px] font-bold leading-[1.08]">
        {videoPlan.headline || brandName}
      </h3>

      <p className="mt-3 text-[13px] leading-5 text-white/80">
        {videoPlan.subheadline || "Видео концепцията ще се визуализира тук."}
      </p>
    </div>

    <div className="space-y-3">
      <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur-sm">
        {videoPlan.hook || "Силен opening hook"}
      </div>

      <div className="rounded-2xl bg-[#f7e7c6] px-4 py-3 text-center text-sm font-bold text-[#2a2117]">
        {videoPlan.cta || "Пиши ни сега"}
      </div>
    </div>
  </div>
)}
            {isRendering ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="w-[180px] text-center text-white">
                  <div className="mb-3 text-sm font-semibold">Rendering video...</div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-full animate-pulse rounded-full bg-white" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
<div className="mb-4 flex gap-2">
  {[5, 10, 15].map((d) => (
    <button
      key={d}
      onClick={() => setVideoDuration(d as 5 | 10 | 15)}
      className={`px-4 py-2 rounded-lg border ${
        videoDuration === d
          ? "bg-black text-white"
          : "bg-white text-black border-black/20"
      }`}
    >
      {d}s
    </button>
  ))}
</div>
    <div className="w-full max-w-[280px]">
    <div className="mb-3 flex justify-center">
  <button
    onClick={() => setUseFakeVideo((prev) => !prev)}
    className={`px-4 py-2 rounded-full text-xs font-semibold border ${
      useFakeVideo
        ? "bg-green-100 text-green-700 border-green-300"
        : "bg-red-100 text-red-700 border-red-300"
    }`}
  >
    {useFakeVideo ? "DEV MODE (без кредити)" : "REAL MODE (харчи кредити)"}
  </button>
</div>
      <button
  type="button"
  onClick={handleGenerateVideo}
  disabled={isRendering}
  className="w-full rounded-full bg-black px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"

>
  {isRendering ? "Generating video..." : "🎬 Generate Video"}
</button>
    </div>
  </div>
</section>
        </div>
      </div>
    </main>
  );
}