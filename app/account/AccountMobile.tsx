"use client";

import Link from "next/link";

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

type AccountMobileProps = {
  email: string;
  subscription: Subscription | null;
  isAdmin: boolean;
  message: string;
  brandProfiles: BrandProfile[];
  activeBrandId: string;
  calendarsByBrandId: Record<string, SavedCalendar>;
  videoOrders: VideoOrder[];
showVideoReady: boolean;
onSelectBrand: (profile: BrandProfile) => void;
  onOpenLastCalendar: (profile: BrandProfile) => void;
  onDeleteLastCalendar: (profileId: string) => void;
  onDeleteBrandProfile: (profileId: string) => void;
};

export default function AccountMobile({
  email,
  subscription,
  isAdmin,
  message,
  brandProfiles,
  activeBrandId,
  calendarsByBrandId,
  videoOrders,
showVideoReady,
onSelectBrand,
  onOpenLastCalendar,
  onDeleteLastCalendar,
  onDeleteBrandProfile,
}: AccountMobileProps) {
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
  return (
    <main className="min-h-screen bg-[#f5f1ec] px-3 py-4 text-neutral-900">
      <section className="rounded-[26px] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.06)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
          AI SMM Studio
        </p>

        <h1 className="mt-2 text-[30px] font-black leading-none tracking-[-0.04em]">
          Моят профил
        </h1>

        <p className="mt-2 break-all text-xs font-medium text-neutral-500">
          {email}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href="/contact"
            className="rounded-2xl bg-black px-4 py-3 text-center text-sm font-bold text-white"
          >
            📩 Връзка
          </Link>

          <Link
            href="/pricing"
            className="rounded-2xl border border-black/10 bg-[#fcfaf7] px-4 py-3 text-center text-sm font-bold"
          >
            Кредити
          </Link>

          {isAdmin ? (
            <Link
              href="/admin/video-orders"
              className="col-span-2 rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-bold text-white"
            >
              Админ панел
            </Link>
          ) : null}
        </div>
      </section>

      <section className="mt-3 grid grid-cols-2 gap-2">
        <div className="col-span-2 rounded-[24px] bg-[#e8ded1] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
            Общо кредити
          </p>
          <p className="mt-1 text-[38px] font-black leading-none">
            {subscription?.credits ?? 0}
          </p>
        </div>

        {[
          ["Quick", subscription?.quick_banner_credits ?? 0],
          ["Brand", subscription?.brand_post_credits ?? 0],
          ["Календар", subscription?.content_calendar_credits ?? 0],
          ["Видео", subscription?.video_credits ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[22px] bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              {label}
            </p>
            <p className="mt-1 text-[28px] font-black leading-none">{value}</p>
          </div>
        ))}
      </section>

      {showVideoReady ? (
  <a
    href={
      videoOrders.find(
        (order) => order.status === "delivered" && order.final_video_url
      )
        ? `#video-order-${
            videoOrders.find(
              (order) => order.status === "delivered" && order.final_video_url
            )?.id
          }`
        : "#"
    }
    className="mt-3 block rounded-[18px] border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-green-800"
  >
    🎉 Видеото ти е готово! Натисни тук, за да го видиш.
  </a>
) : null}

{message ? (
  <div className="mt-3 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
    {message}
  </div>
) : null}

      <section className="mt-3 rounded-[26px] bg-white p-4">
        <h2 className="text-[22px] font-black tracking-[-0.03em]">
          Бързи действия
        </h2>

        <div className="mt-4 grid gap-2">
          <Link
            href="/dashboard?mode=quick"
            className="rounded-[20px] bg-neutral-950 px-4 py-4 text-sm font-bold text-white"
          >
            Бърз рекламен банер
          </Link>

          <Link
            href="/dashboard/brand-workspace"
            className="rounded-[20px] bg-[#fcfaf7] px-4 py-4 text-sm font-bold"
          >
            Brand posts
          </Link>

          <Link
            href="/content-calendar"
            className="rounded-[20px] bg-[#fcfaf7] px-4 py-4 text-sm font-bold"
          >
            Контент календар
          </Link>
        </div>
      </section>

      <section className="mt-3 rounded-[26px] bg-white p-4">
  <div className="flex items-start justify-between gap-3">
    <div>
      <h2 className="text-[22px] font-black tracking-[-0.03em]">
        Бизнеси
      </h2>
      <p className="mt-1 text-xs leading-5 text-neutral-500">
        Избери от брандовете си с кой бизнес искаш да работим.
      </p>
    </div>

    <Link
      href="/dashboard?mode=brand"
      className="shrink-0 rounded-full bg-black px-4 py-2 text-xs font-bold text-white"
    >
      + Добави
    </Link>
  </div>

  <div className="mt-4">
    {brandProfiles.length ? (
      <>
        <select
          value={activeBrandId}
          onChange={(e) => {
            const selected = brandProfiles.find(
              (profile) => profile.id === e.target.value
            );

            if (selected) {
              onSelectBrand(selected);
            }
          }}
          className="w-full rounded-[20px] border border-black/10 bg-[#fcfaf7] px-4 py-4 text-sm font-bold text-neutral-900 outline-none"
        >
          <option value="">Избери бизнес</option>

          {brandProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.brand_name || "Без име"}
            </option>
          ))}
        </select>

        {activeBrandId ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={`/dashboard?mode=brand&brand_id=${activeBrandId}`}
              className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-center text-xs font-bold"
            >
              Редактирай
            </Link>

            {calendarsByBrandId[activeBrandId] ? (
              <button
                type="button"
                onClick={() => {
                  const selected = brandProfiles.find(
                    (profile) => profile.id === activeBrandId
                  );

                  if (selected) {
                    onOpenLastCalendar(selected);
                  }
                }}
                className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-xs font-bold"
              >
                Календар
              </button>
            ) : null}
          </div>
        ) : null}
      </>
    ) : (
      <div className="rounded-[22px] border border-dashed border-black/10 bg-[#fcfaf7] p-5 text-center">
        <p className="text-sm font-bold">Нямаш запазен бизнес.</p>

        <Link
          href="/dashboard?mode=brand"
          className="mt-4 inline-flex rounded-2xl bg-black px-4 py-3 text-sm font-bold text-white"
        >
          Добави бизнес
        </Link>
      </div>
    )}
  </div>
</section>

      <section className="mt-3 rounded-[26px] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-black tracking-[-0.03em]">
            Видео
          </h2>

          <Link
            href="/order-video"
            className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white"
          >
            Поръчай
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {videoOrders.length ? (
            videoOrders.map((order) => (
              <details
  id={`video-order-${order.id}`}
  key={order.id}
  className="rounded-[22px] border border-black/10 bg-[#fcfaf7] p-4"
>
                <summary className="cursor-pointer list-none">
                  <p className="text-base font-black">{order.service_title}</p>
                  <p className="mt-1 text-xs text-neutral-500">
  {order.price_eur}€ •{" "}
  <span
    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
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
                </summary>

                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {order.description}
                </p>

                {order.final_video_url ? (
                  <div className="mt-4">
                    <video
                      src={order.final_video_url}
                      controls
                      className="max-h-[260px] w-full rounded-[18px] bg-black object-contain"
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
  <button
  type="button"
  onClick={() =>
    void handleDownloadVideo(
      order.final_video_url!,
      `${order.service_title || "video"}.mp4`
    )
  }
  className="inline-flex rounded-full bg-black px-4 py-3 text-xs font-bold text-white"
>
  ⬇ Свали видеото
</button>

  <Link
    href={`/video-revision?order_id=${order.id}`}
    className="inline-flex rounded-full border border-black/15 bg-white px-4 py-3 text-xs font-bold"
  >
    Искам корекция
  </Link>
</div>
                  </div>
                ) : null}
              </details>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-black/10 bg-[#fcfaf7] p-5 text-center">
              <p className="text-sm font-bold">Нямаш видео поръчки.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}