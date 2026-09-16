export interface RejectReEnrollmentFormModel {
  rejectionReason: string;
}

export function createEmptyRejectForm(): RejectReEnrollmentFormModel {
  return { rejectionReason: '' };
}

export function validateRejectForm(form: RejectReEnrollmentFormModel): string | null {
  const reason = form.rejectionReason.trim();
  if (!reason) {
    return 'سبب الرفض مطلوب';
  }
  if (reason.length < 3) {
    return 'اكتب سبباً أوضح (3 أحرف على الأقل)';
  }
  return null;
}
