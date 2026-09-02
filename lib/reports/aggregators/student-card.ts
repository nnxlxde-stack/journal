import type { AggregatedReport } from "@/lib/reports/types";
import { LessonType } from "@/lib/reports/types";
import {
  attendancePercent,
  numberColumn,
  textColumn,
  type AggregationContext,
} from "@/lib/reports/aggregators/shared";

const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  lecture: "Лекция",
  practice: "Практика",
  lab: "Лабораторная",
  exam: "Экзамен",
  credit: "Зачёт",
};

/**
 * 1.2 Персональная карточка посещаемости студента.
 * Детализация по дисциплинам и типам занятий за период.
 */
export async function studentAttendanceCard(
  ctx: AggregationContext,
): Promise<AggregatedReport> {
  const { params, range, ds } = ctx;
  const studentId = params.scope.studentId;
  if (!studentId) throw new Error("Для карточки выберите студента");

  const student = (await ds.listStudents()).find((s) => s.id === studentId);
  if (!student) throw new Error("Студент не найден");

  const [lessons, facts] = await Promise.all([
    ds.listLessons({ groupIds: [student.groupId], from: range.from, to: range.to }),
    ds.listAttendance({ studentIds: [studentId], from: range.from, to: range.to }),
  ]);

  // Все пары группы студента в периоде (знаменатель)
  const lessonCountByKey = new Map<string, number>();
  for (const l of lessons) {
    const key = `${l.disciplineId}:${l.lessonType}`;
    lessonCountByKey.set(key, (lessonCountByKey.get(key) ?? 0) + 1);
  }

  // Отметки студента по дисциплине/типу
  const acc = new Map<
    string,
    {
      disciplineId: string;
      discipline: string;
      type: LessonType;
      present: number;
      late: number;
      sick: number;
      absent: number;
    }
  >();
  for (const f of facts) {
    const key = `${f.disciplineId}:${f.lessonType}`;
    const entry =
      acc.get(key) ?? {
        disciplineId: f.disciplineId,
        discipline: f.disciplineName,
        type: f.lessonType,
        present: 0,
        late: 0,
        sick: 0,
        absent: 0,
      };
    if (f.presence === "present") entry.present++;
    else if (f.presence === "late") entry.late++;
    else if (f.absenceReason === "respected") entry.sick++;
    else entry.absent++;
    acc.set(key, entry);
  }

  const typeOrder: Record<LessonType, number> = {
    lecture: 0,
    practice: 1,
    lab: 2,
    exam: 3,
    credit: 4,
  };

  type CardRow = {
    discipline: string;
    type: string;
    typeOrderKey: number;
    totalPairs: number;
    present: number;
    late: number;
    sick: number;
    absent: number;
    percent: number | null;
  };

  const rows: CardRow[] = [];
  for (const [, entry] of acc) {
    const key = `${entry.disciplineId}:${entry.type}`;
    const totalPairs = lessonCountByKey.get(key) ?? 0;
    rows.push({
      discipline: entry.discipline,
      type: LESSON_TYPE_LABELS[entry.type],
      typeOrderKey: typeOrder[entry.type],
      totalPairs,
      present: entry.present,
      late: entry.late,
      sick: entry.sick,
      absent: entry.absent,
      percent: attendancePercent(entry.present + entry.late, totalPairs),
    });
  }

  rows.sort(
    (a, b) =>
      a.discipline.localeCompare(b.discipline) ||
      a.typeOrderKey - b.typeOrderKey,
  );

  const totals = rows.reduce(
    (acc2, r) => ({
      totalPairs: acc2.totalPairs + r.totalPairs,
      present: acc2.present + r.present,
      late: acc2.late + r.late,
      sick: acc2.sick + r.sick,
      absent: acc2.absent + r.absent,
    }),
    { totalPairs: 0, present: 0, late: 0, sick: 0, absent: 0 },
  );

  const totalsRow: Record<string, unknown> = {
    discipline: "Итого",
    type: "—",
    totalPairs: totals.totalPairs,
    present: totals.present,
    late: totals.late,
    sick: totals.sick,
    absent: totals.absent,
    percent: attendancePercent(totals.present + totals.late, totals.totalPairs),
  };

  const tableRows = rows.map(
    (r) => ({ ...r }) as Record<string, unknown>,
  );

  return {
    type: params.type,
    title: `Персональная карточка посещаемости`,
    scopeLabel: student.fullName,
    period: params.period,
    createdAt: new Date().toISOString(),
    tables: [
      {
        title: `${student.fullName} · ${range.from} — ${range.to}`,
        columns: [
          textColumn("discipline", "Дисциплина"),
          textColumn("type", "Тип занятия"),
          numberColumn("totalPairs", "Пар в периоде"),
          numberColumn("present", "Присутств."),
          numberColumn("late", "Опоздал"),
          numberColumn("sick", "Болел"),
          numberColumn("absent", "Пропустил"),
          { key: "percent", title: "% посещ.", kind: "percent", highlightLowThreshold: 60 },
        ],
        rows: tableRows,
        totalsRow,
      },
    ],
  };
}
