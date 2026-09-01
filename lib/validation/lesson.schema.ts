import { z } from "zod";

/** Типы занятий из схемы БД (lesson_type) */
export const lessonTypeSchema = z.enum([
  "lecture",
  "practice",
  "lab",
  "exam",
  "credit",
]);

/**
 * Создание занятия.
 * lessonDate/pairNumber принимают строки из формы (date/number input),
 * pairNumber приводится к number через transform.
 */
export const createLessonSchema = z.object({
  semesterId: z.uuid("Выберите семестр"),
  disciplineId: z.uuid("Выберите дисциплину"),
  groupId: z.uuid("Выберите группу"),
  teacherId: z.uuid().nullable().optional(),
  lessonDate: z.string().min(1, "Укажите дату занятия"),
  pairNumber: z
    .union([
      z.string().regex(/^[1-8]$/, "Пара от 1 до 8"),
      z.number().int().min(1).max(8),
    ])
    .transform((value) => Number(value)),
  lessonType: lessonTypeSchema.default("lecture"),
});

/** Обновление занятия — все поля опциональны, кроме id */
export const updateLessonSchema = createLessonSchema.partial().extend({
  id: z.uuid(),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
