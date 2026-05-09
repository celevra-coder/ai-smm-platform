"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

function VideoRevisionPageContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id");

  const [message, setMessage] = useState("");
const [hasExistingRevision, setHasExistingRevision] = useState(false);
const [checkingRevision, setCheckingRevision] = useState(true);
const [submitting, setSubmitting] = useState(false);
useEffect(() => {
  const checkExistingRevision = async () => {
    if (!orderId) {
      setCheckingRevision(false);
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCheckingRevision(false);
      return;
    }

    const { data, error } = await supabase
      .from("video_revisions")
      .select("id")
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .limit(1);

    if (error) {
      console.error("CHECK EXISTING REVISION ERROR:", error);
      setCheckingRevision(false);
      return;
    }

    setHasExistingRevision((data || []).length > 0);
    setCheckingRevision(false);
  };

  void checkExistingRevision();
}, [orderId]);

  const handleSubmit = async () => {
  if (submitting) return;
  if (hasExistingRevision) {
  alert("Вече сме изпълнили поисканата безплатна корекция. За допълнителни корекции се свържи с екипа ни.");
  return;
}

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
        {checkingRevision ? (
  <p className="mt-4 text-sm text-neutral-500">Проверяваме корекциите...</p>
) : hasExistingRevision ? (
  <div className="mt-4 rounded-[20px] border border-yellow-200 bg-yellow-50 p-4">
    <p className="text-sm font-bold text-yellow-900">
      Вече сме изпълнили една безплатна корекция по тази поръчка.
    </p>

    <p className="mt-2 text-sm text-yellow-800">
      За допълнителни корекции се свържи с екипа ни, за да уточним цена и срок.
    </p>

    <Link
      href="/contact"
      className="mt-4 inline-flex rounded-full bg-black px-5 py-3 text-sm font-bold text-white"
    >
      Свържи се с нас
    </Link>
  </div>
) : null}
{!checkingRevision && !hasExistingRevision ? (
  <>
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
          </>
) : null}
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