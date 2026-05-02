"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

    async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const friendlyMessage =
        error.message === "Invalid login credentials"
          ? "Грешен имейл или парола. Провери данните и опитай отново."
          : "Неуспешен вход. Моля, опитай отново.";

      setMessage(friendlyMessage);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage("Неуспешен вход с Google. Моля, опитай отново.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border">
        <h1 className="text-2xl font-bold mb-2">Вход</h1>
        <p className="text-sm text-gray-500 mb-6">
          Влез в платформата си
        </p>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mb-4 w-full rounded-xl border bg-white py-3 font-medium text-black hover:bg-gray-50 disabled:opacity-50"
        >
          Вход с Google
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">или</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
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
            {loading ? "Влизане..." : "Вход"}
          </button>
        </form>

<div className="mt-3 text-right">
  <Link
    href="/forgot-password"
    className="text-sm text-gray-500 hover:text-black"
  >
    Забравена парола?
  </Link>
</div>

{message && (
  <p className="mt-4 text-sm text-red-600">{message}</p>
)}

        <p className="mt-6 text-sm text-gray-600">
          Нямаш акаунт?{" "}
          <Link href="/register" className="font-semibold text-black">
            Регистрация
          </Link>
        </p>
      </div>
    </main>
  );
}