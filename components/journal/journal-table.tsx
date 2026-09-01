import { BookOpen, Users } from "lucide-react";

import { AttendanceToggle } from "@/components/journal/attendance-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JournalLesson } from "@/lib/queries/get-journal";
import {
  flattenJournal,
  formatDate,
  type JournalStudent,
} from "@/lib/utils/journal";

/** Desktop-версия журнала: таблица (студент, дисциплина, дата, пара, статус). */
export function JournalTable({
  lessons,
  studentsByGroup,
}: {
  lessons: JournalLesson[];
  studentsByGroup: Record<string, JournalStudent[]>;
}) {
  const rows = flattenJournal(lessons, studentsByGroup);

  if (lessons.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-16 text-center shadow-lg shadow-black/40">
        <BookOpen className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Журнал пуст. Создайте занятие, чтобы начать отмечать посещаемость.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-16 text-center shadow-lg shadow-black/40">
        <Users className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          В группах занятий нет студентов. Добавьте студентов, чтобы вести
          журнал.
        </p>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-2xl shadow-lg shadow-black/40">
      <Table aria-label="Журнал посещаемости">
        <TableHeader>
          <TableHead isRowHeader>Студент</TableHead>
          <TableHead>Дисциплина</TableHead>
          <TableHead>Дата</TableHead>
          <TableHead>Пара</TableHead>
          <TableHead className="text-right">Статус</TableHead>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium">{row.studentName}</TableCell>
              <TableCell>{row.discipline}</TableCell>
              <TableCell>{formatDate(row.lessonDate)}</TableCell>
              <TableCell>{row.pairNumber}</TableCell>
              <TableCell className="text-right">
                <AttendanceToggle
                  lessonId={row.lessonId}
                  studentId={row.studentId}
                  value={row.status}
                  compact
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
