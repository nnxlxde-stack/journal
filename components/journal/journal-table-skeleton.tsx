import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Скелетон desktop-таблицы журнала. */
export function JournalTableSkeleton() {
  return (
    <div className="glass overflow-hidden rounded-2xl shadow-lg shadow-black/40">
      <Table aria-label="Журнал посещаемости (загрузка)">
        <TableHeader>
          <TableHead isRowHeader>Студент</TableHead>
          <TableHead>Дисциплина</TableHead>
          <TableHead>Дата</TableHead>
          <TableHead>Пара</TableHead>
          <TableHead className="text-right">Статус</TableHead>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-8 w-32 rounded-lg" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
