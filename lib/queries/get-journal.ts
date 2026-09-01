import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database.types";

export type JournalFilters = {
  groupId?: string;
  disciplineId?: string;
  semesterId?: string;
};

export type JournalLesson = {
  id: string;
  group_id: string;
  lesson_date: string;
  pair_number: number;
  lesson_type: Enums<"lesson_type">;
  discipline: { id: string; name: string } | null;
  group: { id: string; name: string } | null;
  semester: { id: string; name: string } | null;
  teacher: { id: string; full_name: string } | null;
  attendance: {
    id: string;
    student_id: string;
    status: Enums<"attendance_status">;
  }[];
};

/**
 * Журнал посещаемости: занятия с вложенными справочниками и отметками.
 * Один источник истины для desktop-таблицы и mobile-карточек.
 */
export async function getJournal(
  filters: JournalFilters = {},
): Promise<JournalLesson[]> {
  const supabase = await createClient();

  let query = supabase
    .from("lessons")
    .select(
      `id, group_id, lesson_date, pair_number, lesson_type,
       discipline:disciplines(id, name),
       group:groups(id, name),
       semester:semesters(id, name),
       teacher:teachers(id, full_name),
       attendance(id, student_id, status)`,
    )
    .order("lesson_date", { ascending: false })
    .order("pair_number", { ascending: true });

  if (filters.groupId) query = query.eq("group_id", filters.groupId);
  if (filters.disciplineId)
    query = query.eq("discipline_id", filters.disciplineId);
  if (filters.semesterId) query = query.eq("semester_id", filters.semesterId);

  const { data, error } = await query;
  if (error) throw new Error(`Ошибка загрузки журнала: ${error.message}`);

  return data as unknown as JournalLesson[];
}

export type LessonDetail = {
  id: string;
  lesson_date: string;
  pair_number: number;
  lesson_type: Enums<"lesson_type">;
  discipline: { id: string; name: string } | null;
  group: { id: string; name: string } | null;
  semester: { id: string; name: string } | null;
  teacher: { id: string; full_name: string } | null;
  students: { id: string; full_name: string }[];
  /** student_id -> статус */
  attendance: Record<string, Enums<"attendance_status">>;
};

/** Детальная отметка посещаемости конкретного занятия (со списком студентов группы). */
export async function getLessonDetail(
  lessonId: string,
): Promise<LessonDetail | null> {
  const supabase = await createClient();

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(
      `id, lesson_date, pair_number, lesson_type, group_id,
       discipline:disciplines(id, name),
       group:groups(id, name),
       semester:semesters(id, name),
       teacher:teachers(id, full_name)`,
    )
    .eq("id", lessonId)
    .single();
  if (error) return null;

  const groupId = (lesson as { group_id: string }).group_id;
  const [studentsResult, attendanceResult] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name")
      .eq("group_id", groupId)
      .order("full_name"),
    supabase
      .from("attendance")
      .select("student_id, status")
      .eq("lesson_id", lessonId),
  ]);

  const statusMap: Record<string, Enums<"attendance_status">> = {};
  for (const row of attendanceResult.data ?? []) {
    statusMap[row.student_id] = row.status;
  }

  return {
    ...(lesson as Omit<typeof lesson, "group_id">),
    students: studentsResult.data ?? [],
    attendance: statusMap,
  } as unknown as LessonDetail;
}
