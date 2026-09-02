import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database.types";

export type AttendanceStats = {
  total: number;
  present: number;
  late: number;
  sick: number;
  absent: number;
  /** Процент присутствия (present + late) от общего числа отметок, 0-100 */
  percent: number;
};

export type StudentStats = AttendanceStats & {
  student_id: string;
  full_name: string;
};

/**
 * Сводная статистика посещаемости.
 * @param studentId — если передан, считает по одному студенту (карточка студента)
 */
export const getAttendanceStats = cache(async (
  studentId?: string,
): Promise<AttendanceStats> => {
  const supabase = await createClient();

  let query = supabase.from("attendance").select("status");
  if (studentId) query = query.eq("student_id", studentId);

  const { data, error } = await query;
  if (error) throw new Error(`Ошибка статистики: ${error.message}`);

  return summarize(data?.map((row) => row.status) ?? []);
});

/** Статистика по каждому студенту в группе (для журнала и аналитики) */
export const getStudentsStats = cache(async (
  groupId?: string,
): Promise<StudentStats[]> => {
  const supabase = await createClient();

  let query = supabase
    .from("attendance")
    .select("student_id, status, student:students(full_name, group_id)");
  if (groupId) query = query.eq("student:students.group_id", groupId);

  const { data, error } = await query;
  if (error) throw new Error(`Ошибка статистики: ${error.message}`);

  const byStudent = new Map<string, { full_name: string; statuses: Enums<"attendance_status">[] }>();
  for (const row of data ?? []) {
    const student = row.student;
    if (!student) continue;
    const entry = byStudent.get(row.student_id) ?? {
      full_name: student.full_name,
      statuses: [],
    };
    entry.statuses.push(row.status);
    byStudent.set(row.student_id, entry);
  }

  return [...byStudent.entries()].map(([student_id, { full_name, statuses }]) => ({
    student_id,
    full_name,
    ...summarize(statuses),
  }));
});

function summarize(statuses: Enums<"attendance_status">[]): AttendanceStats {
  const total = statuses.length;
  const present = statuses.filter((s) => s === "present").length;
  const late = statuses.filter((s) => s === "late").length;
  const sick = statuses.filter((s) => s === "sick").length;
  const absent = statuses.filter((s) => s === "absent_unknown").length;
  const percent = total === 0 ? 0 : Math.round(((present + late) / total) * 100);
  return { total, present, late, sick, absent, percent };
}
