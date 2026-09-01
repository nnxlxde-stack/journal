import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";

import { AttendanceToggle } from "@/components/journal/attendance-toggle";
import { StatusBadge } from "@/components/journal/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLessonDetail } from "@/lib/queries/get-journal";
import { formatDate, lessonTypeLabel } from "@/lib/utils/journal";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = await getLessonDetail(lessonId);
  if (!lesson) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/journal"
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        К журналу
      </Link>

      <Card className="glass rounded-2xl shadow-lg shadow-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            {lesson.discipline?.name ?? "Занятие"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lesson.group?.name ?? "—"} · {formatDate(lesson.lesson_date)} · пара{" "}
            {lesson.pair_number} · {lessonTypeLabel(lesson.lesson_type)}
            {lesson.teacher ? ` · ${lesson.teacher.full_name}` : ""}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {lesson.students.map((student) => {
            const status = lesson.attendance[student.id] ?? "absent_unknown";
            return (
              <div
                key={student.id}
                className="flex flex-col gap-3 rounded-xl border border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-start">
                  <p className="truncate text-sm font-medium">
                    {student.full_name}
                  </p>
                  <span className="sm:hidden">
                    <StatusBadge status={status} />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 sm:gap-6">
                  <span className="hidden sm:inline">
                    <StatusBadge status={status} />
                  </span>
                  <AttendanceToggle
                    lessonId={lesson.id}
                    studentId={student.id}
                    value={status}
                  />
                </div>
              </div>
            );
          })}
          {lesson.students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              В группе нет студентов.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
