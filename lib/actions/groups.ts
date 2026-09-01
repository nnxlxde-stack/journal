"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createGroupSchema,
  type CreateGroupInput,
} from "@/lib/validation/reference.schema";

export type ReferenceActionState = {
  error?: string;
  success?: boolean;
};

export async function createGroup(
  input: CreateGroupInput,
): Promise<ReferenceActionState> {
  const parsed = createGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("groups").insert({ name: parsed.data.name });
  if (error) return { error: error.message };

  revalidatePath("/groups");
  return { success: true };
}

export async function deleteGroup(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/groups");
}
