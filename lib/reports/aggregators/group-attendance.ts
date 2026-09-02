import type {
  AggregatedReport,
  AttendanceFact,
  ReportColumn,
} from "@/lib/reports/types";
import {
  attendancePercent,
  numberColumn,
  percentColumn,
  shortDate,
  STATUS_LEGEND,
  textColumn,
  type AggregationContext,
} from "@/lib/reports/aggregators/shared";

function cellCode(f: AttendanceFact | null): string {
  if (!f) return "·";
  if (f.presence === "present") return "П";
  if (f.presence === "late") return "О";
  if (f.absenceReason === "respected") return "Б";
  return "Н";
}

/**
 * 1.1 Ведомость посещаемости группы за период.
 * Матрица «студент × пара», статус в каждой ячейке,
 * итоговый % по студенту и по группе.
 */
export async function groupAttendanceSheet(
  ctx: AggregationContext,
): Promise<AggregatedReport> {
  const { params, range, ds } = ctx;
  const groupId = params.scope.groupId;
  if (!groupId) throw new Error("Для ведомости выберите группу");

  const group = (await ds.listGroups()).find((g) => g.id === groupId);
  const [students, lessons, facts] = await Promise.all([
    ds.listStudents({ groupId }),
    ds.listLessons({ groupIds: [groupId], from: range.from, to: range.to }),
    ds.listAttendance({ groupIds: [groupId], from: range.from, to: range.to }),
  ]);

  lessons.sort(
    (a, b) =>
      a.lessonDate.localeCompare(b.lessonDate) || a.pairNumber - b.pairNumber,
  );

  const factByKey = new Map<string, AttendanceFact>();
  for (const f of facts) factByKey.set(`${f.lessonId}:${f.studentId}`, f);

  const lessonColumns: ReportColumn[] = lessons.map((l) => ({
    key: `l_${l.id}`,
    title: `${shortDate(l.lessonDate)} №${l.pairNumber}`,
    kind: "status",
  }));

  const columns: ReportColumn[] = [
    textColumn("student", "Студент"),
    ...lessonColumns,
    numberColumn("present", "П"),
    numberColumn("late", "О"),
    numberColumn("sick", "Б"),
    numberColumn("absentUnknown", "Н"),
    percentColumn("percent", "% посещ.", 60),
  ];

  const rows: Record<string, unknown>[] = [];
  const lessonPresentCount = new Map<string, number>();

  for (const student of students) {
    const row: Record<string, unknown> = { student: student.fullName };
    let present = 0;
    let late = 0;
    let sick = 0;
    let absentUnknown = 0;

    for (const lesson of lessons) {
      const key = `${lesson.id}:${student.id}`;
      const fact = factByKey.get(key);
      const code = cellCode(fact ?? null);
      row[`l_${lesson.id}`] = code;

      if (fact) {
        if (fact.presence === "present") {
          present++;
          lessonPresentCount.set(
            lesson.id,
            (lessonPresentCount.get(lesson.id) ?? 0) + 1,
          );
        } else if (fact.presence === "late") late++;
        else if (fact.absenceReason === "respected") sick++;
        else absentUnknown++;
      }
    }

    row.present = present;
    row.late = late;
    row.sick = sick;
    row.absentUnknown = absentUnknown;
    row.percent = attendancePercent(present + late, lessons.length);
    rows.push(row);
  }

  const totalsRow: Record<string, unknown> = { student: "Итого по группе" };
  for (const lesson of lessons) {
    totalsRow[`l_${lesson.id}`] = lessonPresentCount.get(lesson.id) ?? 0;
  }
  const sumP = rows.reduce((s, r) => s + (r.present as number), 0);
  const sumL = rows.reduce((s, r) => s + (r.late as number), 0);
  const sumS = rows.reduce((s, r) => s + (r.sick as number), 0);
  const sumA = rows.reduce((s, r) => s + (r.absentUnknown as number), 0);
  totalsRow.present = sumP;
  totalsRow.late = sumL;
  totalsRow.sick = sumS;
  totalsRow.absentUnknown = sumA;
  const totalCells = lessons.length * students.length;
  totalsRow.percent =
    totalCells > 0 ? attendancePercent(sumP + sumL, totalCells) : null;

  return {
    type: params.type,
    title: `Ведомость посещаемости группы «${group?.name ?? ""}»`,
    scopeLabel: group?.name ?? "",
    period: params.period,
    createdAt: new Date().toISOString(),
    meta: { legend: STATUS_LEGEND },
    tables: [
      {
        title: `${group?.name ?? "Группа"} · ${range.from} — ${range.to}`,
        columns,
        rows,
        totalsRow,
      },
    ],
  };
}
