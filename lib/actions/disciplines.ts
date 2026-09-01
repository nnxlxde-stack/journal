"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createDisciplineSchema,
  type CreateDisciplineInput,
} from "@/lib/validation/reference.schema";

export type ReferenceActionState = {
  error?: string;
  success?: boolean;
};

export async function createDiscipline(
  input: CreateDisciplineInput,
): Promise<ReferenceActionState> {
  const parsed = createDisciplineSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("disciplines")
    .insert({ name: parsed.data.name });
  if (error) return { error: error.message };

  revalidatePath("/disciplines");
  return { success: true };
}

export async function deleteDiscipline(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("disciplines").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/disciplines");
}
