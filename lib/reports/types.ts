/**
 * Финализированная схема данных модуля аналитических форм.
 * Архитектурный контекст — docs/reporting-architecture.md, ТЗ — docs/analytics-forms.md.
 *
 * Слои: агрегация (ReportDataSource → AggregatedReport) →
 *       рендер (AggregatedReport → RenderedFile) →
 *       доставка (GeneratedReport → DeliveryResult).
 */

// =============================================================
// 1. Базовые доменные типы (маппинг на схему БД — см. документ §1.2)
// =============================================================

/** Каноническое присутствие студента на паре */
export type AttendancePresence = "present" | "absent" | "late";

/** Причина отсутствия (в текущей схеме выводится: sick → respected, absent_unknown → unknown) */
export type AbsenceReason = "respected" | "unrespected" | "unknown";

export type LessonType = "lecture" | "practice" | "lab" | "exam" | "credit";

export interface SemesterRef {
  id: string;
  name: string;
  year: number;
  term: 1 | 2;
  startDate: string;
  endDate: string;
}

export interface GroupRef {
  id: string;
  name: string;
  /** расширение схемы: кафедра группы (опционально) */
  departmentId?: string;
}

export interface StudentRef {
  id: string;
  fullName: string;
  groupId: string;
  /** расширение схемы: номер зачётки */
  recordBook?: string;
}

export interface TeacherRef {
  id: string;
  fullName: string;
  departmentId?: string;
}

export interface DisciplineRef {
  id: string;
  name: string;
}

export interface LessonRef {
  id: string;
  lessonDate: string;
  pairNumber: number;
  lessonType: LessonType;
  groupId: string;
  disciplineId: string;
  teacherId: string | null;
  /** отображаемые имена (опционально, заполняются адаптером) */
  groupName?: string;
  disciplineName?: string;
  teacherName?: string | null;
}

/** Факт посещаемости в каноническом виде (уже смаплен из attendance_status) */
export interface AttendanceFact {
  lessonId: string;
  lessonDate: string;
  pairNumber: number;
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  disciplineId: string;
  disciplineName: string;
  teacherId: string | null;
  lessonType: LessonType;
  presence: AttendancePresence;
  absenceReason: AbsenceReason;
  markedAt: string | null;
}

// =============================================================
// 2. ReportDataSource — абстрактный источник данных (слой агрегации)
// =============================================================

export interface ReportDataSource {
  listSemesters(): Promise<SemesterRef[]>;
  listGroups(filter?: { departmentId?: string }): Promise<GroupRef[]>;
  listStudents(filter?: { groupId?: string }): Promise<StudentRef[]>;
  listTeachers(filter?: { departmentId?: string }): Promise<TeacherRef[]>;
  listDisciplines(): Promise<DisciplineRef[]>;
  listLessons(filter: {
    groupIds?: string[];
    disciplineId?: string;
    teacherId?: string;
    from: string;
    to: string;
  }): Promise<LessonRef[]>;
  listAttendance(filter: {
    groupIds?: string[];
    studentIds?: string[];
    lessonIds?: string[];
    disciplineId?: string;
    teacherId?: string;
    from: string;
    to: string;
  }): Promise<AttendanceFact[]>;
}

// =============================================================
// 3. ReportType / ReportParams — перечень форм и параметры заказа
// =============================================================

/** Перечень отчётных форм (ТЗ, раздел 1) */
export enum ReportType {
  /** 1.1 Ведомость посещаемости группы за период */
  GroupAttendanceSheet = "group_attendance_sheet",
  /** 1.1 Сводка пропусков по группе (уваж./неуваж./опоздания, сортировка ↓) */
  GroupAbsenceSummary = "group_absence_summary",
  /** 1.2 Персональная карточка: по дисциплинам и типам занятий */
  StudentAttendanceCard = "student_attendance_card",
  /** 1.2 Справка о посещаемости (официальный документ, DOCX/PDF) */
  StudentAttendanceCertificate = "student_attendance_certificate",
  /** 1.3 Контроль заполнения журнала преподавателем */
  TeacherFillingControl = "teacher_filling_control",
  /** 1.3 Посещаемость по дисциплине (по группам) */
  DisciplineAttendance = "discipline_attendance",
  /** 1.4 Сводный отчёт по кафедре/институту (средний %, тренд) */
  DepartmentInstituteSummary = "department_institute_summary",
  /** 1.4 Рейтинг групп/курсов по посещаемости */
  GroupAttendanceRating = "group_attendance_rating",
  /** 1.4 Отчёт по причинам отсутствия */
  AbsenceReasonsReport = "absence_reasons_report",
  /** 1.5 Экспресс-отчёт «на сегодня/на неделю» */
  ExpressReport = "express_report",
  /** 1.5 Хронические прогульщики (% ниже порога) */
  ChronicAbsenteesReport = "chronic_absentees_report",
}

/** Категории форм для группировки в меню заказа */
export type ReportCategory =
  | "group"
  | "student"
  | "teacher_discipline"
  | "department_institute"
  | "operational";

/** Форматы экспорта */
export type ReportFormat = "pdf" | "xlsx" | "docx";

/** Метаданные формы: название, описание, заказчик, форматы по умолчанию */
export interface ReportTypeMeta {
  type: ReportType;
  category: ReportCategory;
  title: string;
  description: string;
  defaultCustomer: string;
  defaultFormats: ReportFormat[];
  /** поддерживает ли интерактивный экранный просмотр */
  supportsOnScreen: boolean;
  /** реализована ли форма (доступна для генерации) */
  available: boolean;
  /** если форма недоступна — краткая причина (для UI) */
  unavailableReason?: string;
}

/** Период: пресет или произвольный диапазон дат (ISO yyyy-mm-dd) */
export type PeriodPreset = "today" | "week" | "month" | "semester" | "custom";

export interface DateRange {
  from: string;
  to: string;
}

export interface PeriodSelection {
  preset: PeriodPreset;
  custom?: DateRange;
}

/** Область действия (каскад: институт → кафедра → группа/преподаватель/дисциплина) */
export interface ReportScope {
  instituteId?: string; // расширение схемы
  departmentId?: string; // расширение схемы
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  disciplineId?: string;
}

/** Параметры заказа формы */
export interface ReportParams {
  type: ReportType;
  scope: ReportScope;
  period: PeriodSelection;
  formats: ReportFormat[];
  /** доп. фильтры конкретной формы */
  thresholdPercent?: number; // chronic_absentees
  absenceReasons?: AbsenceReason[];
  lessonTypes?: LessonType[];
}

// =============================================================
// 4. Каноническая модель результата агрегации (не зависит от формата)
// =============================================================

export type ColumnKind = "text" | "number" | "percent" | "date" | "status";

export interface ReportColumn {
  key: string;
  title: string;
  kind?: ColumnKind;
  /** подсветка значений ниже порога (напр., % посещаемости < 60) */
  highlightLowThreshold?: number;
}

export interface ReportTable {
  title?: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  /** строка итогов (по группе/периоду) */
  totalsRow?: Record<string, unknown>;
}

export interface AggregatedReport {
  type: ReportType;
  title: string;
  scopeLabel: string;
  period: PeriodSelection;
  createdAt: string;
  tables: ReportTable[];
  meta?: Record<string, unknown>;
}

// =============================================================
// 5. Слой рендера: шаблон и файлы
// =============================================================

export interface ReportTemplate {
  /** шапка: «ФГБОУ ВО КамчатГТУ», институт/кафедра/название/период/дата */
  headerTitle: string;
  headerSubtitle: string;
  footerText: string;
  fontFamily: string;
  /** показывать блок подписи/печати (официальные формы) */
  showSignatureBlock: boolean;
  /** кириллица обязательна */
  supportCyrillic: true;
}

export interface RenderedFile {
  format: ReportFormat;
  data: Uint8Array;
  mimeType: string;
  sizeBytes: number;
}

export interface ReportRenderer {
  /** один шаблон → разные рендереры форматов */
  render(
    report: AggregatedReport,
    format: ReportFormat,
    template: ReportTemplate,
  ): Promise<RenderedFile>;
}

// =============================================================
// 6. Сгенерированный отчёт (результат генерации — файлы + метаданные)
// =============================================================

export interface GeneratedReport {
  id: string;
  orderId: string;
  type: ReportType;
  params: ReportParams;
  aggregated: AggregatedReport;
  files: RenderedFile[];
  /** хэш данных — для повторного скачивания без пересчёта */
  dataHash: string;
  createdAt: string;
  ownerUserId: string;
}

// =============================================================
// 7. Слой доставки (независим от генерации)
// =============================================================

export type DeliveryMethodKind = "screen" | "email" | "internal" | "download";

/** Адресат доставки */
export interface DeliveryTarget {
  kind: DeliveryMethodKind;
  /** email — получатель (в т.ч. внешний адрес деканата) */
  email?: string;
  /** internal — получатель-пользователь системы */
  recipientUserId?: string;
  /** email: тема/текст/подпись; internal: комментарий при передаче */
  subject?: string;
  message?: string;
  note?: string;
}

export type DeliveryResultStatus =
  | "queued"
  | "sending"
  | "sent"
  | "error";

export interface DeliveryResult {
  status: DeliveryResultStatus;
  deliveredAt?: string;
  error?: string;
}

export interface ReportDeliveryMethod {
  kind: DeliveryMethodKind;
  /** один GeneratedReport может доставляться несколькими методами без перегенерации */
  deliver(
    report: GeneratedReport,
    target: DeliveryTarget,
  ): Promise<DeliveryResult>;
}

// =============================================================
// 8. Заказы, история, шаблоны
// =============================================================

export type ReportOrderStatus =
  | "queued"
  | "aggregating"
  | "rendering"
  | "ready"
  | "error";

export interface ReportOrder {
  id: string;
  userId: string;
  params: ReportParams;
  status: ReportOrderStatus;
  error?: string;
  reportId?: string;
  dataHash?: string;
  createdAt: string;
  finishedAt?: string;
}

/** История доставок по заказу (аудит: кому, когда, какая форма) */
export interface ReportDeliveryLogEntry {
  id: string;
  orderId: string;
  method: DeliveryMethodKind;
  target: DeliveryTarget;
  status: DeliveryResultStatus;
  error?: string;
  sentAt?: string;
}

/** Сохранённый шаблон регулярного заказа */
export interface ReportTemplateOrder {
  id: string;
  userId: string;
  name: string;
  params: ReportParams;
  /** cron-выражение для планирования (опционально) */
  cron?: string;
}

/** Точка входа модуля: регистрация агрегаторов/рендереров/методов доставки */
export interface ReportRegistry {
  metas(): ReportTypeMeta[];
  meta(type: ReportType): ReportTypeMeta | undefined;
}
