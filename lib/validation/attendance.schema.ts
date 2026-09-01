import { z } from "zod";

/** Статусы посещаемости из схемы БД (attendance_status) */
export const attendanceStatusSchema = z.enum([
  "present",
  "absent_unknown",
  "late",
  "sick",
]);

/** Одиночная отметка (toggle в ячейке) */
export const markAttendanceSchema = z.object({
  lessonId: z.uuid(),
  studentId: z.uuid(),
  status: attendanceStatusSchema,
});

/** Массовая отметка группы (bulk) */
export const bulkMarkAttendanceSchema = z.object({
  lessonId: z.uuid(),
  entries: z
    .array(
      z.object({
        studentId: z.uuid(),
        status: attendanceStatusSchema,
      }),
    )
    .min(1, "Не выбрано ни одного студента"),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type BulkMarkAttendanceInput = z.infer<typeof bulkMarkAttendanceSchema>;
