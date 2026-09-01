import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookMarked } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJournal } from "@/lib/queries/get-journal";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/journal";

export const dynamic = "force-dynamic";

export default async function DisciplinePage({
  params,
}: {
  params: Promise<{ disciplineId: string }>;
}) {
  const { disciplineId } = await params;
  const supabase = await createClient();

  const { data: discipline } = await supabase
    .from("disciplines")
    .select("id, name")
    .eq("id", disciplineId)
    .single();
  if (!discipline) notFound();

  const lessons = await getJournal({ disciplineId });

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/disciplines"
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        К дисциплинам
      </Link>

      <Card className="glass rounded-2xl shadow-lg shadow-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="size-5 text-primary" />
            {discipline.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {lessons.length ? (
            lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/journal/${lesson.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="font-medium">{lesson.group?.name ?? "—"}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(lesson.lesson_date)} · пара {lesson.pair_number}
                </span>
              </Link>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Занятий по дисциплине пока нет.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
