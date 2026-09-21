import { CreateTermFormModel } from './create-term-form.model';

export function validateCreateTermForm(form: CreateTermFormModel): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) {
    errors['name'] = 'اسم الدورة مطلوب';
  }
  if (!form.startDate || !form.endDate) {
    if (!form.startDate) {
      errors['startDate'] = 'تاريخ بداية ونهاية الدورة مطلوبان';
    }
    if (!form.endDate) {
      errors['endDate'] = 'تاريخ بداية ونهاية الدورة مطلوبان';
    }
  } else if (form.startDate > form.endDate) {
    errors['endDate'] = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
  }
  if (!form.registerationStartDate || !form.registerationEndDate) {
    if (!form.registerationStartDate) {
      errors['registerationStartDate'] = 'فترة التسجيل مطلوبة';
    }
    if (!form.registerationEndDate) {
      errors['registerationEndDate'] = 'فترة التسجيل مطلوبة';
    }
  } else if (form.registerationStartDate > form.registerationEndDate) {
    errors['registerationEndDate'] = 'نهاية التسجيل يجب أن تكون بعد بداية التسجيل';
  } else if (form.endDate && form.registerationEndDate > form.endDate) {
    errors['registerationEndDate'] = 'نهاية التسجيل يجب أن تكون قبل أو في نفس يوم نهاية الدورة';
  }
  for (const holiday of form.holidayDates) {
    if (form.startDate && form.endDate && (holiday < form.startDate || holiday > form.endDate)) {
      errors['holidayDates'] = 'يجب أن تقع أيام الإجازة ضمن فترة الدورة';
      break;
    }
  }
  return errors;
}

export function canPickHolidayDates(form: CreateTermFormModel): boolean {
  return !!form.startDate && !!form.endDate && form.startDate <= form.endDate;
}
