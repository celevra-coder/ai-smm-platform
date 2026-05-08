"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const services = [
  {
    id: "video-edit",
    title: "Обработка на готово видео",
    price: "1€",
    meta: "Видео до 60 сек. • срок: до 3 работни дни",
    video: "/videos/video-edit.mp4",
    description:
      "Изрязване, музика, субтитри, лого, преходи и базови ефекти.",
  },
  {
  id: "ai-influencer",
  title: "AI инфлуенсър видео",
  price: "15€",
  meta: "Срок: до 3 работни дни",
  video: "/videos/ai-influencer.mp4",
  objectPosition: "center 10%",
  description:
    "Рекламно видео с AI образ, говор или influencer стил за продукт, услуга или бранд.",
},
  {
    id: "cartoon-animation",
    title: "Картуун анимация",
    price: "30€",
    meta: "Срок: до 3 работни дни",
    video: "/videos/cartoon-animation.mp4",
    description:
      "Цветна анимация за реклама, продукт, услуга, обяснително видео или кратка история.",
  },
  {
  id: "realistic-animation",
  title: "Реалистична анимация",
  price: "30€",
  meta: "Срок: до 3 работни дни",
  video: "/videos/realistic-animation.mp4",
  objectPosition: "center 28%",
  description:
    "Премиум реалистична анимация с кинематографично усещане и рекламен стил.",
},
];

export default function OrderVideoPage() {
  const [selectedService, setSelectedService] = useState(services[0].id);
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
const [isOrdering, setIsOrdering] = useState(false);
const orderFormRef = useRef<HTMLElement | null>(null);

  const selected = services.find((service) => service.id === selectedService);
    const handleOrder = async () => {
  if (isOrdering) return;

  setIsOrdering(true);

  try {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Трябва да влезеш в акаунта си.");
    return;
  }

  if (!description.trim()) {
    alert("Моля опиши видеото.");
    return;
  }

  if (!selected) return;

const priceNumber = parseFloat(selected.price.replace("€", ""));

  // 1. създаваме поръчка
  const { data: order, error } = await supabase
    .from("video_orders")
    .insert({
      user_id: user.id,
      service_id: selected.id,
      service_title: selected.title,
      price_eur: priceNumber,
      description,
      status: "pending_payment",
      payment_status: "unpaid",
    })
    .select()
    .single();

  if (error || !order) {
    alert("Грешка при създаване на поръчка.");
    console.error(error);
    return;
  }

        // 2. викаме PayPal checkout функцията
  const accessToken = (await supabase.auth.getSession()).data.session?.access_token;

  const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-video-order-paypal`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        order_id: order.id,
      }),
    }
  );

  const data = await res.json();

    if (!res.ok || !data?.url) {
    throw new Error(data?.error || "Неуспешно създаване на плащане.");
  }

  window.location.href = data.url;
  } catch (error) {
    console.error("VIDEO ORDER CHECKOUT ERROR:", error);
    alert(error instanceof Error ? error.message : "Грешка при отваряне на плащането.");
  } finally {
    setIsOrdering(false);
  }
};

  return (
    <main className="min-h-screen bg-[#f5f1ec] px-6 py-10 text-neutral-950">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[36px] border border-white/70 bg-white/80 p-8 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Видео услуги
          </p>

          <div className="mt-4 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Поръчай професионално видео за твоя бизнес
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
                Избери тип видео, виж пример, опиши какво искаш и качи материал
                по желание.
              </p>
            </div>

            <div className="rounded-[28px] bg-[#f8f5f1] p-5">
              <p className="text-sm font-bold text-neutral-950">
                Как работи?
              </p>
              <div className="mt-3 grid gap-2 text-sm text-neutral-600 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  1. Избираш тип видео
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  2. Описваш идеята
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  3. Получаваш готов резултат
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <button
  key={service.id}
  type="button"
  onClick={() => {
    setSelectedService(service.id);
    setTimeout(() => {
      orderFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }}
  className={`group overflow-hidden rounded-[32px] border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
    selectedService === service.id
      ? "border-black ring-4 ring-black/10"
      : "border-black/10"
  }`}
>
              <div className="relative bg-black">
                <video
  src={service.video}
  autoPlay
  muted
  loop
  playsInline
  style={{
    objectPosition: service.objectPosition || "center center",
  }}
  className="h-[300px] w-full object-cover opacity-95 transition duration-700 group-hover:scale-105"
/>

                <div className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-black text-black shadow-sm">
                  {service.price}
                </div>

                {selectedService === service.id ? (
                  <div className="absolute right-4 top-4 rounded-full bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
                    Избрано
                  </div>
                ) : null}
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-black tracking-tight text-neutral-950">
                  {service.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {service.description}
                </p>

                <div className="mt-5 rounded-2xl bg-[#f8f5f1] px-4 py-3 text-sm font-bold text-neutral-800">
                  {service.price} • {service.meta}
                </div>
              </div>
            </button>
          ))}
        </section>

        <section
  ref={orderFormRef}
  className="mt-8 rounded-[36px] border border-black/10 bg-white p-8 shadow-sm"
>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
  Описание на видеото
</p>

<h2 className="mt-3 text-3xl font-black tracking-tight">
  Опиши какво искаш да направим
</h2>

<p className="mt-3 text-base leading-7 text-neutral-600">
  Избран тип: <span className="font-bold text-neutral-950">{selected?.title}</span>{" "}
  • Цена: <span className="font-bold text-neutral-950">{selected?.price}</span>{" "}
  • {selected?.meta}
</p>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опиши видеото: какъв бизнес/продукт/услуга представя, какво послание искаш, какъв стил харесваш, какви текстове да има, каква музика/настроение предпочиташ, какво задължително да включим и какво да избягваме..."
                className="mt-6 w-full rounded-[24px] border border-black/10 bg-[#faf8f6] p-5 text-sm leading-6 outline-none transition focus:border-black"
                rows={8}
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Материал по желание
              </p>

              <div className="mt-6 rounded-[28px] border border-dashed border-black/20 bg-[#faf8f6] p-6 text-center">
                <p className="text-sm leading-6 text-neutral-600">
                  Качи свое видео, пример, кадър, лого или друг файл, който да
                  използваме при поръчката.
                </p>

                <label className="mt-6 inline-flex cursor-pointer rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition hover:opacity-90">
                  Качи файл
                  <input
                    type="file"
                    accept="video/*,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFileName(file.name);
                    }}
                  />
                </label>

                {fileName ? (
                  <p className="mt-4 text-xs font-medium text-neutral-500">
                    Качен файл: {fileName}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 rounded-[24px] border border-green-200 bg-green-50 p-5">
  <p className="text-sm font-bold text-green-800">
    Какво получаваш:
  </p>

  <div className="mt-3 space-y-2 text-sm text-green-900">
    <p className="flex items-start gap-2">
      <span className="text-green-600">✔</span>
      Готовото видео се качва директно в профила ти
    </p>

    <p className="flex items-start gap-2">
      <span className="text-green-600">✔</span>
      Включена е 1 безплатна корекция при нужда
    </p>
  </div>
</div>

<button
  type="button"
  onClick={handleOrder}
  disabled={isOrdering}
  className="mt-5 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-black px-6 py-4 text-sm font-black text-white transition hover:opacity-90 active:scale-[0.98] active:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
>
  {isOrdering ? (
    <>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      Отварям плащането...
    </>
  ) : (
    <>Поръчай видео – {selected?.price}</>
  )}
</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}