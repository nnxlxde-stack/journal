import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Введите название группы").max(100),
});

export const createDisciplineSchema = z.object({
  name: z.string().trim().min(1, "Введите название дисциплины").max(200),
});

export const createSemesterSchema = z.object({
  name: z.string().trim().min(1, "Введите название семестра").max(100),
  year: z
    .union([
      z.string().regex(/^\d{4}$/, "Укажите год (4 цифры)"),
      z.number().int().min(2000).max(2100),
    ])
    .transform((value) => Number(value)),
  term: z.union([z.literal(1), z.literal(2)]),
  startDate: z.string().min(1, "Укажите дату начала"),
  endDate: z.string().min(1, "Укажите дату окончания"),
});

export const createStudentSchema = z.object({
  fullName: z.string().trim().min(1, "Введите ФИО").max(200),
  groupId: z.uuid("Выберите группу"),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateDisciplineInput = z.infer<typeof createDisciplineSchema>;
export type CreateSemesterInput = z.infer<typeof createSemesterSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
