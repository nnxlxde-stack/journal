import { BookMarked, Trash2 } from "lucide-react";

import { CreateOverlay } from "@/components/shared/create-overlay";
import { NameCreateForm } from "@/components/shared/name-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { createDiscipline, deleteDiscipline } from "@/lib/actions/disciplines";
import { getDisciplines } from "@/lib/queries/directory";

export const dynamic = "force-dynamic";

export default async function DisciplinesPage() {
  const disciplines = await getDisciplines();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateOverlay
          title="Новая дисциплина"
          description="Дисциплина будет доступна при создании занятий."
          buttonLabel="Добавить дисциплину"
        >
          <NameCreateForm
            label="Название дисциплины"
            placeholder="Математический анализ"
            action={createDiscipline}
          />
        </CreateOverlay>
      </div>

      {disciplines.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-16 text-center shadow-lg shadow-black/40">
          <BookMarked className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Дисциплин пока нет.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {disciplines.map((discipline) => (
            <Card
              key={discipline.id}
              className="glass rounded-2xl shadow-lg shadow-black/40"
            >
              <CardContent className="flex items-center justify-between p-4">
                <p className="min-w-0 text-sm font-medium">{discipline.name}</p>
                <form action={deleteDiscipline.bind(null, discipline.id)}>
                  <button
                    type="submit"
                    aria-label="Удалить дисциплину"
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
