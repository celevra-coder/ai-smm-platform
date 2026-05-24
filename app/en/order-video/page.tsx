"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const services = [
  {
    id: "video-edit",
    title: "Editing of an existing video",
    price: "10€",
    meta: "Video up to 60 sec. • delivery: up to 3 business days",
    video: "/videos/video-edit.mp4",
    description:
      "Trimming, music, subtitles, logo, transitions and basic effects.",
  },
  {
    id: "ai-influencer",
    title: "AI influencer video",
    price: "15€",
    meta: "Delivery: up to 3 business days",
    video: "/videos/ai-influencer.mp4",
    objectPosition: "center 10%",
    description:
      "Advertising video with an AI character, voice or influencer-style presentation for a product, service or brand.",
  },
  {
    id: "cartoon-animation",
    title: "Cartoon animation",
    price: "30€",
    meta: "Delivery: up to 3 business days",
    video: "/videos/cartoon-animation.mp4",
    description:
      "Colorful animation for an ad, product, service, explainer video or short story.",
  },
  {
    id: "realistic-animation",
    title: "Realistic animation",
    price: "30€",
    meta: "Delivery: up to 3 business days",
    video: "/videos/realistic-animation.mp4",
    objectPosition: "center 28%",
    description:
      "Premium realistic animation with a cinematic feel and advertising style.",
  },
];

export default function OrderVideoPage() {
  const [selectedService, setSelectedService] = useState(services[0].id);
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
const [isOrdering, setIsOrdering] = useState(false);
const [showPaymentInfo, setShowPaymentInfo] = useState(false);
const [pendingPaymentUrl, setPendingPaymentUrl] = useState("");
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
    alert("You need to log in to your account.");
window.location.href = "/en/login";
return;
  }

  if (!description.trim()) {
    alert("Please describe the video.");
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
    alert("Error while creating the order.");
    console.error(error);
    return;
  }

  if (selectedFiles.length > 0) {
  for (const file of selectedFiles) {
    console.log("Uploading file:", file.name);

    const filePath = `video-order-files/${order.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, file);

      if (uploadError) {
  console.error("VIDEO ORDER FILE UPLOAD ERROR:", uploadError);
  continue; // НЕ спира останалите файлове
}

      const { data: publicFile } = supabase.storage
        .from("videos")
        .getPublicUrl(filePath);

      const { error: fileRecordError } = await supabase
        .from("video_order_files")
        .insert({
          order_id: order.id,
          user_id: user.id,
          file_url: publicFile.publicUrl,
          file_name: file.name,
          file_type: file.type,
        });

      if (fileRecordError) {
        console.error("VIDEO ORDER FILE RECORD ERROR:", fileRecordError);
        throw new Error("Error while saving the file to the order.");
      }
    }
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
    throw new Error(data?.error || "Could not create the payment.");
  }

      setPendingPaymentUrl(data.url);
  setShowPaymentInfo(true);
  return;
  } catch (error) {
    console.error("VIDEO ORDER CHECKOUT ERROR:", error);
    alert(error instanceof Error ? error.message : "Error while opening the payment.");
  } finally {
    setIsOrdering(false);
  }
};

  return (
    <main className="min-h-screen bg-[#f5f1ec] px-6 py-10 text-neutral-950">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[36px] border border-white/70 bg-white/80 p-8 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Video services
          </p>

          <div className="mt-4 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Order a professional video for your business
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
                Choose a video type, watch an example, describe what you need and optionally upload your materials.
              </p>
            </div>

            <div className="rounded-[28px] bg-[#f8f5f1] p-5">
              <p className="text-sm font-bold text-neutral-950">
                How does it work?
              </p>
              <div className="mt-3 grid gap-2 text-sm text-neutral-600 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  1. Choose a video type
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  2. Describe your idea
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  3. Receive the finished video
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
                    Selected
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
  Video description
</p>

<h2 className="mt-3 text-3xl font-black tracking-tight">
  Describe what you want us to create
</h2>

<p className="mt-3 text-base leading-7 text-neutral-600">
  Selected type:<span className="font-bold text-neutral-950">{selected?.title}</span>{" "}
  • Price: <span className="font-bold text-neutral-950">{selected?.price}</span>{" "}
  • {selected?.meta}
</p>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the video: what business/product/service it presents, what message you want, what style you like, what text should appear, what music/mood you prefer, what we must include and what we should avoid..."
                className="mt-6 w-full rounded-[24px] border border-black/10 bg-[#faf8f6] p-5 text-sm leading-6 outline-none transition focus:border-black"
                rows={8}
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Optional materials
              </p>

              <div className="mt-6 rounded-[28px] border border-dashed border-black/20 bg-[#faf8f6] p-6 text-center">
                <p className="text-sm leading-6 text-neutral-600">
                  Upload your own video, example, image, logo or another file that we should use for the order.
                </p>

                <label className="mt-6 inline-flex cursor-pointer rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition hover:opacity-90">
                  Upload file
                                    <input
                    type="file"
                    accept="video/*,image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles(files);
                    }}
                  />
                </label>

                                {selectedFiles.length > 0 ? (
                  <div className="mt-4 space-y-1 text-left text-xs font-medium text-neutral-500">
                    <p>Uploaded files:</p>
                    {selectedFiles.map((file) => (
                      <p key={`${file.name}-${file.size}`}>• {file.name}</p>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 rounded-[24px] border border-green-200 bg-green-50 p-5">
  <p className="text-sm font-bold text-green-800">
    What you get:
  </p>

  <div className="mt-3 space-y-2 text-sm text-green-900">
    <p className="flex items-start gap-2">
      <span className="text-green-600">✔</span>
      The finished video is uploaded directly to your account
    </p>

    <p className="flex items-start gap-2">
      <span className="text-green-600">✔</span>
      1 free revision is included if needed
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
      Opening payment...
    </>
  ) : (
    <>Order video – {selected?.price}</>
  )}
</button>
            </div>
          </div>
        </section>
      </div>
      {showPaymentInfo ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-[28px] bg-white p-7 text-center shadow-2xl">
      <div className="mb-3 text-4xl">💳</div>

      <h2 className="text-xl font-black text-neutral-950">
        Card payment
      </h2>

      <p className="mt-3 text-sm leading-6 text-neutral-700">
        After PayPal opens, you can pay by card. If you do not see a direct card payment button, choose{" "}
<span className="font-black">“Create an account”</span> — this will take you to card payment without registration.
      </p>

      <button
        type="button"
        onClick={() => {
          if (!pendingPaymentUrl) return;
          window.location.href = pendingPaymentUrl;
        }}
        className="mt-6 w-full rounded-full bg-black px-5 py-3 text-sm font-bold text-white"
      >
        Continue to payment
      </button>

      <button
        type="button"
        onClick={() => {
          setShowPaymentInfo(false);
          setPendingPaymentUrl("");
        }}
        className="mt-3 text-xs font-bold text-neutral-500"
      >
        Cancel
      </button>
    </div>
  </div>
) : null}
    </main>
  );
}