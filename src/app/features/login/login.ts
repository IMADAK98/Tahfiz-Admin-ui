import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { createFieldErrorBag, nestSubmitBanner } from '../../core/api/field-error-state';
import { canAccessAdmin, isTeacherRole } from '../../core/auth/auth-role.helpers';
import { AuthService } from '../../core/auth/auth.service';
import { postLoginPath } from '../../core/auth/redirect.helpers';
import { CENTER_SIGNUP_ROUTE } from '../../core/config/public-links';
import { formGroupOf } from '../../core/forms/form-group-of';
import { FieldErrorComponent } from '../../core/ui/field-error';
import { TOAST_I18N } from '../../core/ui/toast-messages';
import { LoginFormModel, createEmptyLoginForm } from './dto/login-form.model';
import { LoginQueryReason } from './enums/login-query-reason.enum';
import { LoginService } from './login.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, InputText, Password, Checkbox, Button, FieldErrorComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly loginService = inject(LoginService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  protected readonly centerSignupRoute = CENTER_SIGNUP_ROUTE;
  protected readonly form = formGroupOf(this.fb, createEmptyLoginForm());
  protected readonly submitting = signal(false);
  protected readonly forgotSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(null);
  protected readonly showForgotPanel = signal(false);
  private readonly fields = createFieldErrorBag();

  protected fieldError(...fieldNames: string[]): string | undefined {
    return this.fields.get(...fieldNames);
  }

  protected clearFieldError(...fieldNames: string[]): void {
    this.fields.clear(...fieldNames);
    if (!this.fields.hasAny()) {
      this.errorMessage.set(null);
    }
  }

  constructor() {
    for (const [name, control] of Object.entries(this.form.controls)) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
        this.clearFieldError(name === 'resetEmail' ? 'email' : name);
      });
    }

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

  protected onForgotLinkClick(event: Event): void {
    event.preventDefault();
    this.fields.clearAll();
    this.errorMessage.set(null);
    this.showForgotPanel.set(true);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.submitting()) {
      return;
    }
    this.fields.clearAll();
    this.errorMessage.set(null);
    this.submitting.set(true);

    this.loginService.login(this.form.getRawValue() as LoginFormModel).subscribe({
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
          nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            'البريد أو كلمة المرور غير صحيحة. حاول مرة أخرى.',
          ),
        );
      },
    });
  }

  onForgotSubmit(): void {
    if (this.forgotSubmitting()) {
      return;
    }
    const value = this.form.getRawValue() as LoginFormModel;
    const email = (value.resetEmail || value.email || '').trim();
    if (!email) {
      this.errorMessage.set('أدخل البريد الإلكتروني أولاً.');
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.fields.clearAll();
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
          nestSubmitBanner(
            error,
            this.fields,
            this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
            'تعذّر إرسال رابط الاستعادة. حاول مرة أخرى.',
          ),
        );
      },
    });
  }
}
