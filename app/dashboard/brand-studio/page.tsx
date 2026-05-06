"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import html2canvas from "html2canvas";
import { toBlob } from "html-to-image";
import { toPng } from "html-to-image";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import BrandStudioMobile from "./BrandStudioMobile";
import { createRoot } from "react-dom/client";
import BrandStudioDesktop from "./BrandStudioDesktop";
import BrandStudioDesktopBanner from "./BrandStudioDesktopBanner";



type BrandProfile = {
  brand_name?: string;
  business_address?: string;
  phone?: string;
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
const LAST_REAL_VIDEO_URL_KEY = "ai_smm_last_real_video_url";
const LAST_RAW_VIDEO_URL_KEY = "ai_smm_last_raw_video_url";

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function extractOfferOverlayText(...values: Array<string | undefined>) {
  const normalizedValues = values
    .map((value) => (value || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

    if (!normalizedValues.length) return "";

  for (const value of normalizedValues) {
    const percentMatch = value.match(/\d{1,3}\s?%/iu);
    if (percentMatch?.[0]) {
      const hasDiscountWord = /(отстъпк|намалени|промоци|оферт)/iu.test(value);

      if (hasDiscountWord) {
        return `${percentMatch[0]} отстъпка`;
      }

      return percentMatch[0];
    }
  }

  for (const value of normalizedValues) {
    const shortOfferMatch = value.match(
      /(отстъпк[а-я]*|намалени[а-я]*|промоци[а-я]*|оферт[а-я]*|безплатн[а-я]*|само\s+днес|само\s+сега)[^.!?\n]{0,30}/iu
    );

    if (shortOfferMatch?.[0]) {
      return shortOfferMatch[0].trim().slice(0, 50);
    }
  }

    return "";
}
function buildShortOfferText(...values: Array<string | undefined>) {
  const text = values
    .map((value) => (value || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");

    if (!text) return "";

  const percentMatch = text.match(/\b(\d{1,3})\s?%/i);
  if (percentMatch?.[1]) {
    return `${percentMatch[1]}% отстъпка`;
  }

  if (/половин цена/i.test(text)) {
    return "50% отстъпка";
  }

  if (/безплатн/i.test(text)) {
    return "Безплатно";
  }

  if (/промоц|оферт|намалени|отстъпк/i.test(text)) {
        return "";
  }

  return "";
}
export default function BrandStudioPage() {
  const router = useRouter();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPostText, setGeneratedPostText] = useState("");
  const [generatedBannerUrl, setGeneratedBannerUrl] = useState("");
  const [generatedBannerPlan, setGeneratedBannerPlan] = useState<any>(null);
  const [isBannerZoomed, setIsBannerZoomed] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState<5 | 10>(5);
  const [useFakeVideo, setUseFakeVideo] = useState(true);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoErrorText, setVideoErrorText] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
const [imageUsageMode, setImageUsageMode] = useState<
  "exact" | "elements" | "integrate"
>("integrate");
  const [uploadedVideoImageUrl, setUploadedVideoImageUrl] = useState("");
  const [uploadedVideoImageName, setUploadedVideoImageName] = useState("");
    const [videoFrameOptions, setVideoFrameOptions] = useState<string[]>([]);
  const [selectedVideoFrameUrl, setSelectedVideoFrameUrl] = useState("");
  const [isGeneratingVideoFrames, setIsGeneratingVideoFrames] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isBannerVisible, setIsBannerVisible] = useState(false);
const [showPaywallModal, setShowPaywallModal] = useState(false);
const [pendingBrandBannerLogId, setPendingBrandBannerLogId] = useState("");
const [pendingBrandBannerBgUrl, setPendingBrandBannerBgUrl] = useState("");
const [showVideoSetupModal, setShowVideoSetupModal] = useState(false);
const [videoSetupMode, setVideoSetupMode] = useState<"campaign" | "video">("video");
const [videoUiSource, setVideoUiSource] = useState<"desktop" | "mobile">("desktop");
const [isAdminUser, setIsAdminUser] = useState(false);
  
  const bannerCardRef = useRef<HTMLDivElement | null>(null);
  const bannerExportRef = useRef<HTMLDivElement | null>(null);
  const bannerCopyRef = useRef<HTMLDivElement | null>(null);
  const bannerSectionRef = useRef<HTMLDivElement | null>(null);
  

  const [workspace, setWorkspace] = useState<VideoWorkspacePayload>({
    source: "manual",
    user_request: "",
    brand_profile: {},
    selected_post: {},
  });

  useEffect(() => {
    const stored = safeJsonParse<VideoWorkspacePayload>(
      localStorage.getItem(STORAGE_KEY),
      {
        source: "manual",
        user_request: "",
        brand_profile: {},
        selected_post: {},
      }
    );

    setWorkspace(stored);
  }, []);
  useEffect(() => {
  const checkAdminUser = async () => {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    setIsAdminUser(
      session?.user?.id === "ef8f7aef-055b-4977-ab77-0430f42b500e"
    );

    if (session?.user?.id !== "ef8f7aef-055b-4977-ab77-0430f42b500e") {
      setUseFakeVideo(false);
    }
  };

  void checkAdminUser();
}, []);
  useEffect(() => {
  if (!generatedBannerUrl) return;

  setIsBannerVisible(false);

  const frame = requestAnimationFrame(() => {
    setIsBannerVisible(true);
  });

  if (bannerSectionRef.current) {
    bannerSectionRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return () => cancelAnimationFrame(frame);
}, [generatedBannerUrl]);

  const brandName = useMemo(() => {
    return workspace.brand_profile?.brand_name?.trim() || "Без избран бранд";
  }, [workspace]);

    const selectedPostText = useMemo(() => {
    return (
      workspace.selected_post?.raw_text ||
      workspace.selected_post?.caption ||
      workspace.selected_post?.headline ||
      "Няма избран post"
    );
  }, [workspace]);

 const renderBannerCard = (zoomed = false, mobileExport = false) => {
  const brandFontSize = mobileExport ? "50px" : zoomed ? "52px" : "34px";
const dividerWidth = mobileExport ? "180px" : zoomed ? "180px" : "140px";
const titleTop = mobileExport ? "34px" : zoomed ? "40px" : "26px";

 const headlineFontSize = mobileExport ? "9px" : zoomed ? "15px" : "10px";
const headlineMaxWidth = mobileExport ? "260px" : zoomed ? "280px" : "190px";

const subtextFontSize = mobileExport ? "16px" : zoomed ? "18px" : "11px";
const subtextMaxWidth = mobileExport ? "310px" : zoomed ? "300px" : "220px";

  const phoneFontSize = mobileExport ? "20px" : zoomed ? "20px" : "10px";
const phoneBottom = mobileExport ? "70px" : zoomed ? "52px" : "22px";
const phonePadding = mobileExport
  ? "10px 30px"
  : zoomed
  ? "7px 34px 21px 34px"
  : "6px 18px 8px 18px";
  const logoSize = zoomed ? "44px" : "30px";
  const logoPadding = zoomed ? "6px" : "4px";
  const logoTop = zoomed ? "16px" : "12px";
  const logoRight = zoomed ? "16px" : "12px";
  if (!generatedBannerUrl) {
  return (
    <div className="flex aspect-[4/5] items-center justify-center">
      {isGenerating ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-black/15 border-t-black" />
          <div className="text-sm font-medium text-black/60">
            Генериране на банер...
          </div>
        </div>
      ) : (
        "Преглед на банера"
      )}
    </div>
  );
}

  
    return (
  <div
  ref={!zoomed ? bannerCardRef : undefined}
  className={`relative w-full overflow-hidden rounded-2xl transition-all duration-500 ${
    isBannerVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
  }`}
    style={{
      aspectRatio: "4 / 5",
      backgroundColor: "#f7f3ee",
      maxWidth: "400px",
      margin: "0 auto",
    }}
  >
    <img
      src={generatedBannerUrl}
      alt={zoomed ? "Zoomed banner" : "Generated banner"}
      crossOrigin="anonymous"
      className="absolute inset-0 h-full w-full object-cover"
    />
            {workspace.brand_profile?.logo_url ? (
  <img
    src={workspace.brand_profile.logo_url}
    alt="Brand logo"
    crossOrigin="anonymous"
    style={{
  position: "absolute",
  top: "16px",
  right: "16px",
  width: "44px",
  height: "44px",
  objectFit: "contain",
  zIndex: 5,

  borderRadius: "12px",
  padding: "6px",

  background: "rgba(255,255,255,0.18)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",

  opacity: 0.85,
}}
  />
) : null}
    

      <div
  className="absolute inset-0"
  style={{
    background: "rgba(0,0,0,0.25)",
  }}
/>

            <div
  className="absolute inset-x-0 px-5 pt-2 text-center"
  style={{ top: titleTop }}
>

  <div
    style={{
      color: "#ffffff",
      fontFamily: '"Times New Roman", Georgia, serif',
      fontStyle: "italic",
      fontSize: mobileExport ? "28px" : brandFontSize,
      lineHeight: 1,
      letterSpacing: "0.6px",
      textShadow:
        "0 1px 0 rgba(255,255,255,0.35), 0 3px 8px rgba(0,0,0,0.5), 0 10px 28px rgba(0,0,0,0.35)",
    }}
  >
    {workspace.brand_profile?.brand_name || ""}
  </div>

    <div
  style={{
    width: "180px",
    height: "1px",
    margin: "28px auto 0 auto",
    backgroundColor: "rgba(255,255,255,0.6)",
    opacity: 0.9,
  }}
/>

</div>

                        <div
        className="absolute inset-x-0 px-5 text-center"
        style={{
  top: mobileExport ? "50%" : "55%",
  transform: "translateY(-50%)",
  color: "#ffffff",
}}
      >
                {(() => {
          const rawHeadline = (generatedBannerPlan?.headline || "").trim();
          const rawSubtext = (generatedBannerPlan?.subtext || "").trim();
          const rawBadge = (generatedBannerPlan?.offer_badge || "").trim();

          const offerRegex = /\d{1,3}\s?%|\d+\s?(лв|лева|евро|eur|€)/iu;
          const dateRegex =
            /\b(днес|утре|валидно|само днес|само сега|до изчерпване|до края|тази седмица|този месец|понеделник|вторник|сряда|четвъртък|петък|събота|неделя|януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември|\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?)\b/iu;
          const locationRegex =
            /\b(софия|пловдив|варна|бургас|русе|стара загора|пазарджик|адрес|ул\.|бул\.|жк|кв\.|център|регион)\b/iu;

          const offerText =
            rawBadge ||
            rawHeadline.match(offerRegex)?.[0] ||
            rawSubtext.match(offerRegex)?.[0] ||
            "";

          const cleanHeadline = rawHeadline
            .replace(offerRegex, "")
            .replace(/\s+[–-]\s*$/u, "")
            .replace(/\s{2,}/g, " ")
            .trim();

          const subParts = rawSubtext
            .split(/\n|[•|]/)
            .map((part: string) => part.trim())
            .filter(Boolean);

          const normalLines: string[] = [];
          const locationLines: string[] = [];
          const dateLines: string[] = [];

                    for (const part of subParts) {
            const cleanPart = part
              .replace(offerRegex, "")
              .replace(/\s+[–-]\s*$/u, "")
              .replace(/\s{2,}/g, " ")
              .trim();

            if (!cleanPart) continue;

            const locationSplitMatch = cleanPart.match(
              /^(.*?)(\s+(?:в|за)\s+(?:софия|пловдив|варна|бургас|русе|стара загора|пазарджик|адрес|ул\.|бул\.|жк|кв\.|център|регион).*)$/iu
            );

            if (dateRegex.test(cleanPart)) {
              dateLines.push(`📅 ${cleanPart}`);
            } else if (locationSplitMatch) {
              const mainText = locationSplitMatch[1].trim();
              const locationText = locationSplitMatch[2].trim();

              if (mainText) normalLines.push(mainText);
              if (locationText) locationLines.push(`📍 ${locationText}`);
            } else if (locationRegex.test(cleanPart)) {
              locationLines.push(`📍 ${cleanPart}`);
            } else {
              normalLines.push(cleanPart);
            }
          }

          return (
            <>
              {offerText ? (
                <div
                  style={{
                    display: "inline-block",
                    marginBottom: zoomed ? "18px" : "32px",
                    padding: zoomed ? "10px 22px" : "8px 18px",
                    borderRadius: "999px",
                    background: "linear-gradient(135deg, #f7d774 0%, #e8b84d 100%)",
                    color: "#000000",
                    fontSize: zoomed ? "16px" : "13px",
                    fontWeight: 800,
                    letterSpacing: "0.2px",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.24)",
                  }}
                >
                  {offerText}
                </div>
              ) : null}

              <div
  style={{
    color: "#ffffff",
    textShadow: "0 2px 6px rgba(0,0,0,0.55)",
    fontSize: headlineFontSize,
    fontWeight: 700,
    lineHeight: mobileExport ? 1.05 : 1.35,
    maxWidth: headlineMaxWidth,
    margin: "0 auto",
    display: "-webkit-box",
    WebkitLineClamp: mobileExport ? 3 : undefined,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  }}
>
  {cleanHeadline}
</div>

              {[...normalLines, ...locationLines, ...dateLines].length ? (
                <div
                  style={{
                    color: "rgba(255,255,255,0.95)",
                    textShadow: "0 2px 6px rgba(0,0,0,0.55)",
                    fontSize: subtextFontSize,

                    lineHeight: 1.4,
                    maxWidth: subtextMaxWidth,
                    margin: "10px auto 0 auto",
                  }}
                >
                  {[...normalLines, ...locationLines, ...dateLines].map(
                    (line: string, index: number) => (
                      <div
                        key={`${line}-${index}`}
                        style={{ marginTop: index === 0 ? 0 : "6px" }}
                      >
                        {line}
                      </div>
                    )
                  )}
                </div>
              ) : null}
            </>
          );
        })()}
      </div>

            {workspace.brand_profile?.business_address ||
      workspace.brand_profile?.phone ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: phoneBottom,
            transform: "translateX(-50%)",
            zIndex: 6,

            
            gap: zoomed ? "8px" : "5px",

            maxWidth: zoomed ? "340px" : "260px",
          }}
        >
          {workspace.brand_profile?.business_address ? (
            <div
              style={{
                padding: zoomed ? "7px 18px" : "5px 12px",
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: zoomed ? "15px" : "10px",
                lineHeight: 1.25,
                color: "#ffffff",
                textAlign: "center",
                maxWidth: "100%",

                background: "rgba(0,0,0,0.38)",
                border: "1px solid rgba(255,255,255,0.22)",
                boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                textShadow: "0 2px 6px rgba(0,0,0,0.55)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            >
              📍 {workspace.brand_profile.business_address}
            </div>
          ) : null}

          {workspace.brand_profile?.phone ? (
            <div
              style={{
                display: "flex",
alignItems: "center",
justifyContent: "center",
textAlign: "center",
lineHeight: 1,

                padding: phonePadding,
                borderRadius: "999px",
                fontWeight: 800,
                fontSize: phoneFontSize,
                color: "#ffffff",
                whiteSpace: "nowrap",

                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.28)",
                boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                textShadow: "0 2px 6px rgba(0,0,0,0.55)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            >
              {workspace.brand_profile.phone}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

  const handleGenerateAll = async (generateVideoAfterBanner = false) => {
    setIsGenerating(true);

    try {
      const brand =
        workspace.brand_profile?.brand_name?.trim() || "Вашият бранд";
      const headline = workspace.selected_post?.headline?.trim() || "";
      const caption = workspace.selected_post?.caption?.trim() || "";
      const rawText = workspace.selected_post?.raw_text?.trim() || "";
      const offer = workspace.selected_post?.offer?.trim() || "";
      const cta = workspace.selected_post?.cta?.trim() || "Пиши ни сега";

      const generatedText = [
        headline || `${brand} представя ново предложение`,
        caption || workspace.brand_profile?.brand_description || "",
        offer ? `Оферта: ${offer}` : "",
        `CTA: ${cta}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      setGeneratedPostText(generatedText);

            const brandDesc = workspace.brand_profile?.brand_description?.trim() || "";
      const businessAddress =
        workspace.brand_profile?.business_address?.trim() || "";
      const preferredColors =
        workspace.brand_profile?.preferred_colors?.trim() || "";
      const phone = workspace.brand_profile?.phone?.trim() || "";
      const logoUrl = workspace.brand_profile?.logo_url?.trim() || "";

      const exactText = [
        headline,
        caption,
        rawText,
                offer ? `Оферта: ${offer}` : "",
        
        cta ? `CTA: ${cta}` : "",
      ]
        .filter(Boolean)
        .join("\n");
        const supabase = createClient();

const {
  data: { session },
} = await supabase.auth.getSession();

const accessToken = session?.access_token;

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
      action_type: "brand_banner",
      cost: 2,
    }),
  }
);

const creditData = await creditRes.json().catch(() => null);
console.log("BRAND BANNER CREDIT DEBUG", {
  creditStatus: creditRes.status,
  creditData,
  accessTokenExists: Boolean(accessToken),
});

if (!creditRes.ok || !creditData?.success) {
  setShowPaywallModal(true);
  return;
}

      const bannerRes = await fetch(
        "https://aogtdpiaagekwzyrazyf.supabase.co/functions/v1/generate-baner",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
    description: brandDesc || caption || rawText || headline,
  address: businessAddress || "",
  offer: offer || headline,
  phone: phone || "",
  exact_text: exactText,
  extra_requirements: [
    "Банерът трябва да следва точно темата и офертата от текста. Да не измисля друга ниша или друг продукт.",
    preferredColors
      ? `Използвай предпочитаните цветове на бранда като основна визуална посока: ${preferredColors}.`
      : "",
    
  ]
    .filter(Boolean)
    .join("\n"),
  logo_url: logoUrl || null,
    image_url: uploadedImageUrl || null,
  image_usage_mode: uploadedImageUrl ? imageUsageMode : "auto",
  source: "brand_banner",
}),
        }
      );

      const bannerText = await bannerRes.text().catch(() => "");
      console.log("BRAND BANNER RAW RESPONSE:", bannerText);
      let bannerData: any = null;

      try {
        bannerData = JSON.parse(bannerText);
      } catch {
        bannerData = { error: bannerText };
      }

      if (!bannerRes.ok) {
        throw new Error(
          bannerData?.error ||
            bannerData?.message ||
            bannerText ||
            "Banner generation failed"
        );
      }

            const nextBannerUrl =
        bannerData?.banner_url || bannerData?.image_url || "";

     const nextBannerPlan = bannerData?.plan || null;

setGeneratedBannerUrl(nextBannerUrl);
setGeneratedBannerPlan(nextBannerPlan);
setGeneratedVideoUrl("");

setPendingBrandBannerLogId(bannerData?.generation_log_id || "");
setPendingBrandBannerBgUrl(nextBannerUrl);

if (generateVideoAfterBanner) {
  setTimeout(() => {
    handleGenerateVideo(nextBannerUrl);
  }, 100);
}
    } catch (e) {
  console.error(e);

  const message =
    e instanceof Error
      ? e.message
      : "Възникна грешка при генериране на кампанията.";

  setToastMessage(message);
  setVideoErrorText(message);

  setTimeout(() => setToastMessage(""), 3500);
} finally {
  setIsGenerating(false);
}
  };

const handleDownloadBanner = async () => {
  if (!generatedBannerUrl) return;

  const sourceNode =
    bannerSectionRef.current || bannerCardRef.current || bannerExportRef.current;

  if (!sourceNode) {
    alert("Не намирам банера за сваляне.");
    return;
  }

  try {
    const dataUrl = await toPng(sourceNode, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#f7f3ee",
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${(workspace.brand_profile?.brand_name || "banner")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()}-banner-${Date.now()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Download failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown download error";

    alert(`Изтеглянето не беше успешно: ${message}`);
  }
};
const saveLastRealVideoUrl = (url: string) => {
  if (!url) return;
  localStorage.setItem(LAST_REAL_VIDEO_URL_KEY, url);
};

const saveLastRawVideoUrl = (url: string) => {
  if (!url) return;
  localStorage.setItem(LAST_RAW_VIDEO_URL_KEY, url);
};

const uploadBrandStudioFile = async ({
  blob,
  folder,
  fileName,
  contentType,
}: {
  blob: Blob;
  folder: string;
  fileName: string;
  contentType: string;
}) => {
  const supabase = createClient();

  const safeFileName = fileName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");

  const filePath = `uploads/${folder}/${Date.now()}-${safeFileName}`;

  const { error } = await supabase.storage
    .from("banners")
    .upload(filePath, blob, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("banners").getPublicUrl(filePath);

  return data.publicUrl;
};

const updateGenerationLogMedia = async ({
  generationLogId,
  finalBannerUrl,
  videoUrl,
}: {
  generationLogId?: string | null;
  finalBannerUrl?: string;
  videoUrl?: string;
}) => {
  if (!generationLogId) return;

  const supabase = createClient();

  const { data: existingLog } = await supabase
    .from("generation_logs")
    .select("metadata")
    .eq("id", generationLogId)
    .maybeSingle();

  const currentMetadata =
    existingLog?.metadata && typeof existingLog.metadata === "object"
      ? existingLog.metadata
      : {};

  await supabase
    .from("generation_logs")
    .update({
      metadata: {
        ...currentMetadata,
        ...(finalBannerUrl ? { final_banner_url: finalBannerUrl } : {}),
        ...(videoUrl ? { video_url: videoUrl } : {}),
      },
    })
    .eq("id", generationLogId);
};

const insertVideoGenerationLog = async (videoUrl: string) => {
  if (!videoUrl) return;

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("generation_logs").insert({
    user_id: user?.id || null,
    user_email: user?.email || null,
    generation_type: "brand_video",
    input_text: selectedPostText || "",
    output_text: generatedBannerPlan?.headline || "",
    metadata: {
      video_url: videoUrl,
      banner_url: generatedBannerUrl || "",
      brand_name: workspace.brand_profile?.brand_name || "",
      headline: generatedBannerPlan?.headline || "",
      subtext: generatedBannerPlan?.subtext || "",
    },
  });
};
const handleCopyPostText = async () => {
  try {
    await navigator.clipboard.writeText(selectedPostText || "");
    setToastMessage("Текстът е копиран");
    setTimeout(() => setToastMessage(""), 2000);
  } catch (error) {
    console.error("Copy post text failed:", error);
    alert("Копирането не беше успешно");
  }
};

const splitVideoText = (value: string) => {
  const cleanText = (value || "").replace(/\s+/g, " ").trim();

  const normalizeSentence = (text: string) =>
    text.replace(/\s+/g, " ").trim();

  if (!cleanText) {
    return { part1: "", part2: "" };
  }

  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map((part) => normalizeSentence(part))
    .filter(Boolean);

  if (sentences.length >= 2) {
    return {
      part1: sentences[0],
      part2: sentences[1],
    };
  }

  if (sentences.length === 1) {
    return {
      part1: sentences[0],
      part2: "",
    };
  }

  return {
    part1: cleanText,
    part2: "",
  };
};
const uploadBrandFinalBannerToStorage = async (dataUrl: string) => {
  if (!dataUrl) return "";

  const blob = await fetch(dataUrl).then((res) => res.blob());

  return await uploadBrandStudioFile({
    blob,
    folder: "final-banners",
    fileName: "brand-final-banner.png",
    contentType: "image/png",
  });
};

const updateBrandGenerationLogWithFinalBanner = async ({
  generationLogId,
  backgroundImageUrl,
  finalBannerUrl,
}: {
  generationLogId: string;
  backgroundImageUrl: string;
  finalBannerUrl: string;
}) => {
  if (!generationLogId || !finalBannerUrl) return;

  const supabase = createClient();

  const { data: existingLog } = await supabase
    .from("generation_logs")
    .select("id, metadata")
    .eq("id", generationLogId)
    .maybeSingle();

  const currentMetadata =
    existingLog?.metadata && typeof existingLog.metadata === "object"
      ? existingLog.metadata
      : {};

  await supabase
    .from("generation_logs")
    .update({
      metadata: {
        ...currentMetadata,
        image_url: backgroundImageUrl,
        final_banner_url: finalBannerUrl,
      },
    })
    .eq("id", generationLogId);
};
const exportBannerDataUrl = async () => {
  if (!bannerExportRef.current || !generatedBannerUrl) return "";

  const sourceNode = bannerExportRef.current;
  const rect = sourceNode.getBoundingClientRect();

  const exportWrapper = document.createElement("div");
  exportWrapper.style.position = "fixed";
  exportWrapper.style.left = "-99999px";
  exportWrapper.style.top = "0";
  exportWrapper.style.width = `${Math.round(rect.width)}px`;
  exportWrapper.style.height = `${Math.round(rect.height)}px`;
  exportWrapper.style.background = "#f7f3ee";
  exportWrapper.style.overflow = "hidden";
  exportWrapper.style.zIndex = "-1";

  const clone = sourceNode.cloneNode(true) as HTMLDivElement;
  clone.style.width = "100%";
  clone.style.height = "100%";
  clone.style.margin = "0";
  clone.style.transform = "none";

  exportWrapper.appendChild(clone);
  document.body.appendChild(exportWrapper);

  try {
    const canvas = await html2canvas(exportWrapper, {
      useCORS: true,
      scale: 2,
      backgroundColor: "#f7f3ee",
      scrollX: 0,
      scrollY: 0,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      windowWidth: Math.round(rect.width),
      windowHeight: Math.round(rect.height),
    });

    return canvas.toDataURL("image/png");
  } finally {
    document.body.removeChild(exportWrapper);
  }
};
useEffect(() => {
  if (!pendingBrandBannerLogId) return;
  if (!pendingBrandBannerBgUrl) return;
  if (!generatedBannerUrl) return;
  if (!generatedBannerPlan) return;

  const saveFinalBrandBanner = async () => {
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      const dataUrl = await exportBannerDataUrl();
      if (!dataUrl) return;

      const finalBannerUrl = await uploadBrandFinalBannerToStorage(dataUrl);
      if (!finalBannerUrl) return;

      await updateBrandGenerationLogWithFinalBanner({
        generationLogId: pendingBrandBannerLogId,
        backgroundImageUrl: pendingBrandBannerBgUrl,
        finalBannerUrl,
      });

      setPendingBrandBannerLogId("");
      setPendingBrandBannerBgUrl("");
    } catch (error) {
      console.error("Brand final banner save error:", error);
    }
  };

  void saveFinalBrandBanner();
}, [
  pendingBrandBannerLogId,
  pendingBrandBannerBgUrl,
  generatedBannerUrl,
  generatedBannerPlan,
]);
const handleCopyBanner = async () => {
  if (!generatedBannerUrl) return;

  const sourceNode =
  bannerSectionRef.current || bannerCardRef.current || bannerCopyRef.current;

  if (!sourceNode) {
    alert("Не намирам банера за копиране.");
    return;
  }

  try {
    const blob = await toBlob(sourceNode, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#f7f3ee",
    });

    if (!blob) {
      throw new Error("Copy blob generation failed");
    }

    if (navigator.clipboard && "ClipboardItem" in window) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      setToastMessage("Банерът е копиран");
      setTimeout(() => setToastMessage(""), 2000);
      return;
    }

    throw new Error("Clipboard image copy is not supported on this device.");
  } catch (error) {
    console.error("Copy failed:", error);
    alert("Копирането на изображение не се поддържа от този браузър. Използвай бутона Свали.");
  }
};
const handleGenerateVideo = async (bannerUrlOverride?: string) => {
  const bannerSource = bannerUrlOverride || generatedBannerUrl;
  let videoCreditWasSpent = false;
  const videoCreditCost = Number(videoDuration) >= 10 ? 35 : 25;

  

  setIsVideoGenerating(true);
  setVideoErrorText("");

  try {
    let rawVideoUrl = "";

    if (useFakeVideo) {
      rawVideoUrl = localStorage.getItem(LAST_RAW_VIDEO_URL_KEY) || "";

      if (!rawVideoUrl) {
        throw new Error("Няма последно сурово видео.");
      }
    } else {
      const supabase = createClient()

const {
  data: { session },
} = await supabase.auth.getSession();

const accessToken = session?.access_token;



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
      cost: videoCreditCost,
    }),
  }
);

const creditData = await creditRes.json().catch(() => null);
console.log("VIDEO CREDIT DEBUG", {
  videoDuration,
  videoCreditCost,
  creditStatus: creditRes.status,
  creditData,
  accessTokenExists: Boolean(accessToken),
});
if (!creditRes.ok || !creditData?.success) {
  setShowPaywallModal(true);
  return;
}
videoCreditWasSpent = true;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            video_image_url: uploadedVideoImageUrl || selectedVideoFrameUrl || "",
            duration: videoDuration,
            source_type: uploadedVideoImageUrl ? "video-image" : "text-only",
            brand_profile: workspace.brand_profile || {},
            selected_post: workspace.selected_post || {},
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.details ||
            `generate-video failed with status ${response.status}`
        );
      }

      const requestId = data?.fal_request_id || data?.request_id;

      if (!requestId) {
        throw new Error("Missing request_id from generate-video.");
      }

            for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 4000));

  const statusRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video-status?request_id=${requestId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const statusData = await statusRes.json().catch(() => null);

  console.log("VIDEO STATUS:", statusData);

  if (!statusData) continue;

  if (statusData.status === "COMPLETED") {
    rawVideoUrl =
      statusData?.video?.url ||
      statusData?.video_url ||
      statusData?.fal_response?.video?.url ||
      "";

    if (rawVideoUrl) break;
  }

  if (
    statusData.status === "FAILED" ||
    statusData.status === "ERROR" ||
    statusData.status === "CANCELLED"
  ) {
    throw new Error(
      statusData?.error ||
        statusData?.details ||
        "Video generation failed"
    );
  }
}
if (!rawVideoUrl) {
  throw new Error("FAL не върна видео (засече се или timeout)");
}

            if (!rawVideoUrl) {
        throw new Error(
          "Video generation timeout after waiting for FAL result."
        );
      }

      saveLastRawVideoUrl(rawVideoUrl);
    }

    const offerOverlayText = extractOfferOverlayText(
      generatedBannerPlan?.headline,
      generatedBannerPlan?.offer_badge,
      workspace.selected_post?.offer,
      workspace.selected_post?.raw_text,
      workspace.selected_post?.caption,
      generatedPostText,
      generatedBannerPlan?.subtext
    );

    console.log("OFFER DEBUG", {
      selectedOffer: workspace.selected_post?.offer || "",
      offerBadge: generatedBannerPlan?.offer_badge || "",
      rawText: workspace.selected_post?.raw_text || "",
      caption: workspace.selected_post?.caption || "",
      generatedPostText: generatedPostText || "",
      bannerHeadline: generatedBannerPlan?.headline || "",
      bannerSubtext: generatedBannerPlan?.subtext || "",
      offerOverlayText,
    });

    const shortOfferText = buildShortOfferText(
      generatedBannerPlan?.headline,
      workspace.selected_post?.offer,
      workspace.selected_post?.caption,
      workspace.selected_post?.raw_text,
      generatedPostText
    );
    const videoHeadlineText = (
  generatedBannerPlan?.headline ||
  workspace.selected_post?.headline ||
  workspace.selected_post?.caption ||
  selectedPostText ||
  ""
)
  .replace(/\s+/g, " ")
  .trim();

const videoSubtextText = (
  generatedBannerPlan?.subtext ||
  workspace.selected_post?.caption ||
  workspace.selected_post?.raw_text ||
  selectedPostText ||
  ""
)
  .replace(/\s+/g, " ")
  .trim();

    const mainVideoTextSource = (
      generatedBannerPlan?.subtext ||
      workspace.selected_post?.caption ||
      workspace.selected_post?.headline ||
      selectedPostText ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();

    const { part1: mainVideoTextPart1, part2: mainVideoTextPart2 } =
      splitVideoText(mainVideoTextSource);

    console.log("RENDER REQUEST DEBUG", {
  videoUiSource,
  videoDuration,
  useFakeVideo,
  brandName: workspace.brand_profile?.brand_name || "",
  phone: workspace.brand_profile?.phone || "",
  address: workspace.brand_profile?.business_address || "",
  videoHeadlineText,
  videoSubtextText,
  shortOfferText,
  mainVideoTextPart1,
  mainVideoTextPart2,
  selectedPostText,
  generatedBannerPlan,
});

    const musicFolder = /luxury|лукс|premium|скъп|елегант/i.test(
  [
    workspace.brand_profile?.brand_description,
    workspace.selected_post?.headline,
    workspace.selected_post?.caption,
    generatedBannerPlan?.headline,
  ]
    .join(" ")
    .toLowerCase()
)
  ? "luxury"
  : /агресив|разпродаж|sale|discount|оферта|намалени|deal/i.test(
      [
        workspace.selected_post?.headline,
        workspace.selected_post?.caption,
        workspace.selected_post?.offer,
      ]
        .join(" ")
        .toLowerCase()
    )
  ? "aggressive"
  : "promo";

const musicDurationFolder = videoDuration >= 10 ? "10s" : "5s";
const randomMusicIndex = Math.floor(Math.random() * 5) + 1;

const generatedMusicUrl = `/audio/${musicFolder}/${musicDurationFolder}/${randomMusicIndex}.mp3`;
    const renderResponse = await fetch("/api/render-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoUrl: rawVideoUrl,
        bannerUrl: bannerSource,
        headline: videoHeadlineText,
subtext: videoSubtextText,
        brandName: workspace.brand_profile?.brand_name || "",
                phone: workspace.brand_profile?.phone || "",
        address: workspace.brand_profile?.business_address || "",
        totalDurationSec: videoDuration,
        musicStyle: /luxury|лукс|premium|скъп|елегант/i.test(
          [
            workspace.brand_profile?.brand_description,
            workspace.selected_post?.headline,
            workspace.selected_post?.caption,
            generatedBannerPlan?.headline,
          ]
            .join(" ")
            .toLowerCase()
        )
          ? "luxury"
          : /агресив|разпродаж|sale|discount|оферта|намалени|deal/i.test(
              [
                workspace.selected_post?.headline,
                workspace.selected_post?.caption,
                workspace.selected_post?.offer,
              ]
                .join(" ")
                .toLowerCase()
            )
          ? "aggressive"
          : "promo",
        musicUrl: generatedMusicUrl,
        scenes: (
  videoDuration <= 5
    ? [
        {
          title: "ShortMessage",
          overlay_text: (() => {
            const text = (
  videoHeadlineText ||
  videoSubtextText ||
  shortOfferText ||
  selectedPostText ||
  ""
)
              .replace(/\s+/g, " ")
              .trim();

            return text;
          })(),
          duration_sec: Math.max(videoDuration - 2.4, 1),
        },
      ]
    : [
        {
          title: "Offer",
          overlay_text: (
            generatedBannerPlan?.offer_badge ||
            workspace.selected_post?.offer ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim(),
          duration_sec: 3,
        },
        {
          title: "MainPart1",
          overlay_text: mainVideoTextPart1,
          duration_sec: 3,
        },
        {
          title: "MainPart2",
          overlay_text: mainVideoTextPart2,
          duration_sec: 3,
        },
      ]
)
        
          .filter((scene) => scene.overlay_text)
          .filter(
            (scene, index, arr) =>
              arr.findIndex(
                (item) =>
                  item.overlay_text.trim().toLowerCase() ===
                  scene.overlay_text.trim().toLowerCase()
              ) === index
          ),
      }),
    });

    if (!renderResponse.ok) {
      const renderError = await renderResponse.json().catch(() => null);
      throw new Error(renderError?.error || "Render video failed");
    }

    const blob = await renderResponse.blob();
    const finalUrl = URL.createObjectURL(blob);

    setGeneratedVideoUrl(finalUrl);
saveLastRealVideoUrl(finalUrl);

try {
  const videoBlob = blob;

  const uploadedVideoUrl = await uploadBrandStudioFile({
    blob: videoBlob,
    folder: "videos",
    fileName: "brand-studio-video.mp4",
    contentType: "video/mp4",
  });

  await insertVideoGenerationLog(uploadedVideoUrl);
} catch (error) {
  console.error("BRAND STUDIO VIDEO SAVE ERROR:", error);
}
  } catch (error) {
  if (videoCreditWasSpent) {
    try {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      await fetch(
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
            cost: videoCreditCost,
            mode: "refund",
          }),
        }
      );
    } catch (refundError) {
      console.error("VIDEO CREDIT REFUND FAILED", refundError);
    }
  }

  const message =
    error instanceof Error ? error.message : "Video generation failed";
  setVideoErrorText(message);
} finally {
    setIsVideoGenerating(false);
  }
};
const handleGenerateVideoFrames = async () => {
  setIsGeneratingVideoFrames(true);
  setVideoErrorText("");

  try {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video-frames`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          brand_profile: workspace.brand_profile || {},
          selected_post: workspace.selected_post || {},
        }),
      }
    );

    const responseText = await response.text();

    console.log("VIDEO FRAMES RAW RESPONSE:", {
      status: response.status,
      responseText,
    });

    let data: any = null;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        responseText || "Generate video frames returned non-JSON response."
      );
    }

    if (!response.ok || !data?.success) {
      throw new Error(
        data?.error ||
          data?.message ||
          data?.details ||
          "Генерирането на кадри не беше успешно."
      );
    }

    if (!Array.isArray(data?.images) || !data.images.length) {
      setVideoErrorText("Генерирането на кадри не върна изображения.");
      return;
    }

    setVideoFrameOptions(data.images.filter(Boolean));
  } catch (e) {
    console.error(e);

    const message =
      e instanceof Error
        ? e.message
        : "Генерирането на кадри не беше успешно.";

    setVideoErrorText(message);
  } finally {
    setIsGeneratingVideoFrames(false);
  }
};
const openVideoSetupModal = async (
  mode: "campaign" | "video",
  source: "desktop" | "mobile" = "desktop"
) => {
  setVideoSetupMode(mode);
  setVideoUiSource(source);
  setShowVideoSetupModal(true);
  setVideoErrorText("");
  setSelectedVideoFrameUrl("");
};

const handleContinueFromVideoSetup = async () => {
  if (!selectedVideoFrameUrl && !uploadedVideoImageUrl) {
    setVideoErrorText("Избери един кадър или качи свое изображение за видеото.");
    return;
  }

  setShowVideoSetupModal(false);

  if (videoSetupMode === "campaign") {
    await handleGenerateAll(true);
    return;
  }

  await handleGenerateVideo();
};
  return (
  <>
    <div className="md:hidden">
      
      <BrandStudioMobile
  brandName={brandName}
  selectedPostText={selectedPostText}
  workspace={workspace}
  generatedBannerUrl={generatedBannerUrl}
  generatedVideoUrl={generatedVideoUrl}
  uploadedImageUrl={uploadedImageUrl}
  imageUsageMode={imageUsageMode}
  videoDuration={videoDuration}
  isGenerating={isGenerating}
  isVideoGenerating={isVideoGenerating}
  isGeneratingVideoFrames={isGeneratingVideoFrames}
  isAdminUser={isAdminUser}
  useFakeVideo={useFakeVideo}
  renderBannerCard={() => renderBannerCard(false, true)}
  onCopyPostText={handleCopyPostText}
  onGenerateCampaign={() => openVideoSetupModal("campaign", "mobile")}
  onGenerateBanner={() => handleGenerateAll(false)}
  onDownloadBanner={handleDownloadBanner}
  onCopyBanner={handleCopyBanner}
  onOpenVideoSetup={() => openVideoSetupModal("video", "mobile")}
  onVideoDurationChange={setVideoDuration}
  onUseFakeVideoToggle={() => setUseFakeVideo((prev) => !prev)}
  onImageUpload={setUploadedImageUrl}
  onClearImage={() => {
    setUploadedImageUrl("");
    setImageUsageMode("integrate");
  }}
  onImageUsageModeChange={setImageUsageMode}
  videoFrameOptions={videoFrameOptions}
  selectedVideoFrameUrl={selectedVideoFrameUrl}
  setSelectedVideoFrameUrl={setSelectedVideoFrameUrl}
  uploadedVideoImageUrl={uploadedVideoImageUrl}
  setUploadedVideoImageUrl={setUploadedVideoImageUrl}
  setUploadedVideoImageName={setUploadedVideoImageName}
  videoErrorText={videoErrorText}
  showVideoSetupModal={showVideoSetupModal}
  setShowVideoSetupModal={setShowVideoSetupModal}
  videoSetupMode={videoSetupMode}
  onGenerateVideoFrames={handleGenerateVideoFrames}
  onContinueFromVideoSetup={handleContinueFromVideoSetup}
/>
    </div>

    <main className="hidden min-h-screen bg-[#f5f1ec] px-6 py-10 md:block">
     <BrandStudioDesktop
  brandName={brandName}
  brandDescription={workspace.brand_profile?.brand_description}
  selectedPostText={selectedPostText}
  onCopyPostText={handleCopyPostText}
  isGenerating={isGenerating}
  isVideoGenerating={isVideoGenerating}
  isGeneratingVideoFrames={isGeneratingVideoFrames}
  onGenerateCampaign={() => openVideoSetupModal("campaign")}
  generatedBannerUrl={generatedBannerUrl}
generatedBannerPlan={generatedBannerPlan}
renderBannerCard={() => renderBannerCard(false, false)}
  onGenerateBanner={() => handleGenerateAll(false)}
  onDownloadBanner={handleDownloadBanner}
  onCopyBanner={handleCopyBanner}
  uploadedImageUrl={uploadedImageUrl}
  setUploadedImageUrl={setUploadedImageUrl}
  imageUsageMode={imageUsageMode}
  setImageUsageMode={setImageUsageMode}
  bannerSectionRef={bannerSectionRef}
  generatedVideoUrl={generatedVideoUrl}
  
  videoDuration={videoDuration}
  setVideoDuration={setVideoDuration}
  onGenerateVideo={() => openVideoSetupModal("video")}
  isAdminUser={isAdminUser}
  useFakeVideo={useFakeVideo}
  setUseFakeVideo={setUseFakeVideo}
  onOpenBannerZoom={() => generatedBannerUrl && setIsBannerZoomed(true)}
  businessAddress={workspace.brand_profile?.business_address}
phone={workspace.brand_profile?.phone}
logoUrl={workspace.brand_profile?.logo_url}
/>
  
      
            
  <div
  style={{
    position: "fixed",
    left: "-99999px",
    top: "0",
    width: "400px",
    height: "500px",
    pointerEvents: "none",
    opacity: 1,
    overflow: "hidden",
  }}
>      
        <div
  ref={(node) => {
    bannerExportRef.current = node;
    bannerCopyRef.current = node;
  }}
  style={{ width: "400px", height: "500px" }}
>
  {renderBannerCard(true)}
</div>
      </div>
            {toastMessage ? (
  <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg">
    {toastMessage}
  </div>
) : null}

{isBannerZoomed && generatedBannerUrl ? (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
    onClick={() => setIsBannerZoomed(false)}
  >
    <div
  className="relative w-full max-w-[400px]"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setIsBannerZoomed(false)}
        className="absolute -right-3 -top-3 z-10 rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow-lg"
      >
        ✕
      </button>

      <div className="overflow-hidden rounded-2xl bg-[#f7f3ee] shadow-2xl">
        <BrandStudioDesktopBanner
  generatedBannerUrl={generatedBannerUrl}
  brandName={brandName}
  headlineText={
    generatedBannerPlan?.headline?.trim() ||
    selectedPostText.split(/[.!?]/)[0]
  }
  subtextText={generatedBannerPlan?.subtext?.trim() || ""}
  phone={workspace.brand_profile?.phone}
  logoUrl={workspace.brand_profile?.logo_url}
/>
      </div>
    </div>
  </div>
) : null}

{showVideoSetupModal ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
    <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-neutral-950">
            Избери кадър за видеото
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Избери един от трите кадъра, от който да генерираме видео, или качи свое изображение.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowVideoSetupModal(false)}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-neutral-600"
        >
          Затвори
        </button>
      </div>

      <div className="mt-6">
        {isGeneratingVideoFrames ? (
  <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-3xl bg-[#f7f3ee] text-center">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/15 border-t-black" />
    <p className="text-sm font-semibold text-black/60">
      Генериране на кадри...
    </p>
  </div>
) : videoFrameOptions.length === 0 ? (
  <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-3xl bg-[#f7f3ee] text-center">
    <p className="max-w-md text-sm leading-6 text-black/55">
      Можеш да генерираш кадри за видеото или да качиш свое изображение отдолу.
    </p>

    <button
      type="button"
      onClick={handleGenerateVideoFrames}
      className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-black hover:text-white"
    >
      ✨ Генерирай кадри
    </button>
  </div>
) : (
  <div className="grid gap-4 md:grid-cols-3">
            {videoFrameOptions.map((frameUrl, index) => (
              <button
                key={`${frameUrl}-${index}`}
                type="button"
                onClick={() => {
                  setSelectedVideoFrameUrl(frameUrl);
                  setUploadedVideoImageUrl("");
                  setUploadedVideoImageName("");
                }}
                className={`overflow-hidden rounded-3xl border bg-[#f7f3ee] transition ${
                  selectedVideoFrameUrl === frameUrl
                    ? "border-black ring-4 ring-black"
                    : "border-black/10 hover:border-black/40"
                }`}
              >
                <img
                  src={frameUrl}
                  alt={`Video frame ${index + 1}`}
                  className="aspect-[9/16] w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[1fr_280px]">
        <div className="rounded-3xl border border-black/10 bg-[#f7f3ee] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/45">
            Или качи свое изображение
          </p>

          <div className="mt-4 flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl bg-white text-sm text-black/45">
            {uploadedVideoImageUrl ? (
              <img
                src={uploadedVideoImageUrl}
                alt="Uploaded video image"
                className="h-full max-h-[320px] w-full object-contain"
              />
            ) : (
              "Няма качено изображение"
            )}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
              Качи изображение
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

            {uploadedVideoImageUrl ? (
              <button
                type="button"
                onClick={() => {
                  setUploadedVideoImageUrl("");
                  setUploadedVideoImageName("");
                }}
                className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600"
              >
                Премахни
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/45">
            Дължина на видеото
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[5, 10].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setVideoDuration(d as 5 | 10)}
                className={`rounded-2xl border px-5 py-4 text-lg font-black ${
                  videoDuration === d
                    ? "bg-black text-white"
                    : "border-black/15 bg-white text-black"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>

          {videoErrorText ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {videoErrorText}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleContinueFromVideoSetup}
            disabled={
  isGenerating ||
  isVideoGenerating ||
  isGeneratingVideoFrames ||
  (!useFakeVideo && !selectedVideoFrameUrl && !uploadedVideoImageUrl)
}
            className="mt-5 w-full rounded-full bg-black px-6 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {videoSetupMode === "campaign"
              ? "Продължи към банер и видео"
              : "Продължи към видео"}
          </button>
        </div>
      </div>
    </div>
  </div>
) : null}
      
{showPaywallModal ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
      <h3 className="text-[24px] font-black text-neutral-900">
        Готов/а ли си да направиш цялата кампания? 🙂
      </h3>

      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Brand Studio създава готова рекламна визия и видео за избрания пост.
        Вземи пакет с кредити и продължи без ограничения.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push("/pricing")}
          className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Виж пакетите
        </button>

        <button
          type="button"
          onClick={() => setShowPaywallModal(false)}
          className="text-sm text-neutral-500"
        >
          Затвори
        </button>
      </div>
    </div>
  </div>
) : null}
      </main>  
  </>
);
}