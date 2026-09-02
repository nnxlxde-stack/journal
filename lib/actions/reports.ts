"use server";

import type { ReportFormat, ReportParams } from "@/lib/reports/types";
import { generateReport } from "@/lib/reports/service";
import {
  FORMAT_EXT,
  renderReport,
} from "@/lib/reports/renderers";

export type DownloadReportResult =
  | { ok: true; filename: string; mime: string; base64: string }
  | { ok: false; error: string };

function safeDate(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Сгенерировать отчёт и вернуть файл (base64) для скачивания */
export async function downloadReport(
  params: ReportParams,
  format: ReportFormat,
): Promise<DownloadReportResult> {
  const generated = await generateReport(params);
  if (!generated.ok) return { ok: false, error: generated.error };

  try {
    const file = await renderReport(generated.report, format);
    const ext = FORMAT_EXT[format];
    const filename = `report_${params.type}_${safeDate()}.${ext}`;
    return {
      ok: true,
      filename,
      mime: file.mimeType,
      base64: Buffer.from(file.data).toString("base64"),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Ошибка генерации файла",
    };
  }
}
