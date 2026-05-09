"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

function VideoRevisionPageContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id");

  const [message, setMessage] = useState("");
  
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