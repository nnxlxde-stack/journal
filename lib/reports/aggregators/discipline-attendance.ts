import type { AggregatedReport } from "@/lib/reports/types";
import {
  attendancePercent,
  numberColumn,
  textColumn,
  type AggregationContext,
} from "@/lib/reports/aggregators/shared";

/**
 * 1.3 Посещаемость по дисциплине.
 * Агрегация по всем группам, изучающим дисциплину (за период).
 */
export async function disciplineAttendance(
  ctx: AggregationContext,
): Promise<AggregatedReport> {
  const { params, range, ds } = ctx;
  const disciplineId = params.scope.disciplineId;
  if (!disciplineId) throw new Error("Выберите дисциплину");

  const discipline = (await ds.listDisciplines()).find(
    (d) => d.id === disciplineId,
  );
  const [lessons, facts] = await Promise.all([
    ds.listLessons({ disciplineId, from: range.from, to: range.to }),
    ds.listAttendance({ disciplineId, from: range.from, to: range.to }),
  ]);

  const groups = new Map<string, string>(); // groupId -> name
  for (const f of facts) groups.set(f.groupId, f.groupName);

  const perGroup = new Map<
    string,
    { groupId: string; pairs: number; present: number; late: number; sick: number; absent: number }
  >();
  for (const l of lessons) {
    const g = perGroup.get(l.groupId) ?? {
      groupId: l.groupId,
      pairs: 0,
      present: 0,
      late: 0,
      sick: 0,
      absent: 0,
    };
    g.pairs++;
    perGroup.set(l.groupId, g);
  }
  for (const f of facts) {
    const g = perGroup.get(f.groupId) ?? {
      groupId: f.groupId,
      pairs: 0,
      present: 0,
      late: 0,
      sick: 0,
      absent: 0,
    };
    if (f.presence === "present") g.present++;
    else if (f.presence === "late") g.late++;
    else if (f.absenceReason === "respected") g.sick++;
    else g.absent++;
    perGroup.set(f.groupId, g);
  }

  const rows = [...perGroup.values()]
    .map((g) => {
      const marked = g.present + g.late + g.sick + g.absent;
      return {
        group: groups.get(g.groupId) ?? g.groupId,
        pairs: g.pairs,
        marked,
        present: g.present,
        late: g.late,
        sick: g.sick,
        absent: g.absent,
        percent: attendancePercent(g.present + g.late, marked),
      };
    })
    .sort((a, b) => String(a.group).localeCompare(String(b.group)));

  const totals = rows.reduce(
    (t, r) => ({
      pairs: t.pairs + r.pairs,
      marked: t.marked + r.marked,
      present: t.present + r.present,
      late: t.late + r.late,
      sick: t.sick + r.sick,
      absent: t.absent + r.absent,
    }),
    { pairs: 0, marked: 0, present: 0, late: 0, sick: 0, absent: 0 },
  );

  const totalsRow: Record<string, unknown> = {
    group: "Итого",
    pairs: totals.pairs,
    marked: totals.marked,
    present: totals.present,
    late: totals.late,
    sick: totals.sick,
    absent: totals.absent,
    percent: attendancePercent(totals.present + totals.late, totals.marked),
  };

  return {
    type: params.type,
    title: `Посещаемость по дисциплине`,
    scopeLabel: discipline?.name ?? "",
    period: params.period,
    createdAt: new Date().toISOString(),
    meta: { legend: "Показатели % — по проставленным отметкам" },
    tables: [
      {
        title: `${discipline?.name ?? "Дисциплина"} · ${range.from} — ${range.to}`,
        columns: [
          textColumn("group", "Группа"),
          numberColumn("pairs", "Пар"),
          numberColumn("marked", "Отметок"),
          numberColumn("present", "П"),
          numberColumn("late", "О"),
          numberColumn("sick", "Б"),
          numberColumn("absent", "Н"),
          { key: "percent", title: "% посещ.", kind: "percent", highlightLowThreshold: 60 },
        ],
        rows,
        totalsRow,
      },
    ],
  };
}
