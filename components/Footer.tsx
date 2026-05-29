"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isEnglish = pathname.startsWith("/en");

  return (
    <footer className="mt-10 border-t border-black/10 bg-white px-6 py-6 text-sm text-neutral-600">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p>© {new Date().getFullYear()} AI SMM Studio</p>

        <div className="flex gap-4">
          <Link href={isEnglish ? "/en/terms" : "/terms"} className="hover:text-black">
            {isEnglish ? "Terms" : "Общи условия"}
          </Link>

          <Link href={isEnglish ? "/en/privacy" : "/privacy"} className="hover:text-black">
            {isEnglish ? "Privacy" : "Поверителност"}
          </Link>

          <Link href={isEnglish ? "/en/refund" : "/refund"} className="hover:text-black">
            {isEnglish ? "Refund" : "Възстановяване"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
