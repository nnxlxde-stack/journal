import type { JournalLesson } from "@/lib/queries/get-journal";
import type { Enums } from "@/lib/types/database.types";

export type JournalStudent = { id: string; full_name: string };

/** Плоская строка журнала: студент × занятие (общая для desktop и mobile). */
export type JournalRow = {
  key: string;
  lessonId: string;
  lessonDate: string;
  pairNumber: number;
  discipline: string;
  groupName: string;
  studentId: string;
  studentName: string;
  status: Enums<"attendance_status">;
  /** true, если на занятии уже есть отметка по этому студенту */
  marked: boolean;
};

/**
 * Разворачивает занятия в плоские строки «студент × занятие».
 * Для каждого занятия берутся ВСЕ студенты его группы (даже без отметок —
 * статус по умолчанию absent_unknown, marked=false).
 */
export function flattenJournal(
  lessons: JournalLesson[],
  studentsByGroup: Record<string, JournalStudent[]>,
): JournalRow[] {
  const rows: JournalRow[] = [];
  for (const lesson of lessons) {
    const statusByStudent = new Map<string, Enums<"attendance_status">>();
    const markedIds = new Set<string>();
    for (const record of lesson.attendance) {
      statusByStudent.set(record.student_id, record.status);
      markedIds.add(record.student_id);
    }

    for (const student of studentsByGroup[lesson.group_id] ?? []) {
      rows.push({
        key: `${lesson.id}:${student.id}`,
        lessonId: lesson.id,
        lessonDate: lesson.lesson_date,
        pairNumber: lesson.pair_number,
        discipline: lesson.discipline?.name ?? "—",
        groupName: lesson.group?.name ?? "—",
        studentId: student.id,
        studentName: student.full_name,
        status: statusByStudent.get(student.id) ?? "absent_unknown",
        marked: markedIds.has(student.id),
      });
    }
  }
  return rows;
}

/** Дата в виде «01.09.2026». */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU");
}

const lessonTypeLabels: Record<Enums<"lesson_type">, string> = {
  lecture: "Лекция",
  practice: "Практика",
  lab: "Лабораторная",
  exam: "Экзамен",
  credit: "Зачёт",
};

export function lessonTypeLabel(type: Enums<"lesson_type">): string {
  return lessonTypeLabels[type];
}
