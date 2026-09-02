import type { ReportTypeMeta } from "@/lib/reports/types";
import { ReportType } from "@/lib/reports/types";

/** Метаданные всех форм (меню заказа строится поверх этого) */
export const REPORT_TYPES: ReportTypeMeta[] = [
  {
    type: ReportType.GroupAttendanceSheet,
    category: "group",
    title: "Ведомость посещаемости группы",
    description: "Таблица «студент × пара» за период с итоговым % по каждому студенту и группе.",
    defaultCustomer: "Староста / куратор",
    defaultFormats: ["xlsx", "pdf"],
    supportsOnScreen: true,
    available: true,
  },
  {
    type: ReportType.GroupAbsenceSummary,
    category: "group",
    title: "Сводка пропусков по группе",
    description: "Пропуски (уважительные / без причины) и опоздания по каждому студенту, сортировка по убыванию.",
    defaultCustomer: "Куратор",
    defaultFormats: ["xlsx"],
    supportsOnScreen: true,
    available: true,
  },
  {
    type: ReportType.StudentAttendanceCard,
    category: "student",
    title: "Персональная карточка посещаемости",
    description: "Детализация по дисциплинам и типам занятий за период.",
    defaultCustomer: "Студент / куратор",
    defaultFormats: ["pdf"],
    supportsOnScreen: true,
    available: true,
  },
  {
    type: ReportType.StudentAttendanceCertificate,
    category: "student",
    title: "Справка о посещаемости",
    description: "Официальный документ для деканата/стипендиальной комиссии (DOCX/PDF с шапкой КамчатГТУ).",
    defaultCustomer: "Деканат",
    defaultFormats: ["docx", "pdf"],
    supportsOnScreen: false,
    available: false,
  },
  {
    type: ReportType.TeacherFillingControl,
    category: "teacher_discipline",
    title: "Контроль заполнения журнала преподавателем",
    description: "Сколько пар отмечено и сколько пропущено отметок по преподавателю (дисциплина ведения журнала).",
    defaultCustomer: "Зав. кафедрой",
    defaultFormats: ["xlsx"],
    supportsOnScreen: true,
    available: true,
  },
  {
    type: ReportType.DisciplineAttendance,
    category: "teacher_discipline",
    title: "Посещаемость по дисциплине",
    description: "Агрегация по всем группам, изучающим дисциплину.",
    defaultCustomer: "Преподаватель",
    defaultFormats: ["xlsx", "pdf"],
    supportsOnScreen: true,
    available: true,
  },
  {
    type: ReportType.DepartmentInstituteSummary,
    category: "department_institute",
    title: "Сводный отчёт по кафедре/институту",
    description: "Средний % посещаемости и тренд. Требует справочников кафедр/институтов.",
    defaultCustomer: "Декан",
    defaultFormats: ["xlsx", "pdf"],
    supportsOnScreen: true,
    available: false,
  },
  {
    type: ReportType.GroupAttendanceRating,
    category: "department_institute",
    title: "Рейтинг групп по посещаемости",
    description: "Топ и антитоп групп за период (все группы, фильтр по периоду).",
    defaultCustomer: "Деканат",
    defaultFormats: ["xlsx"],
    supportsOnScreen: true,
    available: true,
  },
  {
    type: ReportType.AbsenceReasonsReport,
    category: "department_institute",
    title: "Отчёт по причинам отсутствия",
    description: "Пропуски по уважительной причине и без указания причины по группам и дисциплинам.",
    defaultCustomer: "Деканат",
    defaultFormats: ["xlsx"],
    supportsOnScreen: true,
    available: true,
  },
  {
    type: ReportType.ExpressReport,
    category: "operational",
    title: "Экспресс-отчёт (сегодня/неделя)",
    description: "Быстрый просмотр посещаемости группы без сложных фильтров.",
    defaultCustomer: "Староста / куратор",
    defaultFormats: ["pdf"],
    supportsOnScreen: true,
    available: true,
  },
  {
    type: ReportType.ChronicAbsenteesReport,
    category: "operational",
    title: "Хронические прогульщики",
    description: "Студенты с % посещаемости ниже порога (по умолчанию 60%).",
    defaultCustomer: "Куратор / деканат",
    defaultFormats: ["xlsx"],
    supportsOnScreen: true,
    available: true,
  },
];

export function reportMeta(type: ReportType): ReportTypeMeta | undefined {
  return REPORT_TYPES.find((m) => m.type === type);
}

export function reportsByCategory(category: ReportTypeMeta["category"]) {
  return REPORT_TYPES.filter((m) => m.category === category);
}
