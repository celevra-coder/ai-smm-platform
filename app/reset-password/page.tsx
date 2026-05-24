"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
const [isReady, setIsReady] = useState(false);
useEffect(() => {
  const handleRecovery = async () => {
    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.log("RESET EXCHANGE ERROR:", error);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setIsReady(true);
          setMessage("");
          return;
        }

        setMessage("Линкът за смяна на парола е изтекъл или невалиден.");
        setIsReady(false);
        return;
      }

      setIsReady(true);
      setMessage("");
      return;
    }

    const hash = window.location.hash;

    if (hash) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          setMessage("Линкът е изтекъл или невалиден.");
          setIsReady(false);
          return;
        }

        setIsReady(true);
        return;
      }
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      router.push("/");
      router.refresh();
      return;
    }

    setMessage("Линкът за смяна на парола е невалиден.");
    setIsReady(false);
  };

  void handleRecovery();
}, [supabase, router]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Паролата е успешно сменена.");

    setTimeout(() => {
  router.push("/");
  router.refresh();
}, 2000);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border">
        <h1 className="text-2xl font-bold mb-2">
  {isReady ? "Нова парола" : "Невалиден линк"}
</h1>
<p className="text-sm text-gray-500 mb-6">
  {isReady
    ? "Въведи новата си парола"
    : "Заяви нов линк за възстановяване на парола."}
</p>

        {isReady ? (
<form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Нова парола"
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
            {loading ? "Запазване..." : "Запази новата парола"}
          </button>
                </form>
        ) : null}

        {message && (
          <p className="mt-4 text-sm text-center text-green-600">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}