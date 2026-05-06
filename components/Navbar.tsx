"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
const [unreadMessageIds, setUnreadMessageIds] = useState<string[]>([]);
const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
  const checkUser = async () => {
    const supabase = createClient();

    const {
  data: { session },
} = await supabase.auth.getSession();

const user = session?.user || null;

    setIsLoggedIn(Boolean(user));

    if (!user) {
      setCredits(null);
      setUnreadMessagesCount(0);
      return;
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("credits")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("NAVBAR CREDITS DEBUG", {
      userId: user.id,
      email: user.email,
      data,
      error,
    });

    setCredits(data?.credits ?? 0);

    let unreadMessages;

    if (user.id === "ef8f7aef-055b-4977-ab77-0430f42b500e") {
      const { data } = await supabase
        .from("contact_requests")
        .select("id")
        .eq("status", "pending")
        .is("admin_reply", null);

      unreadMessages = data;
    } else {
      const { data } = await supabase
        .from("contact_requests")
        .select("id")
        .eq("user_id", user.id)
        .eq("user_seen", false)
        .eq("status", "answered")
        .not("admin_reply", "is", null)
        .neq("admin_reply", "");

      unreadMessages = data;
    }

    setUnreadMessagesCount(unreadMessages?.length || 0);
setUnreadMessageIds((unreadMessages || []).map((msg: any) => msg.id));
  };

  void checkUser();

  const handleNotificationsUpdated = () => {
    void checkUser();
  };

  window.addEventListener("notifications-updated", handleNotificationsUpdated);

  return () => {
    window.removeEventListener("notifications-updated", handleNotificationsUpdated);
  };
}, []);

const handleNotificationsClick = async (
  e: MouseEvent<HTMLAnchorElement>
) => {
  e.preventDefault();

  setUnreadMessagesCount(0);
  setUnreadMessageIds([]);

  const supabase = createClient();

  const {
  data: { session },
} = await supabase.auth.getSession();

const user = session?.user || null;

  if (!user) {
    window.location.href = "/contact";
    return;
  }

  const ADMIN_ID = "ef8f7aef-055b-4977-ab77-0430f42b500e";

  if (user.id === ADMIN_ID) {
    await supabase
      .from("contact_requests")
      .update({ status: "read" })
      .eq("status", "pending")
      .is("admin_reply", null);
  } else {
    console.log("USER NOTIFICATION CLICK DEBUG:", {
  userId: user.id,
  unreadMessagesCount,
  unreadMessageIds,
});

if (unreadMessageIds.length > 0) {
  const { error: markUserSeenError } = await supabase
  .from("contact_requests")
  .update({ user_seen: true })
  .in("id", unreadMessageIds);

console.log("MARK USER NOTIFICATIONS SEEN:", {
  userId: user.id,
  unreadMessageIds,
  markUserSeenError,
});

if (markUserSeenError) {
  return;
}
}
  }

    router.push("/contact");
};

const handleLogout = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/";
};

  return (
    <header className="relative flex w-full flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white/70 bg-white/75 px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.05)] backdrop-blur sm:flex-nowrap sm:rounded-full sm:px-5">
      <Link href="/" className="flex items-center gap-3">
    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white">
    <img
      src="/logo.png"
      alt="SMM Creative Studio"
      className="h-full w-full object-cover"
    />
  </div>
  <div>
    <p className="text-sm font-semibold tracking-wide text-neutral-900">
      SMM Creative Studio
    </p>
  </div>
</Link>

      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
        {isLoggedIn ? (
          <>
          {(credits ?? 0) > 0 ? (
  <div className="rounded-full bg-[#efe7de] px-4 py-2 text-sm font-bold text-neutral-900">
    {credits} кредита
  </div>
) : (
  <Link
    href="/pricing"
    className="rounded-full bg-[#efe7de] px-4 py-2 text-sm font-bold text-neutral-900 transition hover:bg-[#e2d6c8]"
  >
    Купи кредити
  </Link>
)}
          <Link
  href="/"
  className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-black/5"
>
  Начало
</Link>
<Link
  href="/contact"
  onClick={handleNotificationsClick}
  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg transition hover:bg-black hover:text-white"
  title="Известия"
>
  🔔

  {unreadMessagesCount > 0 ? (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-black leading-none text-white">
      {unreadMessagesCount}
    </span>
  ) : null}
</Link>
<button
  onClick={() => setMenuOpen((v) => !v)}
  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-xl sm:hidden"
>
  ⋯
</button>
            <Link
              href="/account"
              className="hidden rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:inline-flex"
            >
              Профил
            </Link>

            <button
  onClick={handleLogout}
  className="hidden rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white sm:inline-flex"
>
  Изход
</button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-black/5"
            >
              Вход
            </Link>

            <Link
              href="/register"
              className="inline-flex rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Регистрация
            </Link>
          </>
        )}
      </div>
      {menuOpen && (
  <div className="absolute right-4 top-full z-50 mt-2 flex w-44 flex-col rounded-2xl border bg-white p-2 shadow-lg sm:hidden">
    <Link
      href="/account"
      onClick={() => setMenuOpen(false)}
      className="rounded-xl px-4 py-2 text-sm hover:bg-gray-100"
    >
      Профил
    </Link>

    <button
      onClick={async () => {
        setMenuOpen(false);
        await handleLogout();
      }}
      className="rounded-xl px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
    >
      Изход
    </button>
  </div>
)}
    </header>
  );
}