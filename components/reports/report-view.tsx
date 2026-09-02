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

/** Рендер строки отчёта карточкой (мобильная версия) */
function RowCard({
  columns,
  row,
  emphasize = false,
  totals = false,
}: {
  columns: ReportColumn[];
  row: Record<string, unknown>;
  emphasize?: boolean;
  totals?: boolean;
}) {
  const first = columns[0];
  const rest = columns.slice(1);
  const statusCells = rest.filter((c) => c.kind === "status");
  const detailCells = rest.filter((c) => c.kind !== "status");

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border border-border/50 p-3.5",
        totals ? "bg-primary/5" : "bg-card/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("min-w-0 text-sm", emphasize ? "font-medium" : "")}>
          {formatValue(first, row[first.key])}
        </p>
      </div>

      {statusCells.length > 0 ? (
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
          {statusCells.map((col) => {
            const value = formatValue(col, row[col.key]);
            return (
              <span
                key={col.key}
                title={col.title}
                className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/60 px-1.5 text-xs font-medium"
              >
                {value}
              </span>
            );
          })}
        </div>
      ) : null}

      {detailCells.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {detailCells.map((col) => {
            const value = row[col.key];
            const low = isLow(col, value);
            return (
              <div key={col.key} className="flex items-baseline justify-between gap-2">
                <dt className="shrink-0 text-xs text-muted-foreground">
                  {col.title}
                </dt>
                <dd
                  className={cn(
                    "text-right text-sm font-medium",
                    low ? "text-rose-500" : "text-foreground",
                  )}
                >
                  {formatValue(col, value)}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}
    </div>
  );
}

/** Мобильная версия таблицы: строки-карточки вместо горизонтального скролла */
function MobileReportTable({
  table,
}: {
  table: { columns: ReportColumn[]; rows: Record<string, unknown>[]; totalsRow?: Record<string, unknown> };
}) {
  return (
    <div className="flex flex-col gap-2.5 p-3">
      {table.rows.map((row, ri) => (
        <RowCard key={ri} columns={table.columns} row={row} emphasize />
      ))}
      {table.totalsRow ? (
        <RowCard columns={table.columns} row={table.totalsRow} totals emphasize />
      ) : null}
      {table.rows.length === 0 && !table.totalsRow ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Нет данных
        </p>
      ) : null}
    </div>
  );
}

/**
 * Экранное представление сгенерированного отчёта.
 * Desktop — таблицы, Mobile (< md) — карточки по каждой строке.
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

          {/* Mobile: карточки */}
          <div className="md:hidden">
            <MobileReportTable table={table} />
          </div>

          {/* Desktop: таблица */}
          <div className="hidden overflow-x-auto md:block">
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
                    {table.columns.map((col) => {
                      const value = row[col.key];
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            "whitespace-nowrap px-3 py-2",
                            col === table.columns[0] ? "font-medium" : "",
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
