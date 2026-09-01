"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createSemesterSchema,
  type CreateSemesterInput,
} from "@/lib/validation/reference.schema";

export type ReferenceActionState = {
  error?: string;
  success?: boolean;
};

export async function createSemester(
  input: CreateSemesterInput,
): Promise<ReferenceActionState> {
  const parsed = createSemesterSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("semesters").insert({
    name: parsed.data.name,
    year: parsed.data.year,
    term: parsed.data.term,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
  });
  if (error) return { error: error.message };

  revalidatePath("/semesters");
  return { success: true };
}

export async function deleteSemester(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("semesters").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/semesters");
}
