"use client";
import { createClient } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandWorkspaceMobile from "./BrandWorkspaceMobile";

type BrandProfile = {
  id?: string;
  brand_name: string;
  business_address?: string | null;
  phone?: string | null;
  brand_description?: string | null;
  preferred_colors?: string | null;
  logo_url?: string | null;
};

type ToneOption = "soft" | "luxury" | "aggressive";

type BrandVariation = {
  post_text?: string;
  hashtags?: string;
};

type BrandGenerationResponse = {
  success: boolean;
  variations?: BrandVariation[];
  error?: string;
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
   business_address?: string | null;
    phone?: string | null;
    brand_description?: string | null;
    preferred_colors?: string | null;
    logo_url?: string | null;
  };
  selected_post?: VideoWorkspacePost;
};

const toneOptions: {
  value: ToneOption;
  label: string;
  description: string;
}[] = [
  {
    value: "soft",
    label: "ðŸ’– Soft / emotional",
    description: "A softer, warmer and more emotional tone.",
  },
  {
    value: "luxury",
    label: "ðŸ’Ž Luxury / premium",
    description: "A more elegant, stylish and premium tone of voice.",
  },
  {
    value: "aggressive",
    label: "âš¡ Direct sales",
    description: "A stronger CTA, more urgency and a more direct sales angle.",
  },
];

export default function BrandWorkspacePage() {
  const router = useRouter();

  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [userRequest, setUserRequest] = useState("");
  const [tone, setTone] = useState<ToneOption>("soft");
  const [variations, setVariations] = useState<BrandVariation[]>([]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
      const [copyMessage, setCopyMessage] = useState("");
  const [promoHelperMessage, setPromoHelperMessage] = useState("");
  const [promoPhone, setPromoPhone] = useState("");
  const [promoAddress, setPromoAddress] = useState("");

    useEffect(() => { 
    const loadWorkspace = async () => {
      try {
      const stored = localStorage.getItem("active_brand_profile");

      if (stored) {
        const parsed = JSON.parse(stored);

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.id) {
          localStorage.setItem("active_brand_user_id", user.id);
        }

        setBrandProfile(parsed);
        setPromoHelperMessage("");
        setPageLoading(false);
        return;
      }

      const calendarStored = localStorage.getItem("ai_smm_selected_calendar_item");

      if (calendarStored) {
        const parsedCalendar = JSON.parse(calendarStored);
        const item = parsedCalendar?.item;

        const promoText = [item?.title, item?.format, item?.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const isPromoFlow =
          /offer|promo|promotion|discount|sale|special price|2 for 1|gift|bonus|deal/i.test(
            promoText
          );

        if (isPromoFlow) {
                    setBrandProfile({
            brand_name: parsedCalendar?.businessType || "Brand",
            business_address: "",
            phone: "",
            brand_description: parsedCalendar?.notes || item?.description || "",
            preferred_colors: "",
            logo_url: "",
          });

          setUserRequest(
             `Create promotional text for ${parsedCalendar?.businessType || "this business"}. I will enter the real offer, price, discount or bonus. Do not invent a specific promotion.`
          );

          setPromoHelperMessage(
            "This is a promo post from the content calendar. First, write the real offer, price, discount or bonus. If you have them, add a phone number and address to make the ad more conversion-focused."
          );

          setPageLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load brand workspace data from localStorage:", err);
          } finally {
        setPageLoading(false);
      }
    };

    void loadWorkspace();
  }, []);

  useEffect(() => {
    if (!copyMessage) return;

    const timer = window.setTimeout(() => {
      setCopyMessage("");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [copyMessage]);

    async function handleGenerate() {
    if (!brandProfile) {
      setError("No active brand profile loaded.");
      return;
    }

            const finalUserRequest = [
      "Write everything in English.",
      "Create content for an English-speaking audience.",
      userRequest.trim(),
      brandProfile.business_address?.trim()
        ? `Business address: ${brandProfile.business_address.trim()}`
        : "",
      brandProfile.preferred_colors?.trim()
        ? `Preferred brand colors/style: ${brandProfile.preferred_colors.trim()}`
        : "",
      promoPhone.trim() ? `Phone: ${promoPhone.trim()}` : "",
      promoAddress.trim() ? `Address: ${promoAddress.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (!finalUserRequest.trim()) {
      setError("Please describe what you want to create.");
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setLoading(true);
    setError("");
    setCopyMessage("");
    setVariations([]);
    setSelectedVariationIndex(null);

    try {
      const supabase = createClient();

const {
  data: { session },
} = await supabase.auth.getSession();

const accessToken = session?.access_token;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-brand-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${accessToken}`,
          },
                    body: JSON.stringify({
  brand_profile: brandProfile,
  user_request: finalUserRequest,
  tone,
  source: "en_brand_post",
  locale: "en",
  language: "English",
}),
        }
      );

      const data: BrandGenerationResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Generation failed.");
      }

      const safeVariations = Array.isArray(data.variations) ? data.variations : [];

      setVariations(safeVariations);
      setSelectedVariationIndex(safeVariations.length > 0 ? 0 : null);
    } catch (err) {
      console.error("Brand content generation error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during generation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyText() {
    if (!selectedVariation?.post_text) return;

    try {
      await navigator.clipboard.writeText(selectedVariation.post_text);
      setCopyMessage("Text copied.");
    } catch (err) {
      console.error("Copy text failed:", err);
      setError("Could not copy the text.");
    }
  }

  async function handleCopyHashtags() {
    if (!selectedVariation?.hashtags) return;

    try {
      await navigator.clipboard.writeText(selectedVariation.hashtags);
      setCopyMessage("Hashtags copied.");
    } catch (err) {
      console.error("Copy hashtags failed:", err);
      setError("Could not copy the hashtags.");
    }
  }

  function handleExportSelected() {
    if (!brandProfile || !selectedVariation) {
      setError("No variation selected for export.");
      return;
    }

          const exportPayload = {
        brand_profile: brandProfile,
        user_request: [
          userRequest,
          
          promoAddress.trim() ? `Address: ${promoAddress.trim()}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        tone,
        selected_variation: selectedVariation,
        exported_at: new Date().toISOString(),
      };

    try {
      localStorage.setItem("active_brand_export", JSON.stringify(exportPayload));
      router.push("/dashboard/brand-export");
    } catch (err) {
      console.error("Export save failed:", err);
      setError("Could not prepare the export.");
    }
  }
  function handleOpenVideoWorkspace() {
  if (!brandProfile || !selectedVariation) {
    setError("No variation selected for video workspace.");
    return;
  }

    const payload: VideoWorkspacePayload = {
    source: "brand-post",
    user_request: [
      userRequest,
      
      promoAddress.trim() ? `Address: ${promoAddress.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
        brand_profile: {
      brand_name: brandProfile.brand_name,
      business_address: brandProfile.business_address || "",
      phone: brandProfile.phone || "",
      brand_description: brandProfile.brand_description || "",
      preferred_colors: brandProfile.preferred_colors || "",
      logo_url: brandProfile.logo_url || "",
    },
    selected_post: {
      id: String(selectedVariationIndex ?? ""),
      headline: "",
      caption: selectedVariation.post_text || "",
      offer: "",
      cta: "",
      angle: tone,
      audience: "",
      raw_text: selectedVariation.post_text || "",
    },
  };

  try {
    localStorage.setItem("ai_smm_video_workspace_v1", JSON.stringify(payload));
    router.push("/en/dashboard/brand-studio");
  } catch (err) {
    console.error("Video workspace save failed:", err);
    setError("Could not open the video workspace.");
  }
}

  const selectedVariation =
    selectedVariationIndex !== null ? variations[selectedVariationIndex] : null;

  if (pageLoading) {
  return (
    <main className="min-h-screen bg-[#f5f1ec] px-6 py-10 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="animate-pulse rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          Loading...
        </div>
      </div>
    </main>
  );
}

  return (
  <>
    <div className="md:hidden">
      <BrandWorkspaceMobile
        brandProfile={brandProfile}
        userRequest={userRequest}
        setUserRequest={setUserRequest}
        tone={tone}
        setTone={setTone}
        toneOptions={toneOptions}
        promoHelperMessage={promoHelperMessage}
        promoPhone={promoPhone}
        setPromoPhone={setPromoPhone}
        promoAddress={promoAddress}
        setPromoAddress={setPromoAddress}
        variations={variations}
        selectedVariationIndex={selectedVariationIndex}
        setSelectedVariationIndex={setSelectedVariationIndex}
        selectedVariation={selectedVariation}
        loading={loading}
        error={error}
        copyMessage={copyMessage}
        onGenerate={handleGenerate}
        onCopyText={handleCopyText}
        onOpenVideoWorkspace={handleOpenVideoWorkspace}
      />
    </div>

    <main className="hidden min-h-screen bg-[#f5f1ec] px-6 py-10 text-black md:block">
            <div className="mx-auto max-w-7xl space-y-8">
        
        <div className="mb-2">
          <h1 className="text-4xl font-semibold tracking-tight text-black">
            Brand Workspace
          </h1>
          <p className="mt-2 text-sm text-black/50">
            Create 3 post text variations and choose the strongest one for your brand
          </p>
        </div>

        {!brandProfile ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-200">
            No active brand profile found in localStorage. Go back to brand onboarding and save your brand.
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                    Active brand
                  </div>

                  <h2 className="text-2xl font-semibold text-black">{brandProfile.brand_name}</h2>

                  {brandProfile.brand_description ? (
                   <p className="mt-3 max-w-3xl text-black/65">
                      {brandProfile.brand_description}
                    </p>
                  ) : null}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        {brandProfile.business_address ? (
                      <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4">
                        <p className="text-xs uppercase tracking-wider text-black/45">
                          Address
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-black">
                          {brandProfile.business_address}
                        </p>
                      </div>
                    ) : null}

                    {brandProfile.phone ? (
  <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4">
    <p className="text-xs uppercase tracking-wider text-black/45">Phone</p>
    <p className="mt-1 text-base font-semibold text-black">{brandProfile.phone}</p>
  </div>
) : null}

                    

                                        {brandProfile.preferred_colors ? (
                      <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4 sm:col-span-2">
                        <p className="text-xs uppercase tracking-wider text-black/45">
                          Preferred colors
                        </p>
                        <p className="mt-1 text-sm font-semibold text-black">
                          {brandProfile.preferred_colors}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {brandProfile.logo_url ? (
                  <div className="w-full md:w-48">
                    <div className="rounded-3xl border border-white/10 bg-white p-4">
                      <img
                        src={brandProfile.logo_url}
                        alt={brandProfile.brand_name}
                        className="h-32 w-full object-contain"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
  <div className="mb-6">
    <label
      htmlFor="brand-request"
      className="block text-xl font-semibold text-black"
    >
      What do you want to create today?
    </label>
    <p className="mt-2 text-sm leading-6 text-black/55">
      Describe what type of ad you want for this brand and choose the right text style.
    </p>
  </div>
      {promoHelperMessage ? (
    <>
      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
        {promoHelperMessage}
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-neutral-800">
            Phone for this promo post
          </span>
          <input
            value={promoPhone}
            onChange={(e) => setPromoPhone(e.target.value)}
            placeholder="Example: your business phone number"
            className="w-full rounded-2xl border border-black/10 bg-[#f7f3ee] px-4 py-3 text-[15px] text-black outline-none transition focus:border-black/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-neutral-800">
            Address for this promo post
          </span>
          <input
            value={promoAddress}
            onChange={(e) => setPromoAddress(e.target.value)}
            placeholder="Example: your business address or service area"
            className="w-full rounded-2xl border border-black/10 bg-[#f7f3ee] px-4 py-3 text-[15px] text-black outline-none transition focus:border-black/20"
          />
        </label>
      </div>
    </>
  ) : null}

  <textarea
    id="brand-request"
    value={userRequest}
    onChange={(e) => setUserRequest(e.target.value)}
    placeholder="Example: Write an Instagram post for a spring promotion, a new service, a special offer or a brand campaign."
    className="min-h-[170px] w-full rounded-3xl border border-black/10 bg-[#f7f3ee] px-5 py-4 text-[15px] leading-7 text-black outline-none transition focus:border-black/20"
  />

  <div className="mt-6">
    <p className="mb-3 text-lg font-semibold text-black">Choose style</p>

    <div className="grid gap-3 md:grid-cols-3">
      {toneOptions.map((option) => {
        const isActive = tone === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTone(option.value)}
            className={`rounded-2xl border p-4 text-left transition ${
  isActive
    ? "border-black bg-white shadow-sm"
    : "border-black/10 bg-[#f7f3ee] hover:bg-white"
}`}
          >
            <div className={`text-base font-semibold ${isActive ? "text-black" : "text-black"}`}>
              {option.label}
            </div>
            <p
              className={`mt-2 text-sm leading-6 ${
                isActive ? "text-white/75" : "text-black/60"
              }`}
            >
              {option.description}
            </p>
          </button>
        );
      })}
    </div>
  </div>

  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Generating..." : "Generate 3 variations"}
    </button>

    <div className="text-sm text-black/55">
      Selected style:{" "}
      <span className="font-medium text-black">
        {toneOptions.find((option) => option.value === tone)?.label}
      </span>
    </div>
  </div>

  {loading ? (
    <div className="mt-4 rounded-2xl border border-black/10 bg-[#f7f3ee] px-4 py-3 text-sm text-black/70">
      Generating 3 text and hashtag variations...
    </div>
  ) : null}

  {error ? (
    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {error}
    </div>
  ) : null}

  {copyMessage ? (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {copyMessage}
    </div>
  ) : null}
</section>

            {variations.length > 0 ? (
  <section className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-black">Variations</h2>
        <p className="mt-1 text-black/55">
          Choose the strongest variation for this brand.
        </p>
      </div>

      <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black/60">
        Total variations: {variations.length}
      </div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="grid gap-4">
        {variations.map((variation, index) => {
          const isSelected = selectedVariationIndex === index;

          return (
            <div
              key={index}
              className={`rounded-3xl border p-5 transition ${
                isSelected
                  ? "border-black bg-white shadow-sm"
                  : "border-black/10 bg-white"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div
                    className={`mb-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      isSelected
                        ? "bg-black text-white"
                        : "border border-black/10 bg-[#f7f3ee] text-black/70"
                    }`}
                  >
                    Variation {index + 1}
                  </div>

                  <p className="whitespace-pre-line text-[15px] leading-7 text-black/85">
                    {variation.post_text || "No generated text."}
                  </p>

                  <div className="mt-4 rounded-2xl border border-black/10 bg-[#f7f3ee] p-4">
                    <p className="mb-2 text-xs uppercase tracking-wider text-black/45">
                      Hashtags
                    </p>
                    <p className="whitespace-pre-line text-sm leading-6 text-black/70">
                      {variation.hashtags || "No hashtags generated."}
                    </p>
                  </div>
                </div>

                <div className="lg:w-44">
                  <button
                    type="button"
                    onClick={() => setSelectedVariationIndex(index)}
                    className={`w-full rounded-full px-4 py-3 text-sm font-semibold transition ${
                      isSelected
                        ? "bg-black text-white"
                        : "border border-black/10 bg-white text-black hover:bg-black hover:text-white"
                    }`}
                  >
                    {isSelected ? "Selected variation" : "Choose this"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-4 inline-flex rounded-full border border-black/10 bg-[#f7f3ee] px-3 py-1 text-sm font-semibold text-black/70">
          Ð¤Ð¸Ð½Ð°Ð»ÐµÐ½ Ð¸Ð·Ð±Ð¾Ñ€
        </div>

        {selectedVariation ? (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm text-black/55">
                Selected:
                <span className="ml-2 font-semibold text-black">
                  <p className="mb-2 text-sm text-black/55">Hashtags</p>
                </span>
              </p>

              <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4">
                <p className="whitespace-pre-line text-[15px] leading-7 text-black/85">
                  {selectedVariation.post_text || "No text."}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-black/55">Hashtags</p>
              <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4">
                <p className="whitespace-pre-line text-sm leading-6 text-black/75">
                  {selectedVariation.hashtags || "No hashtags."}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={handleCopyText}
                className="w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
              >
                ÐšÐ¾Ð¿Ð¸Ñ€Ð°Ð¹ Ñ‚ÐµÐºÑÑ‚Ð°
              </button>

              <button
                type="button"
                onClick={handleOpenVideoWorkspace}
                className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Open Brand Studio
              </button>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4 text-sm text-black/60">
              The selected post will open in Brand Studio, where you can create a banner and video.
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4 text-sm text-black/60">
            Choose a variation from the left to preview it here as your final selection.
          </div>
        )}
      </div>
    </div>
  </section>
) : null}
          </>
        )}
      </div>
        </main>
  </>
);
}


