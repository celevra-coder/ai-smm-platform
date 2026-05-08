import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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
  request.nextUrl.pathname === "/dashboard" &&
  request.nextUrl.searchParams.get("mode") === "quick" &&
  request.nextUrl.searchParams.get("demo") === "1";

// ако няма user и влиза в dashboard, позволяваме само публичния quick demo
if (
  !user &&
  request.nextUrl.pathname.startsWith("/dashboard") &&
  !isPublicQuickDemo
) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

// ако е логнат и отива към login → пращаме го в dashboard
// register НЕ го пренасочваме автоматично, за да не влиза в quick mode насила
if (user && request.nextUrl.pathname.startsWith("/login")) {
  const url = request.nextUrl.clone();
  url.pathname = "/dashboard";
  return NextResponse.redirect(url);
}
return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};