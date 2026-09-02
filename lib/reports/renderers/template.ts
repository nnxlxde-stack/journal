import type {
  AggregatedReport,
  ReportColumn,
} from "@/lib/reports/types";

/** Университет/шапка для всех форматов */
export const UNIVERSITY_HEADER = "Камчатский государственный технический университет";
export const SYSTEM_HEADER = "Система учёта посещаемости занятий";

export function periodLabel(report: AggregatedReport): string {
  const p = report.period;
  if (p.preset === "custom" && p.custom) {
    return `${p.custom.from} — ${p.custom.to}`;
  }
  const labels: Record<string, string> = {
    today: "Сегодня",
    week: "Неделя",
    month: "Месяц",
    semester: "Семестр",
  };
  return labels[p.preset] ?? String(p.preset);
}

export function todayRu(): string {
  return new Date().toLocaleDateString("ru-RU");
}

/** Текст ячейки по типу колонки (общий для всех рендереров) */
export function cellText(col: ReportColumn, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (col.kind === "percent" && typeof value === "number") return `${value}%`;
  return String(value);
}

/** Значение ниже порога (для подсветки) */
export function isLow(col: ReportColumn, value: unknown): boolean {
  if (col.highlightLowThreshold === undefined) return false;
  return typeof value === "number" && value < col.highlightLowThreshold;
}

/** Строки шапки документа (одинаковы для всех форматов) */
export function headingLines(report: AggregatedReport): string[] {
  return [
    report.title,
    report.scopeLabel ? `Область: ${report.scopeLabel}` : "",
    `Период: ${periodLabel(report)}`,
    `Дата формирования: ${todayRu()}`,
  ].filter(Boolean);
}

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const PDF_MIME = "application/pdf";
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
