"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function VideoRevisionPage() {
  const params = useSearchParams();
  const orderId = params.get("order_id");

  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Трябва да влезеш в акаунта си.");
      return;
    }

    if (!message.trim()) {
      alert("Опиши каква корекция искаш.");
      return;
    }

    let fileUrl: string | null = null;

    if (file) {
      const filePath = `revisions/${orderId}-${Date.now()}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, file);

      if (uploadError) {
        alert("Грешка при качване на файл");
        return;
      }

      const { data } = supabase.storage.from("videos").getPublicUrl(filePath);
      fileUrl = data.publicUrl;
    }

    const { error } = await supabase.from("video_revisions").insert({
      order_id: orderId,
      user_id: user.id,
      message,
      file_url: fileUrl,
    });

    if (error) {
      alert("Грешка при изпращане.");
      return;
    }

    alert("Корекцията е изпратена.");
    window.location.href = "/account";
  };

  return (
    <main className="min-h-screen bg-[#f5f1ec] p-6">
      <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-6">
        <h1 className="text-2xl font-black">Искам корекция</h1>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Опиши какво искаш да променим..."
          className="mt-4 w-full rounded-[20px] border p-4"
          rows={6}
        />

        <input
          type="file"
          className="mt-4"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setFileName(f.name);
            }
          }}
        />

        {fileName && (
          <p className="text-sm mt-2">Файл: {fileName}</p>
        )}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full rounded-full bg-black px-6 py-3 text-white font-bold"
        >
          Изпрати корекция
        </button>
      </div>
    </main>
  );
}