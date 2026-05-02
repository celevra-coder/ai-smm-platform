"use client";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { toBlob, toJpeg, toPng } from "html-to-image";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "quick-ad" | "brand";
type ImageUsageMode = "auto" | "integrate" | "exact";

type StoredBrandProfile = {
  brand_name: string;
  business_address: string;
  phone: string;
  brand_description: string;
  preferred_colors: string;
  logo_url: string;
};
type VideoWorkspacePost = {
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
  brand_profile?: {
    brand_name?: string;
        business_address?: string;
    phone?: string;
    brand_description?: string;
    preferred_colors?: string;
    logo_url?: string;
  };
  selected_post?: VideoWorkspacePost;
};

type BrandMediaExport = {
  mode: "banner" | "video" | "banner_video";
  source: string;
  brand_profile: {
    brand_name?: string;
    brand_description?: string;
    preferred_colors?: string;
        phone?: string;
    business_address?: string;
    logo_url?: string | null;
  };
  post_text?: string;
  hashtags?: string;
  user_request?: string;
};

type BannerPlan = {
  layout_family?: string;
  headline?: string;
  subtext?: string;
  offer_badge?: string;
  phone?: string;
  support_lines?: string[];
  cta?: string;
  scene_intent?: string;
  color_direction?: string;
  mood?: string;
  overlay_strength?: "soft" | "medium" | "strong";
  accent_style?: string;
  headline_style?: "compact" | "editorial" | "impact";
  text_align?: "left" | "center";
  phone_style?: "pill" | "card";
  badge_style?: "rounded" | "circle";
};

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const brandLogoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerPreviewRef = useRef<HTMLDivElement | null>(null);
const exportBannerRef = useRef<HTMLDivElement | null>(null);

      const modeParam =
    searchParams.get("mode") ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("mode")
      : null);

  const mode: Mode = modeParam === "brand" ? "brand" : "quick-ad";
const isQuickMode = mode === "quick-ad" || modeParam === "quick";

const isDemo =
  searchParams.get("demo") === "1" ||
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "1");

  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [extraText, setExtraText] = useState("");

  const [offerText, setOfferText] = useState("");
  const [discountText, setDiscountText] = useState("");
  const [periodText, setPeriodText] = useState("");
  const [exactText, setExactText] = useState("");
  const [quickPhone, setQuickPhone] = useState("");

  const [logoUrl, setLogoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUsageMode, setImageUsageMode] =
    useState<ImageUsageMode>("auto");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [cta, setCta] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [plan, setPlan] = useState<BannerPlan | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoFileName, setLogoFileName] = useState("");
  const [logoUploadMessage, setLogoUploadMessage] = useState("");

  const [imageUploading, setImageUploading] = useState(false);
  const [imageFileName, setImageFileName] = useState("");
  const [imageUploadMessage, setImageUploadMessage] = useState("");

  const [brandName, setBrandName] = useState("");
  const [brandBusinessAddress, setBrandBusinessAddress] = useState("");
  const [brandPhone, setBrandPhone] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandPreferredColors, setBrandPreferredColors] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandLogoFileName, setBrandLogoFileName] = useState("");
  const [brandLogoUploadMessage, setBrandLogoUploadMessage] = useState("");
  const [brandLogoUploading, setBrandLogoUploading] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandMessage, setBrandMessage] = useState("");
  const [brandProfileSaved, setBrandProfileSaved] = useState(false);

    const [fromBrandExport, setFromBrandExport] = useState(false);
  const [fromPromoCalendarFlow, setFromPromoCalendarFlow] = useState(false);
  const [promoHelperMessage, setPromoHelperMessage] = useState("");
  const [autoGeneratePending, setAutoGeneratePending] = useState(false);
  const [copyingBanner, setCopyingBanner] = useState(false);
  const [showDemoLimitModal, setShowDemoLimitModal] = useState(false);
  const [activeBrandLoaded, setActiveBrandLoaded] = useState(false);
const [showPaywallModal, setShowPaywallModal] = useState(false);
const [showSystemErrorModal, setShowSystemErrorModal] = useState(false);
const [systemErrorMessage, setSystemErrorMessage] = useState("");
const [pendingFinalBannerLogUrl, setPendingFinalBannerLogUrl] = useState("");
const [pendingGenerationLogId, setPendingGenerationLogId] = useState("");
const [finalBannerSaving, setFinalBannerSaving] = useState(false);
useEffect(() => {
  if (mode !== "brand") return;
  if (activeBrandLoaded) return;

  const brandId = searchParams.get("brand_id");

  // Ако няма brand_id, значи добавяме НОВ бизнес.
  // Не трябва да пълним формата със стар активен бранд.
  if (!brandId) {
    setBrandName("");
    setBrandBusinessAddress("");
    setBrandPhone("");
    setBrandDescription("");
    setBrandPreferredColors("");
    setBrandLogoUrl("");
    setBrandLogoFileName("");
    setBrandLogoUploadMessage("");
    setBrandProfileSaved(false);
    setActiveBrandLoaded(true);
    return;
  }

  const loadBrandForEdit = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("brand_profiles")
      .select(
        "id,brand_name,business_address,phone,brand_description,preferred_colors,logo_url"
      )
      .eq("id", brandId)
      .maybeSingle();

    if (error || !data) {
      console.error(error);
      setBrandMessage("Не успяхме да заредим този бизнес профил.");
      setActiveBrandLoaded(true);
      return;
    }

    setBrandName(data.brand_name || "");
    setBrandBusinessAddress(data.business_address || "");
    setBrandPhone(data.phone || "");
    setBrandDescription(data.brand_description || "");
    setBrandPreferredColors(data.preferred_colors || "");
    setBrandLogoUrl(data.logo_url || "");
    setBrandProfileSaved(true);
    setActiveBrandLoaded(true);
  };

  void loadBrandForEdit();
}, [mode, activeBrandLoaded, searchParams]);
    useEffect(() => {
  if (!isQuickMode) return;

  const loadQuickMode = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      localStorage.removeItem("active_brand_profile");
      localStorage.removeItem("active_brand_user_id");
      resetQuickAdState();
      return;
    }

    const savedBrand = localStorage.getItem("active_brand_profile");
    const storedBrandUserId = localStorage.getItem("active_brand_user_id");

    if (savedBrand) {
      try {
        const brand = JSON.parse(savedBrand);
        const brandOwnerId = brand?.user_id || storedBrandUserId || "";

        const belongsToCurrentUser =
          !brandOwnerId ||
          brandOwnerId === user.id ||
          brandOwnerId === user.email;

        if (!belongsToCurrentUser) {
          localStorage.removeItem("active_brand_profile");
          localStorage.removeItem("active_brand_user_id");
          localStorage.removeItem("ai_smm_selected_calendar_item");
          resetQuickAdState();
          setFromPromoCalendarFlow(false);
          setPromoHelperMessage("");
          return;
        }

        localStorage.setItem("active_brand_user_id", user.id);
        localStorage.removeItem("ai_smm_selected_calendar_item");

        resetQuickAdState();

        setDescription(
          `Създай рекламен банер за ${brand.brand_name || "бизнеса"}. ${
            brand.brand_description || ""
          }`
        );
        setAddress(brand.business_address || "");
        setQuickPhone(brand.phone || "");
        setLogoUrl(brand.logo_url || "");
        setExtraText(
          brand.preferred_colors
            ? `Предпочитани цветове на бранда: ${brand.preferred_colors}`
            : ""
        );
        setFromPromoCalendarFlow(false);
        setPromoHelperMessage("");
        return;
      } catch (error) {
        console.error("Failed to load active brand for quick mode:", error);
        localStorage.removeItem("active_brand_profile");
        localStorage.removeItem("active_brand_user_id");
        resetQuickAdState();
        return;
      }
    }

    try {
      const stored = localStorage.getItem("ai_smm_selected_calendar_item");

      if (!stored) {
        resetQuickAdState();
        setFromPromoCalendarFlow(false);
        setPromoHelperMessage("");
        return;
      }

      const parsed = JSON.parse(stored);
      const item = parsed?.item;

      if (!item) {
        resetQuickAdState();
        setFromPromoCalendarFlow(false);
        setPromoHelperMessage("");
        return;
      }

      const promoText = [item?.title, item?.format, item?.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const isPromoFlow =
        /%|лв|евро|\d+\s*(лв|€|eur)|2\s*за\s*1|1\s*\+\s*1|отстъпк|намаление|промо|оферта|бонус|подарък/i.test(
          promoText
        );

      if (!isPromoFlow) {
        resetQuickAdState();
        setFromPromoCalendarFlow(false);
        setPromoHelperMessage("");
        return;
      }

      resetQuickAdState();

      setFromPromoCalendarFlow(true);
      setPromoHelperMessage(
        "Този тип пост изисква твоята реална оферта. Попълни цена, отстъпка, бонус или точен промо текст, за да генерираме правилен банер."
      );

      setDescription(
        `Създай рекламен банер за ${parsed?.businessType || "бизнеса"}.`
      );
      setExtraText(
        "Важно: използвай само реалната оферта, която клиентът въведе. Не измисляй цена, отстъпка, бонус, период или подарък."
      );
    } catch (error) {
      console.error("Failed to load promo calendar flow:", error);
      resetQuickAdState();
    }
  };

  void loadQuickMode();
}, [isQuickMode]);

  useEffect(() => {
    if (!autoGeneratePending) return;
    if (!isQuickMode) return;
    if (!description.trim()) return;
    if (loading || logoUploading || imageUploading) return;

    const run = async () => {
      setAutoGeneratePending(false);
      await handleGenerate(true);
    };

    void run();
  }, [
    autoGeneratePending,
    mode,
    description,
    loading,
    logoUploading,
    imageUploading,
  ]);
    

  const sanitizeFileName = (fileName: string) => {
    return fileName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9.\-_]/g, "");
  };

  const uploadFileToBannersBucket = async ({
    file,
    folder,
  }: {
    file: File;
    folder: string;
  }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error("Липсва NEXT_PUBLIC_SUPABASE_URL.");
    }

    if (!supabaseAnonKey) {
      throw new Error("Липсва NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Моля, качи валиден image файл.");
    }

    const safeName = sanitizeFileName(file.name || "image.png");
    const filePath = `uploads/${folder}/${Date.now()}-${safeName}`;

    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/banners/${filePath}`,
      {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: file,
      }
    );

    const rawText = await uploadResponse.text();

    if (!uploadResponse.ok) {
      throw new Error(rawText || "Неуспешно качване на файла.");
    }

    return `${supabaseUrl}/storage/v1/object/public/banners/${filePath}`;
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    setLogoUploadMessage("");
    setMessage("");

    try {
      const publicUrl = await uploadFileToBannersBucket({
        file,
        folder: "logos",
      });

      setLogoUrl(publicUrl);
      setLogoFileName(file.name);
      setLogoUploadMessage("Логото е качено.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неуспешно качване на логото.";
      setLogoUploadMessage(errorMessage);
      console.error("Logo upload error:", error);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
  setImageUploading(true);
  setImageUploadMessage("");
  setMessage("");

  try {
    if (!file.type.startsWith("image/")) {
      setImageUploadMessage("Моля, качи валиден image файл.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImageUrl(previewUrl);
    setImageFileName(file.name);

    const maxDimension = 1600;
    const imageBitmap = await createImageBitmap(file);

    const scale = Math.min(
      1,
      maxDimension / Math.max(imageBitmap.width, imageBitmap.height)
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imageBitmap.width * scale);
    canvas.height = Math.round(imageBitmap.height * scale);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Неуспешна подготовка на изображението.");
    }

    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    const resizedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });

    if (!resizedBlob) {
      throw new Error("Неуспешна обработка на изображението.");
    }

    const resizedFile = new File(
      [resizedBlob],
      `${file.name.replace(/\.[^/.]+$/, "")}-optimized.jpg`,
      { type: "image/jpeg" }
    );

    const publicUrl = await uploadFileToBannersBucket({
      file: resizedFile,
      folder: "products",
    });

    setImageUrl(publicUrl);
    setImageFileName(resizedFile.name);
    setImageUploadMessage("Изображението е качено и оптимизирано.");
  } catch (error) {
    setImageUrl("");
    setImageFileName("");

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Неуспешно качване на изображението.";

    setImageUploadMessage(errorMessage);
    console.error("Image upload error:", error);
  } finally {
    setImageUploading(false);
  }
};

  const handleBrandLogoUpload = async (file: File) => {
    setBrandLogoUploading(true);
    setBrandLogoUploadMessage("");
    setBrandMessage("");

    try {
      const publicUrl = await uploadFileToBannersBucket({
        file,
        folder: "brand-logos",
      });

      setBrandLogoUrl(publicUrl);
      setBrandLogoFileName(file.name);
      setBrandLogoUploadMessage("Логото на бранда е качено.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Неуспешно качване на логото на бранда.";
      setBrandLogoUploadMessage(errorMessage);
      console.error("Brand logo upload error:", error);
    } finally {
      setBrandLogoUploading(false);
    }
  };

  const clearLogoSelection = () => {
    setLogoUrl("");
    setLogoFileName("");
    setLogoUploadMessage("");
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const clearImageSelection = () => {
    setImageUrl("");
    setImageFileName("");
    setImageUploadMessage("");
    setImageUsageMode("auto");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const clearBrandLogoSelection = () => {
    setBrandLogoUrl("");
    setBrandLogoFileName("");
    setBrandLogoUploadMessage("");
    if (brandLogoInputRef.current) {
      brandLogoInputRef.current.value = "";
    }
  };
    const resetQuickAdState = () => {
    setDescription("");
    setAddress("");
    setExtraText("");
    setOfferText("");
    setDiscountText("");
    setPeriodText("");
    setExactText("");
    setQuickPhone("");
    setLogoUrl("");
    setImageUrl("");
    setImageUsageMode("auto");
    setHeadline("");
    setSubtext("");
    setCta("");
    setPlan(null);
    setGeneratedImageUrl("");
    setMessage("");
    setLogoFileName("");
    setImageFileName("");
    setLogoUploadMessage("");
    setImageUploadMessage("");
    setFromBrandExport(false);
    setAutoGeneratePending(false);
  };
  const waitForBannerPreviewRender = async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 400));
  };

  const uploadFinalBannerToStorage = async (dataUrl: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error("Липсва NEXT_PUBLIC_SUPABASE_URL.");
    }

    if (!supabaseAnonKey) {
      throw new Error("Липсва NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    const blob = await fetch(dataUrl).then((res) => res.blob());
    const filePath = `uploads/final-banners/${Date.now()}-final-banner.png`;

    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/banners/${filePath}`,
      {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "image/png",
          "x-upsert": "true",
        },
        body: blob,
      }
    );

    const rawText = await uploadResponse.text();

    if (!uploadResponse.ok) {
      throw new Error(rawText || "Неуспешно качване на финалния банер.");
    }

    return `${supabaseUrl}/storage/v1/object/public/banners/${filePath}`;
  };

    const updateGenerationLogWithFinalBanner = async ({
  generationLogId,
  backgroundImageUrl,
  finalBannerUrl,
}: {
  generationLogId: string;
  backgroundImageUrl: string;
  finalBannerUrl: string;
}) => {
  if (!generationLogId) {
    console.warn("Липсва generationLogId за final_banner_url.");
    return;
  }

  const supabase = createClient();

  const { data: existingLog, error: findError } = await supabase
    .from("generation_logs")
    .select("id, metadata")
    .eq("id", generationLogId)
    .maybeSingle();

  console.log("FINAL BANNER FOUND LOG BY ID:", existingLog, findError);

  if (findError || !existingLog?.id) {
    console.warn("Не намерих generation_log по ID:", findError);
    return;
  }

  const currentMetadata =
    existingLog.metadata && typeof existingLog.metadata === "object"
      ? existingLog.metadata
      : {};

  const { error: updateError } = await supabase
    .from("generation_logs")
    .update({
  final_banner_url: finalBannerUrl,
  metadata: {
    ...currentMetadata,
    image_url: backgroundImageUrl,
    final_banner_url: finalBannerUrl,
  },
})
    .eq("id", generationLogId);

  console.log("FINAL BANNER UPDATE ERROR:", updateError);

  if (updateError) {
    console.warn("Неуспешно обновяване на final_banner_url:", updateError);
  }
};
      useEffect(() => {
    console.log("FINAL BANNER EFFECT CHECK:", {
  pendingFinalBannerLogUrl,
  pendingGenerationLogId,
  generatedImageUrl,
  loading,
  finalBannerSaving,
});

    if (!pendingFinalBannerLogUrl) return;
if (!pendingGenerationLogId) return;
if (!generatedImageUrl) return;
    if (loading) return;
    if (finalBannerSaving) return;

    console.log("FINAL BANNER EFFECT STARTED");
    console.log("FINAL BANNER BEFORE CANVAS");
    

    const saveFinalBanner = async () => {
      try {
        setFinalBannerSaving(true);

        await waitForBannerPreviewRender();

                const node = getBannerExportNode();

if (!node) {
  console.warn("Не намерих bannerPreviewRef за final banner.");
  return;
}

const finalBannerDataUrl = await toPng(node, {
  cacheBust: true,
  pixelRatio: 2,
});

                const finalBannerUrl = await uploadFinalBannerToStorage(finalBannerDataUrl);

        await updateGenerationLogWithFinalBanner({
  generationLogId: pendingGenerationLogId,
  backgroundImageUrl: pendingFinalBannerLogUrl,
  finalBannerUrl,
});

        setPendingFinalBannerLogUrl("");
setPendingGenerationLogId("");
setPendingGenerationLogId("");
      } catch (error) {
        console.error("Final banner save error:", error);
      } finally {
        setFinalBannerSaving(false);
      }
    };

    void saveFinalBanner();
  }, [
    pendingFinalBannerLogUrl,
    pendingGenerationLogId,
    generatedImageUrl,
    headline,
    subtext,
    cta,
    plan,
    loading,
    finalBannerSaving,
  ]);
  const handleGenerate = async (isAutoRun = false) => {
  if (loading || logoUploading || imageUploading) return;

  // 🔒 DEMO LIMIT
  const supabase = createClient();

const {
  data: { session },
} = await supabase.auth.getSession();

const accessToken = session?.access_token;

// demo limit важи само за НЕлогнати потребители
if (isDemo && !session?.user) {
  const demoCount = Number(localStorage.getItem("demo_generations") || "0");

  if (demoCount >= 2) {
    setShowDemoLimitModal(true);
    return;
  }

  localStorage.setItem("demo_generations", String(demoCount + 1));
}

  if (!description.trim()) {
      setMessage("Моля, попълни описание на банера.");
      return;
    }

    setLoading(true);
    setMessage(
  isAutoRun
    ? "Генерираме твоята реклама..."
    : "Генерираме твоята перфектна реклама..."
);
    setHeadline("");
    setSubtext("");
    setCta("");
    setIsPreviewOpen(false);
    setPlan(null);
    setGeneratedImageUrl("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error("Липсва NEXT_PUBLIC_SUPABASE_URL.");
      }

      
       const fullPrompt = [
  "Създай висококонвертиращ рекламен банер (Facebook / Instagram стил).",

  description.trim(),

  address.trim() ? `Адрес (задължително да присъства визуално): ${address.trim()}` : "",

  offerText.trim()
  ? `ОФЕРТАТА е НАЙ-ВАЖНИЯТ елемент в банера и трябва да се вижда веднага: ${offerText.trim()}`
  : "",

  discountText.trim()
    ? `Цена / отстъпка (силен акцент): ${discountText.trim()}`
    : "",

  periodText.trim()
    ? `Период (ако има): ${periodText.trim()}`
    : "",

  quickPhone.trim()
  ? `Телефонът трябва да бъде много видим, голям и оформен като силен CTA елемент (като бутон или акцентна зона): ${quickPhone.trim()}`
  : "",

  exactText.trim()
    ? `ВАЖНО: използвай този текст смислово: ${exactText.trim()}`
    : "",

  extraText.trim(),

  "Банерът трябва да изглежда като РЕАЛНА Facebook/Instagram реклама от малък локален бизнес.",
"Да има естествена композиция, НЕ перфектно центрирана.",
"Да има лек хаос и човешко усещане – не прекалено подредено.",
"Да изглежда като направен от дизайнер, не от AI.",

  "Използвай силна рекламна визуална йерархия:",
"1. HEADLINE – кратък, ударен, привличащ вниманието",
"2. ОФЕРТА – най-силният елемент (да изпъква визуално)",
"3. ПОДТЕКСТ – обяснява офертата",
"4. ТЕЛЕФОН – много видим и лесен за действие",
"Headline и офертата НЕ трябва да се сливат – да има контраст и ясно разграничение.",
"АКО има цена, отстъпка или процент, те ЗАДЪЛЖИТЕЛНО трябва да присъстват визуално като силно отличен promo badge, sticker, circle badge или highlight box.",
"Телефонът, ако е подаден, е ЗАДЪЛЖИТЕЛЕН елемент и трябва да бъде голям, ясен и лесен за забелязване.",
"НЕ повтаряй един и същ текст едновременно като headline, subtext, offer badge и support text.",

  "Добави креативност – може да подобриш текста.",
  "Офертата трябва да е най-силният визуален елемент (по-голяма, по-контрастна, по-отчетлива от останалия текст).",
  

  "НЕ прави скучен дизайн.",
   
  "НЕ подреждай всичко еднакво.",
  "НЕ прави flat композиция.",
  "НЕ добавяй декоративни рамки, орнаменти, винтидж украси или излишни графични елементи около целия банер.",

  imageUrl.trim()
    ? imageUsageMode === "exact"
      ? "Използвай изображението почти без промяна."
      : imageUsageMode === "integrate"
      ? "Използвай изображението като част от сцена."
      : "Използвай изображението интелигентно."
    : "",
]
  .filter(Boolean)
  .join("\n");
const supabase = createClient();

const { data: { session } } = await supabase.auth.getSession();

const accessToken = session?.access_token;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-baner`, {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  Authorization: `Bearer ${accessToken}`,
},
        body: JSON.stringify({
          description: description.trim(),
          address: address.trim(),
          offer: offerText.trim(),
          discount: discountText.trim(),
          price: discountText.trim(),
          period: periodText.trim(),
          phone: quickPhone.trim(),
          exact_text: exactText.trim(),
          extra_requirements: [
            extraText.trim(),
            imageUrl.trim() ? `Image usage mode: ${imageUsageMode}` : "",
            fromBrandExport ? "Source: brand export flow" : "",
            "Design mode: readable editorial",
            "Banner style: more creative layout, richer hierarchy, stronger variation, premium local ad look",
            
            "Do not render CTA as a fake clickable button",
          ]
            .filter(Boolean)
            .join("\n"),
          keyword: fullPrompt,
          product: "quick-ad-banner",
          city: "",
          logo_url: logoUrl.trim(),
          image_url: imageUrl.trim(),
          image_usage_mode: imageUsageMode,
          design_mode: "readable_editorial",
source: "quick_banner",
        }),
      });

     const rawText = await response.text();
console.log("GENERATE STATUS:", response.status);
console.log("GENERATE RAW RESPONSE:", rawText);

let data: any = {};
try {
  data = rawText ? JSON.parse(rawText) : {};
} catch {
  throw new Error(rawText || "Невалиден отговор от сървъра.");
}

if (!response.ok) {
  if (data?.error === "NO_CREDITS" || data?.error === "PAYMENT_REQUIRED") {
    setMessage("");
    setShowPaywallModal(true);
    return;
  }

  setSystemErrorMessage(
  data?.message ||
    "Възникна системна грешка. Кредитите бяха възстановени. Опитай отново по-късно."
);
setShowSystemErrorModal(true);
return;
}

      if (!response.ok) {
        throw new Error(data?.error || "Възникна грешка при генериране.");
      }

           const backgroundImageUrl =
        typeof data?.image_url === "string" ? data.image_url : "";

      setHeadline(typeof data?.headline === "string" ? data.headline : "");
      setSubtext(typeof data?.subtext === "string" ? data.subtext : "");
      setCta(typeof data?.cta === "string" ? data.cta : "");
      setPlan(data?.plan || null);
      setGeneratedImageUrl(backgroundImageUrl);
setPendingFinalBannerLogUrl(backgroundImageUrl);
setPendingGenerationLogId(
  typeof data?.generation_log_id === "string" ? data.generation_log_id : ""
);
setPendingGenerationLogId(
  typeof data?.generation_log_id === "string" ? data.generation_log_id : ""
);           
setPendingGenerationLogId(
  typeof data?.generation_log_id === "string" ? data.generation_log_id : ""
);

      setMessage("Визията е готова.");
      setFromBrandExport(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Възникна грешка при генериране.";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrandProfile = async () => {
    if (brandSaving || brandLogoUploading) return;

    if (!brandName.trim()) {
      setBrandMessage("Моля, попълни име на бранда.");
      return;
    }

    if (!brandDescription.trim()) {
      setBrandMessage("Моля, опиши с какво се занимава брандът.");
      return;
    }

    setBrandSaving(true);
    setBrandMessage("");

    try {
  const supabase = createClient();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
  setBrandMessage("Моля, влез в профила си, за да запазиш brand profile.");
  router.push("/login");
  return;
}

      if (!supabaseUrl) {
        throw new Error("Липсва NEXT_PUBLIC_SUPABASE_URL.");
      }

      if (!supabaseAnonKey) {
        throw new Error("Липсва NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }

            const payload: StoredBrandProfile & { user_id: string } = {
  user_id: user.id,
  brand_name: brandName.trim(),
        business_address: brandBusinessAddress.trim(),
        phone: brandPhone.trim(),
        brand_description: brandDescription.trim(),
        preferred_colors: brandPreferredColors.trim(),
        logo_url: brandLogoUrl.trim(),
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/brand_profiles`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();

      if (!response.ok) {
        throw new Error(rawText || "Неуспешно записване на brand profile.");
      }

      localStorage.setItem("active_brand_profile", JSON.stringify(payload));
      localStorage.setItem("active_brand_user_id", user.id);

      setBrandProfileSaved(true);
      setBrandMessage("Brand profile е запазен. Пренасочваме към работната страница...");

      router.push("/dashboard/brand-workspace");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Неуспешно записване на brand profile.";
      setBrandMessage(errorMessage);
    } finally {
      setBrandSaving(false);
    }
  };

  const normalizeLayoutFamily = (layoutFamily?: string) => {
  const value = (layoutFamily || "").trim().toLowerCase();

  const promoSource = [discountText, offerText, periodText, exactText]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const hasStrongPromo =
    promoSource.includes("%") ||
    promoSource.includes("€") ||
    promoSource.includes("евро") ||
    promoSource.includes("отстъп") ||
    promoSource.includes("само") ||
    promoSource.includes("промо") ||
    promoSource.includes("подар");

  const hasPhone = Boolean((quickPhone || brandPhone || plan?.phone || "").trim());
  const hasImage = Boolean(generatedImageUrl);
  const headlineLength = (previewHeadline || "").length;

  if (
    value.includes("center") ||
    value.includes("centered") ||
    value.includes("centered-offer")
  ) {
    return "centered-offer";
  }

  if (
    value.includes("split") ||
    value.includes("left-right") ||
    value.includes("right-left")
  ) {
    return "split-layout";
  }

  if (
    value.includes("promo") ||
    value.includes("offer-heavy") ||
    value.includes("price-heavy")
  ) {
    return "promo-heavy";
  }

  if (
    value.includes("bottom") ||
    value.includes("card") ||
    value.includes("overlay")
  ) {
    return "bottom-card";
  }

  if (hasStrongPromo) return "promo-heavy";
  if (hasPhone && headlineLength > 34) return "bottom-card";
  if (hasImage) return "hero-left";

  return "split-layout";
};

  const clampText = (value?: string, max = 120) => {
  let clean = (value || "").trim().replace(/\s+/g, " ");
  if (!clean) return "";

  const removeDanglingEnd = (text: string) => {
    return text
      .replace(/[,.!?:;–-]+\s*$/g, "")
      .replace(/\b(в|на|за|с|от|по|към|при|до|без|над|под|около|след|преди)\s*$/i, "")
      .replace(/\b(специална цена от|цена от|оферта за|само за|само от|елате на|заповядайте на|валидно до)\s*$/i, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  clean = removeDanglingEnd(clean);

  if (clean.length <= max) return clean;

  let text = clean.slice(0, max);

  // маха срязана дума
  text = text.replace(/\s+\S*$/, "");

  // маха висящи фрази и предлози
  text = removeDanglingEnd(text);

  return `${text.trim()}…`;
};

  const dedupeLines = (lines: string[]) => {
    const seen = new Set<string>();
    return lines.filter((line) => {
      const normalized = line.trim().toLowerCase();
      if (!normalized) return false;
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  };

  const getExactLines = () => {
    return exactText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const exactLines = getExactLines();

const descriptionLines = description
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
const cleanHeadlineInput = (text?: string) => {
  if (!text) return "";

  let clean = text
    .replace(/направи рекламен банер за/gi, "")
    .replace(/направи рекламен банер/gi, "")
    .replace(/създай рекламен банер за/gi, "")
    .replace(/създай рекламен банер/gi, "")
    .replace(/създай банер за/gi, "")
    .replace(/създай банер/gi, "")
    .replace(/искам рекламен банер за/gi, "")
    .replace(/искам банер за/gi, "")
    .replace(/искам/gi, "")
    .replace(/банер за/gi, "")
    .replace(/реклама за/gi, "")
    .replace(/^за\s+/gi, "")
    .replace(/^на\s+/gi, "")
    .replace(/^относно\s+/gi, "")
    .replace(/^[-–:,.()\s]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  clean = clean.replace(/\s+(за|на|с)\s*$/gi, "").trim();
  clean = clean.replace(/^[-–:,.()\s]+|[-–:,.()\s]+$/g, "").trim();

  return clean;
};
const previewHeadlineSource = cleanHeadlineInput(
  headline ||
  plan?.headline ||
  exactLines[0] ||
  descriptionLines[0] ||
  description ||
  ""
);
  const getDisplayHeadline = () => {
  let clean = cleanHeadlineInput(previewHeadlineSource);

  const source = [description, offerText, clean]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const normalizedAddress = normalizeCompareText(address);
  const addressParts = (address || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const shouldAllowLocationInHeadline = (() => {
    const businessSource = [description, exactText, offerText]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      /ресторант|кафе|кафене|бар|бистро|пицария|хотел|hotel|апартамент|apartments|къща за гости|guest house|магазин|showroom|шоурум|салон|студио|spa|спа|клиника|кабинет/.test(
        businessSource
      ) &&
      !/замерв|геофиз|подземн|сондаж|ремонт|монтаж|сервиз|доставка|почиств|обучен|курс|консултац/.test(
        businessSource
      )
    );
  })();

  const stripAddressFromHeadline = (value: string) => {
    let result = value;

    if (normalizedAddress) {
      const escapedAddress = address.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(escapedAddress, "i"), " ");
    }

    for (const part of addressParts) {
      if (!part) continue;
      if (part.length < 3) continue;

      const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(`\\b${escapedPart}\\b`, "i"), " ");
    }

    result = result
      .replace(/\b(в|за|до|от|към)\s*$/i, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    return result;
  };

  const isWaterTopic =
    source.includes("вода") ||
    source.includes("подземн") ||
    source.includes("водоизточ") ||
    source.includes("сондаж");

  if (!shouldAllowLocationInHeadline && address.trim()) {
    clean = stripAddressFromHeadline(clean);
  }

  if (
    isWaterTopic &&
    /замерв|проучван|геофиз|изследван/i.test(clean) &&
    !/вода|подземн|водоизточ|сондаж/i.test(clean)
  ) {
    clean = `${clean} за вода`;
  }

  if (clean.length < 20) {
    if (isWaterTopic) {
      clean = "Геофизични замервания за вода";
    } else if (source.includes("замер")) {
      clean = "Професионални геофизични замервания";
    } else if (source.includes("козмет") || source.includes("красота")) {
      clean = "Подчертай естествената си красота";
    } else if (source.includes("торта") || source.includes("десерт")) {
      clean = "Сладко изкушение за всеки повод";
    } else {
      clean = "Професионално решение за твоите нужди";
    }
  }

  if (
    isWaterTopic &&
    !/вода|подземн|водоизточ|сондаж/i.test(clean)
  ) {
    clean = `${clean} за вода`;
  }

  if (!shouldAllowLocationInHeadline && address.trim()) {
    clean = stripAddressFromHeadline(clean);
  }

  clean = clean
    .replace(/\s{2,}/g, " ")
    .replace(/\b(в|за|до|от|към)\s*$/i, "")
    .trim();

  if (Math.random() > 0.6 && !clean.includes("!")) {
    clean = clean + "!";
  }

  return clampText(clean, 46);
};

  const getDisplaySubtext = () => {
  const hasLocationLikeContent = (text: string) => {
    return /\b(софия|пловдив|варна|бургас|русе|пазарджик|стара загора|адрес|ул\.|бул\.|жк|кв\.|център|регион|район|локация|град)\b/i.test(
      text
    );
  };

  const candidates = [
    subtext,
    plan?.subtext,
    exactLines[1],
    descriptionLines[1],
  ];

  for (const candidate of candidates) {
    const withoutPhone = stripPhoneLikeContent(candidate);
    const clean = clampText(withoutPhone, 98);
    const withoutPrice = clean.replace(/\d+\s?(евро|€|eur|лв)/gi, "").trim();

    if (!withoutPrice) continue;
    if (hasPhoneLikeContent(withoutPrice)) continue;
    if (hasLocationLikeContent(withoutPrice)) continue;
        if (isTooSimilarText(withoutPrice, [getDisplayHeadline()])) {
      continue;
    }
    return withoutPrice;
  }

  return "";
};
const getImportantTokens = (text?: string) => {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length >= 4 &&
        ![
          "всяка",
          "всеки",
          "всяко",
          "само",
          "сега",
          "тук",
          "това",
          "тези",
          "този",
          "тази",
          "любими",
          "любимите",
          "цена",
          "отстъпка",
          "парчета",
          "торта",
          "торти",
          "неделя",
          "наслади",
        ].includes(token)
    );
};

const isTooSimilarText = (line: string, compareWith: string[]) => {
  const lineTokens = getImportantTokens(line);
  if (!lineTokens.length) return false;

  return compareWith.some((text) => {
    const otherTokens = getImportantTokens(text);
    if (!otherTokens.length) return false;

    const shared = lineTokens.filter((token) => otherTokens.includes(token));
    return shared.length >= 2;
  });
};
 const getDisplaySupportLines = () => {
  const headlineNormalized = normalizeCompareText(previewHeadline);
  const subtextNormalized = normalizeCompareText(previewSubtext);
  const badgeNormalized = normalizeCompareText(getDisplayOfferBadge());
  const phoneNormalized = normalizeCompareText(
    clampText(quickPhone || brandPhone || plan?.phone, 24)
  );
  const addressNormalized = normalizeCompareText(address);

  const isInstructionLine = (text: string) => {
    const t = text.toLowerCase();

    return (
      t.includes("използвай") ||
      t.includes("не използвай") ||
      t.includes("без ") ||
      t.includes("направи") ||
      t.includes("създай") ||
      t.includes("вгради") ||
      t.includes("prompt")
    );
  };

  const containsPrice = (text: string) => {
    return /\d+\s?(евро|€|eur|лв)/i.test(text);
  };

  const isLocationLine = (text: string) => {
    return (
      /\b(адрес|ул\.|бул\.|жк|кв\.|център|регион|район|локация|град)\b/i.test(
        text
      ) || /,\s*[^\s,]+/.test(text)
    );
  };

  const isDateOrPeriodLine = (text: string) => {
    return (
      /\b(дата|период|валид|само днес|само сега|тази седмица|този месец)\b/i.test(
        text
      ) ||
      /\b\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?\b/.test(text)
    );
  };

  const getMeaningfulTokens = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(
        (token) =>
          token.length >= 4 &&
          ![
            "като",
            "само",
            "това",
            "тези",
            "този",
            "тази",
            "вашия",
            "вашият",
            "нашия",
            "нашият",
            "място",
            "услуга",
            "услуги",
            "оферта",
            "оферти",
            "работа",
            "терен",
          ].includes(token)
      );
  };

  const sharesTooMuchWithSubtext = (line: string) => {
    if (!subtextNormalized) return false;

    const lineTokens = getMeaningfulTokens(line);
    const subtextTokens = getMeaningfulTokens(previewSubtext);

    if (!lineTokens.length || !subtextTokens.length) return false;

    const sharedCount = lineTokens.filter((token) =>
      subtextTokens.includes(token)
    ).length;

    return sharedCount >= 2;
  };

  const formatSupportLine = (text: string) => {
    const clean = clampText(stripPhoneLikeContent(text), 58);
    if (!clean) return "";

    if (isLocationLine(clean)) {
      return clean.replace(/^📍\s*/i, "").trim();
    }

    if (isDateOrPeriodLine(clean)) {
      return clean.replace(/^📅\s*/i, "").trim();
    }

    return clean;
  };

  const fromPlan =
    Array.isArray(plan?.support_lines) && plan.support_lines.length
      ? plan.support_lines.map(formatSupportLine).filter(Boolean)
      : [];

  const fallback = [
  exactLines[2] ? formatSupportLine(exactLines[2]) : "",
  exactLines[3] ? formatSupportLine(exactLines[3]) : "",
  exactLines[4] ? formatSupportLine(exactLines[4]) : "",
].filter(Boolean) as string[];

  const filteredLines = dedupeLines([...fromPlan, ...fallback]).filter((line) => {
    const normalized = normalizeCompareText(line);
    const normalizedWithoutEmoji = normalized.replace(
      /^[^\p{L}\p{N}]+/u,
      ""
    );

    if (!normalized) return false;
    if (normalized === headlineNormalized) return false;
    if (normalized === subtextNormalized) return false;
    if (normalized === badgeNormalized) return false;
    if (normalized === phoneNormalized) return false;
    if (normalized === addressNormalized) return false;
    if (isInstructionLine(normalized)) return false;
    if (containsPrice(normalized)) return false;
    if (hasPhoneLikeContent(line)) return false;
    if (isLocationLine(line)) {
  // позволяваме САМО ако е точно address
  const normalized = normalizeCompareText(line);
  if (normalized !== addressNormalized) return false;
}

    if (
      subtextNormalized &&
      (subtextNormalized.includes(normalizedWithoutEmoji) ||
        normalizedWithoutEmoji.includes(subtextNormalized))
    ) {
      return false;
    }

    if (sharesTooMuchWithSubtext(line)) {
      return false;
    }

    if (
  periodText &&
  normalizeCompareText(line).includes(
    normalizeCompareText(periodText)
  )
) {
  return false;
}

return true;
  });

  const normalizedPeriod = normalizeCompareText(periodText);
const periodLine =
  periodText?.trim() &&
  !filteredLines.some((line) => normalizeCompareText(line) === normalizedPeriod)
    ? formatSupportLine(periodText)
    : "";

const locationLine = address ? formatSupportLine(address) : "";
const headlineNormalizedLocal = normalizeCompareText(previewHeadline);

const forcedPeriodLine =
  periodText &&
  !headlineNormalizedLocal.includes(normalizeCompareText(periodText))
    ? formatSupportLine(periodText)
    : "";

const remainingLines = filteredLines.filter((line) => {
  const normalized = normalizeCompareText(line);

  if (locationLine && normalized === normalizeCompareText(locationLine)) {
    return false;
  }

  if (forcedPeriodLine && normalized === normalizeCompareText(forcedPeriodLine)) {
    return false;
  }

  return true;
});

const finalLines = [
  locationLine,
  forcedPeriodLine,
  ...dedupeLines(remainingLines),
]
  .filter(Boolean)
  .filter((line) => {
    return !isTooSimilarText(line, [
      previewHeadline,
      previewSubtext,
      previewOfferBadge,
    ]);
  });

return finalLines.slice(0, (quickPhone || brandPhone || plan?.phone) ? 2 : 3);
};

  const getOverlayStrength = () => {
    const value = plan?.overlay_strength || "medium";
    if (value === "soft") return "soft";
    if (value === "strong") return "strong";
    return "medium";
  };

  const getOverlayClasses = () => {
    const overlayStrength = getOverlayStrength();

    if (overlayStrength === "soft") {
      return {
        base: "bg-black/12",
        gradient: "from-black/34 via-black/12 to-black/6",
        side: "from-black/12 to-transparent",
      };
    }

    if (overlayStrength === "strong") {
      return {
        base: "bg-black/30",
        gradient: "from-black/74 via-black/40 to-black/14",
        side: "from-black/30 to-transparent",
      };
    }

    return {
      base: "bg-black/18",
      gradient: "from-black/54 via-black/22 to-black/10",
      side: "from-black/18 to-transparent",
    };
  };

  const getAccentPalette = () => {
    const source = [
    plan?.color_direction,
    plan?.accent_style,
    plan?.mood,
    extraText,
    brandPreferredColors,
    description,
    offerText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
    const isLightBackground =
    source.includes("light") ||
    source.includes("bright") ||
    source.includes("white") ||
    source.includes("cream") ||
    source.includes("clean");

  if (
    source.includes("green") ||
    source.includes("зел") ||
    source.includes("fresh") ||
    source.includes("nature") ||
    source.includes("sage") ||
    source.includes("olive") ||
    source.includes("botanical")
  ) {
    return {
      badge: "bg-[#f7f2df] text-[#26411f] border-[#d8c88f]/70",
      badgeCircle: "bg-[#f7f2df] text-[#305022] border-[#d8c88f]/80",
      chipBg: "rgba(24, 52, 39, 0.26)",
      chipBorder: "rgba(255,255,255,0.12)",
      chipText: "#F4F8F2",
      phone: "bg-[#1b3120]/88 text-[#fff1bf] border-white/10",
      logoWrap:
        "border-white/12 bg-[linear-gradient(180deg,rgba(22,31,23,0.72),rgba(15,22,16,0.44))]",
      headline: "text-white",
      subtext: "text-white/94",
      warmGlow: "rgba(216,200,143,0.22)",
    };
  }

  if (
    source.includes("gold") ||
    source.includes("злат") ||
    source.includes("luxury") ||
    source.includes("premium") ||
    source.includes("champagne")
  ) {
    return {
      badge: "bg-[#fbf3e4] text-[#4d3512] border-[#dcb870]/70",
      badgeCircle: "bg-[#fbf3e4] text-[#4d3512] border-[#dcb870]/80",
      chipBg: "rgba(80, 58, 29, 0.24)",
      chipBorder: "rgba(255,255,255,0.12)",
      chipText: "#FFF8EC",
      phone: "bg-[#24180d]/86 text-[#ffe1a1] border-white/10",
      logoWrap:
        "border-white/12 bg-[linear-gradient(180deg,rgba(28,20,12,0.72),rgba(18,13,8,0.44))]",
      headline: "text-white",
      subtext: "text-white/93",
      warmGlow: "rgba(220,184,112,0.22)",
    };
  }

    if (
    source.includes("cake") ||
    source.includes("торта") ||
    source.includes("слад") ||
    source.includes("dessert") ||
    source.includes("pastry")
  ) {
    return {
      badge: "bg-[#faf1de] text-[#5a3a16] border-[#e0c79c]/70",
      badgeCircle: "bg-[#f7f1df] text-[#45612c] border-[#e0c79c]/80",
      chipBg: "rgba(72, 56, 28, 0.18)",
      chipBorder: "rgba(255,255,255,0.12)",
      chipText: "#FFF9F0",
      phone: "bg-[#3c2b18]/82 text-[#ffe7b8] border-white/10",
      logoWrap:
        "border-white/12 bg-[linear-gradient(180deg,rgba(32,24,18,0.72),rgba(19,14,10,0.46))]",
      headline: isLightBackground ? "text-neutral-900" : "text-white",
      subtext: isLightBackground ? "text-neutral-700" : "text-white/92",
      warmGlow: "rgba(240,196,120,0.20)",
    };
  }
  if (
    source.includes("blue") ||
    source.includes("син") ||
    source.includes("medical") ||
    source.includes("clean") ||
    source.includes("вода") ||
    source.includes("минерал")
  ) {
    return {
      badge: "bg-sky-50 text-sky-950 border-sky-200/70",
      badgeCircle: "bg-sky-50 text-sky-950 border-sky-200/80",
      chipBg: "rgba(17, 54, 73, 0.18)",
      chipBorder: "rgba(255,255,255,0.14)",
      chipText: "#F4FBFF",
      phone: "bg-[#123040]/84 text-[#d6f1ff] border-white/10",
      logoWrap:
        "border-white/12 bg-[linear-gradient(180deg,rgba(16,28,36,0.72),rgba(10,18,24,0.44))]",
      headline: "text-white",
      subtext: "text-white/92",
      warmGlow: "rgba(134,187,216,0.20)",
    };
  }

  return {
    badge: "bg-[#f6f6f0] text-neutral-950 border-white/20",
    badgeCircle: "bg-[#f6f6f0] text-neutral-950 border-white/20",
    chipBg: "rgba(255,255,255,0.12)",
    chipBorder: "rgba(255,255,255,0.12)",
    chipText: "#FFFFFF",
    phone: "bg-black/74 text-white border-white/10",
    logoWrap:
      "border-white/12 bg-[linear-gradient(180deg,rgba(24,24,24,0.74),rgba(12,12,12,0.42))]",
    headline: "text-white",
    subtext: "text-white/92",
    warmGlow: "rgba(216,200,143,0.18)",
  };
};

const formatOfferText = (text: string) => {
  const value = text.toLowerCase();

  if (
    value.includes("2 за 1") ||
    value.includes("1+1") ||
    value.includes("купи 1")
  ) {
    return "2 ЗА 1";
  }

  if (value.includes("%")) {
    return text.toUpperCase();
  }

  return text;
};

const normalizeCompareText = (value?: string) =>
  (value || "").trim().toLowerCase().replace(/\s+/g, " ");

const hasPhoneLikeContent = (value?: string) => {
  const text = (value || "").trim();
  if (!text) return false;

  const compact = text.replace(/\s+/g, " ");

  return (
    /(?:\+?\d[\d\s\-()]{6,}\d)/.test(compact) ||
    /\b(?:тел|телефон|phone|call|обади|резервац|запази час|записване)\b/i.test(
      compact
    )
  );
};

const stripPhoneLikeContent = (value?: string) => {
  if (!value) return "";

  return value
    .replace(/(?:\+?\d[\d\s\-()]{6,}\d)/g, "")
    .replace(
      /\b(?:тел|телефон|phone|call|обади|резервац|запази час|записване)\b\s*[:\-]?\s*/gi,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .trim();
};

const getDisplayOfferBadge = () => {
  const headlineBaseNormalized = normalizeCompareText(
    clampText(cleanHeadlineInput(previewHeadlineSource), 72)
  );

  const subtextBaseNormalized = normalizeCompareText(getDisplaySubtext());

  const candidates = [discountText, plan?.offer_badge, offerText, periodText];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const clean = clampText(formatOfferText(candidate), 42);
    const normalized = normalizeCompareText(clean);

    if (!clean) continue;
    if (normalized === headlineBaseNormalized) continue;
    if (normalized === subtextBaseNormalized) continue;

    if (
      headlineBaseNormalized.includes(normalized) ||
      normalized.includes(headlineBaseNormalized)
    ) {
      continue;
    }

    return clean;
  }

  return "";
};

  

const shouldUseCircularOfferBadge = () => {
  const badge = getDisplayOfferBadge();
  if (!badge) return false;

  const source = [
    plan?.layout_family,
    plan?.accent_style,
    plan?.mood,
    plan?.offer_badge,
    description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const badgeText = badge.toLowerCase();

  const hasStrongPromoSignal =
    badgeText.includes("%") ||
    badgeText.includes("2 за 1") ||
    badgeText.includes("1+1") ||
    badgeText.includes("подар") ||
    badgeText.includes("само") ||
    badgeText.includes("днес");

  const aiHintsCircle =
    source.includes("circle") ||
    source.includes("round") ||
    source.includes("badge") ||
    source.includes("promo") ||
    source.includes("offer-heavy");

  if (badge.length > 18) return false;

  return hasStrongPromoSignal && aiHintsCircle;
};

// ===== AI STYLE HELPERS =====
const getHeadlineStyle = () => {
  const style = plan?.headline_style || "impact";
  if (style === "compact") return "compact";
  if (style === "editorial") return "editorial";
  return "impact";
};

const getTextAlign = () => {
  const source = [
    description,
    offerText,
    plan?.text_align,
    plan?.mood,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    source.includes("premium") ||
    source.includes("luxury") ||
    source.includes("лукс") ||
    source.includes("злат")
  ) {
    return "center";
  }

  if (
    source.includes("promo") ||
    source.includes("sale") ||
    source.includes("оферта") ||
    source.includes("%")
  ) {
    return "left";
  }

  if (
    source.includes("minimal") ||
    source.includes("clean") ||
    source.includes("modern")
  ) {
    return "center";
  }

  return Math.random() > 0.5 ? "left" : "center";
};

const getPhoneStyle = () => {
  return plan?.phone_style === "card" ? "card" : "pill";
};

const previewHeadlineBase = getDisplayHeadline();
const previewOfferBadge = getDisplayOfferBadge();

const rawPreviewSubtext = getDisplaySubtext();
const previewSubtext = (() => {
  if (!rawPreviewSubtext) return "";

  let cleanSubtext = rawPreviewSubtext;

  if (previewOfferBadge) {
    const escapedOffer = previewOfferBadge.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    cleanSubtext = cleanSubtext
      .replace(new RegExp(escapedOffer, "i"), "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  if (address?.trim()) {
    const addressParts = address
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const escapedFullAddress = address.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    cleanSubtext = cleanSubtext.replace(
      new RegExp(escapedFullAddress, "i"),
      " "
    );

    for (const part of addressParts) {
      if (part.length < 3) continue;

      const escapedPart = part.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      cleanSubtext = cleanSubtext.replace(
        new RegExp(`\\b${escapedPart}\\b`, "i"),
        " "
      );
    }

    cleanSubtext = cleanSubtext
      .replace(/\s{2,}/g, " ")
      .replace(/\b(в|за|до|от|към)\s*$/i, "")
      .trim();
  }
const headlineText = getDisplayHeadline?.() || "";

const removeDuplicateWords = (text: string, reference: string) => {
  const words = reference
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);

  let result = text;

  for (const word of words) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "");
  }

  return result
    .replace(/\s{2,}/g, " ")
    .trim();
};

cleanSubtext = removeDuplicateWords(cleanSubtext, headlineText);
  return cleanSubtext;
})();
const isTextHeavy =
  Boolean(quickPhone || plan?.phone) ||
  Boolean(address) ||
  Boolean(periodText) ||
  exactLines.length >= 3 ||
  previewSubtext.length > 60;

const previewHeadline = previewOfferBadge
  ? clampText(
      previewHeadlineBase.replace(/\d+\s?(евро|€|eur|лв)/gi, "").trim(),
      isTextHeavy ? 38 : 46
    )
  : clampText(previewHeadlineBase, isTextHeavy ? 38 : 46);

const previewSupportLines = getDisplaySupportLines();
const previewPhone = clampText(quickPhone || plan?.phone, 18);


const getSmartLayout = () => {
  const source = [
    description,
    offerText,
    plan?.layout_family,
    plan?.mood,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // силна оферта → promo
  if (
    source.includes("%") ||
    source.includes("2 за 1") ||
    source.includes("1+1") ||
    source.includes("подар") ||
    source.includes("само днес")
  ) {
    return "promo-heavy";
  }

  // luxury / premium
  if (
    source.includes("premium") ||
    source.includes("luxury") ||
    source.includes("злат") ||
    source.includes("лукс")
  ) {
    return "bottom-card";
  }

  // услуги → hero
  if (
    source.includes("услуга") ||
    source.includes("замерване") ||
    source.includes("консултация") ||
    source.includes("service")
  ) {
    return "hero-left";
  }

  // храна / десерти
  if (
    source.includes("торта") ||
    source.includes("десерт") ||
    source.includes("cake") ||
    source.includes("food")
  ) {
    return "centered-offer";
  }

  return "split-layout";
};

const previewLayout = getSmartLayout();
const previewImageSource = generatedImageUrl || "";
const overlayClasses = getOverlayClasses();
const accentPalette = getAccentPalette();
const useCircularOfferBadge = shouldUseCircularOfferBadge();

const getHeadlineSizeClasses = (large = false) => {
  const style = getHeadlineStyle();
  const headlineLength = (previewHeadline || "").trim().length;

  if (large) {
    if (headlineLength > 90) {
      return `text-[24px] md:text-[30px] leading-[1.08] ${accentPalette.headline}`;
    }

    if (headlineLength > 72) {
      return `text-[28px] md:text-[36px] leading-[1.06] ${accentPalette.headline}`;
    }

    if (headlineLength > 56) {
      return `text-[31px] md:text-[40px] leading-[1.05] ${accentPalette.headline}`;
    }

    if (style === "editorial") {
      return `text-[34px] md:text-[44px] leading-[1.05] ${accentPalette.headline}`;
    }

    if (style === "compact") {
      return `text-[30px] md:text-[40px] leading-[1.06] ${accentPalette.headline}`;
    }

    return `text-[36px] md:text-[48px] leading-[1.02] ${accentPalette.headline}`;
  }

  if (headlineLength > 90) {
    return `text-[20px] leading-[1.10] ${accentPalette.headline}`;
  }

  if (headlineLength > 72) {
    return `text-[22px] leading-[1.08] ${accentPalette.headline}`;
  }

  if (headlineLength > 56) {
    return `text-[24px] leading-[1.06] ${accentPalette.headline}`;
  }

  if (style === "editorial") {
    return `text-[26px] leading-[1.05] ${accentPalette.headline}`;
  }

  if (style === "compact") {
    return `text-[24px] leading-[1.06] ${accentPalette.headline}`;
  }

  return `text-[21px] leading-[1.08] ${accentPalette.headline}`;
};

const renderPhonePill = (large = false) => {
  if (!previewPhone) return null;

  const phoneStyle = getPhoneStyle();

  if (phoneStyle === "card") {
    return (
      <div
        className={`w-full max-w-[390px] rounded-[20px] border border-white/10 px-4 py-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-sm ${
          accentPalette.phone
        } ${large ? "md:px-5 md:py-3" : ""}`}
      >
        <div
          className={`font-extrabold uppercase tracking-[0.04em] leading-[1] ${
            large ? "text-[16px] md:text-[19px]" : "text-[13px] md:text-[15px]"
          }`}
        >
          Обади се
        </div>
        <div
          className={`mt-1.5 font-black tracking-[0.01em] leading-[1] break-all ${
            large ? "text-[20px] md:text-[26px]" : "text-[16px] md:text-[18px]"
          }`}
        >
          {previewPhone}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex w-fit items-center rounded-[20px] border border-white/10 px-3.5 py-1.5 font-black tracking-[0.01em] shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-sm ${
        accentPalette.phone
      } ${
        large
          ? "text-[17px] md:px-4 md:py-2 md:text-[23px]"
          : "text-[12px] md:text-[15px]"
      }`}
    >
      <span className="mr-1.5 text-[0.98em]">📞</span>
      <span>Обади се: {previewPhone}</span>
    </div>
  );
};

  

const renderOfferBadge = (large = false) => {
  if (!previewOfferBadge) return null;

  if (useCircularOfferBadge) {
    return (
      <div
        className={`absolute right-4 top-[72px] z-20 flex items-center justify-center rounded-full border text-center font-black shadow-[0_14px_34px_rgba(0,0,0,0.18)] backdrop-blur-sm ${
          accentPalette.badgeCircle
        } ${
          large
            ? "h-[146px] w-[146px] text-[23px] leading-[1.05] md:right-8 md:top-[92px]"
            : "h-[104px] w-[104px] text-[17px] leading-[1.08]"
        }`}
      >
        <div className="max-w-[76%]">{previewOfferBadge}</div>
      </div>
    );
  }

  return (
  <div
    className={`inline-flex w-fit items-center gap-2 rounded-[18px] border border-white/20 bg-white/90 px-4 py-2 font-extrabold text-neutral-900 shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-sm ${
      large
        ? "px-5 py-2.5 text-[16px] md:text-[19px]"
        : "text-[14px]"
    }`}
  >
    <span className="text-[1em]">💰</span>
    <span>{previewOfferBadge}</span>
  </div>
);
};
const renderLogoBadge = (large = false) => {
  if (!logoUrl) return null;
  if (!large) return null;

  return (
    <div
      className={`absolute top-4 right-4 z-20 rounded-[20px] border backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.2)] ${
        accentPalette.logoWrap
      } ${large ? "px-4 py-3 md:px-5 md:py-4" : "px-3 py-2"}`}
    >
      <img
        src={logoUrl}
        alt="Logo"
        className={`object-contain ${
          large ? "h-[50px] md:h-[60px]" : "h-[36px]"
        }`}
      />
    </div>
  );
};
const renderSupportBlock = (large = false, dark = false) => {
  if (!previewSupportLines.length) return null;

  const getLineIcon = (line: string) => {
    const lower = line.toLowerCase();

    if (
      lower.includes("адрес") ||
      lower.includes("локац") ||
      lower.includes("град") ||
      lower.includes("район") ||
      lower.includes("регион") ||
      lower.includes("ул.") ||
      lower.includes("бул.") ||
      lower.includes("жк") ||
      lower.includes("кв.")
    ) {
      return "📍";
    }

    if (
  lower.includes("дата") ||
  lower.includes("период") ||
  lower.includes("валид") ||
  lower.includes("само днес") ||
  lower.includes("само сега") ||
  /\b\d{1,2}[./-]\d{1,2}\b/.test(lower) ||
  /\b\d{1,2}\s*-\s*\d{1,2}\b/.test(lower) ||
  /\b(януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)\b/i.test(lower)
) {
  return "📅";
}

    if (lower.includes("бързо") || lower.includes("скорост")) {
      return "⚡";
    }

    if (
      lower.includes("качество") ||
      lower.includes("профес") ||
      lower.includes("опит")
    ) {
      return "⭐";
    }

    if (lower.includes("гаран") || lower.includes("сигур")) {
      return "🛡️";
    }

    if (lower.includes("екип") || lower.includes("специал")) {
      return "👨‍🔧";
    }

    if (lower.includes("вода")) {
      return "💧";
    }

    return "✔️";
  };

  return (
    <div
      className={`mt-5 space-y-2 ${large ? "max-w-[620px]" : "max-w-[420px]"}`}
    >
      {previewSupportLines.map((line, index) => {
        const icon = getLineIcon(line);

        return (
          <div
            key={`${line}-${index}`}
            className={`flex items-center gap-2 font-semibold ${
              large
  ? "text-[18px] md:text-[20px] leading-[1.35]"
  : "text-[13px] leading-[1.25]"
            } ${dark ? "text-neutral-800" : "text-white/92"}`}
          >
            <span className="shrink-0 text-[18px] leading-none">
              {icon}
            </span>
            <span>{line}</span>
          </div>
        );
      })}
    </div>
  );

};

const renderEditorialCtaText = () => {
  return null;
};

const renderBannerComposition = (large = false) => {
  const rootClass = "relative aspect-square w-full overflow-hidden bg-neutral-900";
  const headlineClass = `font-black ${getHeadlineSizeClasses(large)}`;
  const subtextClass = large
    ? `mt-3 max-w-[520px] text-[17px] font-semibold leading-[1.25] md:text-[21px] ${accentPalette.subtext}`
    : `mt-3 text-[15px] font-semibold leading-[1.25] ${accentPalette.subtext}`;

  const textAlign = getTextAlign();
  const textWrapClass = large
    ? `max-w-[620px] ${textAlign === "center" ? "mx-auto text-center" : ""}`
    : `max-w-[320px] ${textAlign === "center" ? "mx-auto text-center" : ""}`;

  return (
    <div className={rootClass}>
      {previewImageSource ? (
        <img
          src={previewImageSource}
          alt="Banner background"
          className="absolute inset-0 h-full w-full object-contain bg-neutral-900"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700" />
      )}

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 78% 18%, ${accentPalette.warmGlow}, transparent 34%)`,
        }}
      />

            {previewLayout === "centered-offer" ? (
        <>
          <div className={`absolute inset-0 ${overlayClasses.base}`} />
          <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/42 via-black/10 to-transparent" />
          {renderLogoBadge(large)}
          {useCircularOfferBadge ? renderOfferBadge(large) : null}

          <div
            className={`relative z-20 flex h-full flex-col items-center text-center text-white ${
              large ? "px-12 py-14 md:px-16 md:py-16" : "px-8 py-9"
            }`}
          >
            <div className={large ? "h-[90px] md:h-[110px]" : "h-[72px]"} />

            <div
              className={`flex w-full flex-1 flex-col items-center ${
                large ? "max-w-[760px]" : "max-w-[360px]"
              }`}
            >
              {previewHeadline ? (
                <h3
                  className={`${headlineClass} ${
                    large ? "max-w-[720px]" : "max-w-[340px]"
                  }`}
                >
                  {previewHeadline}
                </h3>
              ) : null}

              {previewSubtext ? (() => {
                let cleanSubtext = previewSubtext;

                if (previewOfferBadge) {
                  const offerRegex = new RegExp(previewOfferBadge, "i");
                  cleanSubtext = cleanSubtext.replace(offerRegex, "").trim();
                }

                return (
                  <p className={`${subtextClass} ${large ? "max-w-[620px]" : "max-w-[320px]"}`}>
                    {cleanSubtext}
                  </p>
                );
              })() : null}

              {!useCircularOfferBadge ? (
                <div className={large ? "mt-6 flex flex-wrap items-center justify-center gap-3" : "mt-5 flex flex-wrap items-center justify-center gap-3"}>
                  {renderOfferBadge(large)}
                </div>
              ) : null}

              <div className={large ? "mt-8 flex flex-col items-center gap-5" : "mt-7 flex flex-col items-center gap-4"}>
                {renderSupportBlock(large, false)}
              </div>
            </div>

            <div className={large ? "pt-6" : "pt-5"}>
              {previewPhone ? renderPhonePill(large) : null}
            </div>
          </div>
        </>
      ) : null}

      {previewLayout === "split-layout" ? (
        <>
          <div className={`absolute inset-0 bg-gradient-to-r ${overlayClasses.gradient}`} />
          <div className={`absolute inset-y-0 left-0 w-[74%] bg-gradient-to-r ${overlayClasses.side}`} />
          {renderLogoBadge(large)}
{useCircularOfferBadge ? renderOfferBadge(large) : null}

          <div
            className={`relative z-20 flex h-full items-center text-white ${
             large ? "px-10 py-10 md:px-12" : "px-7 py-8"
            }`}
          >
            <div className={textWrapClass}>
              {previewHeadline ? <h3 className={headlineClass}>{previewHeadline}</h3> : null}
              {previewSubtext ? <p className={subtextClass}>{previewSubtext}</p> : null}

              {!useCircularOfferBadge ? (
                <div className="mt-6 flex flex-wrap gap-3">{renderOfferBadge(large)}</div>
              ) : null}

              {renderSupportBlock(large, false)}

              <div className={previewPhone ? "mt-4 mb-6" : "mt-2"}>
  {previewPhone ? renderPhonePill(large) : null}
</div>
            </div>
          </div>
        </>
      ) : null}

      {previewLayout === "promo-heavy" ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-black/44 via-black/16 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          {renderLogoBadge(large)}
{useCircularOfferBadge ? renderOfferBadge(large) : null}

          <div
            className={`relative z-20 flex h-full items-end text-white ${
              large ? "px-10 py-10 md:px-12" : "px-7 py-8"
            }`}
          >
            <div className={large ? "max-w-[560px]" : "max-w-[330px]"}>
              {previewHeadline ? <h3 className={headlineClass}>{previewHeadline}</h3> : null}
              {previewSubtext ? <p className={subtextClass}>{previewSubtext}</p> : null}

              {!useCircularOfferBadge ? (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {renderOfferBadge(large)}
                </div>
              ) : null}

              {renderSupportBlock(large, false)}

              <div className={previewPhone ? "mt-4 mb-6" : "mt-2"}>
  {previewPhone ? renderPhonePill(large) : null}
</div>
            </div>
          </div>
        </>
      ) : null}

      {previewLayout === "bottom-card" ? (
        <>
          <div className={`absolute inset-0 ${overlayClasses.base}`} />
          {renderLogoBadge(large)}
          {useCircularOfferBadge ? renderOfferBadge(large) : null}

          <div
            className={`absolute z-20 rounded-[28px] border border-white/16 bg-white/92 shadow-2xl backdrop-blur-md ${
              large
                ? "inset-x-6 bottom-6 p-6 md:inset-x-8 md:bottom-8 md:p-8"
                : "inset-x-4 bottom-4 p-5"
            }`}
          >
            <div className="flex flex-col gap-5">
              <div className={large ? "min-w-0 max-w-[600px]" : "min-w-0 max-w-[320px]"}>
                {previewHeadline ? (
                  <h3
                    className={
                      large
                        ? "text-[36px] font-black leading-[0.96] tracking-[-0.03em] text-neutral-950 md:text-[52px]"
                        : "text-[30px] font-black leading-[0.96] tracking-[-0.03em] text-neutral-950"
                    }
                  >
                    {previewHeadline}
                  </h3>
                ) : null}

                {previewSubtext ? (
                  <p
                    className={
                      large
                        ? "mt-4 text-[18px] font-semibold leading-[1.34] text-neutral-700 md:text-[22px]"
                        : "mt-4 text-[17px] font-semibold leading-[1.34] text-neutral-700"
                    }
                  >
                    {previewSubtext}
                  </p>
                ) : null}

                {!useCircularOfferBadge ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {renderOfferBadge(large)}
                  </div>
                ) : null}

                {renderSupportBlock(large, true)}
              </div>

              <div className={previewPhone ? "mt-4 mb-6" : "mt-2"}>
  {previewPhone ? renderPhonePill(large) : null}
</div>
            </div>
          </div>
        </>
      ) : null}

      {previewLayout === "hero-left" ? (
        <>
          <div className={`absolute inset-0 bg-gradient-to-r ${overlayClasses.gradient}`} />
          <div className={`absolute inset-y-0 left-0 w-[76%] bg-gradient-to-r ${overlayClasses.side}`} />
          {renderLogoBadge(large)}
{useCircularOfferBadge ? renderOfferBadge(large) : null}

          <div
            className={`relative z-20 flex h-full items-center text-white ${
              large ? "px-10 py-10 md:px-12" : "px-7 py-8"
            }`}
          >
            <div className={textWrapClass}>
              {previewHeadline ? (
  <h3 className={`${headlineClass} line-clamp-3`}>
    {previewHeadline}
  </h3>
) : null}
              {previewSubtext ? (
  <p className={`${subtextClass} line-clamp-2`}>
    {previewSubtext}
  </p>
) : null}

              {!useCircularOfferBadge ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {renderOfferBadge(large)}
                </div>
              ) : null}

              {renderSupportBlock(large, false)}

              <div className={previewPhone ? "mt-4 mb-6" : "mt-2"}>
  {previewPhone ? renderPhonePill(large) : null}
</div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
  const wrapCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number
  ) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = ctx.measureText(testLine).width;

      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }

      if (lines.length >= maxLines) break;
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight);
    });

    return y + lines.length * lineHeight;
  };

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const renderBannerToCanvas = async () => {
    if (!previewImageSource) return null;

    const img = await loadImage(previewImageSource);
    const canvas = document.createElement("canvas");
    const size = 1024;

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, size, size);

    const overlayStrength = getOverlayStrength();
    const overlayAlpha =
      overlayStrength === "soft" ? 0.12 : overlayStrength === "strong" ? 0.3 : 0.18;

    ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
    ctx.fillRect(0, 0, size, size);

    const radial = ctx.createRadialGradient(780, 150, 20, 780, 150, 260);
    radial.addColorStop(0, accentPalette.warmGlow);
    radial.addColorStop(1, "rgba(216,200,143,0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, size, size);

    const leftPad = 72;
    let y = 110;
    const textWidth = 560;
    const headlineLength = previewHeadline.length;
const headlineFontSize =
  headlineLength > 70 ? 42 : headlineLength > 52 ? 50 : headlineLength > 34 ? 58 : 66;

const headlineLineHeight =
  headlineLength > 70 ? 48 : headlineLength > 52 ? 56 : headlineLength > 34 ? 64 : 70;

const headlineMaxLines =
  headlineLength > 80 ? 4 :
  headlineLength > 60 ? 3 : 2;

    ctx.textBaseline = "top";

    if (previewLayout === "bottom-card") {
      drawRoundedRect(ctx, 42, 630, 940, 330, 28);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fill();

      ctx.fillStyle = "#111111";
ctx.font = `800 ${headlineLength > 70 ? 40 : headlineLength > 48 ? 48 : 56}px sans-serif`;
if (previewHeadline) {
  y = 665;
  y = wrapCanvasText(
    ctx,
    previewHeadline,
    80,
    y,
    760,
    headlineLength > 70 ? 46 : headlineLength > 48 ? 54 : 64,
    headlineLength > 70 ? 4 : 3
  );
}

      if (previewSubtext) {
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = "600 31px sans-serif";
  y += 18;
  y = wrapCanvasText(ctx, previewSubtext, leftPad, y, textWidth, 40, 3);
}

      if (!useCircularOfferBadge && previewOfferBadge) {
        drawRoundedRect(ctx, 80, y + 18, 360, 70, 16);
        ctx.fillStyle = "#f7f2df";
        ctx.fill();
        ctx.fillStyle = "#26411f";
        ctx.font = "800 29px sans-serif";
        ctx.fillText(previewOfferBadge, 102, y + 38);
      }

      const editorialCta = clampText(plan?.cta || cta, 24);
      if (editorialCta) {
        ctx.fillStyle = "#666666";
        ctx.font = "600 28px sans-serif";
        ctx.fillText(`• ${editorialCta}`, 80, y + 106);
      }

      let supportY = y + 150;
      if (previewSupportLines.length) {
        ctx.font = "600 23px sans-serif";
        previewSupportLines.slice(0, 3).forEach((line) => {
  ctx.fillStyle = accentPalette.chipText;
  ctx.fillText(`• ${line}`, leftPad, supportY + 10);
  supportY += 44;
});
      }

      if (previewPhone) {
        drawRoundedRect(ctx, 80, 852, 390, 84, 18);
        ctx.fillStyle = "rgba(27,49,32,0.88)";
        ctx.fill();
        ctx.fillStyle = "#fff1bf";
        ctx.font = "800 36px sans-serif";
        ctx.fillText(`Тел: ${previewPhone}`, 98, 876);
      }
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${headlineLength > 52 ? 50 : headlineLength > 34 ? 58 : 66}px sans-serif`;
      if (previewHeadline) {
        y = wrapCanvasText(
          ctx,
          previewHeadline,
          leftPad,
          y,
          textWidth,
          headlineLineHeight,
          headlineMaxLines
        );
      }

      if (previewSubtext) {
        ctx.fillStyle = "rgba(255,255,255,0.94)";
        ctx.font = "600 31px sans-serif";
        y += 18;
        y = wrapCanvasText(ctx, previewSubtext, leftPad, y, textWidth, 40, 2);
      }

      if (!useCircularOfferBadge && previewOfferBadge) {
        drawRoundedRect(ctx, leftPad, y + 24, 390, 72, 16);
        ctx.fillStyle = "#f7f2df";
        ctx.fill();
        ctx.fillStyle = "#26411f";
        ctx.font = "800 30px sans-serif";
        ctx.fillText(previewOfferBadge, leftPad + 20, y + 45);
      }

      const editorialCta = clampText(plan?.cta || cta, 24);
      if (editorialCta) {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = "600 28px sans-serif";
        ctx.fillText(`• ${editorialCta}`, leftPad, y + 118);
      }

      if (previewSupportLines.length) {
        let supportY = y + 162;
        ctx.font = "600 23px sans-serif";

        previewSupportLines.slice(0, 3).forEach((line) => {
  ctx.fillStyle = "#4a4a4a";
  ctx.fillText(`• ${line}`, 80, supportY + 10);
  supportY += 42;
});

        y = supportY;
      } else {
        y += 156;
      }

      if (previewPhone) {
        drawRoundedRect(ctx, leftPad, y, 390, 84, 18);
        ctx.fillStyle = "rgba(27,49,32,0.88)";
        ctx.fill();
        ctx.fillStyle = "#fff1bf";
        ctx.font = "800 36px sans-serif";
        ctx.fillText(`Тел: ${previewPhone}`, leftPad + 18, y + 24);
      }
    }

    if (useCircularOfferBadge && previewOfferBadge) {
      const circleX = 874;
      const circleY = 146;
      const radius = 86;
      ctx.beginPath();
      ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = "#f7f2df";
      ctx.fill();
      ctx.strokeStyle = "rgba(216,200,143,0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#355129";
      ctx.font = "800 28px sans-serif";
      ctx.textAlign = "center";
      wrapCanvasText(ctx, previewOfferBadge, circleX - 56, circleY - 24, 112, 30, 3);
      ctx.textAlign = "start";
    }

    if (logoUrl) {
      try {
        const logo = await loadImage(logoUrl);

        drawRoundedRect(ctx, 820, 32, 170, 108, 24);
        const grad = ctx.createLinearGradient(820, 32, 990, 140);
        grad.addColorStop(0, "rgba(255,255,255,0.18)");
        grad.addColorStop(1, "rgba(255,255,255,0.05)");
        ctx.fillStyle = grad;
        ctx.fill();

        drawRoundedRect(ctx, 823, 35, 164, 102, 22);
        const inner = ctx.createLinearGradient(823, 35, 987, 137);
        inner.addColorStop(0, "rgba(26,31,24,0.78)");
        inner.addColorStop(1, "rgba(16,18,16,0.42)");
        ctx.fillStyle = inner;
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.drawImage(logo, 848, 56, 114, 60);
      } catch {
        // ignore logo draw errors
      }
    }

    return canvas;
  };

  const copyBannerToClipboard = async () => {
  try {
    if (!previewImageSource) return;

    setCopyingBanner(true);

    const node = getBannerExportNode();
    if (!node) {
      setMessage("Неуспешно копиране на банера.");
      return;
    }

    const blob = await toBlob(node, {
      cacheBust: true,
      pixelRatio: 2,
    });

    if (!blob) {
      setMessage("Неуспешно копиране на банера.");
      return;
    }

    if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
      setMessage("Този браузър не поддържа директно копиране на изображение.");
      return;
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);

    setMessage("Банерът е копиран.");
  } catch (err) {
    console.error(err);
    setMessage("Неуспешно копиране на банера.");
  } finally {
    setCopyingBanner(false);
  }
};
const getBannerExportNode = () => {
  if (exportBannerRef.current) return exportBannerRef.current;
  if (bannerPreviewRef.current) return bannerPreviewRef.current;
  return null;
};

const downloadImage = async (format: "png" | "jpg") => {
  try {
    const node = getBannerExportNode();

    if (!node) {
      setMessage("Няма готов банер за сваляне.");
      return;
    }

    const fileName = `banner-${Date.now()}`;

    if (format === "png") {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${fileName}.png`;
      link.click();

      setMessage("PNG банерът е свален.");
      return;
    }

    const dataUrl = await toJpeg(node, {
      cacheBust: true,
      pixelRatio: 2,
      quality: 0.95,
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${fileName}.jpg`;
    link.click();

    setMessage("JPG банерът е свален.");
  } catch (error) {
    console.error("Download banner error:", error);
    setMessage("Неуспешно сваляне на банера.");
  }
};
  
         const renderQuickPreview = () => {
    return (
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Quick Ad Generator
              </p>
              <h2 className="mt-2 text-[28px] font-black leading-[1] tracking-[-0.03em] text-neutral-950">
                Създай рекламен банер
              </h2>
              <p className="mt-3 max-w-[680px] text-[15px] leading-[1.6] text-neutral-600">
                Попълни основните данни, качи лого или изображение при нужда и
                генерирай бърз банер за Facebook / Instagram.
              </p>
            </div>

            
          </div>
                    {fromPromoCalendarFlow && promoHelperMessage ? (
            <div className="mb-6 rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium leading-[1.6] text-amber-900">
              {promoHelperMessage}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2"></div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2 block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Описание на банера
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Пример: Направи рекламен банер за сладкарница Наслада. Всяка неделя парче торта + още едно подарък."
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Оферта
              </span>
              <input
                value={offerText}
                onChange={(e) => setOfferText(e.target.value)}
                placeholder="Напр. 2 парчета торта на цената на 1"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Цена / отстъпка
              </span>
              <input
                value={discountText}
                onChange={(e) => setDiscountText(e.target.value)}
                placeholder="Напр. -20% / 9.99 €."
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Период
              </span>
              <input
                value={periodText}
                onChange={(e) => setPeriodText(e.target.value)}
                placeholder="Напр. Само тази неделя"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Телефон
              </span>
              <input
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                placeholder="Напр. 0888 123 456"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>

            <label className="md:col-span-2 block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Адрес
              </span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Напр. Красна поляна, София"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>

            <label className="md:col-span-2 block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Точен / допълнителен текст
              </span>
              <textarea
                value={exactText}
                onChange={(e) => setExactText(e.target.value)}
                rows={3}
                placeholder="Текст, който искаш да използва смислово."
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>

            <label className="md:col-span-2 block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Допълнителни изисквания
              </span>
              <textarea
                value={extraText}
                onChange={(e) => setExtraText(e.target.value)}
                rows={3}
                placeholder="Напр. Да е premium, clean, без CTA бутон, с по-реалистична визия."
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>
          </div>

                    <div className="mt-8">
            <div className="rounded-[24px] border border-black/10 bg-[#fcfaf7] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[16px] font-bold text-neutral-900">
                    Лого
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    Качи лого за банера.
                  </p>
                </div>
                {logoUrl ? (
                  <button
                    type="button"
                    onClick={clearLogoSelection}
                    className="rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-black hover:text-white"
                  >
                    Махни
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {logoUploading ? "Качване..." : "Качи лого"}
                  </button>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleLogoUpload(file);
                    }}
                  />

                  {logoFileName ? (
                    <span className="text-sm text-neutral-600">{logoFileName}</span>
                  ) : (
                    <span className="text-sm text-neutral-400">Няма качено лого</span>
                  )}
                </div>

                <div className="min-h-[110px] rounded-2xl border border-black/10 bg-white p-3">
                  {logoUrl ? (
                    <div className="flex h-full items-center justify-center overflow-hidden rounded-xl bg-[#f5f1ec]">
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="max-h-[80px] w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[80px] items-center justify-center rounded-xl bg-[#f5f1ec] text-sm text-neutral-400">
                      Preview на логото
                    </div>
                  )}
                </div>
              </div>

              {logoUploadMessage ? (
                <p className="mt-3 text-sm text-neutral-600">{logoUploadMessage}</p>
              ) : null}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleGenerate(false)}
              disabled={loading || logoUploading || imageUploading}
              className="rounded-[20px] bg-neutral-950 px-6 py-3 text-[15px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Генериране..." : "Генерирай банер"}
            </button>
          </div>

          {message ? (
            <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8f5ef] px-4 py-3 text-sm font-medium text-neutral-700">
              {message}
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              
              <h3 className="mt-2 text-[24px] font-black leading-none tracking-[-0.03em] text-neutral-950">
                Преглед на банера
              </h3>
            </div>
          </div>

          <div
  ref={generatedImageUrl ? bannerPreviewRef : null}
  className="w-full overflow-hidden rounded-[28px] border border-black/10 bg-[#f5f1ec]"
>
            {loading ? (
              <div className="flex aspect-square items-center justify-center p-8 text-center">
                <div className="max-w-[320px]">
                  <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-black/10 border-t-black" />
                  <div className="mt-6 text-[18px] font-bold text-neutral-900">
                    Генерираме твоята перфектна реклама...
                  </div>
                  <p className="mt-3 text-sm leading-[1.7] text-neutral-500">
                    Изчакай малко, подготвяме визия, текст и композиция за банера.
                  </p>
                </div>
              </div>
            ) : generatedImageUrl ? (
  <>
    <div className="md:hidden">
      {renderBannerComposition(false)}
    </div>

    <div className="hidden md:block">
      {renderBannerComposition(true)}
    </div>
  </>
) : (
              <div className="flex aspect-square items-center justify-center p-8 text-center">
                <div>
                  <div className="text-[15px] font-semibold text-neutral-700">
                    Все още няма генериран банер
                  </div>
                  <p className="mt-2 text-sm leading-[1.6] text-neutral-500">
                    Попълни формата и натисни „Генерирай банер“.
                  </p>
                </div>
              </div>
            )}
          </div>

                    {!loading && previewImageSource ? (
  <div className="mt-4 flex flex-wrap gap-3">
    <button
      type="button"
      onClick={() => void copyBannerToClipboard()}
      disabled={copyingBanner}
      className="rounded-[20px] border border-black/10 bg-white px-5 py-3 text-[15px] font-semibold text-neutral-800 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {copyingBanner ? "Копиране..." : "Копирай банера"}
    </button>

    <button
      type="button"
      onClick={() => setIsPreviewOpen(true)}
      className="rounded-[20px] border border-black/10 bg-white px-5 py-3 text-[15px] font-semibold text-neutral-800 transition hover:bg-neutral-100"
    >
      Цял екран
    </button>

    <button
      type="button"
      onClick={() => void downloadImage("png")}
      className="rounded-[20px] border border-black/10 bg-white px-5 py-3 text-[15px] font-semibold text-neutral-800 transition hover:bg-neutral-100"
    >
      Свали PNG
    </button>

    <button
      type="button"
      onClick={() => void downloadImage("jpg")}
      className="rounded-[20px] border border-black/10 bg-white px-5 py-3 text-[15px] font-semibold text-neutral-800 transition hover:bg-neutral-100"
    >
      Свали JPG
    </button>
  </div>
) : null}

              <div className="mt-6 rounded-[24px] border border-black/10 bg-[#fcfaf7] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[16px] font-bold text-neutral-900">
                      Основно изображение
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
  По желание: качи свое изображение и AI ще го интегрира в банера.
</p>
                  </div>
                  {imageUrl ? (
                    <button
                      type="button"
                      onClick={clearImageSelection}
                      className="rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-black hover:text-white"
                    >
                      Махни
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={imageUploading}
                      className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {imageUploading ? "Качване..." : "Качи изображение"}
                    </button>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleImageUpload(file);
                      }}
                    />

                    {imageFileName ? (
  <span className="max-w-[220px] break-all text-sm leading-5 text-neutral-600">
    {imageFileName}
  </span>
) : (
  <span className="text-sm text-neutral-400">
    Няма качено изображение
  </span>
)}
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white p-3">
  {imageUrl ? (
    <div className="flex h-[220px] w-full items-center justify-center overflow-hidden rounded-xl bg-[#f5f1ec]">
      <img
  src={imageUrl}
  alt="Preview на каченото изображение"
  className="h-[220px] w-full rounded-xl object-contain"
  style={{ maxWidth: "100%" }}
  loading="eager"
  onError={() => {
    setImageUploadMessage("Изображението е качено, но preview-то не може да се зареди.");
  }}
/>
    </div>
  ) : (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl bg-[#f5f1ec] text-sm text-neutral-400">
      Preview на изображението
    </div>
  )}
</div>
                </div>

                {imageUrl ? (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-neutral-700">
                      Начин на използване
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "auto", label: "Автоматично" },
                        { key: "integrate", label: "Вграждане" },
                        { key: "exact", label: "Точно копие" },
                      ].map((option) => {
                        const active = imageUsageMode === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() =>
                              setImageUsageMode(option.key as ImageUsageMode)
                            }
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                              active
                                ? "bg-neutral-950 text-white"
                                : "border border-black/10 bg-white text-neutral-700 hover:bg-neutral-100"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 rounded-xl bg-[#f5f1ec] p-3 text-sm leading-[1.5] text-neutral-700">
                      {imageUsageMode === "auto" ? (
                        <p>
                          AI сам решава как да използва изображението – най-балансиран вариант.
                        </p>
                      ) : null}

                      {imageUsageMode === "integrate" ? (
                        <p>
                          Обектът от изображението се вгражда в нова сцена. В полето
                          „Допълнителни изисквания“ можеш да уточниш какво точно да
                          се използва, например: „използвай само колата от снимката“,
                          „използвай само продукта“, „не използвай фона“, „вгради
                          обекта в нова реалистична сцена“.
                        </p>
                      ) : null}

                      {imageUsageMode === "exact" ? (
                        <p>
                          Изображението се използва почти без промяна – запазва се
                          максимално оригинала.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {imageUploadMessage ? (
                  <p className="mt-3 text-sm text-neutral-600">{imageUploadMessage}</p>
                ) : null}
              </div>
            
        </div>
      </section>
    );
  };
  const renderBrandMode = () => {
    return (
      <section className="mx-auto max-w-4xl rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
            Brand Workspace Setup
          </p>
          <h2 className="mt-2 text-[30px] font-black leading-none tracking-[-0.03em] text-neutral-950">
            Запази brand profile
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.7] text-neutral-600">
            Тук подготвяш основната информация за бранда, която после ще се
            използва за банери, постове и следващи формати.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-800">
              Име на бранда
            </span>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Напр. Наслада"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
            />
          </label>

                    <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-800">
              Адрес на бизнеса
            </span>
            <input
              value={brandBusinessAddress}
              onChange={(e) => setBrandBusinessAddress(e.target.value)}
              placeholder="Напр. София, ул. Витоша 25"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-800">
              Телефон
            </span>
            <input
              value={brandPhone}
              onChange={(e) => setBrandPhone(e.target.value)}
              placeholder="0888 123 456"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
            />
          </label>

          

          <label className="md:col-span-2 block">
            <span className="mb-2 block text-sm font-semibold text-neutral-800">
              Описание на бранда
            </span>
            <textarea
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              rows={5}
              placeholder="С какво се занимава брандът, какъв е стилът му, какво предлага..."
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
            />
          </label>

          <label className="md:col-span-2 block">
            <span className="mb-2 block text-sm font-semibold text-neutral-800">
              Предпочитани цветове
            </span>
            <input
              value={brandPreferredColors}
              onChange={(e) => setBrandPreferredColors(e.target.value)}
              placeholder="Напр. кремаво, тъмнозелено, златисто"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
            />
          </label>
        </div>

        <div className="mt-6 rounded-[24px] border border-black/10 bg-[#fcfaf7] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[16px] font-bold text-neutral-900">
                Лого на бранда
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                Качи основното лого за brand workspace.
              </p>
            </div>

            {brandLogoUrl ? (
              <button
                type="button"
                onClick={clearBrandLogoSelection}
                className="rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-black hover:text-white"
              >
                Махни
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => brandLogoInputRef.current?.click()}
              disabled={brandLogoUploading}
              className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {brandLogoUploading ? "Качване..." : "Качи лого"}
            </button>

            <input
              ref={brandLogoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleBrandLogoUpload(file);
              }}
            />

            {brandLogoFileName ? (
              <span className="text-sm text-neutral-600">{brandLogoFileName}</span>
            ) : (
              <span className="text-sm text-neutral-400">Няма качено лого</span>
            )}
          </div>

          {brandLogoUploadMessage ? (
            <p className="mt-3 text-sm text-neutral-600">
              {brandLogoUploadMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSaveBrandProfile()}
            disabled={brandSaving || brandLogoUploading}
            className="rounded-[20px] bg-neutral-950 px-6 py-3 text-[15px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {brandSaving ? "Записване..." : "Запази brand profile"}
          </button>

          {brandProfileSaved ? (
            <span className="text-sm font-semibold text-emerald-700">
              Brand profile saved
            </span>
          ) : null}
        </div>

        {brandMessage ? (
          <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8f5ef] px-4 py-3 text-sm font-medium text-neutral-700">
            {brandMessage}
          </div>
        ) : null}
      </section>
    );
  };

  return (
  <>
    <main className="min-h-screen bg-[#f5f1ec] px-4 py-8 text-black md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        {mode === "quick-ad" ? renderQuickPreview() : renderBrandMode()}
      </div>
    </main>

{generatedImageUrl ? (
  <div className="fixed left-[-9999px] top-0 h-[1024px] w-[1024px] overflow-hidden">
    <div ref={exportBannerRef} className="h-[1024px] w-[1024px]">
      {renderBannerComposition(true)}
    </div>
  </div>
) : null}

            {isPreviewOpen && generatedImageUrl ? (
  <div className="fixed inset-0 z-50 bg-black/80 p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
    <button
      type="button"
      onClick={() => setIsPreviewOpen(false)}
      className="fixed right-4 top-4 z-[70] flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-black text-black shadow-lg"
      aria-label="Затвори"
    >
      ✕
    </button>

    <div className="flex min-h-full items-center justify-center">
      <div className="w-full max-w-[min(92vw,900px)] rounded-[24px] bg-white p-3 shadow-2xl sm:p-5">
        <div className="overflow-hidden rounded-[20px] border border-black/10">
          {renderBannerComposition(true)}
        </div>
      </div>
    </div>
  </div>
) : null}
      {showDemoLimitModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-md rounded-[24px] bg-white p-6 text-center">
      <h3 className="text-xl font-black text-neutral-900">
        Отключи пълния достъп
      </h3>

      <p className="mt-3 text-sm text-neutral-600 leading-6">
        Вече видя как работи платформата.  
        Регистрирай се, за да генерираш неограничени реклами.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/register"
          className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Регистрация
        </Link>

        <button
          onClick={() => setShowDemoLimitModal(false)}
          className="text-sm text-neutral-500"
        >
          Затвори
        </button>
      </div>
    </div>
  </div>
)}
{showPaywallModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
      <h3 className="text-[24px] font-black text-neutral-900">
        Хареса ли ти какво създадохме? 🙂
      </h3>

      <p className="mt-3 text-sm text-neutral-600 leading-6">
        Вземи пакет с кредити и продължи без ограничения с банери, постове,
        календар и видео.
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
)}

{showSystemErrorModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="w-full max-w-md rounded-[28px] bg-white p-7 text-center shadow-[0_30px_100px_rgba(0,0,0,0.3)] animate-[fadeIn_0.25s_ease]">

      {/* Икона */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <span className="text-2xl">⚠️</span>
      </div>

      {/* Заглавие */}
      <h3 className="mt-4 text-[22px] font-black text-neutral-900">
        Възникна проблем
      </h3>

      {/* Текст */}
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Кредитите бяха възстановени.<br />
        Опитай отново след малко.
      </p>

      {/* Бутони */}
      <div className="mt-6 flex flex-col gap-3">

        <button
          type="button"
          onClick={() => {
            setShowSystemErrorModal(false);
            setSystemErrorMessage("");
            handleGenerate(); // 🔥 retry
          }}
          className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          Опитай отново
        </button>

        <button
          type="button"
          onClick={() => {
            setShowSystemErrorModal(false);
            setSystemErrorMessage("");
          }}
          className="text-sm text-neutral-500 hover:text-neutral-700 transition"
        >
          Затвори
        </button>

      </div>
    </div>
  </div>
)}

    </>
  );
}
export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}