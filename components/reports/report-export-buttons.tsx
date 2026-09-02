"use client";

import { useTransition } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadReport } from "@/lib/actions/reports";
import type { ReportFormat, ReportParams } from "@/lib/reports/types";

const FORMATS: { format: ReportFormat; label: string; icon: typeof FileText }[] =
  [
    { format: "xlsx", label: "Excel", icon: FileSpreadsheet },
    { format: "pdf", label: "PDF", icon: FileText },
    { format: "docx", label: "Word", icon: FileType2 },
  ];

function saveBlob(base64: string, mime: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Кнопки экспорта текущего отчёта (пересоздают файл на сервере) */
export function ReportExportButtons({
  params,
  formats = FORMATS.map((f) => f.format),
}: {
  params: ReportParams;
  formats?: ReportFormat[];
}) {
  const [isPending, startTransition] = useTransition();

  const download = (format: ReportFormat) => {
    startTransition(async () => {
      const result = await downloadReport(params, format);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      saveBlob(result.base64, result.mime, result.filename);
      toast.success(`Файл ${result.filename} скачан`);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {FORMATS.filter((item) => formats.includes(item.format)).map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.format}
            type="button"
            variant="outline"
            isDisabled={isPending}
            onClick={() => download(item.format)}
            className="h-10 rounded-xl"
          >
            <Icon className="size-4" />
            {item.label}
          </Button>
        );
      })}
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Download className="size-3.5" />
        {isPending ? "Формируем файл…" : "Скачать"}
      </span>
    </div>
  );
}
