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
  hifzPercent: number;
  tathPercent: number;
  murPercent: number;
  lastUpdatedLabel: string;
  lastUpdatedRaw: string | null;
}
