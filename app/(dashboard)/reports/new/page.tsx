import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

import { ReportExportButtons } from "@/components/reports/report-export-buttons";
import { ReportOrderForm } from "@/components/reports/report-order-form";
import { ReportView } from "@/components/reports/report-view";
import { reportMeta } from "@/lib/reports/registry";
import { generateReport } from "@/lib/reports/service";
import type { ReportParams } from "@/lib/reports/types";
import { ReportType } from "@/lib/reports/types";
import {
  getDisciplines,
  getGroups,
  getStudents,
  getTeachers,
} from "@/lib/queries/directory";

export const dynamic = "force-dynamic";

const PRESETS = ["today", "week", "month", "semester", "custom"] as const;

function parseType(raw: string | undefined): ReportType {
  if (raw && (Object.values(ReportType) as string[]).includes(raw)) {
    return raw as ReportType;
  }
  return ReportType.GroupAttendanceSheet;
}

/** Типы форм, где группа обязательна */
const GROUP_REQUIRED = new Set<ReportType>([
  ReportType.GroupAttendanceSheet,
  ReportType.GroupAbsenceSummary,
  ReportType.ExpressReport,
]);

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v : undefined;
  };

  const type = parseType(get("type"));
  const meta = reportMeta(type);

  const group = get("group");
  const student = get("student");
  const discipline = get("discipline");
  const teacher = get("teacher");
  const presetRaw = get("preset");
  const preset = PRESETS.includes(presetRaw as (typeof PRESETS)[number])
    ? (presetRaw as (typeof PRESETS)[number])
    : "week";
  const from = get("from") ?? "";
  const to = get("to") ?? "";
  const threshold = Number(get("threshold") ?? "60");

  const [groups, students, disciplines, teachers] = await Promise.all([
    getGroups(),
    getStudents(),
    getDisciplines(),
    getTeachers(),
  ]);

  const reportParams: ReportParams = {
    type,
    scope: {
      groupId: group,
      studentId: student,
      disciplineId: discipline,
      teacherId: teacher,
    },
    period: {
      preset,
      custom: preset === "custom" && from && to ? { from, to } : undefined,
    },
    formats: ["pdf"],
    thresholdPercent: Number.isFinite(threshold) ? threshold : 60,
  };

  // Проверка обязательных фильтров для предпросмотра
  let missing: string | null = null;
  if (GROUP_REQUIRED.has(type) && !group) missing = "группу";
  if (type === ReportType.StudentAttendanceCard && !student) missing = "студента";
  if (type === ReportType.DisciplineAttendance && !discipline)
    missing = "дисциплину";
  if (type === ReportType.TeacherFillingControl && !teacher)
    missing = "преподавателя";

  const result = missing ? null : await generateReport(reportParams);

  const presetLabel =
    preset === "today"
      ? "Сегодня"
      : preset === "week"
        ? "Неделя"
        : preset === "month"
          ? "Месяц"
          : preset === "semester"
            ? "Семестр"
            : "Произвольный период";

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/reports"
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        К списку отчётов
      </Link>

      <div className="glass flex flex-col gap-4 rounded-2xl px-5 py-4 shadow-lg shadow-black/40">
        <div>
          <h2 className="font-heading text-lg font-semibold">{meta?.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta?.description}
          </p>
        </div>

        <ReportOrderForm
          meta={meta!}
          groups={groups.map((g) => ({ id: g.id, name: g.name }))}
          students={students.map((s) => ({
            id: s.id,
            name: s.full_name,
            group_id: s.group_id,
          }))}
          disciplines={disciplines.map((d) => ({ id: d.id, name: d.name }))}
          teachers={teachers.map((t) => ({ id: t.id, name: t.full_name }))}
        />

        <p className="text-xs text-muted-foreground">
          Период: <span className="text-foreground">{presetLabel}</span>
        </p>
      </div>

      {missing ? (
        <div className="glass rounded-2xl px-6 py-12 text-center text-sm text-muted-foreground shadow-lg shadow-black/40">
          Выберите {missing}, чтобы увидеть предпросмотр.
        </div>
      ) : result && !result.ok ? (
        <div className="glass rounded-2xl px-6 py-6 text-sm text-rose-500 shadow-lg shadow-black/40">
          {result.error}
        </div>
      ) : result && result.ok ? (
        <div className="flex flex-col gap-3">
          <div className="glass flex flex-wrap items-center gap-3 rounded-2xl px-5 py-3 shadow-lg shadow-black/40">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              <Download className="size-4 text-primary" />
              Экспорт
            </span>
            <ReportExportButtons params={reportParams} />
          </div>
          <ReportView report={result.report} />
        </div>
      ) : null}
    </div>
  );
}
