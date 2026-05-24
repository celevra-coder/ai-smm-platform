"use client";

import Link from "next/link";
import EnglishHomePageMobile from "./HomePageMobile";

export default function EnglishHomePage() {
  return (
    <>
      <EnglishHomePageMobile />

      <main className="hidden min-h-screen bg-[#f5f1ec] text-neutral-900 sm:block">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm">
              AI marketing content for local businesses
            </div>

            <h1 className="mt-6 max-w-3xl text-[2.4rem] font-black leading-[1.05] tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
              Create social media content
              <span className="block text-[#7a6d62]">
                for your business in minutes.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
              Generate ready-to-post banners, short videos and content ideas for
              restaurants, salons, shops, gyms and local service businesses —
              without hiring a designer.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/en/dashboard/quick-video"
                className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Create AI video
              </Link>

              <Link
                href="/en/dashboard?mode=quick"
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400"
              >
                Create banner
              </Link>
            </div>
          </div>

          <div className="rounded-[36px] border border-white/70 bg-white/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              What you can create
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950">
              Ads, posts and videos ready for social media
            </h2>

            <div className="mt-6 grid gap-3">
              <div className="rounded-[24px] bg-[#faf8f6] p-5">
                <h3 className="text-lg font-black">Promotional banners</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  For offers, local campaigns, discounts and seasonal promotions.
                </p>
              </div>

              <div className="rounded-[24px] bg-[#faf8f6] p-5">
                <h3 className="text-lg font-black">Short AI videos</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Create simple video previews for Facebook, Instagram and TikTok.
                </p>
              </div>

              <div className="rounded-[24px] bg-[#faf8f6] p-5">
                <h3 className="text-lg font-black">Content ideas</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Get post topics and marketing angles for your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
          </main>
    </>
  );
}