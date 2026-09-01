import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import {
  getDisciplines,
  getGroups,
  getStudents,
} from "@/lib/queries/directory";

/** Каркас приложения: Sidebar (desktop) / BottomNav (mobile) + TopBar. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [groups, disciplines, students] = await Promise.all([
    getGroups(),
    getDisciplines(),
    getStudents(),
  ]);

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <TopBar searchData={{ groups, disciplines, students }} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
