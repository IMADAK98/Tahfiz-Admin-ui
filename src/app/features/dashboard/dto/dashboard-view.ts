import { parseLocalIsoDate } from '../../../core/utils/local-date';
import { ScoreBand } from '../enums/score-band.enum';

export const LOW_ATTENDANCE_BELOW = 85;
export const LOW_COVERAGE_BELOW = 75;

export function scoreBand(score: number | null): ScoreBand {
  if (score === null || score >= 85) return ScoreBand.Ok;
  return score < 75 ? ScoreBand.Low : ScoreBand.Mid;
}

export function isLow(value: number | null, below: number): boolean {
  return value !== null && value < below;
}

const DAY_MONTH = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' });

/** «13 سبتمبر» / «24 ديسمبر 2026» (year only on the end date). */
export function termDateLabels(startDate: string, endDate: string): { start: string; end: string } {
  const start = parseLocalIsoDate(startDate);
  const end = parseLocalIsoDate(endDate);
  const startLabel = DAY_MONTH.format(start);
  return {
    start:
      start.getFullYear() === end.getFullYear()
        ? startLabel
        : `${startLabel} ${start.getFullYear()}`,
    end: `${DAY_MONTH.format(end)} ${end.getFullYear()}`,
  };
}
