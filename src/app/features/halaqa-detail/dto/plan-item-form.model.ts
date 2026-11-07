import type {
  AddStudyPlanItemPayload,
  CreateStudyPlanItemPayload,
  StudyPlanAmountType,
  StudyPlanDirection,
  StudyPlanItemType,
  UpdateStudyPlanItemPayload,
} from '../../../core/api/models/study-plan.model';
import { STUDY_PLAN_ITEM_TYPE_OPTIONS } from '../enums';
import { HALAQA_DETAIL_I18N } from '../i18n/halaqa-detail-i18n';
import type { StudyPlanItemViewModel } from './halaqa-detail.mapper';

/**
 * Nest `StudyPlanItemType` on IMADAK98/Tahfiz `localization-refactor`
 * (`8164c6ec`, `src/study-plan-item/enums/study-plan-item.enums.ts:1-5`).
 * One live value per plan: partial unique index `UQ_study_plan_item_plan_type`
 * on `(study_plan_id, type) WHERE deleted_at IS NULL`
 * (`src/study-plan-item/entities/study-plan-item.entity.ts:18-21`).
 * Create calls `rejectDuplicateItemTypes` before insert
 * (`src/study-plan/study-plan.service.ts:68`).
 * Add calls `rejectIfPlanHasType` (`study-plan-item.service.ts:61`, defined at `98-115`).
 * Update checks only when the type changes (`:240-241`) and excludes the saved row
 * (`rejectTypeChangeCollision` at `292-303`). `throwDuplicateStudyPlanItemType` is `27-37`.
 */
export const STUDY_PLAN_UNIQUE_ITEM_TYPES: readonly StudyPlanItemType[] = ['HIFZ', 'TATHBEET', 'MURAJAA'];

export interface PlanItemTypeSelectOption {
  value: StudyPlanItemType;
  label: string;
  badgeClass: string;
  disabled: boolean;
}

export interface PlanItemFormModel {
  type: StudyPlanItemType;
  direction: StudyPlanDirection;
  fromSurah: number;
  fromAyah: number;
  toSurah: number | null;
  toAyah: number | null;
  amountType: StudyPlanAmountType;
  amountValue: number;
}

/** Exact enum only. Null, blank, and any other string occupy no type slot. */
export function normalizeStudyPlanItemType(value: unknown): StudyPlanItemType | null {
  return STUDY_PLAN_UNIQUE_ITEM_TYPES.find((type) => type === value) ?? null;
}

/** Types not already on the plan, in حفظ → تثبيت → مراجعة order. */
export function missingPlanItemTypes(
  items: readonly { type?: unknown }[] | null | undefined,
): StudyPlanItemType[] {
  const used = new Set<StudyPlanItemType>();
  for (const item of items ?? []) {
    const type = normalizeStudyPlanItemType(item?.type);
    if (type) {
      used.add(type);
    }
  }
  return STUDY_PLAN_UNIQUE_ITEM_TYPES.filter((type) => !used.has(type));
}

/**
 * Disable types chosen on other rows. This row's current type stays enabled,
 * including when another row already has it.
 */
export function planItemTypeOptionsForRow(
  rows: readonly { type?: unknown }[] | null | undefined,
  rowIndex: number,
): PlanItemTypeSelectOption[] {
  const list = rows ?? [];
  const ownType = normalizeStudyPlanItemType(list[rowIndex]?.type);
  const usedByOthers = new Set<StudyPlanItemType>();
  list.forEach((row, index) => {
    if (index === rowIndex) {
      return;
    }
    const type = normalizeStudyPlanItemType(row?.type);
    if (type) {
      usedByOthers.add(type);
    }
  });
  return STUDY_PLAN_ITEM_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    badgeClass: option.badgeClass,
    disabled: usedByOthers.has(option.value) && option.value !== ownType,
  }));
}

/** Edit dialog: sibling live items are the other rows; the open item is last. */
export function editPlanItemTypeOptions(
  siblingTypes: readonly unknown[] | null | undefined,
  currentType: unknown,
): PlanItemTypeSelectOption[] {
  const rows = [...(siblingTypes ?? []).map((type) => ({ type })), { type: currentType }];
  return planItemTypeOptionsForRow(rows, rows.length - 1);
}

export function nextUnusedPlanItemType(
  rows: readonly { type?: unknown }[] | null | undefined,
): StudyPlanItemType | null {
  const used = new Set<StudyPlanItemType>();
  for (const row of rows ?? []) {
    const type = normalizeStudyPlanItemType(row?.type);
    if (type) {
      used.add(type);
    }
  }
  return STUDY_PLAN_UNIQUE_ITEM_TYPES.find((type) => !used.has(type)) ?? null;
}

export function canAddUniquePlanItem(
  rows: readonly { type?: unknown }[] | null | undefined,
): boolean {
  return nextUnusedPlanItemType(rows) != null;
}

/** i18n keys for create-plan rows that share a type. Missing types are not duplicates of each other. */
export function duplicatePlanItemTypeFieldErrors(
  rows: readonly { type?: unknown }[] | null | undefined,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const firstIndex = new Map<StudyPlanItemType, number>();
  (rows ?? []).forEach((row, index) => {
    const type = normalizeStudyPlanItemType(row?.type);
    if (!type) {
      return;
    }
    const first = firstIndex.get(type);
    if (first === undefined) {
      firstIndex.set(type, index);
      return;
    }
    const key = HALAQA_DETAIL_I18N.validation.planItemTypeDuplicate;
    errors[`studyPlanItems.${index}.type`] = key;
    errors[`studyPlanItems.${first}.type`] = key;
  });
  return errors;
}

/**
 * Saved edit value that another live item already uses.
 * The row stays; callers show this instead of clearing the type.
 */
export function isLegacyDuplicatePlanItemType(
  currentType: unknown,
  originalType: unknown,
  siblingTypes: readonly unknown[] | null | undefined,
): boolean {
  const current = normalizeStudyPlanItemType(currentType);
  const original = normalizeStudyPlanItemType(originalType);
  if (!current || current !== original) {
    return false;
  }
  return (siblingTypes ?? []).some((type) => normalizeStudyPlanItemType(type) === current);
}

/** Block a type change onto a sibling. Keeping the loaded legacy type is not an error. */
export function editPlanItemTypeSubmitError(
  currentType: unknown,
  originalType: unknown,
  siblingTypes: readonly unknown[] | null | undefined,
): string | null {
  const current = normalizeStudyPlanItemType(currentType);
  if (!current || isLegacyDuplicatePlanItemType(current, originalType, siblingTypes)) {
    return null;
  }
  const taken = (siblingTypes ?? []).some((type) => normalizeStudyPlanItemType(type) === current);
  return taken ? HALAQA_DETAIL_I18N.validation.planItemTypeDuplicate : null;
}

/** Add-item dialog may only submit a type still missing on the plan. */
export function addPlanItemTypeSubmitError(
  currentType: unknown,
  availableTypes: readonly unknown[] | null | undefined,
): string | null {
  const current = normalizeStudyPlanItemType(currentType);
  if (!current) {
    return null;
  }
  const allowed = (availableTypes ?? []).some((type) => normalizeStudyPlanItemType(type) === current);
  return allowed ? null : HALAQA_DETAIL_I18N.validation.planItemTypeDuplicate;
}

export function createEmptyPlanItemForm(type: StudyPlanItemType = 'HIFZ'): PlanItemFormModel {
  return {
    type,
    direction: 'NORMAL',
    fromSurah: 1,
    fromAyah: 1,
    toSurah: null,
    toAyah: null,
    amountType: 'LINE',
    amountValue: 5,
  };
}

export function createPlanItemFormFromView(item: StudyPlanItemViewModel): PlanItemFormModel {
  return {
    type: item.type,
    direction: item.direction === 'REVERSE' ? 'REVERSE' : 'NORMAL',
    fromSurah: item.fromSurahNumber,
    fromAyah: item.fromAyah,
    toSurah: item.toSurahNumber,
    toAyah: item.toAyah,
    amountType: item.amountType,
    amountValue: item.amountValue,
  };
}

export function validatePlanItemForm(form: PlanItemFormModel): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!normalizeStudyPlanItemType(form.type)) {
    errors['type'] = HALAQA_DETAIL_I18N.validation.planItemType;
  }
  if (!form.fromSurah || form.fromSurah < 1) {
    errors['fromSurah'] = HALAQA_DETAIL_I18N.validation.fromSurah;
  }
  if (!form.fromAyah || form.fromAyah < 1) {
    errors['fromAyah'] = HALAQA_DETAIL_I18N.validation.fromAyah;
  }
  if (!form.amountValue || form.amountValue < 1) {
    errors['amountValue'] = HALAQA_DETAIL_I18N.validation.amount;
  }
  return errors;
}

export function buildCreatePlanItemPayload(form: PlanItemFormModel): CreateStudyPlanItemPayload {
  const payload: CreateStudyPlanItemPayload = {
    type: form.type,
    direction: form.direction,
    fromSurah: form.fromSurah,
    fromAyah: form.fromAyah,
    amountType: form.amountType,
    amountValue: form.amountValue,
  };
  if (form.toSurah != null) {
    payload.toSurah = form.toSurah;
  }
  if (form.toAyah != null) {
    payload.toAyah = form.toAyah;
  }
  return payload;
}

/** Six keys only. Nest computes the end range; do not send to* or a plan id. */
export function buildAddPlanItemPayload(form: PlanItemFormModel): AddStudyPlanItemPayload {
  return {
    type: form.type,
    direction: form.direction,
    fromSurah: Number(form.fromSurah),
    fromAyah: Number(form.fromAyah),
    amountType: form.amountType,
    amountValue: Number(form.amountValue),
  };
}

export function buildUpdatePlanItemPayload(form: PlanItemFormModel): UpdateStudyPlanItemPayload {
  return {
    type: form.type,
    direction: form.direction,
    fromSurahNumber: form.fromSurah,
    fromAyah: form.fromAyah,
    amountType: form.amountType,
    amountValue: form.amountValue,
  };
}
