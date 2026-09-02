import { readFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import type { AggregatedReport, RenderedFile, ReportTable } from "@/lib/reports/types";
import {
  cellText,
  headingLines,
  isLow,
  PDF_MIME,
  SYSTEM_HEADER,
  UNIVERSITY_HEADER,
} from "@/lib/reports/renderers/template";

const ASSETS_DIR = path.join(process.cwd(), "lib/reports/renderers/assets");

function loadFont(name: string): Uint8Array {
  return readFileSync(path.join(ASSETS_DIR, name));
}

const REGULAR = loadFont("JetBrainsMono-Regular.ttf");
const BOLD = loadFont("JetBrainsMono-Bold.ttf");

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 36;
const BOTTOM = 60;

const COLOR_TEXT = rgb(0.12, 0.14, 0.18);
const COLOR_MUTED = rgb(0.42, 0.47, 0.55);
const COLOR_ACCENT = rgb(0.08, 0.42, 0.85);
const COLOR_RED = rgb(0.88, 0.1, 0.25);
const COLOR_HEADER_BG = rgb(0.92, 0.94, 0.97);

export async function renderPdf(
  report: AggregatedReport,
): Promise<RenderedFile> {
  const pdf = await PDFDocument.create();
  // Для встраивания пользовательских TTF-шрифтов (кириллица)
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(REGULAR);
  const bold = await pdf.embedFont(BOLD);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - 46;

  function ensureSpace(needed: number) {
    if (y - needed < BOTTOM) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - 46;
    }
  }

  function drawLine(
    text: string,
    opts: { size: number; font: PDFFont; color?: ReturnType<typeof rgb>; x?: number },
  ) {
    ensureSpace(opts.size + 6);
    page.drawText(text, {
      x: opts.x ?? MARGIN,
      y,
      size: opts.size,
      font: opts.font,
      color: opts.color ?? COLOR_TEXT,
    });
    y -= opts.size + 6;
  }

  // Шапка
  drawLine(UNIVERSITY_HEADER, { size: 13, font: bold, color: COLOR_ACCENT });
  drawLine(SYSTEM_HEADER, { size: 9, font: regular, color: COLOR_MUTED });
  y -= 8;
  for (const line of headingLines(report)) {
    drawLine(line, { size: 11, font: line === report.title ? bold : regular });
  }
  y -= 10;

  for (const table of report.tables) {
    drawTable(table);
  }

  if (report.meta?.legend) {
    y -= 4;
    drawLine(String(report.meta.legend), {
      size: 7,
      font: regular,
      color: COLOR_MUTED,
    });
  }

  const bytes = await pdf.save();
  return {
    format: "pdf",
    data: bytes,
    mimeType: PDF_MIME,
    sizeBytes: bytes.byteLength,
  };

  function drawTable(table: ReportTable) {
    if (table.title) {
      y -= 4;
      drawLine(table.title, { size: 11, font: bold });
      y -= 4;
    }

    const avail = PAGE_W - MARGIN * 2;
    const size = 8;
    const headerSize = 8;

    // Ширины колонок пропорционально содержимому
    const raw = table.columns.map((col, ci) => {
      const header = table.columns[ci].title;
      const cells = table.rows.map((r) => cellText(col, r[col.key]));
      if (table.totalsRow) cells.push(cellText(col, table.totalsRow[col.key]));
      if (ci === 0) cells.push("XXXXXXXXXXXXXXXXXXXXXXXXXXXX"); // первая колонка шире
      const maxLen = Math.max(header.length, ...cells.map((c) => [...c].length));
      return Math.max(maxLen, 4);
    });
    const rawSum = raw.reduce((a, b) => a + b, 0);
    const widths = raw.map((w) => (avail * w) / rawSum);

    // Заголовок
    ensureSpace(24);
    const headerY = y;
    let x = MARGIN;
    page.drawRectangle({
      x: MARGIN,
      y: headerY - 2,
      width: avail,
      height: 14,
      color: COLOR_HEADER_BG,
    });
    table.columns.forEach((col, ci) => {
      const w = widths[ci];
      page.drawText(col.title.toUpperCase(), {
        x: x + 2,
        y: headerY,
        size: headerSize,
        font: bold,
        color: COLOR_TEXT,
        maxWidth: w - 4,
      });
      x += w;
    });
    y -= 16;

    // Строки
    for (const row of table.rows) {
      ensureSpace(12);
      let cx = MARGIN;
      table.columns.forEach((col, ci) => {
        const value = row[col.key];
        const isFirst = ci === 0;
        page.drawText(cellText(col, value), {
          x: cx + 2,
          y,
          size,
          font: isFirst ? bold : regular,
          color: isLow(col, value) ? COLOR_RED : COLOR_TEXT,
          maxWidth: widths[ci] - 4,
        });
        cx += widths[ci];
      });
      y -= 12;
    }

    // Итоги
    if (table.totalsRow) {
      ensureSpace(16);
      const totalsY = y;
      page.drawRectangle({
        x: MARGIN,
        y: totalsY - 2,
        width: avail,
        height: 14,
        color: COLOR_HEADER_BG,
      });
      let tx = MARGIN;
      table.columns.forEach((col, ci) => {
        page.drawText(cellText(col, table.totalsRow?.[col.key]), {
          x: tx + 2,
          y: totalsY,
          size,
          font: bold,
          color: isLow(col, table.totalsRow?.[col.key])
            ? COLOR_RED
            : COLOR_TEXT,
          maxWidth: widths[ci] - 4,
        });
        tx += widths[ci];
      });
      y -= 16;
    }

    y -= 6;
  }
}
