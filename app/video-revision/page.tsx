"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

function VideoRevisionPageContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id");

  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
  if (submitting) return;

  setSubmitting(true);

  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Трябва да влезеш в акаунта си.");
      return;
    }

    if (!orderId) {
      alert("Липсва номер на поръчка.");
      return;
    }

    if (!message.trim()) {
      alert("Опиши каква корекция искаш.");
      return;
    }

    const { data: revision, error: revisionError } = await supabase
      .from("video_revisions")
      .insert({
        order_id: orderId,
        user_id: user.id,
        message: message.trim(),
        file_url: null,
        status: "pending",
      })
      .select("id")
      .single();

    if (revisionError || !revision) {
      console.error("VIDEO REVISION INSERT ERROR:", revisionError);
      alert(`Грешка при изпращане: ${revisionError?.message || "няма запис"}`);
      return;
    }

    for (const file of files) {
      const fileExtension = file.name.split(".").pop() || "file";
      const filePath = `revisions/${orderId}/${revision.id}-${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        console.error("REVISION FILE UPLOAD ERROR:", uploadError);
        alert(`Корекцията е записана, но файл не се качи: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage.from("videos").getPublicUrl(filePath);
      const fileUrl = data.publicUrl;

      const { error: fileInsertError } = await supabase
        .from("video_revision_files")
        .insert({
          revision_id: revision.id,
          order_id: orderId,
          user_id: user.id,
          file_url: fileUrl,
          file_name: file.name,
          file_type: file.type || fileExtension,
        });

      if (fileInsertError) {
        console.error("REVISION FILE INSERT ERROR:", fileInsertError);
        alert(`Файлът се качи, но не се записа към корекцията: ${fileInsertError.message}`);
        return;
      }
    }

    alert("Корекцията е изпратена.");
    window.location.href = "/account";
  } finally {
    setSubmitting(false);
  }
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

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-black/15 bg-[#fcfaf7] px-5 py-8 text-center transition hover:bg-[#f3eee7]">
  <span className="text-3xl">📎</span>
  <span className="mt-2 text-sm font-black text-neutral-950">
    Качи файлове към корекцията
  </span>
  <span className="mt-1 text-xs text-neutral-500">
    Може да избереш няколко файла
  </span>

  <input
    type="file"
    multiple
    className="hidden"
    onChange={(e) => {
      setFiles(Array.from(e.target.files || []));
    }}
  />
</label>

        {files.length ? (
          <div className="mt-3 rounded-2xl bg-[#f8f5f1] p-3 text-sm">
            <p className="font-bold">Качени файлове:</p>

            <ul className="mt-2 list-inside list-disc">
              {files.map((file) => (
                <li key={`${file.name}-${file.size}`}>{file.name}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-black px-6 py-3 font-bold text-white disabled:opacity-60"
        >
          {submitting ? "Изпращане..." : "Изпрати корекция"}
        </button>
      </div>
    </main>
  );
}
export default function VideoRevisionPage() {
  return (
    <Suspense fallback={null}>
      <VideoRevisionPageContent />
    </Suspense>
  );
}