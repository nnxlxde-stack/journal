import type { AggregatedReport } from "@/lib/reports/types";
import {
  attendancePercent,
  numberColumn,
  textColumn,
  type AggregationContext,
} from "@/lib/reports/aggregators/shared";

/**
 * 1.5 Хронические прогульщики: студенты с % посещаемости ниже порога
 * (по умолчанию 60%). Можно ограничить группой или по всем группам.
 */
export async function chronicAbsentees(
  ctx: AggregationContext,
): Promise<AggregatedReport> {
  const { params, range, ds } = ctx;
  const threshold = params.thresholdPercent ?? 60;
  const groupId = params.scope.groupId;

  const groups = groupId
    ? (await ds.listGroups()).filter((g) => g.id === groupId)
    : await ds.listGroups();

  const rows: Record<string, unknown>[] = [];

  for (const group of groups) {
    const [students, lessons, facts] = await Promise.all([
      ds.listStudents({ groupId: group.id }),
      ds.listLessons({ groupIds: [group.id], from: range.from, to: range.to }),
      ds.listAttendance({ groupIds: [group.id], from: range.from, to: range.to }),
    ]);
    if (lessons.length === 0) continue;

    const byStudent = new Map<string, typeof facts>();
    for (const f of facts) {
      const arr = byStudent.get(f.studentId) ?? [];
      arr.push(f);
      byStudent.set(f.studentId, arr);
    }

    for (const student of students) {
      const list = byStudent.get(student.id) ?? [];
      let present = 0;
      let late = 0;
      let sick = 0;
      let absent = 0;
      for (const f of list) {
        if (f.presence === "present") present++;
        else if (f.presence === "late") late++;
        else if (f.absenceReason === "respected") sick++;
        else absent++;
      }
      const percent = attendancePercent(present + late, lessons.length);
      if (percent !== null && percent < threshold) {
        rows.push({
          group: group.name,
          student: student.fullName,
          pairs: lessons.length,
          present,
          late,
          sick,
          absent,
          absences: sick + absent,
          percent,
        });
      }
    }
  }

  rows.sort(
    (a, b) => (a.percent as number) - (b.percent as number),
  );

  return {
    type: params.type,
    title: `Хронические прогульщики (посещаемость ниже ${threshold}%)`,
    scopeLabel: groupId ? (groups[0]?.name ?? "—") : "Все группы",
    period: params.period,
    createdAt: new Date().toISOString(),
    meta: { legend: "Студенты с % посещаемости ниже заданного порога" },
    tables: [
      {
        title: `${range.from} — ${range.to} · порог < ${threshold}%`,
        columns: [
          textColumn("group", "Группа"),
          textColumn("student", "Студент"),
          numberColumn("pairs", "Пар"),
          numberColumn("present", "Присутств."),
          numberColumn("late", "Опоздал"),
          numberColumn("sick", "Болел"),
          numberColumn("absent", "Пропуски"),
          { key: "percent", title: "% посещ.", kind: "percent", highlightLowThreshold: threshold },
        ],
        rows,
      },
    ],
  };
}
