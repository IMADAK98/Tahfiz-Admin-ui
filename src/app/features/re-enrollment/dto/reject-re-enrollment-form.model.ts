export interface RejectReEnrollmentFormModel {
  rejectionReason: string;
}

export function createEmptyRejectForm(): RejectReEnrollmentFormModel {
  return { rejectionReason: '' };
}

export function validateRejectForm(form: RejectReEnrollmentFormModel): Record<string, string> {
  const errors: Record<string, string> = {};
  const reason = form.rejectionReason.trim();
  if (!reason) {
    errors['rejectionReason'] = 'سبب الرفض مطلوب';
  } else if (reason.length < 3) {
    errors['rejectionReason'] = 'اكتب سبباً أوضح (3 أحرف على الأقل)';
  }
  return errors;
}
