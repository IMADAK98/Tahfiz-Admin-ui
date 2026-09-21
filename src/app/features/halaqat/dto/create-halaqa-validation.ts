import { CreateHalaqaFormModel } from './create-halaqa-form.model';

export function validateCreateHalaqaForm(form: CreateHalaqaFormModel): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) {
    errors['name'] = 'اسم الحلقة مطلوب';
  }
  if (!form.category) {
    errors['category'] = 'اختر الفئة';
  }
  if (!form.period) {
    errors['periods'] = 'اختر الفترة';
  }
  if (!form.teacherId) {
    errors['teacherId'] = 'اختر المعلّم';
  }
  if (!form.studentIds.length) {
    errors['studentsIds'] = 'اختر طالباً واحداً على الأقل';
  }
  if (form.studentLimit !== null && form.studentLimit < 1) {
    errors['studentLimit'] = 'عدد الطلاب المستهدف يجب أن يكون 1 على الأقل';
  }
  return errors;
}
