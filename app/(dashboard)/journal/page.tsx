import { CreateLessonDialog } from "@/components/journal/create-lesson-dialog";
import { JournalFilters } from "@/components/journal/journal-filters";
import { JournalView } from "@/components/journal/journal-view";
import { getJournal } from "@/lib/queries/get-journal";
import {
  getDisciplines,
  getGroups,
  getSemesters,
  getStudents,
  getTeachers,
} from "@/lib/queries/directory";

export const dynamic = "force-dynamic";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{
    group?: string;
    discipline?: string;
    semester?: string;
  }>;
}) {
  const params = await searchParams;

  const [lessons, groups, disciplines, semesters, teachers, students] =
    await Promise.all([
      getJournal({
        groupId: params.group,
        disciplineId: params.discipline,
        semesterId: params.semester,
      }),
      getGroups(),
      getDisciplines(),
      getSemesters(),
      getTeachers(),
      getStudents(),
    ]);

  // Студенты по группам — чтобы журнал показывал всех студентов занятия,
  // даже если по ним ещё нет отметок.
  const studentsByGroup = students.reduce<Record<string, { id: string; full_name: string }[]>>(
    (acc, student) => {
      (acc[student.group_id] ??= []).push({
        id: student.id,
        full_name: student.full_name,
      });
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <JournalFilters
          groups={groups}
          disciplines={disciplines}
          semesters={semesters}
        />
        <CreateLessonDialog
          groups={groups}
          disciplines={disciplines}
          semesters={semesters}
          teachers={teachers.map((teacher) => ({
            id: teacher.id,
            name: teacher.full_name,
          }))}
        />
      </div>
      <JournalView lessons={lessons} studentsByGroup={studentsByGroup} />
    </div>
  );
}
