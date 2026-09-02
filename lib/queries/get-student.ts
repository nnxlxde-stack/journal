import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/types/database.types";

export type StudentWithHistory = {
  id: string;
  full_name: string;
  group: { id: string; name: string } | null;
  history: {
    id: string;
    status: Enums<"attendance_status">;
    marked_at: string;
    lesson: {
      lesson_date: string;
      pair_number: number;
      lesson_type: Enums<"lesson_type">;
      discipline: { name: string } | null;
    } | null;
  }[];
};

/** Студент + история посещаемости (для карточки студента). */
export const getStudentWithHistory = cache(async (
  studentId: string,
): Promise<StudentWithHistory | null> => {
  const supabase = await createClient();

  const { data: student, error } = await supabase
    .from("students")
    .select("id, full_name, group_id, group:groups(id, name)")
    .eq("id", studentId)
    .single();
  if (error) return null;

  const { data: attendance } = await supabase
    .from("attendance")
    .select(
      `id, status, marked_at,
       lesson:lessons(lesson_date, pair_number, lesson_type, discipline:disciplines(name))`,
    )
    .eq("student_id", studentId);

  const history = (attendance ?? [])
    .map((row) => ({
      id: row.id,
      status: row.status,
      marked_at: row.marked_at,
      lesson: row.lesson,
    }))
    .sort((a, b) =>
      (b.lesson?.lesson_date ?? "").localeCompare(a.lesson?.lesson_date ?? ""),
    );

  return {
    ...(student as { id: string; full_name: string; group: { id: string; name: string } | null }),
    history,
  } as unknown as StudentWithHistory;
});
