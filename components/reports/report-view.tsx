import type {
  AggregatedReport,
  ReportColumn,
} from "@/lib/reports/types";
import { cn } from "@/lib/utils";

/** Форматирование значения ячейки по типу колонки */
function formatValue(col: ReportColumn, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (col.kind === "percent" && typeof value === "number") return `${value}%`;
  return String(value);
}

/** Подсветка значений ниже порога (для percent/числовых колонок) */
function isLow(col: ReportColumn, value: unknown): boolean {
  if (col.highlightLowThreshold === undefined) return false;
  if (typeof value !== "number") return false;
  return value < col.highlightLowThreshold;
}

function periodLabel(report: AggregatedReport): string {
  const p = report.period;
  if (p.preset === "custom" && p.custom) {
    return `${p.custom.from} — ${p.custom.to}`;
  }
  const presetLabels: Record<string, string> = {
    today: "Сегодня",
    week: "Неделя",
    month: "Месяц",
    semester: "Семестр",
  };
  return presetLabels[p.preset] ?? String(p.preset);
}

/**
 * Экранное представление сгенерированного отчёта (таблицы).
 * Числовые/процентные колонки подсвечиваются при значении ниже порога.
 */
export function ReportView({ report }: { report: AggregatedReport }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="glass flex flex-col gap-1 rounded-2xl px-5 py-4 shadow-lg shadow-black/40">
        <h2 className="font-heading text-lg font-semibold">{report.title}</h2>
        <p className="text-sm text-muted-foreground">
          {report.scopeLabel ? `${report.scopeLabel} · ` : ""}
          {periodLabel(report)}
        </p>
      </div>

      {report.tables.map((table, ti) => (
        <div
          key={ti}
          className="glass overflow-hidden rounded-2xl shadow-lg shadow-black/40"
        >
          {table.title ? (
            <div className="border-b border-border/50 px-5 py-3 text-sm font-medium">
              {table.title}
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {table.columns.map((col) => (
                    <th
                      key={col.key}
                      className="whitespace-nowrap px-3 py-2.5 font-medium"
                    >
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-border/30 transition-colors hover:bg-primary/5"
                  >
                    {table.columns.map((col, ci) => {
                      const value = row[col.key];
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            "whitespace-nowrap px-3 py-2",
                            ci === 0 ? "font-medium" : "",
                            isLow(col, value)
                              ? "text-rose-500"
                              : "text-foreground",
                          )}
                        >
                          {formatValue(col, value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {table.totalsRow ? (
                  <tr className="bg-primary/5 font-semibold">
                    {table.columns.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-3 py-2">
                        {formatValue(col, table.totalsRow?.[col.key])}
                      </td>
                    ))}
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {report.meta?.legend ? (
            <div className="border-t border-border/50 px-5 py-2.5 text-xs text-muted-foreground">
              {report.meta.legend as string}
            </div>
          ) : null}
        </div>
      ))}

      {report.tables.every((t) => t.rows.length === 0) ? (
        <div className="glass rounded-2xl px-6 py-12 text-center text-sm text-muted-foreground shadow-lg shadow-black/40">
          Нет данных за выбранный период.
        </div>
      ) : null}
    </div>
  );
}
