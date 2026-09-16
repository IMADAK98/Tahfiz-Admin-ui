import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiError } from '../../core/api/api-error';
import { canAccessAdmin, isTeacherRole } from '../../core/auth/auth-role.helpers';
import { AuthService } from '../../core/auth/auth.service';
import { safeRedirectPath } from '../../core/auth/redirect.helpers';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  template: `
    <section class="card max-w-md w-full p-8 flex flex-col gap-6">
      <header class="text-center">
        <h1 class="text-xl font-bold mb-2">تسجيل الدخول</h1>
        <p style="color: var(--color-muted)">ادخل بريدك وكلمة المرور للوصول إلى لوحة الإدارة.</p>
      </header>

      @if (infoMessage()) {
        <p class="badge badge-neutral w-full text-center py-3" role="status">{{ infoMessage() }}</p>
      }

      @if (errorMessage()) {
        <p class="badge badge-neutral w-full text-center py-3" style="color: var(--color-danger)" role="alert">
          {{ errorMessage() }}
        </p>
      }

      <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
        <div class="input-group">
          <label for="email">البريد الإلكتروني</label>
          <input
            id="email"
            name="email"
            type="email"
            class="input"
            [(ngModel)]="email"
            placeholder="admin@center.example"
            autocomplete="username"
            required
            [disabled]="submitting()"
          />
        </div>
        <div class="input-group">
          <label for="password">كلمة المرور</label>
          <input
            id="password"
            name="password"
            type="password"
            class="input"
            [(ngModel)]="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
            [disabled]="submitting()"
          />
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="submitting()">
          {{ submitting() ? 'جاري الدخول…' : 'دخول' }}
        </button>
      </form>
    </section>
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected email = '';
  protected password = '';
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(null);

  constructor() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'teacher') {
      this.infoMessage.set('استخدم تطبيق المعلم — لا يمكن الدخول إلى لوحة الإدارة من الويب.');
    } else if (reason === 'denied') {
      this.infoMessage.set('لا تملك صلاحية الوصول إلى لوحة الإدارة.');
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set(null);
    this.submitting.set(true);

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: (claims) => {
        this.submitting.set(false);

        if (isTeacherRole(claims.role)) {
          this.auth.clearSession();
          this.errorMessage.set('استخدم تطبيق المعلم — لا يمكن الدخول إلى لوحة الإدارة.');
          return;
        }

        if (!canAccessAdmin(claims)) {
          this.auth.clearSession();
          this.errorMessage.set('ليس لديك صلاحية الدخول إلى لوحة الإدارة.');
          return;
        }

        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        void this.router.navigateByUrl(safeRedirectPath(redirect));
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(error instanceof ApiError ? error.message : 'تعذر تسجيل الدخول. تحقق من البيانات.');
      },
    });
  }
}
