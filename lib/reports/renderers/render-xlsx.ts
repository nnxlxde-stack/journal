import { Workbook } from "exceljs";

import type { AggregatedReport, RenderedFile } from "@/lib/reports/types";
import {
  cellText,
  headingLines,
  isLow,
  SYSTEM_HEADER,
  UNIVERSITY_HEADER,
  XLSX_MIME,
} from "@/lib/reports/renderers/template";

/** Имя листа: ≤31 симв., без спецсимволов */
function sheetName(raw: string): string {
  const cleaned = raw.replace(/[\\/?*[\]:]/g, " ").slice(0, 28);
  return cleaned.trim() || "Отчёт";
}

function measure(texts: string[]): number {
  let max = 8;
  for (const t of texts) {
    const len = [...t].length; // считаем юникод-символы
    if (len > max) max = len;
  }
  return Math.min(max, 60) + 2;
}

/** Экспорт отчёта в Excel: лист на каждую таблицу */
export async function renderXlsx(
  report: AggregatedReport,
): Promise<RenderedFile> {
  const wb = new Workbook();
  const meta = headingLines(report);

  for (const table of report.tables) {
    const ws = wb.addWorksheet(sheetName(table.title || report.title));
    const colCount = Math.max(table.columns.length, 1);

    // Шапка
    ws.addRow([UNIVERSITY_HEADER]);
    ws.addRow([SYSTEM_HEADER]);
    ws.addRow([]);
    for (const line of meta) ws.addRow([line]);
    ws.addRow([]);
    if (table.title) ws.addRow([table.title]);
    ws.addRow([]);
    const headerStart = ws.rowCount;

    // Заголовки колонок
    const headerRow = ws.addRow(table.columns.map((c) => c.title));
    headerRow.font = { bold: true };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EEF5" } };
    headerRow.alignment = { vertical: "middle" };
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Данные
    const widths: number[] = table.columns.map((c, ci) =>
      measure([
        c.title,
        ...table.rows.map((r) => cellText(c, r[c.key])),
        ...(table.totalsRow
          ? [cellText(c, table.totalsRow[c.key])]
          : []),
        ci === 0 ? " ".repeat(30) : "",
      ]),
    );
    ws.columns = widths.map((w) => ({ width: w }));

    for (const row of table.rows) {
      const values = table.columns.map((c) => cellText(c, row[c.key]));
      const wsRow = ws.addRow(values);
      table.columns.forEach((c, ci) => {
        const cell = wsRow.getCell(ci + 1);
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        if (isLow(c, row[c.key])) cell.font = { color: { argb: "FFE11D48" } };
      });
    }

    // Итоги
    const totalsRow = table.totalsRow;
    if (totalsRow) {
      const totalsValues = table.columns.map((c) => cellText(c, totalsRow[c.key]));
      const totalsWsRow = ws.addRow(totalsValues);
      totalsWsRow.font = { bold: true };
      totalsWsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F4FA" } };
      table.columns.forEach((c, ci) => {
        const cell = totalsWsRow.getCell(ci + 1);
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        if (isLow(c, table.totalsRow?.[c.key])) {
          cell.font = { bold: true, color: { argb: "FFE11D48" } };
        }
      });
    }

    // Легенда
    if (report.meta?.legend) ws.addRow([]);
    if (report.meta?.legend) ws.addRow([String(report.meta.legend)]);

    // Заголовки и шапка: объединение по ширине таблицы (для ровного вида)
    const lastCol = String.fromCharCode(64 + Math.min(colCount, 26));
    const area = `A1:${lastCol}${Math.max(2, headerStart - 1)}`;
    try {
      ws.mergeCells(area);
    } catch {
      /* столбцов может не хватить — пропускаем */
    }
    ws.views = [{ state: "frozen", ySplit: headerStart + 1 }];
  }

  const buffer = await wb.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer);
  return {
    format: "xlsx",
    data: bytes,
    mimeType: XLSX_MIME,
    sizeBytes: bytes.byteLength,
  };
}
