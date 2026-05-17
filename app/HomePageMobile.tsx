"use client";

import Link from "next/link";

type HomePageMobileProps = {
  handleProtectedClick: (e: React.MouseEvent, href: string) => void;
};

export default function HomePageMobile({
  handleProtectedClick,
}: HomePageMobileProps) {
  return (
    <div className="block sm:hidden bg-[#f5f1ec] px-4 pb-10 pt-5 text-neutral-950">
      <section className="rounded-[28px] bg-white/80 p-5 shadow-sm">
        <div className="inline-flex rounded-full bg-[#f3eee8] px-3 py-1 text-xs font-bold text-neutral-700">
          AI SMM платформа
        </div>

        <h1 className="mt-5 text-[2.15rem] font-black leading-[1.02] tracking-tight">
          Създавай реклами за социалните мрежи.
        </h1>

        <p className="mt-4 text-[15px] leading-7 text-neutral-600">
          Опиши идеята си на български и платформата ще ти помогне с визия,
          текстове, банери, видео посока и контент календар.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href="#mobile-solutions"
            className="rounded-full bg-neutral-950 px-5 py-3 text-center text-sm font-bold text-white"
          >
            Започни
          </a>

          <a
            href="#mobile-how-it-works"
            className="rounded-full border border-neutral-300 bg-white px-5 py-3 text-center text-sm font-bold text-neutral-900"
          >
            Как работи
          </a>
        </div>
      </section>

      

      <section id="mobile-solutions" className="mt-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
          Избери посока
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight">
          Какво искаш да създадеш?
        </h2>

        <div className="mt-5 space-y-4">
          <MobileCard
            label="Най-бърз старт"
            title="Бърза реклама"
            text="Създай банер или рекламна идея за промоция, услуга, продукт или локална оферта."
            href="/dashboard?mode=quick"
            button="Стартирай"
            onClick={handleProtectedClick}
          />

          <MobileCard
            label="За бранд присъствие"
            title="Бранд режим"
            text="Подходящо за бизнеси, които искат по-подредена визия, идеи за постове и рекламна посока."
            href="/dashboard?mode=brand"
            button="Разгледай"
            onClick={handleProtectedClick}
          />

          <MobileCard
            label="Планиране"
            title="Контент календар"
            text="Създай идеи за съдържание по дни или седмици за социалните мрежи."
            href="/content-calendar"
            button="Отвори календара"
            onClick={handleProtectedClick}
          />
        </div>
      </section>

      <section
  id="mobile-how-it-works"
  className="mt-8 space-y-4"
>
  <div className="rounded-[28px] bg-white/80 p-5 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
      Как работи
    </p>

    <h2 className="mt-2 text-2xl font-black tracking-tight">
      Пишеш естествено. Получаваш готова рекламна идея.
    </h2>

    <div className="mt-5 space-y-3">
      <Step number="1" title="Описваш рекламата" />
      <Step number="2" title="Добавяш детайли или изображение" />
      <Step number="3" title="Получаваш готов резултат" />
    </div>
  </div>

  <div className="overflow-hidden rounded-[28px] bg-black text-white shadow-sm">
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
        Професионално видео
      </p>

      <h2 className="mt-2 text-2xl font-black leading-tight">
        Нужно ти е повече от кратко AI видео?
      </h2>

      <p className="mt-3 text-sm leading-6 text-white/70">
        Поръчай професионално видео и ние ще го изработим за теб — с монтаж,
        субтитри, ефекти, музика и завършен рекламен вид.
      </p>

      <Link
        href="/order-video"
        onClick={(e) => handleProtectedClick(e, "/order-video")}
        className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-bold text-black"
      >
        Поръчай професионално видео
      </Link>
    </div>
  </div>
</section>
    </div>
  );
}

function MobileCard({
  label,
  title,
  text,
  href,
  button,
  onClick,
}: {
  label: string;
  title: string;
  text: string;
  href: string;
  button: string;
  onClick: (e: React.MouseEvent, href: string) => void;
}) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-full bg-[#f3eee8] px-3 py-1 text-xs font-bold text-neutral-700">
        {label}
      </div>

      <h3 className="mt-4 text-2xl font-black tracking-tight">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-neutral-600">{text}</p>

      <Link
        href={href}
        onClick={(e) => onClick(e, href)}
        className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-bold text-white"
      >
        {button}
      </Link>
    </div>
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