import type {
  AttendanceFact,
  AggregatedReport,
  ReportColumn,
  ReportDataSource,
  ReportParams,
} from "@/lib/reports/types";

/** Контекст агрегации: параметры заказа + разрешённый диапазон дат */
export interface AggregationContext {
  params: ReportParams;
  range: { from: string; to: string };
  ds: ReportDataSource;
}

export type Aggregator = (ctx: AggregationContext) => Promise<AggregatedReport>;

/** Короткие коды статусов для ячеек ведомости */
export function shortCode(presence: "present" | "late" | "absent"): string {
  if (presence === "present") return "П";
  if (presence === "late") return "О";
  return "Н";
}

/** Процент посещаемости: attended (present+late) от числа пар. null если пар нет */
export function attendancePercent(
  presentLate: number,
  lessons: number,
): number | null {
  if (lessons === 0) return null;
  return Math.round((presentLate / lessons) * 100);
}

export function fmtPercent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

/** «2026-09-01» → «01.09» */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return d && m ? `${d}.${m}` : iso;
}

/** Легенда символов ячеек ведомости */
export const STATUS_LEGEND =
  "П — присутствовал, О — опоздал, Б — болел (уважительная причина), Н — отсутствовал (причина не указана), · — нет отметки";

/** Колонка «процент» с подсветкой ниже порога */
export function percentColumn(
  key: string,
  title: string,
  lowThreshold = 60,
): ReportColumn {
  return { key, title, kind: "percent", highlightLowThreshold: lowThreshold };
}

export const textColumn = (key: string, title: string): ReportColumn => ({
  key,
  title,
  kind: "text",
});

export const numberColumn = (
  key: string,
  title: string,
  highlightLowThreshold?: number,
): ReportColumn => ({
  key,
  title,
  kind: "number",
  highlightLowThreshold,
});

/** Сводка фактов по выборке */
export function summarizeFacts(facts: AttendanceFact[]) {
  let present = 0;
  let late = 0;
  let sick = 0;
  let absentUnknown = 0;
  for (const f of facts) {
    if (f.presence === "present") present++;
    else if (f.presence === "late") late++;
    else if (f.absenceReason === "respected") sick++;
    else absentUnknown++;
  }
  const total = facts.length;
  return {
    present,
    late,
    sick,
    absentUnknown,
    total,
    percent: total === 0 ? null : Math.round(((present + late) / total) * 100),
  };
}

