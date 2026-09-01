import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const AUTH_ROUTES = ["/login", "/register"];

/**
 * Proxy (в Next.js 16 middleware переименован в proxy).
 * 1. Обновляет сессию Supabase на каждый запрос.
 * 2. Прокидывает хедер x-device (мобилка/десктоп) для SSR-оптимизации
 *    (не источник истины для UI — финальное решение принимает CSS).
 * 3. Защищает маршруты: неавторизованных на /login, авторизованных из /login.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Грубое определение устройства (оптимизация, не критичный UI)
  const ua = request.headers.get("user-agent") ?? "";
  const device = /Mobile|Android|iPhone|iPad|iPod/i.test(ua)
    ? "mobile"
    : "desktop";
  supabaseResponse.headers.set("x-device", device);

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/journal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // Пропускаем статику, изображения и API-ассеты
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
