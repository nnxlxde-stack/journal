import type { AggregatedReport, RenderedFile } from "@/lib/reports/types";
import type { ReportFormat } from "@/lib/reports/types";
import { renderXlsx } from "@/lib/reports/renderers/render-xlsx";
import { renderPdf } from "@/lib/reports/renderers/render-pdf";
import { renderDocx } from "@/lib/reports/renderers/render-docx";

export const FORMAT_EXT: Record<ReportFormat, string> = {
  xlsx: "xlsx",
  pdf: "pdf",
  docx: "docx",
};

export const FORMAT_LABEL: Record<ReportFormat, string> = {
  xlsx: "Excel",
  pdf: "PDF",
  docx: "Word",
};

/** Рендер одного AggregatedReport в выбранный формат */
export async function renderReport(
  report: AggregatedReport,
  format: ReportFormat,
): Promise<RenderedFile> {
  switch (format) {
    case "xlsx":
      return renderXlsx(report);
    case "pdf":
      return renderPdf(report);
    case "docx":
      return renderDocx(report);
  }
}
