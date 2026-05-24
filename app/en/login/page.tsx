"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EnglishLoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function continuePendingCheckout(accessToken: string) {
    const pendingPlan = localStorage.getItem("pending_checkout_plan");
    const pendingProvider =
      localStorage.getItem("pending_checkout_provider") || "paypal";

    if (!pendingPlan) {
      router.push("/en");
      router.refresh();
      return;
    }

    localStorage.removeItem("pending_checkout_plan");
    localStorage.removeItem("pending_checkout_provider");
    localStorage.removeItem("pending_checkout_locale");

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
      "Login was successful, but we could not open checkout. Please choose your package again."
    );
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const friendlyMessage =
        error.message === "Invalid login credentials"
          ? "Wrong email or password. Please check your details and try again."
          : "Login failed. Please try again.";

      setMessage(friendlyMessage);
      setLoading(false);
      return;
    }

    const accessToken = data.session?.access_token;

    if (!accessToken) {
      setMessage("Login failed. Please try again.");
      setLoading(false);
      return;
    }

    await continuePendingCheckout(accessToken);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setMessage("");

    const pendingPlan = localStorage.getItem("pending_checkout_plan");
    const pendingProvider =
      localStorage.getItem("pending_checkout_provider") || "paypal";

    if (pendingPlan) {
      localStorage.setItem("pending_checkout_plan", pendingPlan);
      localStorage.setItem("pending_checkout_provider", pendingProvider);
      localStorage.setItem("pending_checkout_locale", "en");
    }

    document.cookie = "ai_smm_auth_next=/en; path=/; max-age=600";

const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      "/en"
    )}`,
  },
});

    if (error) {
      setMessage("Google login failed. Please try again.")
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f1ec] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-black/10 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <Link href="/en" className="text-sm font-semibold text-neutral-500">
  ← Back to home
</Link>

        <h1 className="mt-6 text-3xl font-black tracking-tight text-neutral-950">
          Sign in
        </h1>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Continue creating banners, short videos and social media content for
          your business.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border bg-white py-3 font-medium text-black hover:bg-gray-50 disabled:opacity-50"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="h-5 w-5"
            />
            Continue with Google
          </button>
        </div>

        <div className="mt-3 text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-gray-500 hover:text-black"
          >
            Forgot password?
          </Link>
        </div>

        {message && <p className="mt-4 text-sm text-red-600">{message}</p>}

        <p className="mt-6 text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/en/register" className="font-semibold text-black">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}