import { JournalCardsSkeleton } from "@/components/journal/journal-cards-skeleton";
import { JournalTableSkeleton } from "@/components/journal/journal-table-skeleton";

export default function JournalLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="hidden md:block">
        <JournalTableSkeleton />
      </div>
      <div className="block md:hidden">
        <JournalCardsSkeleton />
      </div>
    </div>
  );
}
