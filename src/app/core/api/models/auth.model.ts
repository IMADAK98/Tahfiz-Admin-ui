export type UserRole = 'SYSTEM_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
