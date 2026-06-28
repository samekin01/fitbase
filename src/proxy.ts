import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// robots.txtのDisallowを無視して/searchを無限に巡回するボット対策。
// DB問い合わせ・画面生成の前段でブロックすることでコストを抑える。
const BLOCKED_BOT_UA = /meta-externalagent|facebookexternalhit|bytespider|petalbot|mj12bot/i;

export async function proxy(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (BLOCKED_BOT_UA.test(userAgent)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let supabaseResponse = NextResponse.next({ request });

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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute =
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/login");

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (isLoginPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/search"],
};
