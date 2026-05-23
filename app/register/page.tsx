"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const supabase = createClient();
const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/`,
  },
});

    if (error) {
  const friendlyMessage =
    error.message.includes("Password should be")
      ? "Паролата трябва да е поне 6 символа."
      : error.message.includes("User already registered")
      ? "Този имейл вече е регистриран."
      : "Неуспешна регистрация. Моля, провери данните и опитай отново.";

  setMessage(friendlyMessage);
  setLoading(false);
  return;
}

if (data.user && data.user.identities?.length === 0) {
  setMessage("user-exists");
  setLoading(false);
  return;
}

setMessage("success");

const pendingPlan = localStorage.getItem("pending_checkout_plan");
const pendingProvider =
  localStorage.getItem("pending_checkout_provider") || "paypal";

if (pendingPlan) {
  localStorage.removeItem("pending_checkout_plan");
  localStorage.removeItem("pending_checkout_provider");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (!accessToken) {
    setLoading(false);
    router.push("/login");
    return;
  }

  const checkoutFunction =
  pendingProvider === "stripe"
    ? "create-stripe-checkout"
    : "create-paypal-checkout";

const res = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${checkoutFunction}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ plan: pendingPlan }),
    }
  );

  const checkoutData = await res.json().catch(() => null);

  if (res.ok && checkoutData?.url) {
    window.location.href = checkoutData.url;
    return;
  }

  setMessage("Регистрацията е успешна, но не успяхме да отворим плащането. Моля, избери пакета отново.");
  setLoading(false);
  return;
}

setLoading(false);

setTimeout(() => {
  router.push("/");
  router.refresh();
}, 800);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border">
        <h1 className="text-2xl font-bold mb-2">Регистрация</h1>
        <p className="text-sm text-gray-500 mb-6">
          Създай си акаунт
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Имейл"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            required
          />

          <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Парола"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full rounded-xl border px-4 py-3 pr-12 outline-none"
    required
  />

  <button
  type="button"
  onClick={() => setShowPassword((v) => !v)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
>
  {showPassword ? "🙈" : "👁️"}
</button>
</div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black text-white py-3 font-medium disabled:opacity-50"
          >
            {loading ? "Създаване..." : "Регистрация"}
          </button>
        </form>

        {message === "success" && (
  <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-4 text-center">
    <p className="text-lg font-semibold text-green-700">
      Добре дошъл в AI SMM Studio!
    </p>
    <p className="text-sm text-green-600 mt-1">
      Регистрацията е успешна. Пренасочваме те...
    </p>
  </div>
)}
{message === "user-exists" && (
  <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-center">
    <p className="text-lg font-semibold text-red-700">
      Този имейл вече е регистриран
    </p>
    <p className="text-sm text-red-600 mt-1">
      Влез в профила си или използвай „Забравена парола?“.
    </p>
  </div>
)}

        <p className="mt-6 text-sm text-gray-600">
          Вече имаш акаунт?{" "}
          <Link href="/login" className="font-semibold text-black">
            Вход
          </Link>
        </p>
      </div>
      {message && message !== "success" && message !== "user-exists" && (
  <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-center">
    <p className="text-sm font-medium text-red-700">
      {message}
    </p>
  </div>
)}
    </main>
  );
}