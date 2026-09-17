export interface RequestPasswordResetBody {
  readonly email: string;
}

export interface ResetPasswordBody {
  readonly token: string;
  readonly newPassword: string;
}
