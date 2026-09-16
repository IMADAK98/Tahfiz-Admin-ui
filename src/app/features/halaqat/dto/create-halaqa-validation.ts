import { CreateHalaqaFormModel } from './create-halaqa-form.model';

export function validateCreateHalaqaForm(form: CreateHalaqaFormModel): string | null {
  if (!form.name.trim()) {
    return 'اسم الحلقة مطلوب';
  }
  if (!form.category) {
    return 'اختر الفئة';
  }
  if (!form.period) {
    return 'اختر الفترة';
  }
  if (!form.teacherId) {
    return 'اختر المعلّم';
  }
  if (!form.studentIds.length) {
    return 'اختر طالباً واحداً على الأقل';
  }
  if (form.studentLimit !== null && form.studentLimit < 1) {
    return 'عدد الطلاب المستهدف يجب أن يكون 1 على الأقل';
  }
  return null;
}
