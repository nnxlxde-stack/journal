"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createStudentSchema,
  type CreateStudentInput,
} from "@/lib/validation/reference.schema";

export type ReferenceActionState = {
  error?: string;
  success?: boolean;
};

export async function createStudent(
  input: CreateStudentInput,
): Promise<ReferenceActionState> {
  const parsed = createStudentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("students").insert({
    full_name: parsed.data.fullName,
    group_id: parsed.data.groupId,
  });
  if (error) return { error: error.message };

  revalidatePath("/students");
  return { success: true };
}

export async function deleteStudent(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/students");
}
