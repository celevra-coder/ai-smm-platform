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
  onSelectBrand,
  onOpenLastCalendar,
  onDeleteLastCalendar,
  onDeleteBrandProfile,
}: AccountMobileProps) {
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-black tracking-[-0.03em]">
            Бизнеси
          </h2>

          <Link
            href="/dashboard?mode=brand"
            className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white"
          >
            + Добави
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {brandProfiles.length ? (
            brandProfiles.map((profile) => {
              const isActive = activeBrandId === profile.id;
              const savedCalendar = calendarsByBrandId[profile.id];

              return (
                <details
                  key={profile.id}
                  className={`rounded-[22px] border p-4 ${
                    isActive
                      ? "border-black bg-[#e8ded1]"
                      : "border-black/10 bg-[#fcfaf7]"
                  }`}
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white">
                      {profile.logo_url ? (
                        <img
                          src={profile.logo_url}
                          alt="Logo"
                          className="h-9 w-9 object-contain"
                        />
                      ) : (
                        <span className="text-xs font-black text-neutral-400">
                          AI
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black">
                        {profile.brand_name || "Без име"}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {isActive ? "Активен бизнес" : "Натисни за действия"}
                      </p>
                    </div>
                  </summary>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600">
                    {profile.brand_description || "Няма описание."}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectBrand(profile)}
                      className="rounded-2xl bg-black px-3 py-3 text-xs font-bold text-white"
                    >
                      Избери
                    </button>

                    <Link
                      href={`/dashboard?mode=brand&brand_id=${profile.id}`}
                      className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-center text-xs font-bold"
                    >
                      Редактирай
                    </Link>

                    {savedCalendar ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenLastCalendar(profile)}
                          className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-xs font-bold"
                        >
                          Календар
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteLastCalendar(profile.id)}
                          className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold text-red-700"
                        >
                          Изтрий календар
                        </button>
                      </>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => onDeleteBrandProfile(profile.id)}
                      className="col-span-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold text-red-700"
                    >
                      Изтрий бизнес
                    </button>
                  </div>
                </details>
              );
            })
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
                key={order.id}
                className="rounded-[22px] border border-black/10 bg-[#fcfaf7] p-4"
              >
                <summary className="cursor-pointer list-none">
                  <p className="text-base font-black">{order.service_title}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {order.price_eur}€ • {order.status}
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

                    <Link
                      href={`/video-revision?order_id=${order.id}`}
                      className="mt-3 inline-flex rounded-full border border-black/15 bg-white px-4 py-3 text-xs font-bold"
                    >
                      Искам корекция
                    </Link>
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