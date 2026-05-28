"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "quick-ad" | "brand";

type StoredBrandProfile = {
  brand_name: string;
  business_address: string;
  phone: string;
  brand_description: string;
  preferred_colors: string;
  logo_url: string;
};

function EnglishDashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modeParam =
    searchParams.get("mode") ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("mode")
      : null);

  const mode: Mode = modeParam === "brand" ? "brand" : "quick-ad";

  const [description, setDescription] = useState("");
  const [offerText, setOfferText] = useState("");
  const [discountText, setDiscountText] = useState("");
  const [periodText, setPeriodText] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [extraText, setExtraText] = useState("");
const [logoUrl, setLogoUrl] = useState("");
const [imageUrl, setImageUrl] = useState("");
const [imageUsageMode, setImageUsageMode] = useState("auto");
const [logoUploading, setLogoUploading] = useState(false);
const [imageUploading, setImageUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [composedBannerUrl, setComposedBannerUrl] = useState("");
const [showBannerZoom, setShowBannerZoom] = useState(false);
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [cta, setCta] = useState("");
    const [showPaywallModal, setShowPaywallModal] = useState(false);

  const [brandName, setBrandName] = useState("");
  const [brandBusinessAddress, setBrandBusinessAddress] = useState("");
  const [brandPhone, setBrandPhone] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandPreferredColors, setBrandPreferredColors] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandLogoFileName, setBrandLogoFileName] = useState("");
  const [brandLogoUploadMessage, setBrandLogoUploadMessage] = useState("");
  const [brandLogoUploading, setBrandLogoUploading] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandMessage, setBrandMessage] = useState("");
  const [brandProfileSaved, setBrandProfileSaved] = useState(false);

  const handleGenerate = async () => {
    if (loading || logoUploading || imageUploading) return;

    if (!description.trim()) {
      setMessage("Please describe the banner you want to create.");
      return;
    }

    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    const isGuest = !accessToken;

    if (isGuest) {
      const guestBannerCount = Number(
        localStorage.getItem("en_guest_banner_count") || "0"
      );

      if (guestBannerCount >= 2) {
        setShowPaywallModal(true);
        return;
      }

      localStorage.setItem(
        "en_guest_banner_count",
        String(guestBannerCount + 1)
      );
    }

    setLoading(true);
    setMessage("Creating your banner...");
    setGeneratedImageUrl("");
    setHeadline("");
    setSubtext("");
    setCta("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
      }

      const fullPrompt = [
        "Create a high-converting social media banner for Facebook and Instagram.",
        description.trim(),
        offerText.trim()
          ? `Main offer: ${offerText.trim()}`
          : "",
        discountText.trim()
          ? `Price or discount: ${discountText.trim()}`
          : "",
        periodText.trim()
          ? `Campaign period: ${periodText.trim()}`
          : "",
        phone.trim()
          ? `Phone number that should be visible: ${phone.trim()}`
          : "",
        address.trim()
          ? `Business location or address: ${address.trim()}`
          : "",
        extraText.trim(),
        "The banner should look like a real ad for a local business.",
        "Use clean composition, strong visual hierarchy and modern social media ad style.",
        "Do not add random unreadable text inside the image.",
        "The final result should be suitable for restaurants, salons, shops, gyms, dentists, real estate or local services.",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-baner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          description: description.trim(),
          address: address.trim(),
          offer: offerText.trim(),
          discount: discountText.trim(),
          price: discountText.trim(),
          period: periodText.trim(),
          phone: phone.trim(),
          exact_text: "",
          extra_requirements: [
  extraText.trim(),
  imageUrl.trim() ? `Image usage mode: ${imageUsageMode}` : "",
  logoUrl.trim() ? "Use the uploaded logo if it fits naturally." : "",
]
  .filter(Boolean)
  .join("\n"),
          keyword: fullPrompt,
          product: "quick-ad-banner",
          city: "",
          logo_url: logoUrl.trim(),
image_url: imageUrl.trim(),
image_usage_mode: imageUsageMode,
          design_mode: "readable_editorial",
          source: "en_quick_banner",
        }),
      });

      const rawText = await response.text();

      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(rawText || "Invalid server response.");
      }

      if (!response.ok) {
        if (data?.error === "NO_CREDITS" || data?.error === "PAYMENT_REQUIRED") {
          setShowPaywallModal(true);
          setMessage("");
          return;
        }

        throw new Error(
          data?.message || data?.error || "Something went wrong. Please try again."
        );
      }

      setGeneratedImageUrl(typeof data?.image_url === "string" ? data.image_url : "");
      setHeadline(typeof data?.headline === "string" ? data.headline : "");
      setSubtext(typeof data?.subtext === "string" ? data.subtext : "");
      setCta(typeof data?.cta === "string" ? data.cta : "");
      setMessage("Your banner is ready.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong.";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };
const uploadQuickBannerFile = async (
  file: File,
  type: "logo" | "image"
) => {
  const supabase = createClient();

  const fileExtension = file.name.split(".").pop() || "file";
  const filePath = `quick-banner/${type}/${crypto.randomUUID()}.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from("videos")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    console.error("EN QUICK BANNER FILE UPLOAD ERROR:", uploadError);
    setMessage(`Could not upload ${type}. Please try again.`);
    return "";
  }

  const { data } = supabase.storage.from("videos").getPublicUrl(filePath);
  return data.publicUrl;
};

const handleLogoUpload = async (file: File | null) => {
  if (!file) return;

  setLogoUploading(true);
  setMessage("Uploading logo...");

  try {
    const url = await uploadQuickBannerFile(file, "logo");
    if (url) {
      setLogoUrl(url);
      setMessage("Logo uploaded.");
    }
  } finally {
    setLogoUploading(false);
  }
};

const handleImageUpload = async (file: File | null) => {
  if (!file) return;

  setImageUploading(true);
  setMessage("Uploading image...");

  try {
    const url = await uploadQuickBannerFile(file, "image");
    if (url) {
      setImageUrl(url);
      setMessage("Image uploaded.");
    }
  } finally {
    setImageUploading(false);
  }
};
    const createComposedBannerBlob = async () => {
  if (!generatedImageUrl) return null;

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = generatedImageUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not load banner image."));
  });

  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0, size, size);

  // Elegant center readability layer, not a bottom black box
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    120,
    size / 2,
    size / 2,
    720
  );

  gradient.addColorStop(0, "rgba(0,0,0,0.42)");
  gradient.addColorStop(0.55, "rgba(0,0,0,0.24)");
  gradient.addColorStop(1, "rgba(0,0,0,0.06)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const drawTextLines = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number
  ) => {
    const words = text.split(" ").filter(Boolean);
    let line = "";
    const lines: string[] = [];

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) lines.push(line);

    const visibleLines = lines.slice(0, maxLines);

    visibleLines.forEach((lineText, index) => {
      ctx.fillText(lineText, x, y + index * lineHeight);
    });

    return y + visibleLines.length * lineHeight;
  };

  const centerX = size / 2;
  let currentY = 295;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Headline
    if (headline) {
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "900 56px Arial";
    ctx.shadowColor = "rgba(0,0,0,0.26)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 2;

    currentY = drawTextLines(headline, centerX, currentY, 760, 64, 2);
    currentY += 40;
  }

  // Subtext
    if (subtext) {
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.font = "700 34px Arial";
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;

    currentY = drawTextLines(subtext, centerX, currentY, 760, 44, 2);
    currentY += 46;
  }

  // Offer / discount / period as a separate elegant line
  const offerLine = [discountText, periodText].filter(Boolean).join(" â€¢ ");

    if (offerLine) {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "900 32px Arial";
    ctx.shadowColor = "rgba(0,0,0,0.24)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;

    currentY = drawTextLines(offerLine, centerX, currentY, 760, 40, 1);
    currentY += 54;
  }

  // CTA pill
  if (cta) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = "900 30px Arial";
    const ctaText = cta;
    const ctaWidth = Math.min(ctx.measureText(ctaText).width + 68, 560);
    const ctaHeight = 58;
    const ctaX = centerX - ctaWidth / 2;
    const ctaY = currentY - 12;

    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, 29);
    ctx.fill();

    ctx.fillStyle = "#111111";
    ctx.fillText(ctaText, centerX, ctaY + 39);

    currentY += 86;
  }

  // Phone / address as a visible premium contact badge
  const contactLine = [phone, address].filter(Boolean).join(" â€¢ ");

    if (contactLine) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = "900 32px Arial";
    const maxContactWidth = 860;
    const measured = Math.min(ctx.measureText(contactLine).width + 84, maxContactWidth);
    const badgeX = centerX - measured / 2;
    const badgeY = 822;
    const badgeH = 72;

    ctx.fillStyle = "rgba(20,20,20,0.28)";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, measured, badgeH, 36);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, measured, badgeH, 36);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.96)";
    drawTextLines(contactLine, centerX, badgeY + 46, measured - 70, 34, 1);
  }

  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
};
useEffect(() => {
  let objectUrl = "";

  const updateComposedPreview = async () => {
    if (!generatedImageUrl) {
      setComposedBannerUrl("");
      return;
    }

    const blob = await createComposedBannerBlob();

    if (!blob) {
      setComposedBannerUrl("");
      return;
    }

    objectUrl = window.URL.createObjectURL(blob);
    setComposedBannerUrl(objectUrl);
  };

  void updateComposedPreview();

  return () => {
    if (objectUrl) {
      window.URL.revokeObjectURL(objectUrl);
    }
  };
}, [generatedImageUrl, headline, subtext, cta, discountText, periodText, phone, address]);

const handleDownloadBanner = async () => {
  const sourceUrl = composedBannerUrl || generatedImageUrl;

  if (!sourceUrl) {
    setMessage("Could not prepare the banner for download.");
    return;
  }

  const response = await fetch(sourceUrl);
  const blob = await response.blob();

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = "ai-smm-banner.png";
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

const handleCopyBannerImage = async () => {
  const sourceUrl = composedBannerUrl || generatedImageUrl;

  if (!sourceUrl) {
    setMessage("Could not copy the banner image.");
    return;
  }

  try {
    const response = await fetch(sourceUrl);
    const blob = await response.blob();

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);

    setMessage("Banner image copied.");
  } catch (error) {
    console.error("COPY BANNER IMAGE ERROR:", error);
    setMessage("Your browser blocked image copy. Please use Download banner.");
  }
};

const handleCopyBannerText = async () => {
  const contactLine = [phone, address].filter(Boolean).join(" â€¢ ");
  const text = [headline, subtext, cta, contactLine].filter(Boolean).join("\n");

  if (!text) return;

  await navigator.clipboard.writeText(text);
  setMessage("Banner text copied.");
};

const handleSaveBrandProfile = async () => {
  if (brandSaving || brandLogoUploading) return;

  if (!brandName.trim()) {
    setBrandMessage("Please enter the brand name.");
    return;
  }

  if (!brandDescription.trim()) {
    setBrandMessage("Please describe what the brand does.");
    return;
  }

  setBrandSaving(true);
  setBrandMessage("");

  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/en/login");
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
    }

    if (!supabaseAnonKey) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    const payload: StoredBrandProfile & { user_id: string } = {
      user_id: user.id,
      brand_name: brandName.trim(),
      business_address: brandBusinessAddress.trim(),
      phone: brandPhone.trim(),
      brand_description: brandDescription.trim(),
      preferred_colors: brandPreferredColors.trim(),
      logo_url: brandLogoUrl.trim(),
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/brand_profiles`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || data?.error || "Could not save brand profile.");
    }

    localStorage.setItem("active_brand_profile", JSON.stringify(payload));
    localStorage.setItem("active_brand_user_id", user.id);

    setBrandProfileSaved(true);
    setBrandMessage("Brand profile saved. Opening the workspace...");

    router.push("/en/dashboard/brand-workspace");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Could not save brand profile.";
    setBrandMessage(errorMessage);
  } finally {
    setBrandSaving(false);
  }
};

if (mode === "brand") {
  return (
    <main className="min-h-screen bg-[#f5f1ec] px-4 py-8 text-neutral-950 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/en" className="text-sm font-semibold text-neutral-500">
            â† Back to home
          </Link>

          <Link
            href="/en/pricing"
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-bold text-white"
          >
            Pricing
          </Link>
        </div>

        <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
            Brand Mode
          </p>

          <h1 className="mt-3 text-[34px] font-black leading-none tracking-[-0.04em] text-neutral-950 md:text-[48px]">
            Create your brand profile
          </h1>

          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-neutral-600">
            Save your business details once and use them to generate post ideas,
            banners and video concepts with consistent brand direction.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Brand name
              </span>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Example: Dolce Bakery"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Business address
              </span>
              <input
                value={brandBusinessAddress}
                onChange={(e) => setBrandBusinessAddress(e.target.value)}
                placeholder="Example: London, Baker Street 25"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Phone
              </span>
              <input
                value={brandPhone}
                onChange={(e) => setBrandPhone(e.target.value)}
                placeholder="Example: your business phone number"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Preferred colors / style
              </span>
              <input
                value={brandPreferredColors}
                onChange={(e) => setBrandPreferredColors(e.target.value)}
                placeholder="Example: warm beige, premium, elegant"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                What does the business do?
              </span>
              <textarea
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                rows={5}
                placeholder="Describe the business, services, target customers, offer style and what makes it different."
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSaveBrandProfile()}
              disabled={brandSaving || brandLogoUploading}
              className="rounded-[20px] bg-neutral-950 px-6 py-3 text-[15px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {brandSaving ? "Saving..." : "Save brand profile"}
            </button>

            {brandProfileSaved ? (
              <span className="text-sm font-semibold text-emerald-700">
                Brand profile saved
              </span>
            ) : null}
          </div>

          {brandMessage ? (
            <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8f5ef] px-4 py-3 text-sm font-medium text-neutral-700">
              {brandMessage}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-[#f5f1ec] px-4 py-8 text-neutral-950 md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/en" className="text-sm font-semibold text-neutral-500">
            â† Back to home
          </Link>

          <Link
            href="/en/pricing"
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-bold text-white"
          >
            Pricing
          </Link>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Quick banner generator
            </p>

            <h1 className="mt-2 text-[30px] font-black leading-none tracking-[-0.03em] text-neutral-950">
              Create a social media banner
            </h1>

            <p className="mt-3 max-w-[680px] text-[15px] leading-[1.6] text-neutral-600">
              Describe your business, offer or campaign and generate a ready-to-use
              banner for Facebook or Instagram.
            </p>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <label className="md:col-span-2 block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">
                  Banner description
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Example: Create a banner for a local bakery. Sunday offer: buy one cake slice and get one free."
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">
                  Offer
                </span>
                <input
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  placeholder="Buy 1 get 1 free"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">
                  Price / discount
                </span>
                <input
                  value={discountText}
                  onChange={(e) => setDiscountText(e.target.value)}
                  placeholder="-20% / 9.99â‚¬"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">
                  Period
                </span>
                <input
                  value={periodText}
                  onChange={(e) => setPeriodText(e.target.value)}
                  placeholder="This weekend only"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">
                  Phone
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Leave empty if you do not want a phone number"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
                />
              </label>

              <label className="md:col-span-2 block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">
                  Address / location
                </span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Sofia, Bulgaria"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
                />
              </label>

              <label className="md:col-span-2 block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">
                  Extra requirements
                </span>
                <textarea
                  value={extraText}
                  onChange={(e) => setExtraText(e.target.value)}
                  rows={3}
                  placeholder="Example: premium look, warm colors, modern layout, no fake buttons."
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-black/30"
                />
              </label>
              <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
  <div className="rounded-[22px] border border-black/10 bg-white p-4">
    <p className="text-sm font-bold text-neutral-900">Logo</p>
    <p className="mt-1 text-xs leading-5 text-neutral-500">
      Optional. Upload your logo if you want it included in the banner.
    </p>

    <label className="mt-4 inline-flex cursor-pointer rounded-full bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
      {logoUploading ? "Uploading..." : logoUrl ? "Change logo" : "Upload logo"}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          void handleLogoUpload(file);
          e.target.value = "";
        }}
      />
    </label>

    {logoUrl ? (
      <div className="mt-4 flex items-center gap-3">
        <img
          src={logoUrl}
          alt="Uploaded logo"
          className="h-14 w-14 rounded-2xl border border-black/10 object-contain"
        />
        <button
          type="button"
          onClick={() => setLogoUrl("")}
          className="text-xs font-bold text-red-600 underline"
        >
          Remove
        </button>
      </div>
    ) : null}
  </div>

  <div className="rounded-[22px] border border-black/10 bg-white p-4">
    <p className="text-sm font-bold text-neutral-900">Reference image</p>
    <p className="mt-1 text-xs leading-5 text-neutral-500">
      Optional. Upload a product, place, dish, room, person or example image.
    </p>

    <label className="mt-4 inline-flex cursor-pointer rounded-full bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
      {imageUploading ? "Uploading..." : imageUrl ? "Change image" : "Upload image"}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          void handleImageUpload(file);
          e.target.value = "";
        }}
      />
    </label>

    {imageUrl ? (
      <div className="mt-4">
        <img
          src={imageUrl}
          alt="Uploaded reference"
          className="h-28 w-full rounded-2xl border border-black/10 object-cover"
        />

        <div className="mt-3 grid gap-2 text-xs font-bold text-neutral-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={imageUsageMode === "auto"}
              onChange={() => setImageUsageMode("auto")}
            />
            Auto â€” use it intelligently
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={imageUsageMode === "integrate"}
              onChange={() => setImageUsageMode("integrate")}
            />
            Integrate into the scene
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={imageUsageMode === "exact"}
              onChange={() => setImageUsageMode("exact")}
            />
            Keep it almost unchanged
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            setImageUrl("");
            setImageUsageMode("auto");
          }}
          className="mt-3 text-xs font-bold text-red-600 underline"
        >
          Remove image
        </button>
      </div>
    ) : null}
  </div>
</div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={loading}
                className="rounded-[20px] bg-neutral-950 px-6 py-3 text-[15px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {logoUploading || imageUploading
  ? "Uploading..."
  : loading
  ? "Generating..."
  : "Generate banner"}
              </button>
            </div>

            {message ? (
              <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8f5ef] px-4 py-3 text-sm font-medium text-neutral-700">
                {message}
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <h2 className="text-[24px] font-black leading-none tracking-[-0.03em] text-neutral-950">
              Banner preview
            </h2>

            <div className="mt-5 w-full overflow-hidden rounded-[28px] border border-black/10 bg-[#f5f1ec]">
              {loading ? (
                <div className="flex aspect-square items-center justify-center p-8 text-center">
                  <div className="max-w-[320px]">
                    <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-black/10 border-t-black" />
                    <div className="mt-6 text-[18px] font-bold text-neutral-900">
                      Creating your banner...
                    </div>
                    <p className="mt-3 text-sm leading-[1.7] text-neutral-500">
                      We are preparing the visual, message and composition.
                    </p>
                  </div>
                </div>
                            ) : generatedImageUrl ? (
                <div>
                  <div className="relative aspect-square overflow-hidden bg-neutral-900">
  <button
    type="button"
    onDoubleClick={() => setShowBannerZoom(true)}
    className="block h-full w-full cursor-zoom-in"
    title="Double click to enlarge"
  >
    <img
      src={composedBannerUrl || generatedImageUrl}
      alt="Generated banner"
      className="h-full w-full object-cover"
    />
  </button>
</div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
  <button
    type="button"
    onClick={() => void handleDownloadBanner()}
    className="rounded-full bg-neutral-950 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
  >
    Download banner
  </button>

  <button
    type="button"
    onClick={() => void handleCopyBannerImage()}
    className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-bold text-neutral-950 transition hover:bg-[#f5f1ec]"
  >
    Copy banner
  </button>

  <button
    type="button"
    onClick={() => void handleCopyBannerText()}
    className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-bold text-neutral-950 transition hover:bg-[#f5f1ec]"
  >
    Copy text
  </button>
</div>
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center p-8 text-center">
                  <div>
                    <div className="text-[15px] font-semibold text-neutral-700">
                      No banner generated yet
                    </div>
                    <p className="mt-2 text-sm leading-[1.6] text-neutral-500">
                      Fill in the form and click â€œGenerate bannerâ€.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
{showBannerZoom && (composedBannerUrl || generatedImageUrl) ? (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    onClick={() => setShowBannerZoom(false)}
  >
    <div
      className="relative max-h-[92vh] max-w-[92vw]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setShowBannerZoom(false)}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-black shadow-lg"
      >
        Close
      </button>

      <img
        src={composedBannerUrl || generatedImageUrl}
        alt="Generated banner enlarged"
        className="max-h-[92vh] max-w-[92vw] rounded-[28px] object-contain shadow-2xl"
      />
    </div>
  </div>
) : null}
      {showPaywallModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
            <h3 className="text-[24px] font-black text-neutral-900">
              Like what we created?
            </h3>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Choose a credit package and continue creating banners, posts and videos.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => router.push("/en/pricing")}
                className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white"
              >
                View pricing
              </button>

              <button
                type="button"
                onClick={() => setShowPaywallModal(false)}
                className="text-sm text-neutral-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
export default function EnglishDashboardPage() {
  return (
    <Suspense fallback={null}>
      <EnglishDashboardPageContent />
    </Suspense>
  );
}
