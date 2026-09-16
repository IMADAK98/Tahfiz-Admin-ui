import { LoginRequestDto } from './login-request.dto';

export interface LoginFormModel {
  email: string;
  password: string;
  rememberMe: boolean;
  resetEmail: string;
}

export function createEmptyLoginForm(): LoginFormModel {
  return {
    email: '',
    password: '',
    rememberMe: false,
    resetEmail: '',
  };
}

export function toLoginRequest(form: LoginFormModel): LoginRequestDto {
  return {
    email: form.email.trim(),
    password: form.password,
  };
}
