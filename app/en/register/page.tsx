"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EnglishRegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleGoogleRegister() {
    const pendingPlan = localStorage.getItem("pending_checkout_plan");
    const pendingProvider =
      localStorage.getItem("pending_checkout_provider") || "paypal";
document.cookie = "ai_smm_auth_next=/en; path=/; max-age=600";

await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      "/en"
    )}`,
    queryParams: {
      access_type: "offline",
      prompt: "consent",
    },
  },
});

    if (pendingPlan) {
      localStorage.setItem("pending_checkout_plan", pendingPlan);
      localStorage.setItem("pending_checkout_provider", pendingProvider);
      localStorage.setItem("pending_checkout_locale", "en");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/en`,
      },
    });

    if (error) {
      const friendlyMessage = error.message.includes("Password should be")
        ? "Password must be at least 6 characters."
        : error.message.includes("User already registered")
        ? "This email is already registered."
        : "Registration failed. Please check your details and try again.";

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
      localStorage.removeItem("pending_checkout_locale");

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

      setMessage(
        "Registration was successful, but we could not open checkout. Please choose your package again."
      );
      setLoading(false);
      return;
    }

    setLoading(false);

    setTimeout(() => {
      router.push("/en");
      router.refresh();
    }, 800);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f1ec] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-black/10 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <Link href="/en" className="text-sm font-semibold text-neutral-500">
  ← Back to home
</Link>

        <h1 className="mt-6 text-3xl font-black tracking-tight text-neutral-950">
          Create your account
        </h1>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Start creating banners, short videos and content ideas for your
          business.
        </p>

        <button
          type="button"
          onClick={handleGoogleRegister}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 font-medium text-neutral-900 transition hover:bg-neutral-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5"
          >
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 15.3 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 10-2 13.5-5.3l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6.2 7.1l6.2 5.2C39.2 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"
            />
          </svg>

          Continue with Google
        </button>

        <form onSubmit={handleRegister} className="mt-5 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
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
            className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        {message === "success" && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-lg font-semibold text-green-700">
              Welcome to AI SMM Studio!
            </p>
            <p className="mt-1 text-sm text-green-600">
              Your registration was successful. Redirecting...
            </p>
          </div>
        )}

        {message === "user-exists" && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-lg font-semibold text-red-700">
              This email is already registered
            </p>
            <p className="mt-1 text-sm text-red-600">
              Sign in instead or use password reset.
            </p>
          </div>
        )}

        {message && message !== "success" && message !== "user-exists" && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm font-medium text-red-700">{message}</p>
          </div>
        )}

        <p className="mt-6 text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/en/login" className="font-semibold text-black">
  Sign in
</Link>
        </p>
      </div>
    </main>
  );
}