"use client";

// app/page.tsx

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Navbar from "@/components/Navbar";
import HomePageMobile from "./HomePageMobile";

export default function HomePage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState("");
    const showcaseItems = [
    {
      type: "image",
      src: "/showcase/banner-1.png",
      label: "Банер за промоция",
    },
    {
      type: "video",
      src: "/showcase/video-1.mp4",
      label: "Кратко рекламно видео",
    },
    {
      type: "image",
      src: "/showcase/banner-2.png",
      label: "Банер за услуга",
    },
    {
      type: "video",
      src: "/showcase/video-2.mp4",
      label: "Видео за социални мрежи",
    },
  ];

  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const activeShowcase = showcaseItems[activeShowcaseIndex];


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const payment = params.get("payment");

  if (code) {
    window.location.href = `/reset-password?code=${code}`;
    return;
  }

  if (payment === "video_success") {
    setPaymentSuccessMessage(
      "Благодарим за поръчката! Ще получиш готовото видео до 3 работни дни тук в профила си."
    );
    window.history.replaceState({}, "", "/");
  }

  if (payment === "package_success") {
    setPaymentSuccessMessage(
      "Плащането е успешно! Кредитите вече са добавени към профила ти и можеш да започнеш да създаваш съдържание."
    );
    window.history.replaceState({}, "", "/");
  }

  const checkUser = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setIsLoggedIn(Boolean(user));
  };

  void checkUser();
}, []);
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveShowcaseIndex((current) =>
        current === showcaseItems.length - 1 ? 0 : current + 1
      );
    }, 3000);

    return () => window.clearInterval(interval);
  }, [showcaseItems.length]);
  const handleProtectedClick = (e: React.MouseEvent, href: string) => {
  if (isLoggedIn) return;

  e.preventDefault();
  setShowAuthModal(true);
};

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f1ec] text-neutral-900">
      <div className="absolute inset-0 -z-10 overflow-hidden hidden sm:block">
        <div className="absolute left-[-120px] top-[-80px] h-[320px] w-[320px] rounded-full bg-[#e9dfd3] blur-3xl" />
        <div className="absolute right-[-100px] top-[120px] h-[280px] w-[280px] rounded-full bg-[#efe7de] blur-3xl" />
        <div className="absolute bottom-[-120px] left-[18%] h-[300px] w-[300px] rounded-full bg-[#ddd0c3] blur-3xl" />
      </div>

            <HomePageMobile handleProtectedClick={handleProtectedClick} />

      <div className="hidden sm:block">
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
       

        <div className="grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:py-24">
          <div>
            <div className="inline-flex max-w-full rounded-full border border-black/10 bg-white/80 px-4 py-2 text-center text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur sm:text-sm">
              Създавай реклами по описание на български
            </div>

            <h1 className="mt-6 max-w-3xl text-[2.35rem] font-black leading-[1.05] tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
              Премиум рекламни визии,
              <span className="block text-[#7a6d62]">
                създадени по описание на български.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
              Създавай банери и рекламни идеи за социалните мрежи, без да мислиш
              като дизайнер или copywriter. Просто опиши какво искаш — системата
              оформя визията вместо теб.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#solutions"
                className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Разгледай опциите
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400"
              >
                Как работи
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:max-w-2xl sm:grid-cols-3 sm:gap-4">
              <div className="min-w-[220px] flex-shrink-0 rounded-[20px] border border-white/70 bg-white/80 p-3 shadow-sm sm:min-w-0 sm:p-4">
                <p className="text-2xl font-black text-neutral-900">Банери</p>
                <p className="mt-1 text-sm text-neutral-500">
                  За промоции, услуги и локални оферти
                </p>
              </div>
              <div className="min-w-[220px] flex-shrink-0 rounded-[20px] border border-white/70 bg-white/80 p-3 shadow-sm sm:min-w-0 sm:p-4">
                <p className="text-2xl font-black text-neutral-900">Текстове</p>
                <p className="mt-1 text-sm text-neutral-500">
                  За постове и рекламни послания
                </p>
              </div>
              <div className="min-w-[220px] flex-shrink-0 rounded-[20px] border border-white/70 bg-white/80 p-3 shadow-sm sm:min-w-0 sm:p-4">
                <p className="text-2xl font-black text-neutral-900">Концепция</p>
                <p className="mt-1 text-sm text-neutral-500">
                  За по-цялостно присъствие онлайн
                </p>
              </div>
            </div>
          </div>

                    <div className="relative">
            <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-white/55 blur-3xl" />
            <div className="absolute -right-10 bottom-10 h-44 w-44 rounded-full bg-[#e7ddd2] blur-3xl" />

            <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.08)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Примери от платформата
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">
                    Банери и видеа, готови за реклама
                  </h2>
                </div>

                <div className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-bold text-white">
                  {activeShowcase.label}
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-black/10 bg-black">
                {activeShowcase.type === "video" ? (
                  <video
                    key={activeShowcase.src}
                    src={activeShowcase.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <img
                    key={activeShowcase.src}
                    src={activeShowcase.src}
                    alt={activeShowcase.label}
                    className="aspect-square w-full object-cover"
                  />
                )}
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2">
                {showcaseItems.map((item, index) => (
                  <button
                    key={item.src}
                    type="button"
                    onClick={() => setActiveShowcaseIndex(index)}
                    className={`h-2 rounded-full transition ${
                      activeShowcaseIndex === index
                        ? "bg-neutral-950"
                        : "bg-neutral-300"
                    }`}
                    aria-label={item.label}
                  />
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
  <div className="rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4">
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
      Free Test
    </p>

    <h3 className="mt-2 text-lg font-black text-neutral-950">
      Създай рекламен банер
    </h3>

    <p className="mt-2 text-sm leading-6 text-neutral-600">
      Тествай платформата безплатно и генерирай банер по описание.
    </p>

    <Link
      href="/dashboard?mode=quick"
      onClick={(e) => handleProtectedClick(e, "/dashboard?mode=quick")}
      className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
    >
      Тествай безплатно
    </Link>
  </div>

  <div className="rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4">
  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7a6d62]">
    Генерирай видео
  </p>

  <h3 className="mt-2 text-lg font-black text-neutral-950">
    Създай AI видео
  </h3>

  <p className="mt-2 text-sm leading-6 text-neutral-600">
    Създай бързо рекламно видео за социалните мрежи.
  </p>

  <Link
    href="/dashboard/video"
    onClick={(e) => handleProtectedClick(e, "/dashboard/video")}
    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
  >
    Генерирай видео
  </Link>
</div>
</div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="solutions"
        className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
            >
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Избери своя подход
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-neutral-950 sm:text-4xl">
            Създай реклама според нуждата си
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            Независимо дали искаш бърза визия за оферта, или по-цялостно рекламно
            присъствие, започваш оттук.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[32px] sm:p-7">
            <div className="inline-flex rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Най-бърз старт
            </div>

            <h3 className="mt-5 text-3xl font-black tracking-tight text-neutral-950">
              Нямаш време?
              <span className="block text-[#7a6d62]">
                Пусни бърза реклама.
              </span>
            </h3>

            <p className="mt-3 text-sm leading-6 text-neutral-600 sm:mt-4 sm:text-base sm:leading-7">
              Описваш на български какъв банер искаш — промоция, град, отстъпка,
              период, продукт, услуга или конкретен повод. По желание добавяш
              лого или изображение.
            </p>

            <div className="mt-4 space-y-2 text-sm text-neutral-700 hidden sm:block">
              <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                Подходящо за промоции, локални обяви и кампании
              </div>
              <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                Генерира текст и визия според твоята идея
              </div>
              <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                Може да използва качено изображение и лого
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
  href="/dashboard?mode=quick"
  onClick={(e) => handleProtectedClick(e, "/dashboard?mode=quick")}
                className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Стартирай бърза реклама
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[32px] sm:p-7">
            <div className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              За по-силно присъствие
            </div>

            <h3 className="mt-5 text-3xl font-black tracking-tight text-neutral-950">
              Искаш цялостна визия?
              <span className="block text-[#7a6d62]">
                Постове, банери и видео посока.
              </span>
            </h3>

            <p className="mt-3 text-sm leading-6 text-neutral-600 sm:mt-4 sm:text-base sm:leading-7">
              За бизнеси, които искат последователен стил и по-добра рекламна
              структура в социалните мрежи — с бранд информация, насока и
              следващи формати.
            </p>

            <div className="mt-6 space-y-3 text-sm text-neutral-700">
              <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                По-цялостен подход за бизнеса ти
              </div>
              <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                Банери, идеи за постове и видео концепция
              </div>
              <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                Подходящо за по-дългосрочно онлайн присъствие
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
  href="/dashboard?mode=brand"
  onClick={(e) => handleProtectedClick(e, "/dashboard?mode=brand")}
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Разгледай бранд режима
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[32px] sm:p-7">
            <div className="inline-flex rounded-full bg-[#f3eee8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              Нов модул
            </div>

            <h3 className="mt-5 text-3xl font-black tracking-tight text-neutral-950">
              Искаш план напред?
              <span className="block text-[#7a6d62]">
                Създай контент календар.
              </span>
            </h3>

            <p className="mt-3 text-sm leading-6 text-neutral-600 sm:mt-4 sm:text-base sm:leading-7">
              Генерирай структуриран календар със съдържание за твоя бизнес —
              теми, идеи за постове, формати и насоки по дни или седмици.
            </p>

            <div className="mt-6 space-y-3 text-sm text-neutral-700">
              <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                Подходящо за салони, услуги, магазини и локален бизнес
              </div>
              <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                Идеи за постове, оферти, сезонни теми и ангажиращо съдържание
              </div>
              <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                Добра основа за месечно планиране на социалните мрежи
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
  href="/content-calendar"
  onClick={(e) => handleProtectedClick(e, "/content-calendar")}
                className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Отвори контент календара
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
  id="how-it-works"
  className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8"
>
  <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
    <div className="rounded-[28px] border border-white/70 bg-white/70 px-4 py-7 shadow-[0_18px_60px_rgba(0,0,0,0.05)] backdrop-blur sm:rounded-[36px] sm:px-7 lg:px-9 lg:py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Как работи
      </p>

      <h2 className="mt-3 text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">
        Пишеш естествено. Получаваш готова рекламна визия.
      </h2>

      <div className="mt-7 grid gap-3 md:grid-cols-3">
        <div className="rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-black text-white">
            1
          </div>
          <h3 className="text-base font-bold text-neutral-950">
            Описваш рекламата
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Услуга, продукт, град, оферта или конкретно послание.
          </p>
        </div>

        <div className="rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-black text-white">
            2
          </div>
          <h3 className="text-base font-bold text-neutral-950">
            Добавяш детайли
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            По желание качваш лого или изображение.
          </p>
        </div>

        <div className="rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-black text-white">
            3
          </div>
          <h3 className="text-base font-bold text-neutral-950">
            Получаваш резултат
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Готов банер или рекламна идея за социални мрежи.
          </p>
        </div>
      </div>
    </div>

    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-neutral-950 text-white shadow-[0_18px_60px_rgba(0,0,0,0.10)] sm:rounded-[36px]">
      <video
        src="/videos/promo.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="h-[220px] w-full object-cover opacity-90"
      />

      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          Професионално видео
        </p>

        <h3 className="mt-2 text-2xl font-black leading-tight">
          Нужно ти е повече от кратко AI видео?
        </h3>

        <p className="mt-3 text-sm leading-6 text-white/75">
          Поръчай професионално видео и ние ще го изработим за теб — с монтаж,
          субтитри, ефекти, музика и завършен рекламен вид.
        </p>

        <Link
          href="/order-video"
          onClick={(e) => handleProtectedClick(e, "/order-video")}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-black"
        >
          Поръчай професионално видео
        </Link>
      </div>
    </div>
  </div>
</section>
            </div>
      {showAuthModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-5 text-center shadow-xl sm:p-6">
      <h2 className="text-2xl font-bold mb-2">
        Тествай платформата безплатно
      </h2>

      <p className="text-sm text-gray-600 mb-6">
        За да създаваш реклами, трябва да имаш акаунт.
      </p>

      <div className="flex flex-col gap-3">
        <Link
          href="/register"
          className="rounded-xl bg-black text-white py-3 font-semibold"
        >
          Регистрация
        </Link>

        <Link
          href="/login"
          className="rounded-xl border py-3 font-semibold"
        >
          Вход
        </Link>

        <button
          onClick={() => setShowAuthModal(false)}
          className="text-sm text-gray-500 mt-2"
        >
          Затвори
        </button>
      </div>
    </div>
  </div>
)}
{paymentSuccessMessage ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[28px] bg-white p-7 text-center shadow-2xl">
      <div className="mb-3 text-4xl">🎉</div>

      <h2 className="text-xl font-black text-neutral-950">
        Успешно плащане
      </h2>

      <p className="mt-3 text-sm leading-6 text-neutral-700">
        {paymentSuccessMessage}
      </p>

      <button
        type="button"
        onClick={() => setPaymentSuccessMessage("")}
        className="mt-6 w-full rounded-full bg-black px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
      >
        Разбрах
      </button>
    </div>
  </div>
) : null}
    </main>
  );
}