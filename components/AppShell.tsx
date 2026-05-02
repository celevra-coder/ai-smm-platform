"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideNavbar =
    pathname === "/login" ||
    pathname === "/register";

  return (
    <>
      {!hideNavbar ? (
        <div className="mx-auto w-full max-w-7xl px-6 pt-6">
          <Navbar />
        </div>
      ) : null}

      <div className="flex-1">{children}</div>
    </>
  );
}