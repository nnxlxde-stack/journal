import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/types/database.types";

/**
 * Клиент для Server Components, Server Actions и Route Handlers.
 * Сессия читается/пишется через cookies из next/headers.
 * НЕ импортировать в "use client" компоненты.
 *
 * Обёрнут в React cache(): в рамках одного серверного запроса
 * (рендер страницы/Server Action) все вызовы получают ОДИН клиент —
 * без повторных чтений cookies и лишних инициализаций.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Вызывается из Server Component — cookie можно только читать.
            // Обновление сессии обрабатывается в proxy.ts (middleware).
          }
        },
      },
    },
  );
});
