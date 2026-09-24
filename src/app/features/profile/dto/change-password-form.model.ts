import type { ChangePasswordRequest } from '../../../core/api/credential-change.model';

export const CHANGE_PASSWORD_MIN_LENGTH = 8;

export interface ChangePasswordFormModel {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordFieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function createEmptyChangePasswordForm(): ChangePasswordFormModel {
  return { currentPassword: '', newPassword: '', confirmPassword: '' };
}

export function validateChangePasswordForm(form: ChangePasswordFormModel): ChangePasswordFieldErrors {
  const errors: ChangePasswordFieldErrors = {};
  if (!form.currentPassword) {
    errors.currentPassword = 'أدخل كلمة المرور الحالية';
  }
  if (form.newPassword.length < CHANGE_PASSWORD_MIN_LENGTH) {
    errors.newPassword = 'ثمانية أحرف على الأقل';
  }
  if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = 'كلمتا المرور غير متطابقتين';
  }
  return errors;
}

export function toChangePasswordRequest(form: ChangePasswordFormModel): ChangePasswordRequest {
  return { currentPassword: form.currentPassword, newPassword: form.newPassword };
}
