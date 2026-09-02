import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { REPORT_TYPES } from "@/lib/reports/registry";
import type { ReportTypeMeta } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

const CATEGORIES: {
  key: ReportTypeMeta["category"];
  label: string;
  hint: string;
}[] = [
  { key: "group", label: "По группе", hint: "Ведомости и сводки для старост и кураторов" },
  { key: "student", label: "По студенту", hint: "Карточки и справки" },
  { key: "teacher_discipline", label: "Преподаватель / дисциплина", hint: "Контроль заполнения и посещаемость по дисциплине" },
  { key: "department_institute", label: "Кафедра / институт", hint: "Управленческая аналитика для деканата" },
  { key: "operational", label: "Оперативные", hint: "Быстрые отчёты для ежедневной работы" },
];

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Отчёты</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Аналитические формы посещаемости. Выберите форму, настройте параметры
          и посмотрите результат на экране.
        </p>
      </div>

      {CATEGORIES.map((category) => {
        const items = REPORT_TYPES.filter((m) => m.category === category.key);
        if (items.length === 0) return null;
        return (
          <div key={category.key} className="flex flex-col gap-3">
            <div>
              <h3 className="font-heading text-base font-semibold">
                {category.label}
              </h3>
              <p className="text-xs text-muted-foreground">{category.hint}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((meta) => (
                <Card
                  key={meta.type}
                  className={cn(
                    "glass rounded-2xl shadow-lg shadow-black/40",
                    !meta.available && "opacity-60",
                  )}
                >
                  {meta.available ? (
                    <Link
                      href={`/reports/new?type=${meta.type}`}
                      className="block h-full"
                    >
                      <ReportCardBody meta={meta} />
                    </Link>
                  ) : (
                    <ReportCardBody meta={meta} />
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReportCardBody({ meta }: { meta: ReportTypeMeta }) {
  return (
    <CardContent className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15">
          <FileText className="size-4 text-primary" />
        </span>
        {meta.available ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            <Sparkles className="size-3" /> Доступно
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            В разработке
          </span>
        )}
      </div>
      <p className="text-sm font-semibold leading-tight">{meta.title}</p>
      <p className="line-clamp-3 text-xs text-muted-foreground">
        {meta.description}
      </p>
      <p className="mt-auto text-[11px] text-muted-foreground">
        Заказчик: {meta.defaultCustomer}
      </p>
    </CardContent>
  );
}
