"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  bulkMarkAttendanceSchema,
  markAttendanceSchema,
  type BulkMarkAttendanceInput,
  type MarkAttendanceInput,
} from "@/lib/validation/attendance.schema";

export type AttendanceActionState = {
  error?: string;
  success?: boolean;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Быстрая отметка одного студента (toggle в ячейке таблицы / карточке). */
export async function markAttendance(
  input: MarkAttendanceInput,
): Promise<AttendanceActionState> {
  const parsed = markAttendanceSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректные данные" };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Не авторизован" };

  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("lesson_id", parsed.data.lessonId)
    .eq("student_id", parsed.data.studentId)
    .maybeSingle();

  const payload = {
    lesson_id: parsed.data.lessonId,
    student_id: parsed.data.studentId,
    status: parsed.data.status,
    marked_by: user.id,
  };

  const { error } = existing
    ? await supabase.from("attendance").update(payload).eq("id", existing.id)
    : await supabase.from("attendance").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/journal");
  revalidatePath(`/journal/${parsed.data.lessonId}`);
  return { success: true };
}

/** Массовая отметка группы студентов (bulk action). */
export async function bulkMarkAttendance(
  input: BulkMarkAttendanceInput,
): Promise<AttendanceActionState> {
  const parsed = bulkMarkAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Не авторизован" };

  const rows = parsed.data.entries.map((entry) => ({
    lesson_id: parsed.data.lessonId,
    student_id: entry.studentId,
    status: entry.status,
    marked_by: user.id,
  }));

  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "lesson_id,student_id" });

  if (error) return { error: error.message };

  revalidatePath("/journal");
  revalidatePath(`/journal/${parsed.data.lessonId}`);
  return { success: true };
}
