import { CalendarDays, Trash2 } from "lucide-react";

import { CreateOverlay } from "@/components/shared/create-overlay";
import { SemesterCreateForm } from "@/components/semesters/semester-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { createSemester, deleteSemester } from "@/lib/actions/semesters";
import { getSemesters } from "@/lib/queries/directory";

export const dynamic = "force-dynamic";

const termLabels = { 1: "Осенний", 2: "Весенний" } as const;

export default async function SemestersPage() {
  const semesters = await getSemesters();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateOverlay
          title="Новый семестр"
          description="Семестр ограничивает даты занятий."
          buttonLabel="Добавить семестр"
        >
          <SemesterCreateForm action={createSemester} />
        </CreateOverlay>
      </div>

      {semesters.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-16 text-center shadow-lg shadow-black/40">
          <CalendarDays className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Семестров пока нет.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((semester) => (
            <Card
              key={semester.id}
              className="glass rounded-2xl shadow-lg shadow-black/40"
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{semester.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {termLabels[semester.term as 1 | 2]} · {semester.year}
                  </p>
                </div>
                <form action={deleteSemester.bind(null, semester.id)}>
                  <button
                    type="submit"
                    aria-label="Удалить семестр"
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
