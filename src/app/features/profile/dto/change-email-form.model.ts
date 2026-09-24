import type { ChangeEmailRequest } from '../../../core/api/credential-change.model';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ChangeEmailFormModel {
  newEmail: string;
  currentPassword: string;
}

export interface ChangeEmailFieldErrors {
  newEmail?: string;
  currentPassword?: string;
}

export function createEmptyChangeEmailForm(): ChangeEmailFormModel {
  return { newEmail: '', currentPassword: '' };
}

export function validateChangeEmailForm(form: ChangeEmailFormModel): ChangeEmailFieldErrors {
  const errors: ChangeEmailFieldErrors = {};
  const newEmail = form.newEmail.trim();
  if (!EMAIL_PATTERN.test(newEmail)) {
    errors.newEmail = 'أدخل بريداً إلكترونياً صالحاً';
  }
  if (!form.currentPassword) {
    errors.currentPassword = 'أدخل كلمة المرور الحالية';
  }
  return errors;
}

export function toChangeEmailRequest(form: ChangeEmailFormModel): ChangeEmailRequest {
  return { newEmail: form.newEmail.trim(), currentPassword: form.currentPassword };
}
