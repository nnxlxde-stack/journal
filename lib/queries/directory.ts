import { createClient } from "@/lib/supabase/server";

/** Справочные списки для форм, фильтров и страниц-каталогов. */

export async function getGroups() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id, name")
    .order("name");
  if (error) throw new Error(`Ошибка загрузки групп: ${error.message}`);
  return data;
}

export async function getDisciplines() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("disciplines")
    .select("id, name")
    .order("name");
  if (error) throw new Error(`Ошибка загрузки дисциплин: ${error.message}`);
  return data;
}

export async function getSemesters() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("semesters")
    .select("id, name, year, term")
    .order("year", { ascending: false });
  if (error) throw new Error(`Ошибка загрузки семестров: ${error.message}`);
  return data;
}

export async function getStudents(groupId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("students")
    .select("id, full_name, group_id, group:groups(name)")
    .order("full_name");
  if (groupId) query = query.eq("group_id", groupId);
  const { data, error } = await query;
  if (error) throw new Error(`Ошибка загрузки студентов: ${error.message}`);
  return data as unknown as {
    id: string;
    full_name: string;
    group_id: string;
    group: { name: string } | null;
  }[];
}

export async function getTeachers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("id, full_name")
    .order("full_name");
  if (error) throw new Error(`Ошибка загрузки преподавателей: ${error.message}`);
  return data;
}
