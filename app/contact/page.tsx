"use client";
<style jsx global>{`
  @keyframes scaleIn {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`}</style>

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function ContactPage() {
      useEffect(() => {
  const loadMessages = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("contact_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setMessages(data || []);
    const { data: readyVideosData, error: readyVideosError } = await supabase
  .from("video_orders")
  .select("id, service_title, created_at")
  .eq("user_id", user.id)
  .eq("status", "delivered")
  .eq("user_notified", false)
  .order("created_at", { ascending: false });

if (readyVideosError) {
  console.error("READY VIDEOS LOAD ERROR:", readyVideosError);
} else {
  setReadyVideos(readyVideosData || []);
}

    await supabase
      .from("contact_requests")
      .update({ user_seen: true })
      .eq("user_id", user.id)
      .eq("user_seen", false)
      .eq("status", "answered")
      .not("admin_reply", "is", null)
      .neq("admin_reply", "");
      await supabase
  .from("video_orders")
  .update({ user_notified: true })
  .eq("user_id", user.id)
  .eq("status", "delivered")
  .eq("user_notified", false);

    window.dispatchEvent(new Event("notifications-updated"));
  };

  void loadMessages();
}, []);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
const [readyVideos, setReadyVideos] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
    const [successMessage, setSuccessMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojis = [
  "😊","🙂","😁","😎","😍","😘","😇","🥰",
  "🔥","✨","💥","⭐","🌟",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍",
  "🙏","👏","👍","👎","🤝",
  "💡","🎯","📌","📈","📊",
  "📸","🎥","🎬","🎶",
  "😐","😕","😞","😢","😭",
  "😡","😠","🤯","😤",
  "❗","❓","⚠️"
];
  

  const handleSubmit = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!message.trim()) {
      alert("Напиши съобщение.");
      return;
    }

    let fileUrl: string | null = null;

    if (file) {
      const filePath = `contact/${Date.now()}`;

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

    const { error } = await supabase.from("contact_requests").insert({
  user_id: user?.id || null,
  subject: "Общо запитване",
  message,
  uploaded_file_url: fileUrl,
  admin_reply: null,
  status: "pending",
  user_seen: true,
});

    if (error) {
  console.error("CONTACT INSERT ERROR:", error);
  alert("Грешка при изпращане.");
  return;
}

    setSuccessMessage("Съобщението беше изпратено успешно ✨.Следете профила си за отговор от екипа");
    setMessage("");
    setFile(null);
    setFileName("");
  };

  return (
        <main
      onClick={() => setShowEmojiPicker(false)}
      className="min-h-screen bg-[#f5f1ec] p-6"
    >
      <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-6">
        <h1 className="text-2xl font-black">Свържи се с нас</h1>
        


        <p className="mt-2 text-sm text-neutral-600">
          Имаш въпрос преди поръчка или нещо не е ясно? Пиши ни.
        </p>

                <div className="relative mt-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Напиши въпроса си..."
            className="w-full rounded-[20px] border p-4 pr-12"
            rows={6}
          />

                    <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker((v) => !v);
            }}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f1ec] text-xl"
          >
            😊
          </button>

          {showEmojiPicker ? (
                        <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-14 right-0 z-20 grid grid-cols-6 gap-2 rounded-2xl border bg-white p-3 shadow-xl"
            >
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setMessage((prev) => `${prev}${emoji}`);
                    setShowEmojiPicker(false);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-xl hover:bg-[#f5f1ec]"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
        </div>

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
  className="mt-6 w-full rounded-full bg-black px-6 py-3 text-white font-bold transition-all duration-150 hover:scale-105 active:scale-95 active:opacity-80"
>
  Изпрати съобщение
</button>

        <div className="mt-8 space-y-4">
  {readyVideos.map((video) => (
    <div
      key={video.id}
      className="rounded-[20px] border border-green-200 bg-green-50 p-4"
    >
      <p className="text-sm font-black text-green-900">
        🎉 Видеото ти е готово.
      </p>

      <p className="mt-2 text-sm text-green-800">
        Посети профила си, за да го видиш.
      </p>

      <a
        href="/account"
        className="mt-3 inline-flex rounded-full bg-green-700 px-4 py-2 text-xs font-bold text-white"
      >
        Към профила
      </a>
    </div>
  ))}

  {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-[20px] border border-black/10 bg-[#faf8f6] p-4"
            >
              <p className="text-xs text-neutral-500">
                {new Date(msg.created_at).toLocaleString()}
              </p>

              <p className="mt-2 text-sm text-neutral-900">{msg.message}</p>

              {msg.uploaded_file_url ? (
                <a
                  href={msg.uploaded_file_url}
                  target="_blank"
                  className="mt-2 block text-sm font-bold underline"
                >
                  Виж файл
                </a>
              ) : null}

              {msg.admin_reply ? (
                <div className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-900">
                  <p className="font-bold">Отговор от екипа:</p>
                  <p>{msg.admin_reply}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {successMessage && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="animate-[scaleIn_.3s_ease] rounded-[28px] bg-white p-8 shadow-2xl max-w-sm w-full text-center">
      
      <div className="text-4xl mb-3">✅</div>

      <h2 className="text-xl font-black">
        Успешно изпратено
      </h2>

      <p className="mt-2 text-sm text-neutral-600">
        {successMessage}
      </p>

      <button
  onClick={() => setSuccessMessage("")}
  className="mt-6 w-full rounded-full bg-black px-5 py-3 text-white font-bold transition-all duration-150 hover:scale-105 active:scale-95 active:opacity-80"
>
  OK
</button>
    </div>
  </div>
)}
    </main>
  );
}