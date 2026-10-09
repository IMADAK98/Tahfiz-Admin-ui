import type {
  AddStudyPlanItemPayload,
  CreateStudyPlanItemPayload,
  StudyPlanAmountType,
  StudyPlanDirection,
  StudyPlanItemType,
  UpdateStudyPlanItemPayload,
} from '../../../core/api/models/study-plan.model';
import { HALAQA_DETAIL_I18N } from '../i18n/halaqa-detail-i18n';
import type { StudyPlanItemViewModel } from './halaqa-detail.mapper';

const PLAN_ITEM_TYPE_ORDER: readonly StudyPlanItemType[] = ['HIFZ', 'TATHBEET', 'MURAJAA'];

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

/** Types not already on the plan, in حفظ → تثبيت → مراجعة order. */
export function missingPlanItemTypes(
  items: readonly { type: StudyPlanItemType }[],
): StudyPlanItemType[] {
  const used = new Set(items.map((item) => item.type));
  return PLAN_ITEM_TYPE_ORDER.filter((type) => !used.has(type));
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
