import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { ApiError } from '../../core/api/api-error';
import { canAccessAdmin, isTeacherRole } from '../../core/auth/auth-role.helpers';
import { AuthService } from '../../core/auth/auth.service';
import { safeRedirectPath } from '../../core/auth/redirect.helpers';
import { CENTER_SIGNUP_ROUTE } from '../../core/config/public-links';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, InputText, Password, Checkbox, Button],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly centerSignupRoute = CENTER_SIGNUP_ROUTE;
  protected email = '';
  protected password = '';
  protected resetEmail = '';
  protected rememberMe = false;
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(null);
  protected readonly showForgotPanel = signal(false);

  constructor() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'teacher') {
      this.infoMessage.set('استخدم تطبيق المعلم — لا يمكن الدخول إلى لوحة الإدارة من الويب.');
    } else if (reason === 'denied') {
      this.infoMessage.set('لا تملك صلاحية الوصول إلى لوحة الإدارة.');
    }

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash === '#forgot' || hash === '#forgot-panel') {
      this.showForgotPanel.set(true);
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
        this.errorMessage.set(
          error instanceof ApiError ? error.message : 'البريد أو كلمة المرور غير صحيحة. حاول مرة أخرى.',
        );
      },
    });
  }

  onForgotSubmit(): void {
    // ponytail: password-reset API wiring is a later PR; panel is mock-faithful UX only
    this.infoMessage.set('إذا كان البريد مسجّلاً، ستصلك رسالة بإرشادات الاستعادة.');
    this.showForgotPanel.set(false);
  }
}
