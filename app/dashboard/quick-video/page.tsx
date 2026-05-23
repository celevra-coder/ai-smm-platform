"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function QuickVideoPage() {
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [videoIdea, setVideoIdea] = useState("");
  const [phone, setPhone] = useState("");
  const [duration, setDuration] = useState<5 | 10>(5);
  const [showMiniPackageModal, setShowMiniPackageModal] = useState(false);
const [paymentLoading, setPaymentLoading] = useState(false);
const [paymentError, setPaymentError] = useState("");
const [imageUrl, setImageUrl] = useState("");
const [imageFileName, setImageFileName] = useState("");
const [imageUploading, setImageUploading] = useState(false);
const [generating, setGenerating] = useState(false);
const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
const [generationError, setGenerationError] = useState("");
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [previewLoading, setPreviewLoading] = useState(false);
const [previewImages, setPreviewImages] = useState<string[]>([]);

const buildQuickOverlayText = () => {
  const source = `${businessName} ${businessDescription} ${videoIdea}`.toLowerCase();

  if (/куче|котка|домашн|pet|животн|кайма|храна за животни/.test(source)) {
    return "Истинска храна, която любимците обичат";
  }

  if (/суши|sushi/.test(source)) {
    return "Свежо суши с апетитен вкус";
  }

  if (/ресторант|храна|пица|бургер|кафе|десерт|торта/.test(source)) {
    return "Вкус, който се забелязва веднага";
  }

  if (/маникюр|коса|фризьор|козмет|масаж|салон|красота/.test(source)) {
    return "Професионална грижа с видим резултат";
  }

  if (/фитнес|трениров|зала|спорт/.test(source)) {
    return "Започни промяната още днес";
  }

  if (businessDescription.trim()) {
    return "Рекламно видео с реалистична визия";
  }

  return "Открий предложение, което си струва";
};
const buildQuickVideoPrompt = () => {
  const source = `${businessName} ${businessDescription} ${videoIdea}`.toLowerCase();

  let realismRules =
    "Create realistic vertical 9:16 commercial video footage. No text, no letters, no subtitles, no logos, no signs, no labels, no fake typography inside the raw video. Natural camera movement, believable real-world physics, realistic textures, realistic lighting, no plastic-looking objects, no AI fantasy, no distorted anatomy.";

  if (/куче|котка|кайма|barf|барф|суров/.test(source)) {
  realismRules +=
    " Realistic home-style BARF feeding scene. One realistic dog and one realistic cat eating ONLY soft raw minced meat from simple neutral ceramic bowls. The food must look exactly like raw ground meat paste with soft wet uneven minced texture. No bones. No plastic bones. No chew toys. No dry food. No kibble. No pellets. No biscuits. No pet snacks. No chunks. No steak. No whole meat cuts. The bowls must contain ONLY raw minced meat paste. The animals should keep their heads close to the bowls and naturally lick or eat the minced meat with subtle realistic mouth movement. Environment must be cozy warm home interior with wooden floor and soft natural lighting. Absolutely no veterinary clinic, no pharmacy, no pet shop, no supermarket, no medical shelves, no white medical room, no product display shelves, no retail environment, no commercial store. Camera should focus tightly on the bowls and the animals eating. Close-up cinematic feeding shots. Realistic food texture is extremely important.";
}

  if (/суши|sushi/.test(source)) {
    realismRules +=
      " Show realistic fresh sushi, real rice texture, fish texture, nori, wooden board or plate, restaurant lighting. Avoid plastic-looking food, fake glossy surfaces, impossible ingredients, or artificial shapes.";
  }

  return `
Main video scene:
${videoIdea.trim()}.

Business context only:
${businessDescription.trim()}.

Important:
The MAIN visual action and camera focus must follow ONLY the video idea section.
The business context is background information only and must NOT force unrelated objects, body parts, services, or scenes into the same shot.

Create one clean coherent commercial scene.
Avoid mixing manicure and pedicure in the same close-up unless explicitly requested.
Avoid awkward touching, hands touching feet, combined beauty procedures, or unnatural beauty salon actions.
ABSOLUTELY NO TEXT INSIDE THE RAW VIDEO.
Do not generate captions, subtitles, typography, titles, labels, logos, UI elements, watermarks, posters, signs, product packaging text, or any readable letters.
The generated video must contain ONLY clean cinematic footage.
Any text overlay will be added later externally.

${realismRules}

Negative details:
text, subtitles, captions, letters, typography, logo, watermark, UI,
bones, plastic bones, chew toy, kibble, pellets, granules, pet snacks, biscuits, steak, steak pieces, cooked meat, grilled meat, sausage, rice, vegetables, pharmacy, veterinary clinic, pet store, retail shelves, medical room, supermarket, laboratory, hospital, white walls, medicine products, fake food, CGI food, cartoon food, floating objects, distorted animal mouth, unrealistic chewing.
`;
};
const uploadImage = async (file: File) => {
  try {
    setImageUploading(true);
    setGenerationError("");

    if (!file.type.startsWith("image/")) {
      setGenerationError("Моля, качи валидна снимка.");
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Липсва Supabase конфигурация.");
    }

    const safeName = file.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9.\-_]/g, "");

    const filePath = `uploads/quick-video/${Date.now()}-${safeName}`;

    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/banners/${filePath}`,
      {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: file,
      }
    );

    const rawText = await uploadResponse.text();

    if (!uploadResponse.ok) {
      throw new Error(rawText || "Неуспешно качване на снимката.");
    }

    setImageUrl(`${supabaseUrl}/storage/v1/object/public/banners/${filePath}`);
    setImageFileName(file.name);
  } catch (error) {
    console.error(error);
    setGenerationError(
      error instanceof Error ? error.message : "Неуспешно качване на снимката."
    );
  } finally {
    setImageUploading(false);
  }
};
const handleMiniPackageCheckout = async () => {
  localStorage.setItem(
    "pending_quick_video",
    JSON.stringify({
      businessName: businessName.trim(),
      businessDescription: businessDescription.trim(),
      videoIdea: videoIdea.trim(),
      phone: phone.trim(),
      duration,
      imageUrl,
      imageFileName,
    })
  );

  window.location.href = "/pricing?source=quick-video";
};
const handleGeneratePreview = async () => {
  try {
    setGenerationError("");

    if (!businessName.trim()) {
      setGenerationError("Моля, попълни име на бизнес.");
      return;
    }

    if (!businessDescription.trim()) {
      setGenerationError("Моля, опиши какво предлага бизнесът.");
      return;
    }

    if (!videoIdea.trim()) {
      setGenerationError("Моля, опиши идеята за видеото.");
      return;
    }

    setPreviewImages([]);
    setPreviewLoading(true);
    setShowPreviewModal(true);

    
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video-frames`,
      {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
},
        body: JSON.stringify({
          brand_profile: {
            brand_name: businessName,
            brand_description: businessDescription,
          },
          selected_post: {
            headline: videoIdea,
            caption: videoIdea,
            raw_text: videoIdea,
          },
        }),
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success || !Array.isArray(data?.images)) {
  throw new Error(
    data?.error ||
      data?.details ||
      `Preview failed. Status: ${res.status}. Response: ${JSON.stringify(data)}`
  );
}

    setPreviewImages(data.images);
  } catch (error) {
  console.error(error);
  setShowPreviewModal(false);
  setGenerationError(
    error instanceof Error
      ? error.message
      : "Не успяхме да създадем preview. Опитай отново."
  );
} finally {
    setPreviewLoading(false);
  }
};
const handleGenerateVideo = async () => {
  try {
    setGenerating(true);
    setGenerationError("");
    setGeneratedVideoUrl("");

    if (!businessName.trim()) {
      setGenerationError("Моля, попълни име на бизнес.");
      return;
    }

    if (!businessDescription.trim()) {
      setGenerationError("Моля, опиши какво предлага бизнесът.");
      return;
    }

    if (!videoIdea.trim()) {
      setGenerationError("Моля, опиши идеята за видеото.");
      return;
    }

            const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;

    if (!accessToken) {
  localStorage.setItem(
    "pending_quick_video",
    JSON.stringify({
      businessName: businessName.trim(),
      businessDescription: businessDescription.trim(),
      videoIdea: videoIdea.trim(),
      phone: phone.trim(),
      duration,
      imageUrl,
      imageFileName,
    })
  );

  window.location.href = "/pricing?source=quick-video";
  return;
}

    const creditRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/consume-credit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action_type: "video",
          cost: duration === 5 ? 25 : 35,
        }),
      }
    );

    const creditData = await creditRes.json().catch(() => null);

    if (!creditRes.ok || !creditData?.success) {
  localStorage.setItem(
    "pending_quick_video",
    JSON.stringify({
      businessName: businessName.trim(),
      businessDescription: businessDescription.trim(),
      videoIdea: videoIdea.trim(),
      phone: phone.trim(),
      duration,
      imageUrl,
      imageFileName,
    })
  );

  window.location.href = "/pricing?source=quick-video";
  return;
}

    const generateRes = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${accessToken}`,
    },
        body: JSON.stringify({
          video_image_url: imageUrl || "",
          source_type: imageUrl ? "video-image" : "text-only",
          duration,
          brand_profile: {
            brand_name: businessName.trim(),
            brand_description: businessDescription.trim(),
            phone: phone.trim(),
          },
          selected_post: {
  headline: buildQuickOverlayText(),
  caption: buildQuickVideoPrompt(),
  offer: "",
  cta: phone.trim() ? "Обади се сега" : "Пиши ни сега",
},
        }),
      }
    );

    const generateData = await generateRes.json().catch(() => null);

    if (!generateRes.ok) {
      throw new Error(
        generateData?.error ||
          generateData?.details ||
          "Неуспешно стартиране на видео генерацията."
      );
    }

    const requestId = generateData?.fal_request_id || generateData?.request_id;

    if (!requestId) {
      throw new Error("Липсва request_id от видео генерацията.");
    }

    let rawVideoUrl = "";

    for (let i = 0; i < 40; i++) {
      await new Promise((resolve) => setTimeout(resolve, 4000));

      const statusRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video-status?request_id=${requestId}`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const statusData = await statusRes.json().catch(() => null);

      rawVideoUrl =
        statusData?.video?.url ||
        statusData?.video_url ||
        statusData?.fal_response?.video?.url ||
        "";

      if (rawVideoUrl) break;
    }

    if (!rawVideoUrl) {
      throw new Error("Видеото не беше готово навреме. Опитай отново.");
    }

    const renderRes = await fetch("/api/render-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoUrl: rawVideoUrl,
        headline: videoIdea.trim(),
        brandName: businessName.trim(),
        scenes: [
          {
            title: "Quick video",
            overlay_text: buildQuickOverlayText(),
            duration_sec: duration,
          },
        ],
        totalDurationSec: duration,
        cta: phone.trim() ? "Обади се сега" : "Пиши ни сега",
        phone: phone.trim(),
        address: "",
        musicStyle: "modern social ad",
      }),
    });

    if (!renderRes.ok) {
      const renderError = await renderRes.json().catch(() => null);
      throw new Error(renderError?.error || "Неуспешно рендериране на видеото.");
    }

    const blob = await renderRes.blob();
    const finalUrl = URL.createObjectURL(blob);

    setGeneratedVideoUrl(finalUrl);
  } catch (error) {
    console.error(error);
    setGenerationError(
      error instanceof Error ? error.message : "Възникна грешка при видеото."
    );
  } finally {
    setGenerating(false);
  }
};
  return (
    <main className="min-h-screen bg-[#f5f1ec] px-4 py-8 text-neutral-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-neutral-600">
            ← Назад към сайта
          </Link>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            Бързо AI видео за реклама
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">
            Попълни кратко описание и създай рекламно видео за социалните мрежи,
            без да минаваш през Brand Studio.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <section className="rounded-[32px] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 rounded-[24px] bg-[#faf8f6] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a6d62]">
                Мини пакет
              </p>
              <h2 className="mt-2 text-2xl font-black">
                2 AI видеа за проба
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Подходящо е, ако искаш първо да пробваш видео генерацията без да
                купуваш цял пакет.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Име на бизнес
                </span>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Напр. Sushi Bar Sakura"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Какво предлага бизнесът?
                </span>
                <textarea
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  rows={4}
                  placeholder="Напр. Суши бар с прясно суши, сетове за двама, доставка и уютна атмосфера."
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Каква е идеята за видеото?
                </span>
                <textarea
                  value={videoIdea}
                  onChange={(e) => setVideoIdea(e.target.value)}
                  rows={4}
                  placeholder="Напр. Кратко апетитно видео за промо сет суши за вечеря."
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Телефон по желание
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Напр. 0888 123 456"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </label>
              <label className="block">
  <span className="mb-2 block text-sm font-bold">
    Снимка по желание
  </span>

  <input
    type="file"
    accept="image/*"
    disabled={imageUploading || generating}
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) void uploadImage(file);
    }}
    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/30"
  />

  {imageFileName ? (
    <p className="mt-2 text-xs font-semibold text-neutral-500">
      Качена снимка: {imageFileName}
    </p>
  ) : null}

  {imageUrl ? (
    <img
      src={imageUrl}
      alt="Качена снимка"
      className="mt-3 h-36 w-full rounded-2xl object-cover"
    />
  ) : null}
</label>

              <div>
                <p className="mb-2 text-sm font-bold">Продължителност</p>
                <div className="grid grid-cols-2 gap-3">
                  {[5, 10].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDuration(item as 5 | 10)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                        duration === item
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-black"
                      }`}
                    >
                      {item} секунди
                    </button>
                  ))}
                </div>
              </div>

              <button
  type="button"
  onClick={() => void handleGeneratePreview()}
  disabled={generating || imageUploading || previewLoading}
  className="w-full rounded-full bg-neutral-950 px-5 py-4 text-sm font-black text-white disabled:opacity-60"
>
  {previewLoading
    ? "Подготвяме preview..."
    : generating
      ? "Генерираме видео..."
      : "Генерирай видео"}
</button>
{showPreviewModal ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[32px] bg-white p-5 shadow-2xl">
      {previewLoading ? (
        <div>
          <div className="mb-5 text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
              AI preview
            </p>

            <h2 className="mt-2 text-2xl font-black text-neutral-950">
              Подготвяме първите кадри...
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Това може да отнеме малко време. Не затваряй прозореца.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-[9/16] animate-pulse rounded-2xl bg-gradient-to-b from-neutral-200 via-neutral-100 to-neutral-300" />
            <div className="aspect-[9/16] animate-pulse rounded-2xl bg-gradient-to-b from-neutral-300 via-neutral-100 to-neutral-200" />
          </div>

          <div className="mt-5 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-black" />
          </div>

          <div className="mt-5 space-y-3 text-sm font-semibold text-neutral-700">
            <div className="flex items-center gap-3 rounded-2xl bg-[#faf8f6] p-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                1
              </span>
              <p>AI анализира бизнеса и офертата...</p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-[#faf8f6] p-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                2
              </span>
              <p>Създава реалистични рекламни сцени...</p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-[#faf8f6] p-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                3
              </span>
              <p>Подготвя preview преди пълното видео...</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
              Preview готов
            </p>

            <h2 className="mt-2 text-2xl font-black text-neutral-950">
              Първите AI кадри са готови
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Това е визуална посока за видеото. Пълното видео се отключва след
              потвърждение.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {previewImages.map((image, index) => (
              <img
                key={`${image.slice(0, 24)}-${index}`}
                src={image}
                alt={`Preview ${index + 1}`}
                className="aspect-[9/16] rounded-2xl object-cover"
              />
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-neutral-100 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
              Идея за видеото
            </p>

            <p className="mt-2 text-sm font-bold text-neutral-900">
              {videoIdea || "Твоето AI видео ще се появи тук."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowPreviewModal(false);
              void handleGenerateVideo();
            }}
            className="mt-5 w-full rounded-full bg-black px-5 py-4 text-sm font-black text-white"
          >
            Отключи пълното видео
          </button>

          <button
            type="button"
            onClick={() => setShowPreviewModal(false)}
            className="mt-3 w-full text-sm font-semibold text-neutral-500"
          >
            Затвори
          </button>
        </>
      )}
    </div>
  </div>
) : null}
{generationError ? (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
    {generationError}
  </div>
) : null}
            </div>
          </section>

          <section className="rounded-[32px] bg-neutral-950 p-5 text-white shadow-sm sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
              Preview
            </p>

            <h2 className="mt-3 text-2xl font-black">
              Какво ще получиш?
            </h2>

            <div className="mt-5 space-y-3 text-sm leading-6 text-white/75">
              <p>• 2 кратки AI видеа за социални мрежи</p>
              <p>• вертикален формат 9:16</p>
              <p>• текст върху видеото</p>
              <p>• музика и финален екран с бизнес име</p>
              <p>• подходящо за Facebook, Instagram Reels и TikTok</p>
            </div>

            <div className="mt-8 overflow-hidden rounded-[28px] bg-black">
              {generating ? (
  <div className="flex aspect-[9/16] w-full flex-col items-center justify-center bg-neutral-950 px-6 text-center">
    <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />

    <h3 className="mt-6 text-xl font-black text-white">
      Генерираме видеото...
    </h3>

    <p className="mt-3 text-sm leading-6 text-white/60">
      Това може да отнеме известно време. Подготвяме реалистична визия,
      движение, музика и финален рекламен текст.
    </p>
  </div>
) : generatedVideoUrl ? (
  <video
    src={generatedVideoUrl}
    controls
    autoPlay
    loop
    playsInline
    className="aspect-[9/16] w-full object-cover"
  />
) : (
  <video
    src="/showcase/video-1.mp4"
    autoPlay
    muted
    loop
    playsInline
    className="aspect-[9/16] w-full object-cover opacity-90"
  />
)}
            </div>
          </section>
        </div>
      </div>
      {generatedVideoUrl ? (
  <a
    href={generatedVideoUrl}
    download="ai-smm-video.mp4"
    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-black"
  >
    Свали видеото
  </a>
) : null}
      {showMiniPackageModal ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-2xl">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a6d62]">
        Мини пакет AI видео
      </p>

      <h2 className="mt-3 text-2xl font-black text-neutral-950">
        2 кратки AI видеа за 4€
      </h2>

      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Получаваш 50 кредита — достатъчни за 2 видеа по 5 секунди.
        Ако избереш 10 секунди, едно видео използва 35 кредита.
      </p>

      {paymentError ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {paymentError}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleMiniPackageCheckout}
          disabled={paymentLoading}
          className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {paymentLoading ? "Отварям PayPal..." : "Купи мини пакет"}
        </button>

        <button
          type="button"
          onClick={() => setShowMiniPackageModal(false)}
          className="text-sm font-semibold text-neutral-500"
        >
          Затвори
        </button>
      </div>
    </div>
  </div>
) : null}
    </main>
  );
}