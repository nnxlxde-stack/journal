import type { AggregatedReport } from "@/lib/reports/types";
import {
  attendancePercent,
  numberColumn,
  textColumn,
  type AggregationContext,
} from "@/lib/reports/aggregators/shared";

/**
 * 1.4 Рейтинг групп по посещаемости (топ и антитоп) за период.
 * % группы = (присутствия + опоздания) / (пары × студенты).
 */
export async function groupAttendanceRating(
  ctx: AggregationContext,
): Promise<AggregatedReport> {
  const { params, range, ds } = ctx;

  const groups = await ds.listGroups();
  const rows: {
    group: string;
    pairs: number;
    students: number;
    present: number;
    late: number;
    absences: number;
    percent: number | null;
  }[] = [];

  for (const group of groups) {
    const [students, lessons, facts] = await Promise.all([
      ds.listStudents({ groupId: group.id }),
      ds.listLessons({ groupIds: [group.id], from: range.from, to: range.to }),
      ds.listAttendance({ groupIds: [group.id], from: range.from, to: range.to }),
    ]);
    if (lessons.length === 0 || students.length === 0) continue;

    let present = 0;
    let late = 0;
    let sick = 0;
    let absent = 0;
    for (const f of facts) {
      if (f.presence === "present") present++;
      else if (f.presence === "late") late++;
      else if (f.absenceReason === "respected") sick++;
      else absent++;
    }
    const cells = lessons.length * students.length;
    rows.push({
      group: group.name,
      pairs: lessons.length,
      students: students.length,
      present,
      late,
      absences: sick + absent,
      percent: attendancePercent(present + late, cells),
    });
  }

  rows.sort(
    (a, b) =>
      (b.percent ?? -1) - (a.percent ?? -1) || a.group.localeCompare(b.group),
  );

  const totals = rows.reduce(
    (t, r) => ({
      present: t.present + r.present,
      late: t.late + r.late,
      absences: t.absences + r.absences,
      cells: t.cells + r.pairs * r.students,
    }),
    { present: 0, late: 0, absences: 0, cells: 0 },
  );

  const totalsRow: Record<string, unknown> = {
    group: "Итого по всем группам",
    pairs: rows.reduce((s, r) => s + r.pairs, 0),
    students: rows.reduce((s, r) => s + r.students, 0),
    present: totals.present,
    late: totals.late,
    absences: totals.absences,
    percent: attendancePercent(totals.present + totals.late, totals.cells),
  };

  return {
    type: params.type,
    title: "Рейтинг групп по посещаемости",
    scopeLabel: "Все группы",
    period: params.period,
    createdAt: new Date().toISOString(),
    meta: {
      legend:
        "% посещ. = (присутствия + опоздания) / (пары × студенты группы) за период",
    },
    tables: [
      {
        title: `${range.from} — ${range.to}`,
        columns: [
          textColumn("group", "Группа"),
          numberColumn("pairs", "Пар"),
          numberColumn("students", "Студентов"),
          numberColumn("present", "Присутств."),
          numberColumn("late", "Опоздал"),
          numberColumn("absences", "Пропуски"),
          { key: "percent", title: "% посещ.", kind: "percent", highlightLowThreshold: 60 },
        ],
        rows,
        totalsRow,
      },
    ],
  };
}
