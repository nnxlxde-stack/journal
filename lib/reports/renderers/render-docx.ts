import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import type {
  AggregatedReport,
  RenderedFile,
  ReportTable,
} from "@/lib/reports/types";
import {
  cellText,
  DOCX_MIME,
  headingLines,
  isLow,
  SYSTEM_HEADER,
  UNIVERSITY_HEADER,
} from "@/lib/reports/renderers/template";

const RED = "E11D48";
const GRAY_BG = "F0F4FA";
const BORDER = "999999";

function run(text: string, opts: { bold?: boolean; size?: number; color?: string }) {
  return new TextRun({
    text,
    bold: opts.bold,
    size: opts.size ?? 20, // half-points: 20 = 10pt
    color: opts.color,
    font: "Arial",
  });
}

function borderStyle() {
  const style = { style: BorderStyle.SINGLE, size: 1, color: BORDER };
  return {
    top: style,
    bottom: style,
    left: style,
    right: style,
    insideHorizontal: style,
    insideVertical: style,
  };
}

function docxTable(table: ReportTable): Table {
  const colCount = Math.max(table.columns.length, 1);
  const colWidth = Math.round(100 / colCount);

  const headerCells = table.columns.map(
    (col) =>
      new TableCell({
        width: { size: colWidth, type: WidthType.PERCENTAGE },
        shading: { fill: GRAY_BG },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: col.kind === "status" || col.kind === "number" || col.kind === "percent" ? AlignmentType.CENTER : AlignmentType.LEFT,
            children: [run(col.title, { bold: true, size: 19 })],
          }),
        ],
      }),
  );

  const dataRows = table.rows.map(
    (row) =>
      new TableRow({
        children: table.columns.map((col, ci) => {
          const value = row[col.key];
          const low = isLow(col, value);
          const center =
            col.kind !== "text" || ci > 0;
          return new TableCell({
            width: { size: colWidth, type: WidthType.PERCENTAGE },
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
                children: [
                  run(cellText(col, value), {
                    bold: ci === 0,
                    color: low ? RED : undefined,
                  }),
                ],
              }),
            ],
          });
        }),
      }),
  );

  const rows: TableRow[] = [
    new TableRow({ tableHeader: true, children: headerCells }),
    ...dataRows,
  ];

  if (table.totalsRow) {
    const totalsCells = table.columns.map((col, ci) => {
      const value = table.totalsRow?.[col.key];
      const low = isLow(col, value);
      return new TableCell({
        width: { size: colWidth, type: WidthType.PERCENTAGE },
        shading: { fill: GRAY_BG },
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: ci === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
            children: [run(cellText(col, value), { bold: true, color: low ? RED : undefined })],
          }),
        ],
      });
    });
    rows.push(new TableRow({ children: totalsCells }));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderStyle(),
    rows,
  });
}

/** Экспорт отчёта в Word (.docx) */
export async function renderDocx(
  report: AggregatedReport,
): Promise<RenderedFile> {
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [run(UNIVERSITY_HEADER, { bold: true, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [run(SYSTEM_HEADER, { size: 18, color: "6B7280" })],
    }),
  );

  for (const line of headingLines(report)) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          run(line, {
            bold: line === report.title,
            size: line === report.title ? 26 : 20,
          }),
        ],
      }),
    );
  }

  children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));

  for (const table of report.tables) {
    if (table.title) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [run(table.title, { bold: true, size: 21 })],
        }),
      );
    }
    children.push(docxTable(table));
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }

  if (report.meta?.legend) {
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [run(String(report.meta.legend), { size: 17, color: "6B7280" })],
      }),
    );
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 20 } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 850, right: 850, bottom: 850, left: 850 } },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const bytes = new Uint8Array(buffer);
  return {
    format: "docx",
    data: bytes,
    mimeType: DOCX_MIME,
    sizeBytes: bytes.byteLength,
  };
}
