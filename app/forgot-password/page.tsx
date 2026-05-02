"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
setMessage("");

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});

if (error) {
  setMessage("Не успяхме да изпратим линк. Провери имейла и опитай отново.");
  setLoading(false);
  return;
}

setMessage("Изпратихме ти имейл за смяна на паролата. Провери и папка Спам.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border">
        <h1 className="text-2xl font-bold mb-2">
          Забравена парола
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Въведи имейла си и ще ти изпратим линк за нова парола
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="Имейл"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black text-white py-3 font-medium disabled:opacity-50"
          >
            {loading ? "Изпращане..." : "Изпрати линк"}
          </button>
        </form>

        {message && (
  <p
    className={`mt-4 text-sm text-center ${
      message.includes("Не успяхме") ? "text-red-600" : "text-green-600"
    }`}
  >
    {message}
  </p>
)}

        <p className="mt-6 text-sm text-gray-600 text-center">
          Спомни си паролата?{" "}
          <Link href="/login" className="font-semibold text-black">
            Вход
          </Link>
        </p>
      </div>
    </main>
  );
}