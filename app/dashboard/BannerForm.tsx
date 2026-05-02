"use client";

import { useState } from "react";

export default function BannerForm() {
  const [keyword, setKeyword] = useState("");
  const [product, setProduct] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  async function handleGenerate() {
    try {
      setLoading(true);
      setMessage("");
      setBannerUrl("");
      setImageUrl("");

      const res = await fetch(
        "https://aogtdpiaagekwzyrazyf.supabase.co/functions/v1/generate-baner",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
          },
          body: JSON.stringify({
            keyword,
            product,
            logo_url: logoUrl || null,
          }),
        }
      );

      const rawText = await res.text();

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { error: rawText };
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || rawText || "Грешка при генериране");
      }

      setMessage("Банерът е генериран успешно.");
      setBannerUrl(data?.banner_url || "");
      setImageUrl(data?.image_url || "");
    } catch (err: any) {
      setMessage(err?.message || "Нещо се обърка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Създай банер</h2>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Ключова дума"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full rounded-xl border px-4 py-3 outline-none"
        />

        <input
          type="text"
          placeholder="Продукт"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="w-full rounded-xl border px-4 py-3 outline-none"
        />

        <input
          type="text"
          placeholder="Logo URL (по желание)"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="w-full rounded-xl border px-4 py-3 outline-none"
        />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-xl bg-black px-6 py-3 text-white font-medium disabled:opacity-50"
        >
          {loading ? "Генериране..." : "Генерирай"}
        </button>

        {message && (
          <p className="text-sm text-gray-700 break-words">{message}</p>
        )}

        {imageUrl && (
          <div className="pt-4">
            <p className="mb-2 font-medium">AI изображение</p>
            <img
              src={imageUrl}
              alt="AI изображение"
              className="w-full rounded-2xl border"
            />
          </div>
        )}

        {bannerUrl && (
          <div className="pt-4">
            <p className="mb-2 font-medium">Готов банер</p>
            <img
              src={bannerUrl}
              alt="Готов банер"
              className="w-full rounded-2xl border"
            />
          </div>
        )}
      </div>
    </div>
  );
}
      