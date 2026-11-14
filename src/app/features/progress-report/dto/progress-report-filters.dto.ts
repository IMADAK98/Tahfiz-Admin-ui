import { ProgressPeriod } from '../../../core/api/models/progress.model';

/** UI filters — ḥalaqa + period + date context + student search. */
export interface ProgressReportFilters {
  halqaId: number | null;
  period: ProgressPeriod;
  /** day: YYYY-MM-DD; week: Sunday YYYY-MM-DD; month: YYYY-MM */
  dateContext: string;
  studentQuery: string;
}

export interface HalqaSelectOption {
  id: number;
  name: string;
}

export interface ProgressRowVm {
  studentId: number;
  studentName: string;
  /** null = no plan item of this type (shown as '—'), unlike a real 0. */
  hifzPercent: number | null;
  tathPercent: number | null;
  murPercent: number | null;
  lastUpdatedLabel: string;
  lastUpdatedRaw: string | null;
}
