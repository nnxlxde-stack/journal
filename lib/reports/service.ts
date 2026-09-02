import { AGGREGATORS } from "@/lib/reports/aggregators";
import type { AggregationContext } from "@/lib/reports/aggregators/shared";
import { SupabaseReportDataSource } from "@/lib/reports/data-source";
import { reportMeta } from "@/lib/reports/registry";
import type {
  AggregatedReport,
  DateRange,
  ReportDataSource,
  ReportParams,
} from "@/lib/reports/types";
import { ReportType } from "@/lib/reports/types";

/** Локальная дата ISO yyyy-mm-dd (без сдвига таймзоны) */
export function localISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return localISO(d);
}

/** Разрешение пресета периода в диапазон дат */
export async function resolveRange(
  params: ReportParams,
  ds: ReportDataSource,
  today = new Date(),
): Promise<DateRange> {
  const preset = params.period.preset;
  const now = localISO(today);

  switch (preset) {
    case "today":
      return { from: now, to: now };
    case "week":
      return { from: shiftDays(now, -6), to: now };
    case "month": {
      const first = localISO(new Date(today.getFullYear(), today.getMonth(), 1));
      return { from: first, to: now };
    }
    case "semester": {
      const semesters = await ds.listSemesters();
      const active = semesters.find(
        (s) => s.startDate <= now && now <= s.endDate,
      );
      if (active) {
        return {
          from: active.startDate,
          to: active.endDate < now ? active.endDate : now,
        };
      }
      // Фолбэк: учебный семестр по дате
      const month = today.getMonth() + 1; // 1..12
      const year = today.getFullYear();
      const from = month >= 9 ? `${year}-09-01` : `${year}-02-01`;
      return { from, to: now };
    }
    case "custom":
      if (!params.period.custom?.from || !params.period.custom?.to) {
        throw new Error("Укажите диапазон дат");
      }
      return params.period.custom;
  }
}

/** Проверка, какие фильтры области обязательны для формы */
function requiredScope(
  type: ReportType,
): ("groupId" | "studentId" | "disciplineId" | "teacherId")[] {
  switch (type) {
    case ReportType.GroupAttendanceSheet:
    case ReportType.GroupAbsenceSummary:
    case ReportType.ExpressReport:
      return ["groupId"];
    case ReportType.StudentAttendanceCard:
      return ["studentId"];
    case ReportType.DisciplineAttendance:
      return ["disciplineId"];
    case ReportType.TeacherFillingControl:
      return ["teacherId"];
    case ReportType.ChronicAbsenteesReport:
    case ReportType.GroupAttendanceRating:
    case ReportType.AbsenceReasonsReport:
      return [];
    default:
      return ["groupId"];
  }
}

export type GenerateReportResult =
  | { ok: true; report: AggregatedReport }
  | { ok: false; error: string };

/**
 * Генерация отчёта: валидация → разрешение периода → агрегация.
 * Лёгкие формы выполняются синхронно (экранный предпросмотр).
 */
export async function generateReport(
  params: ReportParams,
): Promise<GenerateReportResult> {
  try {
    const meta = reportMeta(params.type);
    if (!meta) throw new Error("Неизвестная форма отчёта");
    if (!meta.available) {
      throw new Error(`Форма «${meta.title}» пока недоступна`);
    }

    const aggregator = AGGREGATORS[params.type];
    if (!aggregator) throw new Error("Агрегатор для формы не реализован");

    for (const key of requiredScope(params.type)) {
      if (!params.scope[key]) {
        const label =
          key === "groupId"
            ? "группу"
            : key === "studentId"
              ? "студента"
              : key === "disciplineId"
                ? "дисциплину"
                : "преподавателя";
        throw new Error(`Выберите ${label}`);
      }
    }

    const ds = new SupabaseReportDataSource();
    const range = await resolveRange(params, ds);
    const ctx: AggregationContext = { params, range, ds };
    const report = await aggregator(ctx);
    return { ok: true, report };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}
