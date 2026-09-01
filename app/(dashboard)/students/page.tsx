import Link from "next/link";
import { GraduationCap, Trash2 } from "lucide-react";

import { CreateOverlay } from "@/components/shared/create-overlay";
import { StudentCreateForm } from "@/components/students/student-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { createStudent, deleteStudent } from "@/lib/actions/students";
import { getGroups, getStudents } from "@/lib/queries/directory";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const [students, groups] = await Promise.all([getStudents(), getGroups()]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateOverlay
          title="Новый студент"
          description="Студент появится в журнале посещаемости."
          buttonLabel="Добавить студента"
        >
          <StudentCreateForm groups={groups} action={createStudent} />
        </CreateOverlay>
      </div>

      {students.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-16 text-center shadow-lg shadow-black/40">
          <GraduationCap className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Студентов пока нет.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card
              key={student.id}
              className="glass rounded-2xl shadow-lg shadow-black/40"
            >
              <CardContent className="flex items-center justify-between gap-2 p-4">
                <Link
                  href={`/students/${student.id}`}
                  className="min-w-0"
                >
                  <p className="truncate text-sm font-medium transition-colors hover:text-primary">
                    {student.full_name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {student.group?.name ?? "—"}
                  </p>
                </Link>
                <form action={deleteStudent.bind(null, student.id)}>
                  <button
                    type="submit"
                    aria-label="Удалить студента"
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
