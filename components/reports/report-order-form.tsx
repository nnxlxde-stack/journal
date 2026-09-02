"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportTypeMeta } from "@/lib/reports/types";
import { ReportType } from "@/lib/reports/types";

type Option = { id: string; name: string };

function FieldSelect({
  label,
  options,
  value,
  onSelect,
  placeholder,
  allowAll,
  allLabel = "Все группы",
}: {
  label: string;
  options: Option[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder: string;
  allowAll?: boolean;
  allLabel?: string;
}) {
  const list = allowAll ? [{ id: "__all__", name: allLabel }, ...options] : options;
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select
        aria-label={label}
        className="w-full"
        selectedKey={value || (allowAll ? "__all__" : "__none__")}
        onSelectionChange={(key) => {
          const v = key ? String(key) : "";
          onSelect(v === "__all__" ? "" : v);
        }}
      >
        <SelectTrigger className="h-11! w-full rounded-xl">
          <SelectValue>
            {(state) =>
              state.selectedItems.length > 0
                ? state.selectedText
                : placeholder
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {list.map((option) => (
            <SelectItem
              key={option.id}
              id={option.id}
              textValue={option.name}
            >
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function needsGroup(type: ReportType) {
  return (
    type === ReportType.GroupAttendanceSheet ||
    type === ReportType.GroupAbsenceSummary ||
    type === ReportType.ExpressReport ||
    type === ReportType.ChronicAbsenteesReport ||
    type === ReportType.AbsenceReasonsReport
  );
}

/** Группа необязательна (есть вариант «Все группы») */
function groupOptional(type: ReportType) {
  return (
    type === ReportType.ChronicAbsenteesReport ||
    type === ReportType.AbsenceReasonsReport
  );
}

function OrderFormInner({
  meta,
  groups,
  students,
  disciplines,
  teachers,
}: {
  meta: ReportTypeMeta;
  groups: Option[];
  students: Option[];
  disciplines: Option[];
  teachers: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const group = searchParams.get("group") ?? undefined;
  const student = searchParams.get("student") ?? undefined;
  const discipline = searchParams.get("discipline") ?? undefined;
  const teacher = searchParams.get("teacher") ?? undefined;
  const preset = searchParams.get("preset") ?? "week";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const threshold = searchParams.get("threshold") ?? "60";

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", meta.type);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const showStudent = meta.type === ReportType.StudentAttendanceCard;
  const showDiscipline = meta.type === ReportType.DisciplineAttendance;
  const showTeacher = meta.type === ReportType.TeacherFillingControl;
  const showGroup = needsGroup(meta.type);
  const groupAllowAll = groupOptional(meta.type);
  const isChronic = meta.type === ReportType.ChronicAbsenteesReport;
  const isCustom = preset === "custom";

  const groupStudents = group
    ? students.filter(
        (s) =>
          s.id === group || (s as Option & { group_id?: string }).group_id === group,
      )
    : students;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {showGroup ? (
          <FieldSelect
            label={groupAllowAll ? "Группа (необязательно)" : "Группа"}
            placeholder="Выберите группу"
            options={groups}
            value={group}
            onSelect={(v) => setParam("group", v)}
            allowAll={groupAllowAll}
          />
        ) : null}

        {showStudent ? (
          <FieldSelect
            label="Студент"
            placeholder="Выберите студента"
            options={groupStudents}
            value={student}
            onSelect={(v) => setParam("student", v)}
          />
        ) : null}

        {showDiscipline ? (
          <FieldSelect
            label="Дисциплина"
            placeholder="Выберите дисциплину"
            options={disciplines}
            value={discipline}
            onSelect={(v) => setParam("discipline", v)}
          />
        ) : null}

        {showTeacher ? (
          <FieldSelect
            label="Преподаватель"
            placeholder="Выберите преподавателя"
            options={teachers}
            value={teacher}
            onSelect={(v) => setParam("teacher", v)}
          />
        ) : null}

        <FieldSelect
          label="Период"
          placeholder="Период"
          options={[
            { id: "today", name: "Сегодня" },
            { id: "week", name: "Неделя" },
            { id: "month", name: "Месяц" },
            { id: "semester", name: "Семестр" },
            { id: "custom", name: "Произвольный" },
          ]}
          value={preset}
          onSelect={(v) => setParam("preset", v || "week")}
        />

        {isChronic ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="threshold">Порог, %</Label>
            <Input
              id="threshold"
              type="number"
              min={1}
              max={99}
              value={threshold}
              onChange={(e) => setParam("threshold", e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        ) : null}
      </div>

      {isCustom ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="from">С</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setParam("from", e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="to">По</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setParam("to", e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">{meta.description}</p>
    </div>
  );
}

/** Мастер заказа отчёта: параметры обновляют URL и отчёт перегенерируется на сервере */
export function ReportOrderForm(props: {
  meta: ReportTypeMeta;
  groups: Option[];
  students: (Option & { group_id?: string })[];
  disciplines: Option[];
  teachers: Option[];
}) {
  return (
    <Suspense>
      <OrderFormInner {...props} />
    </Suspense>
  );
}
