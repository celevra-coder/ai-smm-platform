"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type VideoOrder = {
  id: string;
  service_title: string;
  description: string;
  price_eur: number;
  status: string;
  payment_status: string;
  final_video_url: string | null;
  created_at: string;
};

type Revision = {
  id: string;
  order_id: string;
  message: string;
  file_url: string | null;
  status?: string;
  created_at: string;
};

type ContactRequest = {
  id: string;
  message: string;
  uploaded_file_url: string | null;
  admin_reply: string | null;
  created_at: string;
};
type GenerationLog = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  generation_type: string;
  input_text: string | null;
  output_text: string | null;
  metadata?: any | null;
final_banner_url?: string | null;
  created_at: string;
};

export default function AdminVideoOrdersPage() {
  const [orders, setOrders] = useState<VideoOrder[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [generationLogs, setGenerationLogs] = useState<GenerationLog[]>([]);
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openEmojiForMessageId, setOpenEmojiForMessageId] = useState<string | null>(null);

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
  const [activeTab, setActiveTab] = useState<"orders" | "revisions" | "messages" | "generations">("orders");
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newRevisionsCount, setNewRevisionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    const supabase = createClient();

    const { data: ordersData, error: ordersError } = await supabase
      .from("video_orders")
      .select("*")
      .order("created_at", { ascending: false });

           if (ordersError) console.error("ADMIN VIDEO ORDERS LOAD ERROR:", ordersError);     

    const { data: revisionsData, error: revisionsError } = await supabase
      .from("video_revisions")
      .select("*")
      .order("created_at", { ascending: false });

    if (revisionsError) console.error(revisionsError);

    const { data: contactData, error: contactError } = await supabase
      .from("contact_requests")
      .select("*")
      .order("created_at", { ascending: false });
      const { data: logsData, error: logsError } = await supabase
  .from("generation_logs")
  .select(
  "id,user_id,user_email,generation_type,input_text,output_text,metadata,created_at,final_banner_url"
)
  .order("created_at", { ascending: false })
  .limit(10);

if (logsError) {
  console.log("GENERATION LOGS LOAD ERROR:", {
    message: logsError.message,
    code: logsError.code,
    details: logsError.details,
    hint: logsError.hint,
  });
}

  console.log("ADMIN CONTACT DEBUG:", {
  contactData,
  contactError,
});

if (contactError) console.error(contactError);

    setOrders((ordersData || []).filter((order) => order.payment_status === "paid"));
    setRevisions(revisionsData || []);
    setContactRequests(contactData || []);
    if (!logsError && logsData) {
  setGenerationLogs(logsData);
}
    

    setNewOrdersCount((ordersData || []).filter((o) => o.status === "paid").length);
    setNewRevisionsCount((revisionsData || []).filter((r) => r.status === "pending").length);

    setLoading(false);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const ADMIN_ID = "ef8f7aef-055b-4977-ab77-0430f42b500e";

      if (user.id !== ADMIN_ID) {
        window.location.href = "/";
        return;
      }

      await loadOrders();
    };

    void checkAdmin();

    const interval = setInterval(() => {
      void loadOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);
  const handleOpenMessagesTab = async () => {
    setActiveTab("messages");

    const supabase = createClient();

    const { error } = await supabase
      .from("contact_requests")
      .update({
        status: "read",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "pending")
      .is("admin_reply", null);

    if (error) {
      console.error("ADMIN MARK MESSAGES READ ERROR:", error);
      return;
    }

    await loadOrders();
    window.dispatchEvent(new Event("notifications-updated"));
  };
  const handleUpload = async (orderId: string, file: File) => {
    const supabase = createClient();
    const filePath = `videos/${orderId}-${Date.now()}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(filePath, file);

    if (uploadError) {
      alert("Грешка при качване");
      console.error(uploadError);
      return;
    }

    const { data } = supabase.storage.from("videos").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("video_orders")
      .update({
        final_video_url: publicUrl,
        status: "delivered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      alert("Грешка при запис");
      console.error(updateError);
      return;
    }

    alert("Видео качено успешно");
    await loadOrders();
  };

    const updateOrderStatus = async (orderId: string, status: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("video_orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      alert("Грешка при смяна на статус");
      console.error(error);
      return;
    }

    await loadOrders();
  };

  const handleReplyToContact = async (messageId: string) => {
    const reply = replyDrafts[messageId]?.trim();

    if (!reply) {
      alert("Напиши отговор.");
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("contact_requests")
      .update({
        admin_reply: reply,
        user_seen: false,
        status: "answered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) {
      alert("Грешка при изпращане на отговора.");
      console.error(error);
      return;
    }

    setReplyDrafts((current) => ({
      ...current,
      [messageId]: "",
    }));

    alert("Отговорът е изпратен.");
    await loadOrders();
  };

  if (loading) {
    return <div className="p-10">Зареждане...</div>;
  }

  return (
        <main
      onClick={() => setOpenEmojiForMessageId(null)}
      className="min-h-screen bg-[#f5f1ec] p-10"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-black">Админ панел</h1>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`rounded-full px-5 py-2 text-sm font-bold ${
              activeTab === "orders" ? "bg-black text-white" : "border bg-white"
            }`}
          >
            Поръчки {newOrdersCount > 0 ? `(${newOrdersCount})` : ""}
          </button>

          <button
            onClick={() => setActiveTab("revisions")}
            className={`rounded-full px-5 py-2 text-sm font-bold ${
              activeTab === "revisions" ? "bg-black text-white" : "border bg-white"
            }`}
          >
            Корекции {newRevisionsCount > 0 ? `(${newRevisionsCount})` : ""}
          </button>

          <button
            onClick={() => void handleOpenMessagesTab()}
            className={`rounded-full px-5 py-2 text-sm font-bold ${
              activeTab === "messages" ? "bg-black text-white" : "border bg-white"
            }`}
          >
            Съобщения {contactRequests.filter((msg: any) => msg.status === "pending").length > 0 ? `(${contactRequests.filter((msg: any) => msg.status === "pending").length})` : ""}
          </button>
          <button
  onClick={() => setActiveTab("generations")}
  className={`rounded-full px-5 py-2 text-sm font-bold ${
    activeTab === "generations" ? "bg-black text-white" : "border bg-white"
  }`}
>
  Генерации {generationLogs.length > 0 ? `(${generationLogs.length})` : ""}
</button>
        </div>
      </div>

      {activeTab === "orders" ? (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-[24px] border border-black/10 bg-white p-6"
            >
              <h2 className="text-xl font-black">{order.service_title}</h2>

              <p className="mt-2 text-sm text-neutral-600">
                {order.price_eur}€ • {order.status} • {order.payment_status}
              </p>

              <p className="mt-3 text-sm">{order.description}</p>

              {order.final_video_url ? (
                <video
                  src={order.final_video_url}
                  controls
                  className="mt-4 max-h-[300px] rounded-[18px] bg-black"
                />
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => void updateOrderStatus(order.id, "in_progress")}
                  className="rounded-full bg-yellow-500 px-4 py-2 text-xs font-bold text-white"
                >
                  In Progress
                </button>

                <button
                  onClick={() => void updateOrderStatus(order.id, "delivered")}
                  className="rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white"
                >
                  Delivered
                </button>
              </div>

              <div className="mt-4">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(order.id, file);
                  }}
                />
              </div>

              <div className="mt-4 space-y-3">
                {revisions
                  .filter((rev) => rev.order_id === order.id)
                  .map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-[16px] border border-yellow-200 bg-yellow-50 p-4"
                    >
                      <p className="text-sm font-bold text-yellow-800">Корекция</p>
                      <p className="mt-2 text-sm text-neutral-700">{rev.message}</p>

                      {rev.file_url ? (
                        <a
                          href={rev.file_url}
                          target="_blank"
                          className="mt-2 block text-sm font-bold underline"
                        >
                          Виж файл
                        </a>
                      ) : null}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "revisions" ? (
        <div className="grid gap-4">
          {revisions.length ? (
            revisions.map((rev) => (
              <div key={rev.id} className="rounded-[20px] border bg-white p-5">
                <p className="text-sm text-neutral-500">Order: {rev.order_id}</p>
                <p className="mt-2 text-sm">{rev.message}</p>

                {rev.file_url ? (
                  <a
                    href={rev.file_url}
                    target="_blank"
                    className="mt-2 block font-bold underline"
                  >
                    Виж файл
                  </a>
                ) : null}
              </div>
            ))
          ) : (
            <p>Няма корекции</p>
          )}
        </div>
      ) : null}

            {activeTab === "messages" ? (
        <div className="grid gap-4">
          {contactRequests.length ? (
            contactRequests.map((msg) => (
              <div key={msg.id} className="rounded-[20px] border bg-white p-5">
                <p className="text-sm text-neutral-500">
                  {new Date(msg.created_at).toLocaleString()}
                </p>

                <p className="mt-2 text-sm">{msg.message}</p>

                {msg.uploaded_file_url ? (
                  <a
                    href={msg.uploaded_file_url}
                    target="_blank"
                    className="mt-2 block font-bold underline"
                  >
                    Виж файл
                  </a>
                ) : null}
                
                

                {msg.admin_reply ? (
                  <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm text-green-900">
                    <p className="font-bold">Твоят отговор:</p>
                    <p className="mt-1">{msg.admin_reply}</p>
                  </div>
                ) : null}

                                <div className="relative mt-4">
                  <textarea
                    value={replyDrafts[msg.id] || ""}
                    onChange={(e) =>
                      setReplyDrafts((current) => ({
                        ...current,
                        [msg.id]: e.target.value,
                      }))
                    }
                    placeholder="Напиши отговор към потребителя..."
                    className="w-full rounded-2xl border border-black/10 bg-[#faf8f6] p-4 pr-12 text-sm outline-none"
                    rows={4}
                  />

                                    <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenEmojiForMessageId((current) =>
                        current === msg.id ? null : msg.id
                      );
                    }}
                    className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl shadow-sm"
                  >
                    😊
                  </button>

                  {openEmojiForMessageId === msg.id ? (
                                        <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-14 right-0 z-20 grid grid-cols-6 gap-2 rounded-2xl border bg-white p-3 shadow-xl"
                    >
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setReplyDrafts((current) => ({
                              ...current,
                              [msg.id]: `${current[msg.id] || ""}${emoji}`,
                            }));
                            setOpenEmojiForMessageId(null);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-xl hover:bg-[#f5f1ec]"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => void handleReplyToContact(msg.id)}
                  className="mt-3 rounded-full bg-black px-5 py-2 text-sm font-bold text-white"
                >
                  Изпрати отговор
                </button>
              </div>
            ))
          ) : (
            <p>Няма съобщения</p>
          )}
        </div>
      ) : null}
      {activeTab === "generations" ? (
  <div className="grid gap-4">
    {generationLogs.length ? (
      generationLogs.map((log) => {
  const metadata =
    log.metadata && typeof log.metadata === "object" ? log.metadata : {};

  const finalBannerUrl =
    metadata.final_banner_url ||
    metadata.banner_url ||
    metadata.image_url ||
    log.final_banner_url ||
    "";

  const videoUrl =
    metadata.video_url ||
    metadata.final_video_url ||
    "";

  return (
    <div key={log.id} className="rounded-[20px] border bg-white p-5">
      <p className="text-xs text-neutral-500">
        {new Date(log.created_at).toLocaleString()} • {log.generation_type}
      </p>

      <p className="mt-2 text-sm font-bold">
        {log.user_email || "Без имейл"}
      </p>

      <div className="mt-4 rounded-2xl bg-[#faf8f6] p-4">
        <p className="text-xs font-bold uppercase text-neutral-500">
          Вход
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm">
          {log.input_text || "Няма вход"}
        </p>
      </div>

      

      <div className="mt-4 rounded-2xl bg-[#f0fdf4] p-4">
        <p className="text-xs font-bold uppercase text-green-700">
          Резултат
        </p>

        <p className="mt-2 whitespace-pre-wrap text-sm">
          {log.output_text || "Няма резултат"}
        </p>

        {finalBannerUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border bg-white p-3">
            <img
              src={finalBannerUrl}
              alt="Generated banner"
              className="w-full max-w-[420px] rounded-2xl object-contain"
            />
          </div>
        ) : null}

        {log.metadata?.video_url ? (
  <div className="mt-4 overflow-hidden rounded-2xl border bg-black p-3">
    <p className="mb-2 text-xs font-bold uppercase text-neutral-400">
      Видео
    </p>

    <video
      src={log.metadata.video_url}
      controls
      playsInline
      preload="metadata"
      className="max-h-[520px] w-full max-w-[320px] rounded-2xl bg-black object-contain"
    />
  </div>
) : null}
      </div>
    </div>
  );
})
    ) : (
      <p>Няма генерации</p>
    )}
  </div>
) : null}
    </main>
  );
}