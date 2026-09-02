import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database.types";
import type {
  AttendanceFact,
  DisciplineRef,
  GroupRef,
  LessonRef,
  ReportDataSource,
  SemesterRef,
  StudentRef,
  TeacherRef,
} from "@/lib/reports/types";

/** Маппинг статуса attendance_status → канонический (ТЗ, §1.2) */
function mapFact(
  row: {
    status: Enums<"attendance_status">;
    marked_at: string;
    student_id: string;
    lesson_id: string;
    student: { id: string; full_name: string; group_id: string } | null;
    lesson: {
      id: string;
      lesson_date: string;
      pair_number: number;
      lesson_type: Enums<"lesson_type">;
      discipline_id: string;
      group_id: string;
      teacher_id: string | null;
      discipline: { id: string; name: string } | null;
      group: { id: string; name: string } | null;
    } | null;
  },
): AttendanceFact {
  const lesson = row.lesson;
  const status = row.status;

  let presence: AttendanceFact["presence"];
  let absenceReason: AttendanceFact["absenceReason"] = "unknown";

  switch (status) {
    case "present":
      presence = "present";
      break;
    case "late":
      presence = "late";
      break;
    case "sick":
      presence = "absent";
      absenceReason = "respected"; // болезнь = уважительная (до ввода поля absence_reason)
      break;
    default:
      presence = "absent";
      absenceReason = "unknown";
  }

  return {
    lessonId: lesson?.id ?? row.lesson_id,
    lessonDate: lesson?.lesson_date ?? "",
    pairNumber: lesson?.pair_number ?? 0,
    groupId: lesson?.group_id ?? row.student?.group_id ?? "",
    groupName: lesson?.group?.name ?? "",
    studentId: row.student?.id ?? row.student_id,
    studentName: row.student?.full_name ?? "—",
    disciplineId: lesson?.discipline_id ?? "",
    disciplineName: lesson?.discipline?.name ?? "—",
    teacherId: lesson?.teacher_id ?? null,
    lessonType: lesson?.lesson_type ?? "lecture",
    presence,
    absenceReason,
    markedAt: row.marked_at,
  };
}

/**
 * Реализация ReportDataSource поверх Supabase (серверный клиент, RLS).
 * Модуль отчётности работает только через этот интерфейс.
 */
export class SupabaseReportDataSource implements ReportDataSource {
  private async client() {
    return createClient();
  }

  async listSemesters(): Promise<SemesterRef[]> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("semesters")
      .select("id, name, year, term, start_date, end_date")
      .order("start_date", { ascending: true });
    if (error) throw new Error(`Ошибка чтения семестров: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      year: row.year,
      term: row.term,
      startDate: row.start_date,
      endDate: row.end_date,
    }));
  }

  async listGroups(): Promise<GroupRef[]> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("groups")
      .select("id, name")
      .order("name");
    if (error) throw new Error(`Ошибка чтения групп: ${error.message}`);
    return data ?? [];
  }

  async listStudents(filter?: { groupId?: string }): Promise<StudentRef[]> {
    const supabase = await this.client();
    let query = supabase
      .from("students")
      .select("id, full_name, group_id")
      .order("full_name");
    if (filter?.groupId) query = query.eq("group_id", filter.groupId);
    const { data, error } = await query;
    if (error) throw new Error(`Ошибка чтения студентов: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id,
      fullName: row.full_name,
      groupId: row.group_id,
    }));
  }

  async listTeachers(): Promise<TeacherRef[]> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("teachers")
      .select("id, full_name")
      .order("full_name");
    if (error) throw new Error(`Ошибка чтения преподавателей: ${error.message}`);
    return (data ?? []).map((row) => ({ id: row.id, fullName: row.full_name }));
  }

  async listDisciplines(): Promise<DisciplineRef[]> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("disciplines")
      .select("id, name")
      .order("name");
    if (error) throw new Error(`Ошибка чтения дисциплин: ${error.message}`);
    return data ?? [];
  }

  async listLessons(filter: {
    groupIds?: string[];
    disciplineId?: string;
    teacherId?: string;
    from: string;
    to: string;
  }): Promise<LessonRef[]> {
    const supabase = await this.client();
    let query = supabase
      .from("lessons")
      .select(
        `id, lesson_date, pair_number, lesson_type, group_id, discipline_id, teacher_id,
         group:groups(name), discipline:disciplines(name), teacher:teachers(full_name)`,
      )
      .gte("lesson_date", filter.from)
      .lte("lesson_date", filter.to);

    if (filter.groupIds?.length) query = query.in("group_id", filter.groupIds);
    if (filter.disciplineId) query = query.eq("discipline_id", filter.disciplineId);
    if (filter.teacherId) query = query.eq("teacher_id", filter.teacherId);

    const { data, error } = await query;
    if (error) throw new Error(`Ошибка чтения занятий: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id,
      lessonDate: row.lesson_date,
      pairNumber: row.pair_number,
      lessonType: row.lesson_type,
      groupId: row.group_id,
      disciplineId: row.discipline_id,
      teacherId: row.teacher_id,
      groupName:
        (row as { group?: { name: string } | null }).group?.name ?? undefined,
      disciplineName:
        (row as { discipline?: { name: string } | null }).discipline?.name ??
        undefined,
      teacherName:
        (row as { teacher?: { full_name: string } | null }).teacher?.full_name ??
        null,
    }));
  }

  async listAttendance(filter: {
    groupIds?: string[];
    studentIds?: string[];
    lessonIds?: string[];
    disciplineId?: string;
    teacherId?: string;
    from: string;
    to: string;
  }): Promise<AttendanceFact[]> {
    const supabase = await this.client();

    // Сначала определяем интересующие занятия (если фильтры по группе/дисциплине/преподавателю)
    let lessonIds = filter.lessonIds;
    const needLessons =
      filter.groupIds?.length ||
      filter.disciplineId ||
      filter.teacherId ||
      !filter.lessonIds;
    if (needLessons) {
      const lessons = await this.listLessons({
        groupIds: filter.groupIds,
        disciplineId: filter.disciplineId,
        teacherId: filter.teacherId,
        from: filter.from,
        to: filter.to,
      });
      lessonIds = lessons.map((l) => l.id);
    }

    if (!lessonIds || lessonIds.length === 0) return [];

    let query = supabase
      .from("attendance")
      .select(
        `id, lesson_id, student_id, status, marked_at,
         student:students(id, full_name, group_id),
         lesson:lessons(
           id, lesson_date, pair_number, lesson_type,
           discipline_id, group_id, teacher_id,
           discipline:disciplines(id, name),
           group:groups(id, name)
         )`,
      )
      .in("lesson_id", lessonIds)
      .order("marked_at", { ascending: true });

    if (filter.studentIds?.length) {
      query = query.in("student_id", filter.studentIds);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Ошибка чтения посещаемости: ${error.message}`);

    return (data ?? []).map((row) =>
      mapFact(row as unknown as Parameters<typeof mapFact>[0]),
    );
  }
}
