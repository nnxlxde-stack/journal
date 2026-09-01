"use client";

import { useTransition } from "react";
import { Clock, HeartCrack, Stethoscope, ThumbsUp } from "lucide-react";

import { markAttendance } from "@/lib/actions/attendance";
import type { Enums } from "@/lib/types/database.types";
import { cn } from "@/lib/utils";

const statuses: {
  value: Enums<"attendance_status">;
  label: string;
  icon: typeof ThumbsUp;
}[] = [
  { value: "present", label: "Присутствовал", icon: ThumbsUp },
  { value: "late", label: "Опоздал", icon: Clock },
  { value: "sick", label: "Болен", icon: Stethoscope },
  { value: "absent_unknown", label: "Отсутствовал", icon: HeartCrack },
];

/**
 * Сегментированный контрол статуса (iOS-стиль):
 * контейнер bg-secondary rounded-xl p-1, активный сегмент — bg-primary glow-sm.
 * compact — для ячеек таблицы, обычный — на всю ширину карточки (mobile).
 */
export function AttendanceToggle({
  lessonId,
  studentId,
  value,
  compact = false,
}: {
  lessonId: string;
  studentId: string;
  value: Enums<"attendance_status">;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const current = value;

  return (
    <div
      role="group"
      aria-label="Статус посещаемости"
      className={cn(
        "flex rounded-xl bg-secondary p-1",
        compact ? "w-fit gap-0.5" : "w-full gap-1",
      )}
    >
      {statuses.map((status) => {
        const active = current === status.value;
        const Icon = status.icon;
        return (
          <button
            key={status.value}
            type="button"
            disabled={isPending}
            aria-pressed={active}
            aria-label={status.label}
            title={status.label}
            onClick={() => {
              if (active || isPending) return;
              startTransition(async () => {
                await markAttendance({
                  lessonId,
                  studentId,
                  status: status.value,
                });
              });
            }}
            className={cn(
              "flex items-center justify-center rounded-lg transition-all",
              compact
                ? "size-8"
                : "h-12 min-w-11 flex-1",
              active
                ? "bg-primary text-primary-foreground glow-sm"
                : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
            )}
          >
            <Icon className={compact ? "size-3.5" : "size-5"} />
          </button>
        );
      })}
    </div>
  );
}
