import {
  StudyPlanAmountType,
  StudyPlanDirection,
  StudyPlanItemType,
} from '../../../core/api/models/study-plan.model';

export const STUDY_PLAN_ITEM_TYPE_OPTIONS: ReadonlyArray<{
  value: StudyPlanItemType;
  label: string;
  badgeClass: string;
}> = [
  { value: 'HIFZ', label: 'حفظ', badgeClass: 'badge-primary' },
  { value: 'TATHBEET', label: 'تثبيت', badgeClass: 'badge-success' },
  { value: 'MURAJAA', label: 'مراجعة', badgeClass: 'badge-warning' },
];

export const STUDY_PLAN_DIRECTION_OPTIONS: ReadonlyArray<{
  value: StudyPlanDirection;
  label: string;
}> = [
  { value: 'NORMAL', label: 'عادي' },
  { value: 'REVERSE', label: 'عكس' },
];

export const STUDY_PLAN_AMOUNT_TYPE_OPTIONS: ReadonlyArray<{
  value: StudyPlanAmountType;
  label: string;
  unitSingular: string;
  unitPlural: string;
}> = [
  { value: 'LINE', label: 'أسطر', unitSingular: 'سطر', unitPlural: 'أسطر' },
  { value: 'PAGE', label: 'صفحات', unitSingular: 'صفحة', unitPlural: 'صفحة' },
];

export function studyPlanItemTypeLabel(type: StudyPlanItemType): string {
  return STUDY_PLAN_ITEM_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type;
}

export function studyPlanItemTypeBadgeClass(type: StudyPlanItemType): string {
  return STUDY_PLAN_ITEM_TYPE_OPTIONS.find((item) => item.value === type)?.badgeClass ?? 'badge-neutral';
}

export function studyPlanDirectionLabel(direction: StudyPlanDirection): string {
  return STUDY_PLAN_DIRECTION_OPTIONS.find((item) => item.value === direction)?.label ?? direction;
}

export function studyPlanAmountLabel(amountType: StudyPlanAmountType, value: number): string {
  const option = STUDY_PLAN_AMOUNT_TYPE_OPTIONS.find((item) => item.value === amountType);
  if (!option) {
    return String(value);
  }
  const unit = value === 1 ? option.unitSingular : option.unitPlural;
  return `${value} ${unit}`;
}
