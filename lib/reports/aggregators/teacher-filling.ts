import type { AggregatedReport, ReportDataSource } from "@/lib/reports/types";
import {
  numberColumn,
  shortDate,
  textColumn,
  type AggregationContext,
} from "@/lib/reports/aggregators/shared";

/**
 * 1.3 Контроль заполнения журнала преподавателем.
 * Пары преподавателя за период: какие отмечены, какие пропущены
 * (нет ни одной отметки посещаемости).
 */
export async function teacherFillingControl(
  ctx: AggregationContext,
): Promise<AggregatedReport> {
  const { params, range, ds } = ctx;
  const teacherId = params.scope.teacherId;
  if (!teacherId) throw new Error("Выберите преподавателя");

  const teacher = (await ds.listTeachers()).find((t) => t.id === teacherId);
  const lessons = await ds.listLessons({
    teacherId,
    from: range.from,
    to: range.to,
  });

  let facts: Awaited<ReturnType<ReportDataSource["listAttendance"]>> = [];
  if (lessons.length > 0) {
    facts = await ds.listAttendance({
      lessonIds: lessons.map((l) => l.id),
      from: range.from,
      to: range.to,
    });
  }

  const markCount = new Map<string, number>();
  for (const f of facts) {
    markCount.set(f.lessonId, (markCount.get(f.lessonId) ?? 0) + 1);
  }

  const sorted = [...lessons].sort(
    (a, b) =>
      a.lessonDate.localeCompare(b.lessonDate) || a.pairNumber - b.pairNumber,
  );

  const rows: Record<string, unknown>[] = sorted.map((lesson) => {
    const marks = markCount.get(lesson.id) ?? 0;
    return {
      date: shortDate(lesson.lessonDate),
      pair: lesson.pairNumber,
      group: lesson.groupName ?? "—",
      discipline: lesson.disciplineName ?? "—",
      marks,
      status: marks > 0 ? "Отмечено" : "НЕ ОТМЕЧЕНО",
    };
  });

  const totalPairs = sorted.length;
  const marked = rows.filter((r) => (r.marks as number) > 0).length;
  const unmarked = totalPairs - marked;

  const totalsRow: Record<string, unknown> = {
    date: "Итого",
    pair: "—",
    group: "—",
    discipline: "—",
    marks: facts.length,
    status: `Отмечено пар: ${marked}`,
  };

  return {
    type: params.type,
    title: "Контроль заполнения журнала",
    scopeLabel: teacher?.fullName ?? "",
    period: params.period,
    createdAt: new Date().toISOString(),
    meta: {
      legend: `Пар за период: ${totalPairs}; отмечено: ${marked}; пропущено отметок: ${unmarked} (${totalPairs ? Math.round((marked / totalPairs) * 100) : 0}%)`,
    },
    tables: [
      {
        title: `${teacher?.fullName ?? "Преподаватель"} · ${range.from} — ${range.to}`,
        columns: [
          textColumn("date", "Дата"),
          numberColumn("pair", "Пара"),
          textColumn("group", "Группа"),
          textColumn("discipline", "Дисциплина"),
          numberColumn("marks", "Отметок"),
          textColumn("status", "Статус"),
        ],
        rows,
        totalsRow,
      },
    ],
  };
}
