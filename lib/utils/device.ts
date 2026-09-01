import { headers } from "next/headers";

export type Device = "mobile" | "desktop";

/**
 * Чтение грубой оценки устройства из хедера, выставленного proxy.ts.
 * Используется для SSR-оптимизации (например, не тянуть данные
 * для desktop-таблицы на мобильном). Финальная видимость — всегда CSS.
 */
export async function getDevice(): Promise<Device> {
  const headersList = await headers();
  return headersList.get("x-device") === "mobile" ? "mobile" : "desktop";
}
