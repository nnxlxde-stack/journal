import type { Enums } from "@/lib/types/database.types";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  Enums<"attendance_status">,
  { label: string; className: string }
> = {
  present: {
    label: "Присутствовал",
    className: "bg-emerald-400/15 text-emerald-400",
  },
  late: {
    label: "Опоздал",
    className: "bg-amber-400/15 text-amber-400",
  },
  sick: {
    label: "Болен",
    className: "bg-slate-400/15 text-slate-400",
  },
  absent_unknown: {
    label: "Отсутствовал",
    className: "bg-rose-500/15 text-rose-500 glow-sm",
  },
};

/** Бейдж статуса посещаемости. Свечение — только на «проблемных» статусах. */
export function StatusBadge({
  status,
  marked = true,
}: {
  status: Enums<"attendance_status">;
  /** false — отметки по студенту ещё нет */
  marked?: boolean;
}) {
  if (!marked) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-400/10 px-2.5 py-0.5 text-xs font-medium text-slate-400">
        Не отмечен
      </span>
    );
  }
  const cfg = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}
