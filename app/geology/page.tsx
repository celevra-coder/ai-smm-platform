"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function GeologyPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login?next=/geology";
        return;
      }

      setAllowed(true);
      setChecking(false);
    };

    void checkAccess();
  }, []);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <p className="text-sm text-neutral-300">Зареждане на геоложката карта…</p>
      </main>
    );
  }

  if (!allowed) return null;

  return (
    <main className="h-screen w-full overflow-hidden bg-neutral-950">
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4 text-white">
        <div>
          <h1 className="text-sm font-semibold sm:text-base">
            Национална карта на подземните води
          </h1>
          <p className="hidden text-xs text-neutral-400 sm:block">
            Сондажи, водни тела, активни разломи и пространствен анализ
          </p>
        </div>

        <a
          href="/dashboard"
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium hover:bg-white/10"
        >
          Към профила
        </a>
      </div>

      <iframe
        src="/geology-map/index.html"
        title="Национална карта на подземните води"
        className="h-[calc(100vh-56px)] w-full border-0"
        allow="geolocation"
      />
    </main>
  );
}
