export interface ResetPasswordFormModel {
  newPassword: string;
  confirmPassword: string;
}

export function createEmptyResetPasswordForm(): ResetPasswordFormModel {
  return {
    newPassword: '',
    confirmPassword: '',
  };
}
