import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isEnglishPath = pathname === "/en" || pathname.startsWith("/en/");

  const isPublicPath =
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/order-video" ||
    pathname === "/contact" ||
    pathname === "/content-calendar" ||
    pathname === "/content-posts" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/video-revision" ||
    pathname === "/en" ||
    pathname === "/en/pricing" ||
    pathname === "/en/login" ||
    pathname === "/en/register" ||
    pathname === "/en/dashboard" ||
    pathname === "/en/dashboard/quick-video" ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api/");
    if (isPublicPath) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  
let user = null;

try {
  const res = await Promise.race([
    supabase.auth.getUser(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
  ]);

  if (res) {
    user = res.data.user;
  }
} catch (e) {
  console.error("Middleware auth error:", e);
}
const isPublicQuickDemo =
  request.nextUrl.pathname === "/dashboard/quick-video" ||
  request.nextUrl.pathname === "/en/dashboard/quick-video" ||
  (
    request.nextUrl.pathname === "/dashboard" &&
    request.nextUrl.searchParams.get("mode") === "quick"
  ) ||
  (
    request.nextUrl.pathname === "/en/dashboard" &&
    request.nextUrl.searchParams.get("mode") === "quick"
  );
// ако няма user и влиза в dashboard, позволяваме само публичния quick demo

if (
  !user &&
  (request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/en/dashboard")) &&
  !isPublicQuickDemo
) {
  const url = request.nextUrl.clone();
  url.pathname = request.nextUrl.pathname.startsWith("/en")
    ? "/en/login"
    : "/login";
  return NextResponse.redirect(url);
}
// ако е логнат и отива към login → пращаме го в dashboard
// register НЕ го пренасочваме автоматично, за да не влиза в quick mode насила
if (user && request.nextUrl.pathname === "/login") {
  const url = request.nextUrl.clone();
  url.pathname = "/dashboard";
  return NextResponse.redirect(url);
}

if (user && request.nextUrl.pathname === "/en/login") {
  const url = request.nextUrl.clone();
  url.pathname = "/en";
  return NextResponse.redirect(url);
}
return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};