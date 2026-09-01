import { AnalyticsView } from "@/components/analytics/analytics-view";
import {
  getAttendanceStats,
  getStudentsStats,
} from "@/lib/queries/get-attendance-stats";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [stats, students] = await Promise.all([
    getAttendanceStats(),
    getStudentsStats(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <AnalyticsView stats={stats} students={students} />
    </div>
  );
}
