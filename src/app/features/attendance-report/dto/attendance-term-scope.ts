import type { TermStatus } from '../../../core/api/models/term.model';
import { ALL_ACTIVE_HALAQAT } from './attendance-report-filters.dto';
import type { CenterWeeklyTable } from './center-weekly-table.mapper';

/**
 * ponytail: Nest's term-scoped center grid includes inactive ḥalaqas whenever termId is set.
 * For an active term, «كل الحلقات النشطة» keeps rows whose ḥalaqa is in the active by-term list.
 * Inactive members of those ḥalaqas stay. Completed terms keep every returned ḥalaqa.
 * A single selected ḥalaqa is already scoped by halqaId.
 * Ceiling: no client flag can ask Nest for active-only ḥalaqas and termId together.
 */
export function scopeAttendanceTable(
  table: CenterWeeklyTable,
  termStatus: TermStatus | null,
  activeHalqaIds: readonly number[],
  halqaValue: string,
): CenterWeeklyTable {
  if (termStatus == null || termStatus === 'COMPLETED' || halqaValue !== ALL_ACTIVE_HALAQAT) {
    return table;
  }
  const allowed = new Set(activeHalqaIds);
  return {
    ...table,
    students: table.students.filter((row) => {
      const id = row.halqa?.id ?? null;
      return id == null || allowed.has(id);
    }),
  };
}
