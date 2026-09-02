import { groupAttendanceSheet } from "@/lib/reports/aggregators/group-attendance";
import { groupAbsenceSummary } from "@/lib/reports/aggregators/group-absences";
import { studentAttendanceCard } from "@/lib/reports/aggregators/student-card";
import { disciplineAttendance } from "@/lib/reports/aggregators/discipline-attendance";
import { chronicAbsentees } from "@/lib/reports/aggregators/chronic-absentees";
import { groupAttendanceRating } from "@/lib/reports/aggregators/group-rating";
import { absenceReasonsReport } from "@/lib/reports/aggregators/absence-reasons";
import { teacherFillingControl } from "@/lib/reports/aggregators/teacher-filling";
import type { Aggregator } from "@/lib/reports/aggregators/shared";
import type { ReportType } from "@/lib/reports/types";
import { ReportType as RT } from "@/lib/reports/types";

/**
 * Реестр агрегаторов по типу формы.
 * Недоступные формы (см. registry.REPORT_TYPES[*].available) здесь отсутствуют.
 */
export const AGGREGATORS: Partial<Record<ReportType, Aggregator>> = {
  [RT.GroupAttendanceSheet]: groupAttendanceSheet,
  [RT.GroupAbsenceSummary]: groupAbsenceSummary,
  [RT.StudentAttendanceCard]: studentAttendanceCard,
  [RT.DisciplineAttendance]: disciplineAttendance,
  [RT.ChronicAbsenteesReport]: chronicAbsentees,
  [RT.GroupAttendanceRating]: groupAttendanceRating,
  [RT.AbsenceReasonsReport]: absenceReasonsReport,
  [RT.TeacherFillingControl]: teacherFillingControl,
  // Экспресс-отчёт «сегодня/неделя» — та же ведомость по группе
  [RT.ExpressReport]: groupAttendanceSheet,
};
