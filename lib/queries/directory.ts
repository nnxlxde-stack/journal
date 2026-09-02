import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * Справочные списки для форм, фильтров и страниц-каталогов.
 * Обёрнуты в React cache(): если один список запрашивается несколько раз
 * в рамках одного серверного рендера (например, layout + страница) —
 * выполняется только один запрос к БД.
 */

export const getGroups = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id, name")
    .order("name");
  if (error) throw new Error(`Ошибка загрузки групп: ${error.message}`);
  return data;
});

export const getDisciplines = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("disciplines")
    .select("id, name")
    .order("name");
  if (error) throw new Error(`Ошибка загрузки дисциплин: ${error.message}`);
  return data;
});

export const getSemesters = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("semesters")
    .select("id, name, year, term")
    .order("year", { ascending: false });
  if (error) throw new Error(`Ошибка загрузки семестров: ${error.message}`);
  return data;
});

export const getStudents = cache(async (groupId?: string) => {
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
});

export const getTeachers = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("id, full_name")
    .order("full_name");
  if (error) throw new Error(`Ошибка загрузки преподавателей: ${error.message}`);
  return data;
});
