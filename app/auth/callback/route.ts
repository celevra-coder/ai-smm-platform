import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");
const nextCookie = request.cookies.get("ai_smm_auth_next")?.value;
const next = nextParam || nextCookie || "/";

const safeNext =
  next.startsWith("/") && !next.startsWith("//") ? next : "/";

let response = NextResponse.redirect(new URL(safeNext, request.url));

response.cookies.set("ai_smm_auth_next", "", {
  path: "/",
  maxAge: 0,
});

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}