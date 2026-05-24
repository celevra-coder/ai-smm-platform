"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import AccountMobile from "./AccountMobile";

type Subscription = {
  credits: number | null;
  status: string | null;
  plan: string | null;
  quick_banner_credits: number | null;
  brand_post_credits: number | null;
  content_calendar_credits: number | null;
  video_credits: number | null;
};
type SavedCalendar = {
  id: string;
  brand_profile_id: string | null;
};
type VideoOrder = {
  id: string;
  service_title: string;
  price_eur: number;
  description: string;
  status: string;
  payment_status: string;
  final_video_url: string | null;
user_notified: boolean | null;
created_at: string;
};
type BrandProfile = {
  id: string;
  brand_name: string | null;
  website: string | null;
  phone: string | null;
  brand_description: string | null;
  preferred_colors: string | null;
  logo_url: string | null;
  business_address: string | null;
};

export default function AccountPage() {
      const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [brandProfiles, setBrandProfiles] = useState<BrandProfile[]>([]);
  const [brandCalendars, setBrandCalendars] = useState<Record<string, any>>({});
  const [message, setMessage] = useState("");
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [activeBrandId, setActiveBrandId] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
  const [calendarsByBrandId, setCalendarsByBrandId] = useState<Record<string, SavedCalendar>>({});
  const [videoOrders, setVideoOrders] = useState<VideoOrder[]>([]);
const [showVideoReady, setShowVideoReady] = useState(false);

  useEffect(() => {
    const loadAccount = async () => {
      setLoading(true);
      setMessage("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/en/login";
        return;
      }

      setEmail(user.email || "");
      const ADMIN_ID = "ef8f7aef-055b-4977-ab77-0430f42b500e";

if (user.id === ADMIN_ID) {
  setIsAdmin(true);
}

      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("user_subscriptions")
          .select(
            "credits,status,plan,quick_banner_credits,brand_post_credits,content_calendar_credits,video_credits"
          )
          .eq("user_id", user.id)
          .maybeSingle();

      if (subscriptionError) {
        console.error(subscriptionError);
      }

      setSubscription(subscriptionData || null);
      const { data: videoOrdersData, error: videoOrdersError } = await supabase
  .from("video_orders")
  .select("id,service_title,price_eur,description,status,payment_status,final_video_url,user_notified,created_at")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

if (videoOrdersError) {
  console.error(videoOrdersError);
}

setVideoOrders(videoOrdersData || []);

const hasNewVideo = (videoOrdersData || []).some(
  (order) => order.status === "delivered" && order.user_notified === false
);

if (hasNewVideo) {
  setShowVideoReady(true);

  await supabase
    .from("video_orders")
    .update({ user_notified: true })
    .eq("user_id", user.id)
    .eq("user_notified", false);
}

      const { data: profilesData, error: profilesError } = await supabase
        .from("brand_profiles")
        .select(
          "id,brand_name,website,phone,brand_description,preferred_colors,logo_url,business_address"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error(profilesError);
        setMessage("Не успяхме да заредим бизнес профилите.");
      }
      const brandIds = (profilesData || []).map((profile) => profile.id);

      if (brandIds.length) {
        const { data: calendarsData, error: calendarsError } = await supabase
          .from("content_calendars")
          .select("id,brand_profile_id,created_at")
          .eq("user_id", user.id)
          .in("brand_profile_id", brandIds)
          .order("created_at", { ascending: false });

        if (calendarsError) {
          console.error(calendarsError);
        }

        const nextCalendarsByBrandId: Record<string, SavedCalendar> = {};

        (calendarsData || []).forEach((calendar) => {
          if (
            calendar.brand_profile_id &&
            !nextCalendarsByBrandId[calendar.brand_profile_id]
          ) {
            nextCalendarsByBrandId[calendar.brand_profile_id] = {
              id: calendar.id,
              brand_profile_id: calendar.brand_profile_id,
            };
          }
        });

        setCalendarsByBrandId(nextCalendarsByBrandId);
      }
      setBrandProfiles(profilesData || []);
      // взимаме последен календар за всеки бранд
if (profilesData?.length) {
  const calendarsMap: Record<string, any> = {};

  for (const profile of profilesData) {
    const { data } = await supabase
      .from("content_calendars")
      .select("id, items, created_at")
      .eq("user_id", user.id)
      .eq("brand_profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      calendarsMap[profile.id] = data;
    }
  }

  setBrandCalendars(calendarsMap);
}
      const savedActiveBrand = localStorage.getItem("active_brand_profile");

let parsedActiveBrand: BrandProfile | null = null;

try {
  parsedActiveBrand = savedActiveBrand ? JSON.parse(savedActiveBrand) : null;
} catch {
  parsedActiveBrand = null;
}

const currentProfiles = profilesData || [];

const parsedBrandIsFromThisUser =
  parsedActiveBrand?.id &&
  currentProfiles.some((profile) => profile.id === parsedActiveBrand?.id);

if (parsedBrandIsFromThisUser) {
  localStorage.setItem("active_brand_profile", JSON.stringify(parsedActiveBrand));
  localStorage.setItem("active_brand_user_id", user.email || "");
  setActiveBrandId(parsedActiveBrand!.id || "");
} else if (currentProfiles.length === 1) {
  const onlyBrand = currentProfiles[0];

  localStorage.setItem("active_brand_profile", JSON.stringify(onlyBrand));
  localStorage.setItem("active_brand_user_id", user.email || "");

  setActiveBrandId(onlyBrand.id);
} else {
  localStorage.removeItem("active_brand_profile");
  localStorage.removeItem("active_brand_user_id");
  setActiveBrandId("");

}
const { data: messagesData, error: messagesError } = await supabase
  .from("contact_requests")
  .select("id, user_seen, user_id")
  .eq("user_id", user.id)
  .eq("user_seen", false);

if (messagesError) {
  console.error(messagesError);
}

setUnreadMessagesCount(messagesData?.length || 0);
      setLoading(false);
    };

    void loadAccount();
  }, []);
  

const handleLogout = async () => {
  localStorage.removeItem("active_brand_profile");
  localStorage.removeItem("active_brand_user_id");

  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/en";
};
const handleOpenLastCalendar = (profile: BrandProfile) => {
  localStorage.setItem("active_brand_profile", JSON.stringify(profile));
localStorage.setItem("active_brand_user_id", email);
setActiveBrandId(profile.id);
  router.push("/en/content-calendar");
};

const handleDeleteLastCalendar = async (profileId: string) => {
  const calendar = calendarsByBrandId[profileId];

  if (!calendar) return;

  const confirmed = window.confirm(
    "Сигурна ли си, че искаш да изтриеш последния контент календар за този бизнес?"
  );

  if (!confirmed) return;

  const supabase = createClient();

  const { error } = await supabase
    .from("content_calendars")
    .delete()
    .eq("id", calendar.id);

  if (error) {
    console.error(error);
    setMessage("Не успяхме да изтрием календара.");
    return;
  }

  setCalendarsByBrandId((current) => {
    const next = { ...current };
    delete next[profileId];
    return next;
  });

  setMessage("Контент календарът е изтрит.");
};
const handleDeleteBrandProfile = async (profileId: string) => {
  const confirmed = window.confirm(
    "Сигурна ли си, че искаш да изтриеш този бизнес профил?"
  );

  if (!confirmed) return;

  const supabase = createClient();

  const { error } = await supabase
    .from("brand_profiles")
    .delete()
    .eq("id", profileId);

  if (error) {
    console.error(error);
    setMessage("Не успяхме да изтрием бизнес профила.");
    return;
  }

  setBrandProfiles((current) =>
    current.filter((profile) => profile.id !== profileId)
  );

  setCalendarsByBrandId((current) => {
    const next = { ...current };
    delete next[profileId];
    return next;
  });

  if (activeBrandId === profileId) {
    localStorage.removeItem("active_brand_profile");
    setActiveBrandId("");
  }

  setMessage("Бизнес профилът е изтрит.");
};
const handleDownloadVideo = async (url: string, fileName: string) => {
  const response = await fetch(url);
  const blob = await response.blob();

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f1ec] px-4 py-10 text-neutral-900">
        <div className="mx-auto max-w-5xl rounded-[28px] bg-white p-6">
          Зареждане...
        </div>
      </main>
    );
  }

  return (
  <>
    <div className="md:hidden">
      <AccountMobile
        email={email}
        subscription={subscription}
        isAdmin={isAdmin}
        message={message}
        brandProfiles={brandProfiles}
        activeBrandId={activeBrandId}
        calendarsByBrandId={calendarsByBrandId}
        videoOrders={videoOrders}
showVideoReady={showVideoReady}
onSelectBrand={(profile) => {
          localStorage.setItem("active_brand_profile", JSON.stringify(profile));
          localStorage.setItem("active_brand_user_id", email);
          setActiveBrandId(profile.id);
          setMessage(`Избран бизнес: ${profile.brand_name || "Без име"}`);
        }}
        onOpenLastCalendar={handleOpenLastCalendar}
        onDeleteLastCalendar={handleDeleteLastCalendar}
        onDeleteBrandProfile={handleDeleteBrandProfile}
      />
    </div>

    <div className="hidden md:block">
      <main className="min-h-screen bg-[#f5f1ec] px-4 py-8 text-neutral-900 md:px-6 md:py-10">
    <div className="mx-auto max-w-7xl">
      <section className="mb-8 rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
              AI SMM Studio
            </p>

            <h1 className="mt-3 text-[34px] font-black leading-none tracking-[-0.04em] text-neutral-950 md:text-[48px]">
              Моят профил
            </h1>

            <p className="mt-3 text-sm font-medium text-neutral-500">
  {email}
</p>
<div className="mt-5">
  <a
    href="/en/contact"
    className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-bold text-white"
  >
    📩 Връзка с нас
  </a>
</div>

{isAdmin && (
  <Link
    href="/admin/video-orders"
    className="mt-4 inline-flex rounded-[18px] bg-black px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
  >
    Админ панел
  </Link>
)}
</div>
</div>

<div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[26px] border border-[#d8cfc2] bg-[#e8ded1] p-5 text-neutral-950 shadow-sm">
  <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
    Оставащи кредити
  </p>
  <p className="mt-3 text-[46px] font-black leading-none">
    {subscription?.credits ?? 0}
  </p>
  <p className="mt-2 text-xs font-medium text-neutral-500">общ баланс</p>
</div>

          {[
            {
              label: "Quick банери",
              value: subscription?.quick_banner_credits ?? 0,
            },
            {
              label: "Brand постове",
              value: subscription?.brand_post_credits ?? 0,
            },
            {
              label: "Контент календар",
              value: subscription?.content_calendar_credits ?? 0,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[26px] border border-black/10 bg-[#fcfaf7] p-5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
                {item.label}
              </p>
              <p className="mt-3 text-[38px] font-black leading-none text-neutral-950">
                {item.value}
              </p>
              <p className="mt-2 text-xs font-medium text-neutral-400">
                безплатни оставащи
              </p>
            </div>
          ))}
        </div>
      </section>

      

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
            Бързи действия
          </p>

          <h2 className="mt-3 text-[28px] font-black tracking-[-0.03em] text-neutral-950">
            Какво искаш да създадеш?
          </h2>

          <div className="mt-6 grid gap-3">
            {[
              {
                href: "/en/dashboard?mode=quick",
                title: "Бърз рекламен банер",
                text: "Създай визия за Facebook / Instagram.",
              },
              {
                href: "/en/dashboard/brand-studio",
                title: "Brand posts",
                text: "Генерирай постове по бизнес профил.",
              },
              {
                href: "/en/content-calendar",
                title: "Контент календар",
                text: "Планирай идеи за публикации.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[24px] border border-black/10 bg-[#fcfaf7] p-5 transition hover:-translate-y-0.5 hover:bg-neutral-950 hover:text-white"
              >
                <p className="font-black">{item.title}</p>
                <p className="mt-1 text-sm text-neutral-500 group-hover:text-white/65">
                  {item.text}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
                Бизнес профили
              </p>

              <h2 className="mt-3 text-[28px] font-black tracking-[-0.03em] text-neutral-950">
                Запазени бизнеси
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                Данните се използват за бранд режим, банери, постове и видео.
              </p>
            </div>

            <Link
              href="/en/dashboard?mode=brand"
              className="rounded-[18px] bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Добави бизнес
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {brandProfiles.length ? (
  brandProfiles.map((profile) => {
    const isActive = activeBrandId === profile.id;
    const savedCalendar = calendarsByBrandId[profile.id];

    return (
      <div
        key={profile.id}
        onClick={async () => {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    setMessage("Моля, влез отново в профила си.");
    return;
  }

  localStorage.setItem("active_brand_profile", JSON.stringify(profile));
  localStorage.setItem("active_brand_user_id", user.email);

  setActiveBrandId(profile.id);
  setMessage(`Избран бизнес: ${profile.brand_name || "Без име"}`);
}}
        className={`w-full cursor-pointer rounded-[28px] border p-5 text-left transition ${
          isActive
            ? "border-neutral-950 bg-[#e8ded1] shadow-[0_14px_40px_rgba(0,0,0,0.10)]"
            : "border-black/10 bg-[#fcfaf7] hover:shadow-[0_14px_40px_rgba(0,0,0,0.08)]"
        }`}
      >
        <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-white shadow-sm">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt="Logo"
                className="h-12 w-12 object-contain"
              />
            ) : (
              <span className="text-sm font-black text-neutral-400">AI</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-black text-neutral-950">
              {profile.brand_name || "Без име"}
            </h3>

            <p className="mt-2 text-sm text-neutral-600">
              {profile.brand_description || "Няма описание."}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/en/dashboard?mode=brand&brand_id=${profile.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-bold underline"
              >
                Редактирай
              </Link>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeleteBrandProfile(profile.id);
                }}
                className="cursor-pointer text-sm font-bold text-red-700 underline"
              >
                Изтрий бранд
              </span>
              {savedCalendar ? (
                <>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenLastCalendar(profile);
                    }}
                    className="cursor-pointer text-sm font-bold text-blue-600 underline"
                  >
                    Отвори календар
                  </span>

                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteLastCalendar(profile.id);
                    }}
                    className="cursor-pointer text-sm font-bold text-red-600 underline"
                  >
                    Изтрий
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  })
) : (
  <div className="rounded-[28px] border border-dashed border-black/10 bg-[#fcfaf7] p-8 text-center">
    <p className="text-lg font-black text-neutral-950">
      Все още няма запазен бизнес профил.
    </p>

    <Link
      href="/dashboard?mode=brand"
      className="mt-5 inline-flex rounded-[18px] bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
    >
      Добави бизнес
    </Link>
  </div>
)}
          </div>
        </div>
            </section>

      <section className="mt-6 rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
              Видео поръчки
            </p>

            <h2 className="mt-3 text-[28px] font-black tracking-[-0.03em] text-neutral-950">
              Моите видео поръчки
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Тук ще виждаш статуса и готовите видеа.
            </p>
          </div>

          <Link
            href="/order-video"
            className="rounded-[18px] bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Поръчай видео
          </Link>
        </div>

        <div className="mt-6 grid gap-4">
          {videoOrders.length ? (
            videoOrders.map((order) => (
              <div
  id={`video-order-${order.id}`}
  key={order.id}
  className="scroll-mt-8 rounded-[26px] border border-black/10 bg-[#fcfaf7] p-5"
>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-neutral-950">
                      {order.service_title}
                    </h3>

                    <p className="mt-2 text-sm text-neutral-600">
                      {order.price_eur}€ • статус:{" "}
                      <span
  className={`rounded-full px-3 py-1 text-xs font-bold ${
    order.status === "pending_payment"
      ? "bg-gray-200 text-gray-700"
      : order.status === "paid"
      ? "bg-blue-100 text-blue-700"
      : order.status === "in_progress"
      ? "bg-yellow-100 text-yellow-700"
      : order.status === "delivered"
      ? "bg-green-200 text-green-900"
      : "bg-gray-100 text-gray-600"
  }`}
>
 {order.status === "delivered"
  ? "Готово"
  : order.status === "in_progress"
  ? "В процес"
  : order.status === "paid"
  ? "Платено"
  : "Чака плащане"}
</span>
                    </p>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-500">
                      {order.description}
                    </p>
                  </div>

                  <div className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-neutral-700">
                    {order.payment_status}
                  </div>
                </div>

                {order.final_video_url ? (
                  <div className="mt-5">
                    <video
                      src={order.final_video_url}
                      controls
                      className="max-h-[360px] w-full rounded-[22px] bg-black object-contain"
                    />
<button
  type="button"
  onClick={() =>
    void handleDownloadVideo(
      order.final_video_url!,
      `${order.service_title || "video"}.mp4`
    )
  }
  className="mt-3 inline-flex rounded-full bg-black px-5 py-2 text-sm font-bold text-white"
>
  ⬇ Свали видеото
</button>

                    <Link
                      href={`/video-revision?order_id=${order.id}`}
                      className="mt-4 inline-flex rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-bold text-neutral-950 transition hover:bg-black hover:text-white"
                    >
                      Искам корекция
                    </Link>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[26px] border border-dashed border-black/10 bg-[#fcfaf7] p-8 text-center">
              <p className="text-lg font-black text-neutral-950">
                Все още нямаш видео поръчки.
              </p>

              <Link
                href="/order-video"
                className="mt-5 inline-flex rounded-[18px] bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
              >
                Поръчай първото видео
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
        </main>
    </div>
  </>
);
}