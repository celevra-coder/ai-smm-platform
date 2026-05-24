"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HomePageMobileProps = {
  handleProtectedClick: (e: React.MouseEvent, href: string) => void;
};

export default function EnglishHomePageMobile({
  handleProtectedClick,
}: HomePageMobileProps) {
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
            AI SMM platform
          </div>

          <h1 className="mt-4 text-[1.85rem] font-black leading-[1.05] tracking-tight">
            See what ads you can create.
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Banners and short videos for social media — created from a simple
            description.
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
                activeShowcaseIndex === index ? "bg-neutral-950" : "bg-neutral-300"
              }`}
              aria-label={item.label}
            />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 items-stretch gap-3">
          <Link
            href="/en/dashboard?mode=quick"
            onClick={(e) => handleProtectedClick(e, "/en/dashboard?mode=quick")}
            className="flex h-full cursor-pointer flex-col rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">
              Free test
            </p>

            <h3 className="mt-2 text-[15px] font-black leading-tight text-neutral-950">
              Create banner
            </h3>

            <p className="mt-2 text-xs leading-5 text-neutral-600">
              Try it for free and generate an ad banner.
            </p>

            <span className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-3 py-3 text-xs font-bold text-white">
              Try now
            </span>
          </Link>

          <Link
            href="/en/dashboard/quick-video"
            onClick={(e) =>
              handleProtectedClick(e, "/en/dashboard/quick-video")
            }
            className="flex h-full cursor-pointer flex-col rounded-[24px] border border-neutral-200 bg-[#faf8f6] p-4"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a6d62]">
              Generate video
            </p>

            <h3 className="mt-2 text-[15px] font-black leading-tight text-neutral-950">
              Create AI video
            </h3>

            <p className="mt-2 text-xs leading-5 text-neutral-600">
              Create a short advertising video.
            </p>

            <span className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-3 py-3 text-xs font-bold text-white">
              Video
            </span>
          </Link>
        </div>
      </section>

      <section id="mobile-solutions" className="mt-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
          Choose your direction
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight">
          What do you want to create?
        </h2>

        <div className="mt-5 space-y-4">
          <MobileCard
            badge="Try for free"
            label="Fastest start"
            title="Quick ad"
            text="Create a banner or ad idea for a promotion, service, product or local offer."
            href="/en/dashboard?mode=quick"
            button="Start"
            onClick={handleProtectedClick}
          />

          <MobileCard
            label="For brand presence"
            title="Brand mode"
            text="For businesses that want a more organized visual direction, post ideas and marketing structure."
            href="/en/dashboard?mode=brand"
            button="Explore"
            onClick={handleProtectedClick}
          />

          <MobileCard
            label="Planning"
            title="Content calendar"
            text="Create social media content ideas by days or weeks for your business."
            href="/en/content-calendar"
            button="Open calendar"
            onClick={handleProtectedClick}
          />
        </div>
      </section>

      <section id="mobile-how-it-works" className="mt-8 space-y-4">
        <div className="rounded-[28px] bg-white/80 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
            How it works
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight">
            Write naturally. Get a ready-to-use marketing asset.
          </h2>

          <div className="mt-5 space-y-3">
            <Step number="1" title="Describe the ad" />
            <Step number="2" title="Add details or an image" />
            <Step number="3" title="Get the final result" />
          </div>
        </div>

        <Link
          href="/en/order-video"
          onClick={(e) => handleProtectedClick(e, "/en/order-video")}
          className="block cursor-pointer overflow-hidden rounded-[28px] bg-black text-white shadow-sm"
        >
          <video
            src="/videos/promo.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="h-[220px] w-full object-cover opacity-90"
          />

          <div className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">
              Professional video
            </p>

            <h2 className="mt-2 text-2xl font-black leading-tight">
              Need more than a short AI video?
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/70">
              Order a professional video and our team will create it for you —
              with editing, subtitles, effects, music and a polished ad look.
            </p>

            <span className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-bold text-black">
              Order professional video
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}

function MobileCard({
  badge,
  label,
  title,
  text,
  href,
  button,
  onClick,
}: {
  badge?: string;
  label: string;
  title: string;
  text: string;
  href: string;
  button: string;
  onClick: (e: React.MouseEvent, href: string) => void;
}) {
  return (
    <Link
      href={href}
      onClick={(e) => onClick(e, href)}
      className="block cursor-pointer rounded-[28px] bg-white p-5 shadow-sm"
    >
      {badge ? (
        <div className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
          {badge}
        </div>
      ) : null}

      <div className="inline-flex rounded-full bg-[#f3eee8] px-3 py-1 text-xs font-bold text-neutral-700">
        {label}
      </div>

      <h3 className="mt-4 text-2xl font-black tracking-tight">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-neutral-600">{text}</p>

      <span className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-bold text-white">
        {button}
      </span>
    </Link>
  );
}

function Step({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#faf8f6] p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-sm font-black text-white">
        {number}
      </div>
      <p className="text-sm font-bold text-neutral-900">{title}</p>
    </div>
  );
}