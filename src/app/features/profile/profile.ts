import { Component, inject, signal } from '@angular/core';
import { AuthApiService } from '../../core/api/auth-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { JwtClaims } from '../../core/auth/jwt.helpers';

interface AdminProfileView {
  name: string;
  email: string;
  phone: string;
  roleLabel: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly profile = signal<AdminProfileView | null>(null);

  constructor() {
    this.authApi.getProfile().subscribe({
      next: (raw) => {
        this.profile.set(mapAdminProfile(raw, this.auth.getClaims()));
        this.loading.set(false);
      },
      error: () => {
        this.profile.set(mapAdminProfile(null, this.auth.getClaims()));
        this.loading.set(false);
      },
    });
  }
}

function mapAdminProfile(raw: unknown, claims: JwtClaims | null): AdminProfileView {
  const record = asRecord(raw);
  const nestedUser = record['user'];
  const user =
    nestedUser && typeof nestedUser === 'object' && !Array.isArray(nestedUser)
      ? (nestedUser as Record<string, unknown>)
      : record;
  const role = stringOf(user['role']) ?? claims?.role;
  return {
    name: stringOf(user['name']) ?? stringOf(user['teacherName']) ?? roleLabel(role),
    email: stringOf(user['email']) ?? '—',
    phone: stringOf(user['phone']) ?? '—',
    roleLabel: roleLabel(role),
  };
}

function roleLabel(role: string | undefined): string {
  if (role === 'SYSTEM_ADMIN') {
    return 'مدير النظام';
  }
  return 'مشرف';
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function stringOf(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}
