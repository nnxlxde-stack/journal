"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/types/database.types";
import {
  createLessonSchema,
  updateLessonSchema,
  type CreateLessonInput,
  type UpdateLessonInput,
} from "@/lib/validation/lesson.schema";

export type LessonActionState = {
  error?: string;
  success?: boolean;
};

/** Создание занятия. Валидация дублируется на сервере (общая zod-схема). */
export async function createLesson(
  input: CreateLessonInput,
): Promise<LessonActionState> {
  const parsed = createLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lessons").insert({
    semester_id: parsed.data.semesterId,
    discipline_id: parsed.data.disciplineId,
    group_id: parsed.data.groupId,
    teacher_id: parsed.data.teacherId ?? null,
    lesson_date: parsed.data.lessonDate,
    pair_number: parsed.data.pairNumber,
    lesson_type: parsed.data.lessonType,
  });

  if (error) return { error: error.message };

  revalidatePath("/journal");
  return { success: true };
}

/** Обновление занятия. */
export async function updateLesson(
  input: UpdateLessonInput,
): Promise<LessonActionState> {
  const parsed = updateLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const { id, ...rest } = parsed.data;
  const supabase = await createClient();

  const patch: TablesUpdate<"lessons"> = {};
  if (rest.semesterId !== undefined) patch.semester_id = rest.semesterId;
  if (rest.disciplineId !== undefined) patch.discipline_id = rest.disciplineId;
  if (rest.groupId !== undefined) patch.group_id = rest.groupId;
  if (rest.teacherId !== undefined) patch.teacher_id = rest.teacherId;
  if (rest.lessonDate !== undefined) patch.lesson_date = rest.lessonDate;
  if (rest.pairNumber !== undefined) patch.pair_number = rest.pairNumber;
  if (rest.lessonType !== undefined) patch.lesson_type = rest.lessonType;

  const { error } = await supabase.from("lessons").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/journal");
  revalidatePath(`/journal/${id}`);
  return { success: true };
}

/** Удаление занятия (каскадно удаляет отметки посещаемости). */
export async function deleteLesson(id: string): Promise<LessonActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/journal");
  return { success: true };
}
