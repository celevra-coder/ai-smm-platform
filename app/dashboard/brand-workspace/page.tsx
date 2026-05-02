"use client";
import { createClient } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    label: "💖 Нежен / женствен",
    description: "По-мек, емоционален и деликатен тон.",
  },
  {
    value: "luxury",
    label: "💎 Луксозен / премиум",
    description: "По-елегантен, стилен и премиум tone of voice.",
  },
  {
    value: "aggressive",
    label: "⚡ Агресивно продаващ",
    description: "По-силен CTA, urgency и по-директна продажба.",
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
          /оферта|промо|промоция|намалени|намаление|отстъпк|специална цена|2 за 1|подарък|бонус|promo/i.test(
            promoText
          );

        if (isPromoFlow) {
                    setBrandProfile({
            brand_name: parsedCalendar?.businessType || "Бранд",
            business_address: "",
            phone: "",
            brand_description: parsedCalendar?.notes || item?.description || "",
            preferred_colors: "",
            logo_url: "",
          });

          setUserRequest(
            `Създай промо текст за ${parsedCalendar?.businessType || "този бизнес"}. Аз ще въведа реалната оферта, цена, отстъпка или бонус. Не измисляй конкретна промоция.`
          );

          setPromoHelperMessage(
            "Това е промо пост от контент календара. Първо напиши реалната оферта, цена, отстъпка или бонус. Ако имаш – добави телефон и адрес, за да направим рекламата по-конвертираща."
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
      setError("Няма зареден активен brand profile.");
      return;
    }

        const finalUserRequest = [
      userRequest.trim(),
      brandProfile.business_address?.trim()
        ? `Адрес на бизнеса: ${brandProfile.business_address.trim()}`
        : "",
      brandProfile.preferred_colors?.trim()
        ? `Предпочитани цветове на бранда: ${brandProfile.preferred_colors.trim()}`
        : "",
      promoPhone.trim() ? `Телефон: ${promoPhone.trim()}` : "",
      promoAddress.trim() ? `Адрес: ${promoAddress.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (!finalUserRequest.trim()) {
      setError("Моля, опиши какво искаш да създадем.");
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Липсват NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY.");
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
  source: "brand_post",
}),
        }
      );

      const data: BrandGenerationResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Неуспешно генериране.");
      }

      const safeVariations = Array.isArray(data.variations) ? data.variations : [];

      setVariations(safeVariations);
      setSelectedVariationIndex(safeVariations.length > 0 ? 0 : null);
    } catch (err) {
      console.error("Brand content generation error:", err);
      setError(err instanceof Error ? err.message : "Възникна грешка при генерирането.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyText() {
    if (!selectedVariation?.post_text) return;

    try {
      await navigator.clipboard.writeText(selectedVariation.post_text);
      setCopyMessage("Текстът е копиран.");
    } catch (err) {
      console.error("Copy text failed:", err);
      setError("Неуспешно копиране на текста.");
    }
  }

  async function handleCopyHashtags() {
    if (!selectedVariation?.hashtags) return;

    try {
      await navigator.clipboard.writeText(selectedVariation.hashtags);
      setCopyMessage("Хаштаговете са копирани.");
    } catch (err) {
      console.error("Copy hashtags failed:", err);
      setError("Неуспешно копиране на хаштаговете.");
    }
  }

  function handleExportSelected() {
    if (!brandProfile || !selectedVariation) {
      setError("Няма избран вариант за export.");
      return;
    }

          const exportPayload = {
        brand_profile: brandProfile,
        user_request: [
          userRequest,
          promoPhone.trim() ? `Телефон: ${promoPhone.trim()}` : "",
          promoAddress.trim() ? `Адрес: ${promoAddress.trim()}` : "",
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
      setError("Неуспешно подготвяне на export.");
    }
  }
  function handleOpenVideoWorkspace() {
  if (!brandProfile || !selectedVariation) {
    setError("Няма избран вариант за video workspace.");
    return;
  }

    const payload: VideoWorkspacePayload = {
    source: "brand-post",
    user_request: [
      userRequest,
      promoPhone.trim() ? `Телефон: ${promoPhone.trim()}` : "",
      promoAddress.trim() ? `Адрес: ${promoAddress.trim()}` : "",
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
    router.push("/dashboard/brand-studio");
  } catch (err) {
    console.error("Video workspace save failed:", err);
    setError("Неуспешно отваряне на video workspace.");
  }
}

  const selectedVariation =
    selectedVariationIndex !== null ? variations[selectedVariationIndex] : null;

  if (pageLoading) {
  return (
    <main className="min-h-screen bg-[#f5f1ec] px-6 py-10 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="animate-pulse rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          Зареждане...
        </div>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-[#f5f1ec] px-6 py-10 text-black">
            <div className="mx-auto max-w-7xl space-y-8">
        
        <div className="mb-2">
          <h1 className="text-4xl font-semibold tracking-tight text-black">
            Brand Workspace
          </h1>
          <p className="mt-2 text-sm text-black/50">
            Създай 3 варианта на текст за пост и избери най-силния за своя бранд
          </p>
        </div>

        {!brandProfile ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-200">
            Няма активен brand profile в localStorage. Върни се към brand onboarding и запази бранд.
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                    Активен бранд
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
                          Адрес
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-black">
                          {brandProfile.business_address}
                        </p>
                      </div>
                    ) : null}

                    {brandProfile.phone ? (
  <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4">
    <p className="text-xs uppercase tracking-wider text-black/45">Телефон</p>
    <p className="mt-1 text-base font-semibold text-black">{brandProfile.phone}</p>
  </div>
) : null}

                    

                                        {brandProfile.preferred_colors ? (
                      <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4 sm:col-span-2">
                        <p className="text-xs uppercase tracking-wider text-black/45">
                          Предпочитани цветове
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
      Какво искаш да създадем днес?
    </label>
    <p className="mt-2 text-sm leading-6 text-black/55">
      Опиши какъв тип реклама искаш за този бранд и избери подходящ стил на текста.
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
            Телефон за промо поста
          </span>
          <input
            value={promoPhone}
            onChange={(e) => setPromoPhone(e.target.value)}
            placeholder="Напр. 0888 123 456"
            className="w-full rounded-2xl border border-black/10 bg-[#f7f3ee] px-4 py-3 text-[15px] text-black outline-none transition focus:border-black/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-neutral-800">
            Адрес за промо поста
          </span>
          <input
            value={promoAddress}
            onChange={(e) => setPromoAddress(e.target.value)}
            placeholder="Напр. бул. България 25, София"
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
    placeholder="Пример: Напиши Instagram пост за пролетна промоция на лазерна епилация с нежен, женствен и продаващ тон."
    className="min-h-[170px] w-full rounded-3xl border border-black/10 bg-[#f7f3ee] px-5 py-4 text-[15px] leading-7 text-black outline-none transition focus:border-black/20"
  />

  <div className="mt-6">
    <p className="mb-3 text-lg font-semibold text-black">Избери стил</p>

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
      {loading ? "Генериране..." : "Генерирай 3 варианта"}
    </button>

    <div className="text-sm text-black/55">
      Избран стил:{" "}
      <span className="font-medium text-black">
        {toneOptions.find((option) => option.value === tone)?.label}
      </span>
    </div>
  </div>

  {loading ? (
    <div className="mt-4 rounded-2xl border border-black/10 bg-[#f7f3ee] px-4 py-3 text-sm text-black/70">
      Генерираме 3 варианта за текст и хаштагове...
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
        <h2 className="text-2xl font-semibold text-black">Варианти</h2>
        <p className="mt-1 text-black/55">
          Избери най-силния вариант за този бранд.
        </p>
      </div>

      <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black/60">
        Общо варианти: {variations.length}
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
                    Вариант {index + 1}
                  </div>

                  <p className="whitespace-pre-line text-[15px] leading-7 text-black/85">
                    {variation.post_text || "Няма генериран текст."}
                  </p>

                  <div className="mt-4 rounded-2xl border border-black/10 bg-[#f7f3ee] p-4">
                    <p className="mb-2 text-xs uppercase tracking-wider text-black/45">
                      Хаштагове
                    </p>
                    <p className="whitespace-pre-line text-sm leading-6 text-black/70">
                      {variation.hashtags || "Няма генерирани хаштагове."}
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
                    {isSelected ? "Избран вариант" : "Избери този"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-4 inline-flex rounded-full border border-black/10 bg-[#f7f3ee] px-3 py-1 text-sm font-semibold text-black/70">
          Финален избор
        </div>

        {selectedVariation ? (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm text-black/55">
                Избран е:
                <span className="ml-2 font-semibold text-black">
                  Вариант {(selectedVariationIndex ?? 0) + 1}
                </span>
              </p>

              <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4">
                <p className="whitespace-pre-line text-[15px] leading-7 text-black/85">
                  {selectedVariation.post_text || "Няма текст."}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-black/55">Хаштагове</p>
              <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4">
                <p className="whitespace-pre-line text-sm leading-6 text-black/75">
                  {selectedVariation.hashtags || "Няма хаштагове."}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={handleCopyText}
                className="w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
              >
                Копирай текста
              </button>

              <button
                type="button"
                onClick={handleOpenVideoWorkspace}
                className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Отвори Brand Studio
              </button>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4 text-sm text-black/60">
              Избраният пост ще се отвори в Brand Studio, където ще можеш да създадеш банер и видео.
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-[#f7f3ee] p-4 text-sm text-black/60">
            Избери вариант отляво, за да го видиш тук като финален избор.
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
  );
}