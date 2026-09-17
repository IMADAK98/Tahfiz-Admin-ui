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
import { postLoginPath } from '../../core/auth/redirect.helpers';
import { CENTER_SIGNUP_ROUTE } from '../../core/config/public-links';
import { createEmptyLoginForm } from './dto/login-form.model';
import { LoginQueryReason } from './enums/login-query-reason.enum';
import { LoginService } from './login.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, InputText, Password, Checkbox, Button],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly loginService = inject(LoginService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly centerSignupRoute = CENTER_SIGNUP_ROUTE;
  protected readonly form = createEmptyLoginForm();
  protected readonly submitting = signal(false);
  protected readonly forgotSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(null);
  protected readonly showForgotPanel = signal(false);

  constructor() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === LoginQueryReason.Teacher) {
      this.infoMessage.set('استخدم تطبيق المعلم — لا يمكن الدخول إلى لوحة الإدارة من الويب.');
    } else if (reason === LoginQueryReason.Denied) {
      this.infoMessage.set('لا تملك صلاحية الوصول إلى لوحة الإدارة.');
    } else if (this.route.snapshot.queryParamMap.get('reset') === 'success') {
      this.infoMessage.set('تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.');
    }

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash === '#forgot' || hash === '#forgot-panel') {
      this.showForgotPanel.set(true);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.submitting()) {
      return;
    }
    this.errorMessage.set(null);
    this.submitting.set(true);

    this.loginService.login(this.form).subscribe({
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
        void this.router.navigateByUrl(postLoginPath(claims.role, redirect));
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
    if (this.forgotSubmitting()) {
      return;
    }
    const email = (this.form.resetEmail || this.form.email || '').trim();
    if (!email) {
      this.errorMessage.set('أدخل البريد الإلكتروني أولاً.');
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.forgotSubmitting.set(true);

    this.loginService.requestPasswordReset(email).subscribe({
      next: () => {
        this.forgotSubmitting.set(false);
        // Enumeration-safe copy (Nest always 200 when email format is valid).
        this.infoMessage.set('إذا كان البريد مسجّلاً، ستصلك رسالة بإرشادات الاستعادة.');
        this.showForgotPanel.set(false);
      },
      error: (error: unknown) => {
        this.forgotSubmitting.set(false);
        this.errorMessage.set(
          error instanceof ApiError
            ? error.message
            : 'تعذّر إرسال رابط الاستعادة. حاول مرة أخرى.',
        );
      },
    });
  }
}
