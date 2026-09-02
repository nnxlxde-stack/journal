import type { AggregatedReport } from "@/lib/reports/types";
import {
  attendancePercent,
  numberColumn,
  textColumn,
  type AggregationContext,
} from "@/lib/reports/aggregators/shared";

/**
 * 1.1 Сводка пропусков по группе за период.
 * По каждому студенту: присутствия, опоздания, пропуски
 * (уважительная причина / причина не указана) с сортировкой по убыванию.
 */
export async function groupAbsenceSummary(
  ctx: AggregationContext,
): Promise<AggregatedReport> {
  const { params, range, ds } = ctx;
  const groupId = params.scope.groupId;
  if (!groupId) throw new Error("Для сводки пропусков выберите группу");

  const group = (await ds.listGroups()).find((g) => g.id === groupId);
  const [students, lessons, facts] = await Promise.all([
    ds.listStudents({ groupId }),
    ds.listLessons({ groupIds: [groupId], from: range.from, to: range.to }),
    ds.listAttendance({ groupIds: [groupId], from: range.from, to: range.to }),
  ]);

  const byStudent = new Map<string, typeof facts>();
  for (const f of facts) {
    const arr = byStudent.get(f.studentId) ?? [];
    arr.push(f);
    byStudent.set(f.studentId, arr);
  }

  const nameOf = new Map(students.map((s) => [s.id, s.fullName]));

  const rows = students.map((student) => {
    const list = byStudent.get(student.id) ?? [];
    let present = 0;
    let late = 0;
    let sick = 0;
    let absentUnknown = 0;
    for (const f of list) {
      if (f.presence === "present") present++;
      else if (f.presence === "late") late++;
      else if (f.absenceReason === "respected") sick++;
      else absentUnknown++;
    }
    const absences = late + sick + absentUnknown;
    return {
      student: nameOf.get(student.id) ?? student.fullName,
      present,
      late,
      sick,
      absentUnknown,
      absences,
      percent: attendancePercent(present + late, lessons.length),
    };
  });

  rows.sort((a, b) => b.absences - a.absences || a.student.localeCompare(b.student));

  const totals = rows.reduce(
    (acc, r) => ({
      present: acc.present + r.present,
      late: acc.late + r.late,
      sick: acc.sick + r.sick,
      absentUnknown: acc.absentUnknown + r.absentUnknown,
      absences: acc.absences + r.absences,
    }),
    { present: 0, late: 0, sick: 0, absentUnknown: 0, absences: 0 },
  );

  const totalCells = lessons.length * students.length;
  const totalsRow: Record<string, unknown> = {
    student: "Итого по группе",
    present: totals.present,
    late: totals.late,
    sick: totals.sick,
    absentUnknown: totals.absentUnknown,
    absences: totals.absences,
    percent:
      totalCells > 0
        ? attendancePercent(totals.present + totals.late, totalCells)
        : null,
  };

  return {
    type: params.type,
    title: `Сводка пропусков по группе «${group?.name ?? ""}»`,
    scopeLabel: group?.name ?? "",
    period: params.period,
    createdAt: new Date().toISOString(),
    meta: {
      legend:
        "Б — пропуски по уважительной причине (болезнь), Н — пропуски без указания причины",
    },
    tables: [
      {
        title: `${group?.name ?? "Группа"} · ${range.from} — ${range.to}`,
        columns: [
          textColumn("student", "Студент"),
          numberColumn("present", "Присутств."),
          numberColumn("late", "Опоздал"),
          numberColumn("sick", "Болел (уваж.)"),
          numberColumn("absentUnknown", "Пропуски (причина не указана)"),
          numberColumn("absences", "Всего пропусков"),
          { key: "percent", title: "% посещ.", kind: "percent", highlightLowThreshold: 60 },
        ],
        rows,
        totalsRow,
      },
    ],
  };
}
