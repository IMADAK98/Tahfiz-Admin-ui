import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '../../core/api/api-error';
import { isAdminRole } from '../../core/auth/auth-role.helpers';
import { AuthService } from '../../core/auth/auth.service';
import { safeRedirectPath } from '../../core/auth/redirect.helpers';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="card max-w-md w-full p-8 flex flex-col gap-6">
      <header class="text-center">
        <h1 class="text-xl font-bold mb-2">تسجيل الدخول</h1>
        <p style="color: var(--color-muted)">ادخل بريدك وكلمة المرور للوصول إلى لوحة الإدارة.</p>
      </header>

      @if (reasonMessage) {
        <p class="text-sm text-center p-3 rounded" style="background: var(--color-danger-soft); color: var(--color-danger)">
          {{ reasonMessage }}
        </p>
      }

      @if (errorMessage) {
        <p class="text-sm text-center p-3 rounded" style="background: var(--color-danger-soft); color: var(--color-danger)">
          {{ errorMessage }}
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
            placeholder="admin@center.example"
            autocomplete="username"
            [disabled]="loading"
            [(ngModel)]="email"
            required
          />
        </div>
        <div class="input-group">
          <label for="password">كلمة المرور</label>
          <input
            id="password"
            name="password"
            type="password"
            class="input"
            placeholder="••••••••"
            autocomplete="current-password"
            [disabled]="loading"
            [(ngModel)]="password"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="loading">
          {{ loading ? 'جاري الدخول…' : 'دخول' }}
        </button>
      </form>

      <p class="text-center text-sm" style="color: var(--color-muted)">
        <a routerLink="/" class="font-semibold">العودة للصفحة الرئيسية</a>
      </p>
    </section>
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = false;
  errorMessage: string | null = null;
  reasonMessage: string | null = null;

  constructor() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'teacher') {
      this.reasonMessage = 'حساب المعلم مخصص لتطبيق المعلم. استخدم تطبيق المعلم للوصول إلى حلقاتك.';
    } else if (reason === 'denied') {
      this.reasonMessage = 'لا تملك صلاحية الوصول إلى لوحة الإدارة.';
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage = null;
    this.reasonMessage = null;

    const email = this.email.trim();
    const password = this.password;
    if (!email || !password) {
      this.errorMessage = 'يرجى إدخال البريد الإلكتروني وكلمة المرور.';
      return;
    }

    this.loading = true;
    this.auth.login(email, password).subscribe({
      next: (claims) => {
        this.loading = false;
        if (!isAdminRole(claims.role)) {
          this.auth.logout().subscribe();
          if (claims.role === 'TEACHER') {
            this.reasonMessage =
              'حساب المعلم مخصص لتطبيق المعلم. استخدم تطبيق المعلم للوصول إلى حلقاتك.';
          } else {
            this.reasonMessage = 'لا تملك صلاحية الوصول إلى لوحة الإدارة.';
          }
          return;
        }

        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        void this.router.navigateByUrl(safeRedirectPath(redirect));
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage =
          error instanceof ApiError ? error.message : 'تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.';
      },
    });
  }
}
