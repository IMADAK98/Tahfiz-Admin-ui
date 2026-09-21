import { HalqaCategory, HalqaPeriod } from '../../../core/api/models/halqa.model';
import { UpdateHalqaPayload } from '../../../core/api/halqa-api.service';
import { HALAQA_DETAIL_I18N } from '../i18n/halaqa-detail-i18n';
import { HalaqaDetailViewModel } from './halaqa-detail.mapper';

export interface EditHalaqaFormModel {
  category: HalqaCategory | '';
  period: HalqaPeriod | '';
  isActive: boolean;
  teacherId: number | null;
  studentLimit: number | null;
}

export function createEditHalaqaForm(detail: HalaqaDetailViewModel): EditHalaqaFormModel {
  return {
    category: detail.category ?? '',
    period: detail.periods[0] ?? '',
    isActive: detail.isActive,
    teacherId: detail.teacherId,
    studentLimit: detail.studentLimit || 15,
  };
}

export function validateEditHalaqaForm(form: EditHalaqaFormModel): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.category) {
    errors['category'] = HALAQA_DETAIL_I18N.validation.pickCategory;
  }
  if (!form.period) {
    errors['periods'] = HALAQA_DETAIL_I18N.validation.pickPeriod;
  }
  if (!form.teacherId) {
    errors['teacherId'] = HALAQA_DETAIL_I18N.validation.pickTeacher;
  }
  if (!form.studentLimit || form.studentLimit < 1) {
    errors['studentLimit'] = HALAQA_DETAIL_I18N.validation.studentLimit;
  }
  return errors;
}

export function buildUpdateHalqaPayload(
  detail: HalaqaDetailViewModel,
  form: EditHalaqaFormModel,
): UpdateHalqaPayload {
  return {
    name: detail.name,
    category: form.category as HalqaCategory,
    periods: [form.period as HalqaPeriod],
    studentLimit: form.studentLimit as number,
    teacherId: form.teacherId ?? undefined,
  };
}
