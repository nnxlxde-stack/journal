import { JournalCards } from "@/components/journal/journal-cards";
import { JournalTable } from "@/components/journal/journal-table";
import type { JournalLesson } from "@/lib/queries/get-journal";
import type { JournalStudent } from "@/lib/utils/journal";

/**
 * Контейнер журнала: рендерит обе версии (desktop/mobile),
 * переключение — CSS-брейкпоинты, данные одни и те же.
 */
export function JournalView({
  lessons,
  studentsByGroup,
}: {
  lessons: JournalLesson[];
  studentsByGroup: Record<string, JournalStudent[]>;
}) {
  return (
    <>
      <div className="hidden md:block">
        <JournalTable lessons={lessons} studentsByGroup={studentsByGroup} />
      </div>
      <div className="block md:hidden">
        <JournalCards lessons={lessons} studentsByGroup={studentsByGroup} />
      </div>
    </>
  );
}
