"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import NavbarEn from "@/app/en/components/NavbarEn";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isEn = pathname.startsWith("/en");

  const hideNavbar =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/en/login" ||
    pathname === "/en/register";

  return (
    <>
      {!hideNavbar ? (
        <div className="mx-auto w-full max-w-7xl px-6 pt-6">
          {isEn ? <NavbarEn /> : <Navbar />}
        </div>
      ) : null}

      <div className="flex-1">{children}</div>
    </>
  );
}