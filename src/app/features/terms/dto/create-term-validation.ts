import { CreateTermFormModel } from './create-term-form.model';

export function validateCreateTermForm(form: CreateTermFormModel): string | null {
  if (!form.name.trim()) {
    return 'اسم الدورة مطلوب';
  }
  if (!form.startDate || !form.endDate) {
    return 'تاريخ بداية ونهاية الدورة مطلوبان';
  }
  if (!form.registerationStartDate || !form.registerationEndDate) {
    return 'فترة التسجيل مطلوبة';
  }
  if (form.startDate > form.endDate) {
    return 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
  }
  if (form.registerationStartDate > form.registerationEndDate) {
    return 'نهاية التسجيل يجب أن تكون بعد بداية التسجيل';
  }
  if (form.registerationEndDate > form.endDate) {
    return 'نهاية التسجيل يجب أن تكون قبل أو في نفس يوم نهاية الدورة';
  }
  for (const holiday of form.holidayDates) {
    if (holiday < form.startDate || holiday > form.endDate) {
      return 'يجب أن تقع أيام الإجازة ضمن فترة الدورة';
    }
  }
  return null;
}

export function canPickHolidayDates(form: CreateTermFormModel): boolean {
  return !!form.startDate && !!form.endDate && form.startDate <= form.endDate;
}
