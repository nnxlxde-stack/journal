import { BookOpen, Users } from "lucide-react";

import { AttendanceToggle } from "@/components/journal/attendance-toggle";
import { StatusBadge } from "@/components/journal/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import type { JournalLesson } from "@/lib/queries/get-journal";
import {
  flattenJournal,
  formatDate,
  type JournalStudent,
} from "@/lib/utils/journal";

/** Mobile-версия журнала: карточки по студенту с ToggleGroup на всю ширину. */
export function JournalCards({
  lessons,
  studentsByGroup,
}: {
  lessons: JournalLesson[];
  studentsByGroup: Record<string, JournalStudent[]>;
}) {
  const rows = flattenJournal(lessons, studentsByGroup);

  if (lessons.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-16 text-center shadow-lg shadow-black/40">
        <BookOpen className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Журнал пуст. Создайте занятие, чтобы начать отмечать посещаемость.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-16 text-center shadow-lg shadow-black/40">
        <Users className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          В группах занятий нет студентов. Добавьте студентов, чтобы вести
          журнал.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <Card
          key={row.key}
          className="glass rounded-2xl shadow-lg shadow-black/40"
        >
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.studentName}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {row.discipline} · {formatDate(row.lessonDate)} · пара{" "}
                  {row.pairNumber}
                </p>
              </div>
              <StatusBadge status={row.status} marked={row.marked} />
            </div>
            <AttendanceToggle
              lessonId={row.lessonId}
              studentId={row.studentId}
              value={row.status}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
