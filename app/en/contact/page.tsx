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
    if (!user) {
  alert("You need to be logged in.");
  return;
}

    if (!user) return;

    const { data, error } = await supabase
      .from("contact_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

        setMessages(data || []);

    const { data: replyFilesData, error: replyFilesError } = await supabase
      .from("contact_reply_files")
      .select("*")
      .eq("user_id", user.id);

    if (replyFilesError) {
      console.error("CONTACT REPLY FILES LOAD ERROR:", replyFilesError);
    }

    const replyFilesMap: Record<string, any[]> = {};

    (replyFilesData || []).forEach((file) => {
      if (!replyFilesMap[file.contact_request_id]) {
        replyFilesMap[file.contact_request_id] = [];
      }

      replyFilesMap[file.contact_request_id].push(file);
    });

    setContactReplyFiles(replyFilesMap);
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
const [contactReplyFiles, setContactReplyFiles] = useState<Record<string, any[]>>({});
  const [files, setFiles] = useState<File[]>([]);
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

  if (!user) {
    alert("You need to be logged in.");
    return;
  }

  if (!message.trim()) {
    alert("Please write a message.");
    return;
  }

  let firstFileUrl: string | null = null;

  const { data: contactRequest, error } = await supabase
    .from("contact_requests")
    .insert({
      user_id: user.id,
      subject: "General inquiry",
      message,
      uploaded_file_url: null,
      admin_reply: null,
      status: "pending",
      user_seen: true,
    })
    .select("id")
    .single();

  if (error || !contactRequest) {
    console.error("CONTACT INSERT ERROR:", error);
    alert("Error while sending the message.");
    return;
  }

    const uploadedFiles: any[] = [];

  for (const file of files) {
    const fileExtension = file.name.split(".").pop() || "file";
    const filePath = `contact/${contactRequest.id}/${crypto.randomUUID()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      console.error("CONTACT FILE UPLOAD ERROR:", uploadError);
      alert(`The message was sent, but a file could not be uploaded: ${uploadError.message}`);
      return;
    }

    const { data } = supabase.storage.from("videos").getPublicUrl(filePath);
    const fileUrl = data.publicUrl;

    if (!firstFileUrl) {
      firstFileUrl = fileUrl;
    }

    uploadedFiles.push({
      contact_request_id: contactRequest.id,
      user_id: user.id,
      file_url: fileUrl,
      file_name: file.name,
      file_type: file.type || fileExtension,
    });
  }

  if (uploadedFiles.length > 0) {
    const { error: fileInsertError } = await supabase
      .from("contact_request_files")
      .insert(uploadedFiles);

    if (fileInsertError) {
      console.error("CONTACT FILE INSERT ERROR:", fileInsertError);
      alert(`The files were uploaded, but could not be saved to the message: ${fileInsertError.message}`);
      return;
    }
  }

  if (firstFileUrl) {
    await supabase
      .from("contact_requests")
      .update({ uploaded_file_url: firstFileUrl })
      .eq("id", contactRequest.id);
  }

  setSuccessMessage("Your message was sent successfully ✨. Check your account for a reply from our team.");
  setMessage("");
  setFiles([]);
};

  return (
        <main
      onClick={() => setShowEmojiPicker(false)}
      className="min-h-screen bg-[#f5f1ec] p-6"
    >
      <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-6">
        <h1 className="text-2xl font-black">Contact us</h1>
        


        <p className="mt-2 text-sm text-neutral-600">
          Have a question before ordering or need help with something? Send us a message.
        </p>

                <div className="relative mt-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
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

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-black/15 bg-[#fcfaf7] px-5 py-6 text-center transition hover:bg-[#f3eee7]">
  <span className="text-3xl">📎</span>
  <span className="mt-2 text-sm font-black text-neutral-950">
    Attach files
  </span>
  <span className="mt-1 text-xs text-neutral-500">
    You can select one or multiple files
  </span>

  <input
    type="file"
    multiple
    className="hidden"
    onChange={(e) => {
  const selectedFiles = Array.from(e.target.files || []);

  setFiles((current) => {
    const nextFiles = [...current, ...selectedFiles];

    const uniqueFiles = nextFiles.filter(
      (file, index, array) =>
        index ===
        array.findIndex(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified
        )
    );

    if (uniqueFiles.length > 5) {
      alert("You can attach up to 5 files.");
      return uniqueFiles.slice(0, 5);
    }

    return uniqueFiles;
  });

  e.target.value = "";
}}
  />
</label>

{files.length ? (
  <div className="mt-3 rounded-2xl bg-[#f8f5f1] p-3 text-sm">
    <p className="font-bold">Selected files:</p>

    <ul className="mt-2 list-inside list-disc">
      {files.map((file) => (
        <li key={`${file.name}-${file.size}`}>{file.name}</li>
      ))}
    </ul>
  </div>
) : null}
                <button
  onClick={handleSubmit}
  className="mt-6 w-full rounded-full bg-black px-6 py-3 text-white font-bold transition-all duration-150 hover:scale-105 active:scale-95 active:opacity-80"
>
  Send message
</button>

        <div className="mt-8 space-y-4">
  {readyVideos.map((video) => (
    <div
      key={video.id}
      className="rounded-[20px] border border-green-200 bg-green-50 p-4"
    >
      <p className="text-sm font-black text-green-900">
        🎉 Your video is ready.
      </p>

      <p className="mt-2 text-sm text-green-800">
        Go to your account to view it.
      </p>

      <a
        href="/en/account"
        className="mt-3 inline-flex rounded-full bg-green-700 px-4 py-2 text-xs font-bold text-white"
      >
        Go to account
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
                  View file
                </a>
              ) : null}

                            {msg.admin_reply || contactReplyFiles[msg.id]?.length ? (
  <div className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-900">
    <p className="font-bold">Reply from our team:</p>

                  {msg.admin_reply ? <p>{msg.admin_reply}</p> : null}

                  {contactReplyFiles[msg.id]?.length ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold uppercase text-green-800">
                        Attached files
                      </p>

                      {contactReplyFiles[msg.id].map((file) => (
                        <a
                          key={file.id}
                          href={file.file_url}
                          target="_blank"
                          download={file.file_name || true}
                          className="inline-flex rounded-full bg-green-700 px-4 py-2 text-xs font-bold text-white"
                        >
                          Download file: {file.file_name || "File"}
                        </a>
                      ))}
                    </div>
                  ) : null}
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
        Message sent
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