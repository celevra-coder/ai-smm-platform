"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import EnglishHomePageMobile from "./HomePageMobile";

export default function EnglishHomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState("");

  const showcaseItems = [
    {
      type: "image",
      src: "/showcase/banner-1-en.png",
      label: "Promo banner",
    },
    {
      type: "video",
      src: "/showcase/video-1-en.mp4",
      label: "Short ad video",
    },
    {
      type: "image",
      src: "/showcase/banner-2-en.png",
      label: "Service banner",
    },
    {
      type: "video",
      src: "/showcase/video-2-en.mp4",
      label: "Social media video",
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
        "Thank you for your order! Your finished video will appear in your account when it is ready."
      );
      window.history.replaceState({}, "", "/en");
    }

    if (payment === "package_success") {
      setPaymentSuccessMessage(
        "Payment successful! Your credits have been added to your account and you can start creating content."
      );
      window.history.replaceState({}, "", "/en");
    }

    const checkUser = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(Boolean(user));
      setAuthChecked(true);
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
    const isPublicDemoRoute =
      href === "/en/dashboard/quick-video" ||
      href === "/en/dashboard?mode=quick";

    if (isPublicDemoRoute) {
      return;
    }

    if (!authChecked) {
      e.preventDefault();
      return;
    }

    if (isLoggedIn) return;

    e.preventDefault();
    setShowAuthModal(true);
  };

  const handleCardClick = (href: string) => {
    if (!authChecked) return;

    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    window.location.href = href;
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f1ec] text-neutral-900">
      <div className="absolute inset-0 -z-10 hidden overflow-hidden sm:block">
        <div className="absolute left-[-120px] top-[-80px] h-[320px] w-[320px] rounded-full bg-[#e9dfd3] blur-3xl" />
        <div className="absolute right-[-100px] top-[120px] h-[280px] w-[280px] rounded-full bg-[#efe7de] blur-3xl" />
        <div className="absolute bottom-[-120px] left-[18%] h-[300px] w-[300px] rounded-full bg-[#ddd0c3] blur-3xl" />
      </div>

      <EnglishHomePageMobile handleProtectedClick={handleProtectedClick} />

      <div className="hidden sm:block">
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:py-24">
            <div>
              <div className="inline-flex max-w-full rounded-full border border-black/10 bg-white/80 px-4 py-2 text-center text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur sm:text-sm">
                Create banners or short AI videos from a simple description
              </div>

              <h1 className="mt-6 max-w-3xl text-[2.35rem] font-black leading-[1.05] tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
                Create ads in minutes -
                <span className="block text-[#7a6d62]">
                  banners or AI videos for your business.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
                Describe your business, offer or idea. AI SMM Studio helps you
                create ready-to-use ad visuals, short videos and content ideas
                for social media - without a designer and without a complicated
                process.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/en/dashboard/quick-video"
                  onClick={(e) => handleProtectedClick(e, "/en/dashboard/quick-video")}
                  className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Create AI video
                </Link>

                <Link
                  href="/en/dashboard?mode=quick"
                  onClick={(e) => handleProtectedClick(e, "/en/dashboard?mode=quick")}
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400"
                >
                  Create banner
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:max-w-2xl sm:grid-cols-3 sm:gap-4">
                {[
                  {
                    title: "Banners",
                    text: "For promotions, services and local offers",
                  },
                  {
                    title: "Texts",
                    text: "For posts and advertising messages",
                  },
                  {
                    title: "Concepts",
                    text: "For a stronger online presence",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="min-w-[220px] flex-shrink-0 rounded-[20px] border border-white/70 bg-white/80 p-3 shadow-sm sm:min-w-0 sm:p-4"
                  >
                    <p className="text-2xl font-black text-neutral-900">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-white/55 blur-3xl" />
              <div className="absolute -right-10 bottom-10 h-44 w-44 rounded-full bg-[#e7ddd2] blur-3xl" />

              <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.08)] backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Platform examples
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">
                      Banners and videos ready for advertising
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

                <div className="mt-5 grid items-stretch gap-3 sm:grid-cols-2">
                  <div className="flex h-full flex-col rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
                      Free test
                    </p>
                    <h3 className="mt-2 text-lg font-black text-neutral-950">
                      Create an ad banner
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      Try the platform for free and generate a banner from a
                      short description.
                    </p>
                    <Link
                      href="/en/dashboard?mode=quick"
                      className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      Try for free
                    </Link>
                  </div>

                  <div className="flex h-full flex-col rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7a6d62]">
                      Generate video
                    </p>
                    <h3 className="mt-2 text-lg font-black text-neutral-950">
                      Create an AI video
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      Create a short advertising video for social media.
                    </p>
                    <Link
                      href="/en/dashboard/quick-video"
                      className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      Generate video
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
              Choose your workflow
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-neutral-950 sm:text-4xl">
              Create marketing content based on what you need
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-600">
              Whether you need a quick visual for an offer or a more complete
              marketing direction, you can start from here.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div
              onClick={() => handleCardClick("/en/dashboard?mode=quick")}
              className="cursor-pointer rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[32px] sm:p-7"
            >
              <div className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                Try for free
              </div>

              <div className="inline-flex rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Fastest start
              </div>

              <h3 className="mt-5 text-3xl font-black tracking-tight text-neutral-950">
                No time?
                <span className="block text-[#7a6d62]">
                  Launch a quick ad.
                </span>
              </h3>

              <p className="mt-3 text-sm leading-6 text-neutral-600 sm:mt-4 sm:text-base sm:leading-7">
                Describe the banner you want - promotion, city, discount,
                period, product, service or a specific campaign idea. You can
                also upload a logo or image.
              </p>

              <div className="mt-4 hidden space-y-2 text-sm text-neutral-700 sm:block">
                <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                  Suitable for promotions, local ads and campaigns
                </div>
                <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                  Generates text and visuals based on your idea
                </div>
                <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                  Can use an uploaded image or logo
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/en/dashboard?mode=quick"
                  onClick={(e) => handleProtectedClick(e, "/en/dashboard?mode=quick")}
                  className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Start quick ad
                </Link>
              </div>
            </div>

            <div
              onClick={() => handleCardClick("/en/dashboard?mode=brand")}
              className="cursor-pointer rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[32px] sm:p-7"
            >
              <div className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                For a stronger presence
              </div>

              <h3 className="mt-5 text-3xl font-black tracking-tight text-neutral-950">
                Want a full direction?
                <span className="block text-[#7a6d62]">
                  Posts, banners and video concepts.
                </span>
              </h3>

              <p className="mt-3 text-sm leading-6 text-neutral-600 sm:mt-4 sm:text-base sm:leading-7">
                For businesses that want consistent style and a stronger
                marketing structure across social media - with brand
                information, direction and next content formats.
              </p>

              <div className="mt-6 space-y-3 text-sm text-neutral-700">
                <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                  More complete approach for your business
                </div>
                <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                  Banners, post ideas and video concepts
                </div>
                <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                  Suitable for a longer-term online presence
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/en/dashboard?mode=brand"
                  onClick={(e) => handleProtectedClick(e, "/en/dashboard?mode=brand")}
                  className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Explore brand mode
                </Link>
              </div>
            </div>

            <div
              onClick={() => handleCardClick("/en/content-calendar")}
              className="cursor-pointer rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[32px] sm:p-7"
            >
              <div className="inline-flex rounded-full bg-[#f3eee8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Planning module
              </div>

              <h3 className="mt-5 text-3xl font-black tracking-tight text-neutral-950">
                Need a plan ahead?
                <span className="block text-[#7a6d62]">
                  Create a content calendar.
                </span>
              </h3>

              <p className="mt-3 text-sm leading-6 text-neutral-600 sm:mt-4 sm:text-base sm:leading-7">
                Generate a structured content calendar for your business -
                topics, post ideas, formats and daily or weekly directions.
              </p>

              <div className="mt-6 space-y-3 text-sm text-neutral-700">
                <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                  Suitable for salons, services, shops and local businesses
                </div>
                <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                  Post ideas, offers, seasonal topics and engaging content
                </div>
                <div className="rounded-[20px] bg-[#f8f5f1] px-4 py-3">
                  A solid base for monthly social media planning
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/en/content-calendar"
                  onClick={(e) => handleProtectedClick(e, "/en/content-calendar")}
                  className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Open content calendar
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
                How it works
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">
                Write naturally. Get a ready-to-use marketing asset.
              </h2>

              <div className="mt-7 grid gap-3 md:grid-cols-3">
                {[
                  {
                    number: "1",
                    title: "Describe the ad",
                    text: "Service, product, city, offer or a specific message.",
                  },
                  {
                    number: "2",
                    title: "Add details",
                    text: "Optionally upload a logo, image or extra brand context.",
                  },
                  {
                    number: "3",
                    title: "Get the result",
                    text: "A ready banner, video idea or social media content direction.",
                  },
                ].map((step) => (
                  <div
                    key={step.number}
                    className="rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-black text-white">
                      {step.number}
                    </div>
                    <h3 className="text-base font-bold text-neutral-950">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              onClick={() => handleCardClick("/en/order-video")}
              className="cursor-pointer overflow-hidden rounded-[28px] border border-white/70 bg-neutral-950 text-white shadow-[0_18px_60px_rgba(0,0,0,0.10)] sm:rounded-[36px]"
            >
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
                  Professional video
                </p>

                <h3 className="mt-2 text-2xl font-black leading-tight">
                  Need more than a short AI video?
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/75">
                  Order a professional video and our team will create it for you
                  - with editing, subtitles, effects, music and a polished ad
                  look.
                </p>

                <Link
                  href="/en/order-video"
                  onClick={(e) => handleProtectedClick(e, "/en/order-video")}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-black"
                >
                  Order professional video
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 text-center shadow-xl sm:p-6">
            <h2 className="mb-2 text-2xl font-bold">
              Try the platform for free
            </h2>

            <p className="mb-6 text-sm text-gray-600">
              Registration takes about 10 seconds. After that you can start
              creating ads right away.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/en/register"
                className="rounded-xl bg-black py-3 font-semibold text-white"
              >
                Register
              </Link>

              <Link
                href="/en/login"
                className="rounded-xl border py-3 font-semibold"
              >
                Login
              </Link>

              <button
                onClick={() => setShowAuthModal(false)}
                className="mt-2 text-sm text-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentSuccessMessage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-7 text-center shadow-2xl">
            <div className="mb-3 text-4xl">OK</div>

            <h2 className="text-xl font-black text-neutral-950">
              Payment successful
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-700">
              {paymentSuccessMessage}
            </p>

            <button
              type="button"
              onClick={() => setPaymentSuccessMessage("")}
              className="mt-6 w-full rounded-full bg-black px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

