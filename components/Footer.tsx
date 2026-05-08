import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-black/10 bg-white px-6 py-6 text-sm text-neutral-600">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        
        <p>© {new Date().getFullYear()} AI SMM Studio</p>

        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-black">
            Общи условия
          </Link>
          <Link href="/privacy" className="hover:text-black">
            Поверителност
          </Link>
          <Link href="/refund" className="hover:text-black">
            Възстановяване
          </Link>
        </div>

      </div>
    </footer>
  );
}