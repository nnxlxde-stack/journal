import type { AggregatedReport } from "@/lib/reports/types";
import {
  numberColumn,
  textColumn,
  type AggregationContext,
} from "@/lib/reports/aggregators/shared";

/**
 * 1.4 Отчёт по причинам отсутствия.
 * Распределение пропусков (уважительная причина — болезнь,
 * причина не указана) по группам и дисциплинам. До ввода поля
 * «причина отсутствия» неуважительные не выделяются отдельно.
 */
export async function absenceReasonsReport(
  ctx: AggregationContext,
): Promise<AggregatedReport> {
  const { params, range, ds } = ctx;
  const groupId = params.scope.groupId;

  const groups = groupId
    ? (await ds.listGroups()).filter((g) => g.id === groupId)
    : await ds.listGroups();

  type Row = {
    group: string;
    discipline: string;
    marks: number;
    present: number;
    late: number;
    sick: number;
    unknown: number;
  };
  const rows: Row[] = [];

  for (const group of groups) {
    const facts = await ds.listAttendance({
      groupIds: [group.id],
      from: range.from,
      to: range.to,
    });

    const byDiscipline = new Map<
      string,
      { discipline: string; present: number; late: number; sick: number; unknown: number }
    >();
    for (const f of facts) {
      const entry =
        byDiscipline.get(f.disciplineName) ?? {
          discipline: f.disciplineName,
          present: 0,
          late: 0,
          sick: 0,
          unknown: 0,
        };
      if (f.presence === "present") entry.present++;
      else if (f.presence === "late") entry.late++;
      else if (f.absenceReason === "respected") entry.sick++;
      else entry.unknown++;
      byDiscipline.set(f.disciplineName, entry);
    }

    for (const [, entry] of byDiscipline) {
      rows.push({
        group: group.name,
        discipline: entry.discipline,
        marks: entry.present + entry.late + entry.sick + entry.unknown,
        present: entry.present,
        late: entry.late,
        sick: entry.sick,
        unknown: entry.unknown,
      });
    }
  }

  rows.sort(
    (a, b) =>
      String(a.group).localeCompare(String(b.group)) ||
      String(a.discipline).localeCompare(String(b.discipline)),
  );

  const totals = rows.reduce(
    (t, r) => ({
      marks: t.marks + r.marks,
      present: t.present + r.present,
      late: t.late + r.late,
      sick: t.sick + r.sick,
      unknown: t.unknown + r.unknown,
    }),
    { marks: 0, present: 0, late: 0, sick: 0, unknown: 0 },
  );

  const totalsRow: Record<string, unknown> = {
    group: "Итого",
    discipline: "—",
    marks: totals.marks,
    present: totals.present,
    late: totals.late,
    sick: totals.sick,
    unknown: totals.unknown,
    respectedShare: totalShare(totals.sick, totals.sick + totals.unknown),
  };

  // Доля уважительных пропусков в каждой строке
  const tableRows = rows.map((r) => ({
    group: r.group,
    discipline: r.discipline,
    marks: r.marks,
    present: r.present,
    late: r.late,
    sick: r.sick,
    unknown: r.unknown,
    respectedShare: totalShare(r.sick, r.sick + r.unknown),
  }));

  return {
    type: params.type,
    title: "Отчёт по причинам отсутствия",
    scopeLabel: groupId ? tableRows[0]?.group ?? "—" : "Все группы",
    period: params.period,
    createdAt: new Date().toISOString(),
    meta: {
      legend:
        "Пропуски по уважительной причине = болезнь (sick). «Причина не указана» = отсутствие без отметки причины. Поле «неуважительная причина» появится после расширения схемы.",
    },
    tables: [
      {
        title: `${range.from} — ${range.to}`,
        columns: [
          textColumn("group", "Группа"),
          textColumn("discipline", "Дисциплина"),
          numberColumn("marks", "Отметок"),
          numberColumn("present", "Присутств."),
          numberColumn("late", "Опоздал"),
          numberColumn("sick", "Уважительная (болезнь)"),
          numberColumn("unknown", "Причина не указана"),
          { key: "respectedShare", title: "Доля уваж. среди пропусков, %", kind: "percent", highlightLowThreshold: 0 },
        ],
        rows: tableRows,
        totalsRow: {
          ...totalsRow,
          respectedShare: totalsRow.respectedShare,
        },
      },
    ],
  };
}

function totalShare(respected: number, absences: number): number | null {
  if (absences === 0) return null;
  return Math.round((respected / absences) * 100);
}
