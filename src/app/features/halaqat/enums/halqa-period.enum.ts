import { HalqaPeriod } from '../../../core/api/models/halqa.model';

export const HALQA_PERIOD_OPTIONS: ReadonlyArray<{ value: HalqaPeriod; label: string }> = [
  { value: 'ONLINE', label: 'عن بُعد' },
  { value: 'FAJR', label: 'الفجر' },
  { value: 'DUHUR', label: 'الظهر' },
  { value: 'ASR', label: 'العصر' },
  { value: 'MAGHRIB', label: 'المغرب' },
  { value: 'ISHA', label: 'العشاء' },
];

export function halqaPeriodLabel(period: HalqaPeriod): string {
  return HALQA_PERIOD_OPTIONS.find((item) => item.value === period)?.label ?? period;
}

export function halqaPeriodsLabel(periods: HalqaPeriod[]): string {
  if (!periods.length) {
    return '—';
  }
  return periods.map(halqaPeriodLabel).join(' · ');
}
