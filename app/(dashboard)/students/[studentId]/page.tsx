import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";

import { StatusBadge } from "@/components/journal/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getStudentWithHistory } from "@/lib/queries/get-student";
import { getAttendanceStats } from "@/lib/queries/get-attendance-stats";
import { formatDate, lessonTypeLabel } from "@/lib/utils/journal";

export const dynamic = "force-dynamic";

export default async function StudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const [student, stats] = await Promise.all([
    getStudentWithHistory(studentId),
    getAttendanceStats(studentId),
  ]);
  if (!student) notFound();

  const low = stats.percent < 75;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/students"
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        К студентам
      </Link>

      <Card className="glass rounded-2xl shadow-lg shadow-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            {student.full_name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {student.group?.name ?? "Группа не указана"}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Посещаемость: {stats.percent}%
            </span>
            <span className="text-xs text-muted-foreground">
              {stats.total} занятий
            </span>
          </div>
          <Progress value={stats.percent} className={low ? "glow-sm" : undefined} />
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="text-emerald-400">✓ {stats.present}</span>
            <span className="text-amber-400">О {stats.late}</span>
            <span className="text-slate-400">Б {stats.sick}</span>
            <span className="text-rose-500">Н {stats.absent}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="glass rounded-2xl shadow-lg shadow-black/40">
        <CardHeader>
          <CardTitle className="text-base">История посещаемости</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {student.history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Отметок пока нет.
            </p>
          ) : (
            student.history.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {record.lesson?.discipline?.name ?? "Занятие"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {record.lesson
                      ? `${formatDate(record.lesson.lesson_date)} · пара ${record.lesson.pair_number} · ${lessonTypeLabel(record.lesson.lesson_type)}`
                      : "—"}
                  </p>
                </div>
                <StatusBadge status={record.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
