"use client";


import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function ContentCalendarPage() {
  const router = useRouter();

    const [businessType, setBusinessType] = useState("");
  const [specificServices, setSpecificServices] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [period, setPeriod] = useState("30 дни");
  const [frequency, setFrequency] = useState("3 поста седмично");
  const [tone, setTone] = useState("Професионален");
    const [notes, setNotes] = useState("");
    const [promoRedirectMessage, setPromoRedirectMessage] = useState("");
    const [showPaywallModal, setShowPaywallModal] = useState(false);
    const [calendarHelperMessage, setCalendarHelperMessage] = useState("");
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [calendarItems, setCalendarItems] = useState<
  Array<{
  day: string;
  title: string;
  format: string;
  description: string;
  postType?: "educational" | "promo" | "trust" | "authority" | "general";
}>
>([]);
const [isCalendarSaved, setIsCalendarSaved] = useState(false);
const [isGeneratingCalendar, setIsGeneratingCalendar] = useState(false);
useEffect(() => {
  const loadInitialCalendarState = async () => {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user || null;

    const savedCalendar = localStorage.getItem("selected_calendar_from_account");

    if (savedCalendar) {
      try {
        const parsed = JSON.parse(savedCalendar);
        setCalendarItems(Array.isArray(parsed.items) ? parsed.items : []);
        localStorage.removeItem("selected_calendar_from_account");
      } catch (e) {
        console.error("Failed to load calendar from account", e);
      }
    }

    const saved = localStorage.getItem("active_brand_profile");
    const storedBrandUserId = localStorage.getItem("active_brand_user_id");

    if (!user) {
      localStorage.removeItem("active_brand_profile");
      localStorage.removeItem("active_brand_user_id");
      setActiveBrandId(null);
      setBusinessType("");
      setSpecificServices("");
      setNotes("");
      return;
    }

    if (!saved) {
  setActiveBrandId(null);
  setBusinessType("");
  setSpecificServices("");
  setNotes("");
  setCalendarItems([]);
  setIsCalendarSaved(false);
  return;
}

    try {
      const brand = JSON.parse(saved);
      const brandOwnerId = brand?.user_id || storedBrandUserId || "";

      const belongsToCurrentUser =
        brandOwnerId === user.id || brandOwnerId === user.email;

      if (!belongsToCurrentUser) {
        localStorage.removeItem("active_brand_profile");
        localStorage.removeItem("active_brand_user_id");
        setActiveBrandId(null);
        setBusinessType("");
        setSpecificServices("");
        setNotes("");
        return;
      }

      localStorage.setItem("active_brand_user_id", user.id);

      setActiveBrandId(brand.id || null);
      setBusinessType(brand.brand_name || "");
      setSpecificServices(brand.brand_description || "");
      setNotes("");
    } catch (e) {
      console.error("Failed to load active brand", e);
      localStorage.removeItem("active_brand_profile");
      localStorage.removeItem("active_brand_user_id");
    }
  };

  void loadInitialCalendarState();
}, []);

    

  const periodDays = useMemo(() => {
    if (period === "7 дни") return 7;
    if (period === "14 дни") return 14;
    return 30;
  }, [period]);

  const postsCount = useMemo(() => {
    if (frequency === "3 поста седмично") return periodDays === 7 ? 3 : periodDays === 14 ? 6 : 12;
    if (frequency === "4 поста седмично") return periodDays === 7 ? 4 : periodDays === 14 ? 8 : 16;
    if (frequency === "5 поста седмично") return periodDays === 7 ? 5 : periodDays === 14 ? 10 : 20;
    return periodDays;
  }, [frequency, periodDays]);

    const handleGenerateCalendar = async () => {
  try {
    setIsGeneratingCalendar(true);
    const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

    const accessToken = session?.access_token;

  if (!accessToken) {
    router.push("/login");
    return;
  }

  setPromoRedirectMessage("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const calendarRes = await fetch(
  `${supabaseUrl}/functions/v1/generate-content-calendar`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      businessType,
      services: specificServices,
      notes,
      tone,
      platform,
      period,
      frequency,
      days: postsCount,
    }),
  }
);

const calendarData = await calendarRes.json().catch(() => null);

if (!calendarRes.ok || !calendarData?.success) {
  setPromoRedirectMessage("");

  if (
    calendarData?.error === "NO_CREDITS" ||
    calendarData?.error === "PAYMENT_REQUIRED"
  ) {
    setShowPaywallModal(true);
    return;
  }

  throw new Error(calendarData?.error || "Неуспешно генериране на календар.");
}

const generated = Array.isArray(calendarData.items) ? calendarData.items : [];

setCalendarItems(generated);
setIsCalendarSaved(false);
        } catch (err) {
  console.error(err);
  setPromoRedirectMessage("Грешка при проверка на кредити.");
  } finally {
  setIsGeneratingCalendar(false);
}
  };

    const handleWritePost = (item: {
  day: string;
  title: string;
  format: string;
  description: string;
  postType?: "educational" | "promo" | "trust" | "authority" | "general";
}) => {
    const payload = {
            businessType,
      specificServices,
      platform,
      period,
      frequency,
      tone,
      notes,
      item,
    };

    localStorage.setItem(
      "ai_smm_selected_calendar_item",
      JSON.stringify(payload)
    );

    const promoText = [item.title, item.format, item.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const isPromoFlow = item.postType === "promo";
          const isBeforeAfterFlow =
      /преди\s*\/\s*след|before\s*\/\s*after|before after|реален резултат/i.test(
        promoText
      );

    if (isBeforeAfterFlow) {
      setCalendarHelperMessage(
        "За пост тип „Преди / след“ е най-добре да използваш реални снимки на клиент. Избери този пост и после качи снимки или опиши конкретния резултат, за да стане текстът по-достоверен."
      );
    } else {
      setCalendarHelperMessage("");
    }

    if (isPromoFlow) {
      setPromoRedirectMessage(
        "За промо постове първо въведи точната оферта, за да генерираме правилен текст."
      );
      router.push("/dashboard/brand-workspace");
      return;
    }

    setPromoRedirectMessage("");
    router.push("/content-posts");
  };

  return (
    <main className="min-h-screen bg-[#f5f1ec] px-4 py-8 text-neutral-900 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        

                <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Нов модул
            </p>

            <h1 className="mt-3 text-[32px] font-black leading-none tracking-[-0.03em] text-neutral-950 md:text-[40px]">
              Създай контент календар
            </h1>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-[24px] border border-black/10 bg-[#fcfaf7] p-5 md:p-6">
              <h2 className="text-[22px] font-black tracking-[-0.02em] text-neutral-950">
                Настройки на календара
              </h2>
              <p className="mt-2 text-sm leading-[1.7] text-neutral-600">
                Попълни основните параметри за бизнеса и съдържанието.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-800">
                    Тип бизнес
                  </span>
                  <input
  value={businessType}
  onChange={(e) => setBusinessType(e.target.value)}
  placeholder="Напр. фризьорски салон"
  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
/>
                </label>
                                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-800">
                    Конкретни услуги / процедури
                  </span>
                  <input
                    value={specificServices}
                    onChange={(e) => setSpecificServices(e.target.value)}
                    placeholder="Напр. лазерна епилация, почистване на лице, хидрафейшъл"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-800">
                    Платформа
                  </span>
                  <select
  value={platform}
  onChange={(e) => setPlatform(e.target.value)}
  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
>
                    <option>Instagram</option>
<option>Facebook</option>
<option>Instagram + Facebook</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-800">
                    Период
                  </span>
                  <select
  value={period}
  onChange={(e) => setPeriod(e.target.value)}
  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
>
                    <option>7 дни</option>
                    <option>14 дни</option>
                    <option>30 дни</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-800">
                    Честота
                  </span>
                  <select
  value={frequency}
  onChange={(e) => setFrequency(e.target.value)}
  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
>
                    <option>3 поста седмично</option>
                    <option>4 поста седмично</option>
                    <option>5 поста седмично</option>
                    <option>Всеки ден</option>
                  </select>
                </label>

                <label className="md:col-span-2 block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-800">
                    Тон на съдържанието
                  </span>
                  <select
  value={tone}
  onChange={(e) => setTone(e.target.value)}
  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
>
                    <option>Професионален</option>
                    <option>Приятелски</option>
                    <option>Премиум</option>
                    <option>Продажбен</option>
                    <option>Образователен</option>
                  </select>
                </label>

                <label className="md:col-span-2 block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-800">
                    Допълнителни цели / бележки
                  </span>
                  <textarea
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  rows={5}
  placeholder="Напр. Искам повече запитвания, повече доверие, локално позициониране, сезонни оферти, представяне на услуги."
  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
/>
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
  <button
  type="button"
  onClick={handleGenerateCalendar}
  disabled={isGeneratingCalendar}
  className="rounded-[20px] bg-neutral-950 px-6 py-3 text-[15px] font-bold text-white transition hover:scale-[1.02] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
>
 {isGeneratingCalendar ? (
  <span className="flex items-center justify-center gap-2">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
    Генериране...
  </span>
) : (
  "Генерирай контент календар"
)}
</button>
  {calendarItems.length ? (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={async () => {
  try {
  const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !calendarItems.length) return;

    await supabase.from("content_calendars").insert({
      user_id: user.id,
      brand_profile_id: activeBrandId,
      business_type: businessType,
      specific_services: specificServices,
      platform,
      period,
      frequency,
      tone,
      notes,
      items: calendarItems,
    });

    setIsCalendarSaved(true);
  } catch (err) {
    console.error(err);
  }
}}
      className="rounded-[20px] border border-black/10 bg-white px-6 py-3 text-[15px] font-bold text-neutral-800 transition hover:bg-neutral-100"
    >
      Запази календара
    </button>

    {isCalendarSaved ? (
      <span className="text-sm font-semibold text-green-600">
        ✔ Запазено
      </span>
    ) : null}
  </div>
) : null}

  {calendarItems.length ? (
    <button
      type="button"
      onClick={() => {
  setCalendarItems([]);
  setPromoRedirectMessage("");
  setCalendarHelperMessage("");
  setIsCalendarSaved(false);
}}
      className="rounded-[20px] border border-black/10 bg-white px-6 py-3 text-[15px] font-bold text-neutral-800 transition hover:bg-neutral-100"
    >
      Изчисти стария календар
    </button>
  ) : null}
</div>
            </div>

                                    <div className="rounded-[24px] border border-black/10 bg-white p-5 md:p-6">
              {promoRedirectMessage ? (
                <div className="mb-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  {promoRedirectMessage}
                </div>
              ) : null}
                            {calendarHelperMessage ? (
                <div className="mb-4 rounded-[18px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                  {calendarHelperMessage}
                </div>
              ) : null}

              <div className="relative mt-6 rounded-[20px] border border-dashed border-black/10 bg-[#fcfaf7] p-6">
              {isGeneratingCalendar && (
  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[24px] bg-white/70 backdrop-blur-sm">
    <div className="flex items-center gap-3 text-sm font-semibold text-neutral-800">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
      AI генерира календара...
    </div>
  </div>
)}
                {calendarItems.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {calendarItems.map((item) => (
                      <div
  key={`${item.day}-${item.title}`}
  className="group rounded-[22px] border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)]"
>
                        <div className="inline-flex rounded-full bg-[#f5f1ec] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-neutral-700">
  {item.day}
</div>
                        <p className="mt-4 text-[16px] font-black leading-[1.35] text-neutral-950">
  {item.title}
</p>
                        <p className="mt-3 text-sm leading-[1.7] text-neutral-600">
  {item.description}
</p>
                        <div className="mt-4 inline-flex rounded-full border border-black/10 bg-[#fcfaf7] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-600">
  {item.format}
</div>

                        <div className="mt-5 pt-1">
                          <button
  type="button"
  onClick={() => handleWritePost(item)}
  className="rounded-[18px] bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:scale-[1.02] hover:opacity-95"
>
 Създай публикация
</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[18px] bg-white p-4 shadow-sm">
                    <p className="text-sm font-bold text-neutral-900">
                      Примерни постове
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                      <li>• Представяне на {businessType || "бизнеса"}</li>
                      <li>• Полезен съвет ({tone.toLowerCase()})</li>
                      <li>• Оферта / услуга</li>
                    </ul>
                  </div>
                )}
              
              </div>
            </div>
          </div>
        </section>
      </div>
      {showPaywallModal ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
      <h3 className="text-[24px] font-black leading-tight text-neutral-950">
        Хареса ли ти какво създадохме? 🙂
      </h3>

      <p className="mt-3 text-sm leading-[1.7] text-neutral-600">
        Вземи пакет с кредити и продължи без ограничения с банери, постове,
        контент календар и видео.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push("/pricing")}
          className="rounded-[20px] bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          Виж пакетите
        </button>

        <button
          type="button"
          onClick={() => setShowPaywallModal(false)}
          className="text-sm font-semibold text-neutral-500"
        >
          Затвори
        </button>
      </div>
    </div>
  </div>
) : null}
    </main>
      );
}