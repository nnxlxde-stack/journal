"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database.types";

/**
 * Клиент для Client Components (браузер).
 * Использует anon key + RLS-политики. НЕ импортировать в серверный код.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
