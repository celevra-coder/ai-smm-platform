"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function EnglishHomePageMobile() {
  const showcaseItems = [
    {
      type: "image",
      src: "/showcase/banner-1.png",
      label: "Promo banner",
    },
    {
      type: "video",
      src: "/showcase/video-1.mp4",
      label: "Short ad video",
    },
    {
      type: "image",
      src: "/showcase/banner-2.png",
      label: "Service banner",
    },
    {
      type: "video",
      src: "/showcase/video-2.mp4",
      label: "Social media video",
    },
  ];

  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const activeShowcase = showcaseItems[activeShowcaseIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveShowcaseIndex((current) =>
        current === showcaseItems.length - 1 ? 0 : current + 1
      );
    }, 3000);

    return () => window.clearInterval(interval);
  }, [showcaseItems.length]);

  return (
    <div className="block bg-[#f5f1ec] px-4 pb-10 pt-5 text-neutral-950 sm:hidden">
      <section className="overflow-hidden rounded-[28px] bg-white/85 p-4 shadow-sm">
        <div className="mb-4">
          <div className="inline-flex rounded-full bg-[#f3eee8] px-3 py-1 text-xs font-bold text-neutral-700">
            AI marketing for local businesses
          </div>

          <h1 className="mt-4 text-[1.85rem] font-black leading-[1.05] tracking-tight">
            Create social media content in minutes.
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Banners, short videos and post ideas for restaurants, salons, shops
            and local services.
          </p>
        </div>

        <div className="overflow-hidden rounded-[24px] bg-black">
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

        <div className="mt-4 grid grid-cols-4 gap-2">
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

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/en/dashboard?mode=quick"
            className="flex flex-col rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">
              Free test
            </p>

            <h3 className="mt-2 text-[15px] font-black leading-tight">
              Create banner
            </h3>

            <p className="mt-2 text-xs leading-5 text-neutral-600">
              Generate a quick promo banner.
            </p>

            <span className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-3 py-3 text-xs font-bold text-white">
              Start
            </span>
          </Link>

          <Link
            href="/en/dashboard/quick-video"
            className="flex flex-col rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a6d62]">
              AI video
            </p>

            <h3 className="mt-2 text-[15px] font-black leading-tight">
              Create video
            </h3>

            <p className="mt-2 text-xs leading-5 text-neutral-600">
              Make a short ad video preview.
            </p>

            <span className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-3 py-3 text-xs font-bold text-white">
              Video
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}