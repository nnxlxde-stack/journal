"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AttendanceStats, StudentStats } from "@/lib/queries/get-attendance-stats";

const chartConfig = {
  count: { label: "Отметок" },
  present: { label: "Присутствовал", color: "hsl(160 84% 39%)" },
  late: { label: "Опоздал", color: "hsl(45 93% 47%)" },
  sick: { label: "Болен", color: "hsl(215 20% 65%)" },
  absent: { label: "Отсутствовал", color: "hsl(340 82% 60%)" },
} satisfies ChartConfig;

function MetricCards({ stats }: { stats: AttendanceStats }) {
  const items = [
    { label: "Всего отметок", value: stats.total, className: "" },
    { label: "Присутствовал", value: stats.present, className: "text-emerald-400" },
    { label: "Опоздал", value: stats.late, className: "text-amber-400" },
    { label: "Болен", value: stats.sick, className: "text-slate-400" },
    { label: "Отсутствовал", value: stats.absent, className: "text-rose-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} className="glass rounded-2xl shadow-lg shadow-black/40">
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className={`text-2xl font-semibold ${item.className}`}>
              {item.value}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DistributionChart({ stats }: { stats: AttendanceStats }) {
  const data = [
    { status: "Присутствовал", count: stats.present, fill: "hsl(160 84% 39%)" },
    { status: "Опоздал", count: stats.late, fill: "hsl(45 93% 47%)" },
    { status: "Болен", count: stats.sick, fill: "hsl(215 20% 65%)" },
    { status: "Отсутствовал", count: stats.absent, fill: "hsl(340 82% 60%)" },
  ];

  return (
    <Card className="glass rounded-2xl shadow-lg shadow-black/40">
      <CardHeader>
        <CardTitle className="text-base">Распределение статусов</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="hsl(222 30% 18%)" />
            <XAxis
              dataKey="status"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function StudentsList({ students }: { students: StudentStats[] }) {
  return (
    <Card className="glass rounded-2xl shadow-lg shadow-black/40">
      <CardHeader>
        <CardTitle className="text-base">По студентам</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {students.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Нет данных.
          </p>
        ) : (
          students.map((student) => (
            <div key={student.student_id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{student.full_name}</span>
                <span
                  className={student.percent < 75 ? "text-rose-500" : "text-muted-foreground"}
                >
                  {student.percent}%
                </span>
              </div>
              <Progress
                value={student.percent}
                className={student.percent < 75 ? "glow-sm" : undefined}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Аналитика: desktop — сетка карточек (всё сразу),
 * mobile — Tabs с переключением между метриками.
 */
export function AnalyticsView({
  stats,
  students,
}: {
  stats: AttendanceStats;
  students: StudentStats[];
}) {
  return (
    <>
      {/* Mobile: Tabs */}
      <div className="flex flex-col gap-3 md:hidden">
        <Tabs defaultSelectedKey="summary">
          <TabsList className="w-full">
            <TabsTrigger id="summary" className="flex-1">
              Сводка
            </TabsTrigger>
            <TabsTrigger id="chart" className="flex-1">
              График
            </TabsTrigger>
            <TabsTrigger id="students" className="flex-1">
              Студенты
            </TabsTrigger>
          </TabsList>
          <TabsContent id="summary">
            <MetricCards stats={stats} />
          </TabsContent>
          <TabsContent id="chart">
            <DistributionChart stats={stats} />
          </TabsContent>
          <TabsContent id="students">
            <StudentsList students={students} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: всё сразу */}
      <div className="hidden flex-col gap-3 md:flex">
        <MetricCards stats={stats} />
        <div className="grid grid-cols-2 gap-3">
          <DistributionChart stats={stats} />
          <StudentsList students={students} />
        </div>
      </div>
    </>
  );
}
