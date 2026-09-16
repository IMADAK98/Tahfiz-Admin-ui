import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Checkbox } from 'primeng/checkbox';
import { Button } from 'primeng/button';
import { ApiError } from '../../core/api/api-error';
import { canAccessAdmin, isTeacherRole } from '../../core/auth/auth-role.helpers';
import { AuthService } from '../../core/auth/auth.service';
import { safeRedirectPath } from '../../core/auth/redirect.helpers';
import { CENTER_SIGNUP_URL } from '../../core/config/public-links';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, InputText, Password, Checkbox, Button],
  template: `
    <div class="login-page">
      <div class="login-wrap">
        <a class="brand-row" routerLink="/">
          <span class="brand-mark" aria-hidden="true">ت</span>
          تحفيظ
        </a>

        <div class="login-card">
          <h1>تسجيل الدخول</h1>
          <p class="login-sub">لوحة إدارة المركز</p>

          @if (infoMessage()) {
            <p class="login-info" role="status">{{ infoMessage() }}</p>
          }

          @if (errorMessage()) {
            <p class="login-error" role="alert">{{ errorMessage() }}</p>
          }

          <form class="login-form" (submit)="onSubmit($event)" aria-label="نموذج تسجيل الدخول">
            <div class="input-group login-field">
              <label for="email">البريد الإلكتروني</label>
              <input
                pInputText
                id="email"
                name="email"
                type="email"
                [(ngModel)]="email"
                placeholder="admin@center.example"
                autocomplete="username"
                required
                fluid
                [disabled]="submitting()"
              />
            </div>

            <div class="input-group login-field">
              <label for="password">كلمة المرور</label>
              <p-password
                inputId="password"
                name="password"
                [(ngModel)]="password"
                placeholder="••••••••"
                [feedback]="false"
                [toggleMask]="true"
                autocomplete="current-password"
                required
                fluid
                [disabled]="submitting()"
              />
            </div>

            <div class="row-between">
              <label class="remember-row">
                <p-checkbox [(ngModel)]="rememberMe" name="remember" [binary]="true" inputId="remember" />
                <span>تذكّرني</span>
              </label>
              <button type="button" class="btn btn-ghost btn-sm" (click)="showForgotPanel.set(true)">
                نسيت كلمة المرور؟
              </button>
            </div>

            <p-button
              type="submit"
              [label]="submitting() ? 'جاري الدخول…' : 'دخول'"
              styleClass="w-full"
              [loading]="submitting()"
              [disabled]="submitting()"
            />
          </form>

          @if (showForgotPanel()) {
            <section class="forgot-panel" aria-labelledby="forgot-title">
              <h2 id="forgot-title">استعادة كلمة المرور</h2>
              <p>أدخل بريدك وسنرسل رابط إعادة التعيين.</p>
              <div class="input-group login-field">
                <label for="reset-email">البريد الإلكتروني</label>
                <input
                  pInputText
                  id="reset-email"
                  type="email"
                  [(ngModel)]="resetEmail"
                  placeholder="admin@center.example"
                  fluid
                />
              </div>
              <p-button
                type="button"
                label="إرسال رابط الاستعادة"
                severity="secondary"
                styleClass="w-full mt-3"
                (onClick)="onForgotSubmit()"
              />
            </section>
          }

          <div class="login-divider">أو</div>
          <p style="text-align: center; font-size: 0.9375rem; color: var(--color-muted)">
            ليس لديك حساب مركز؟
            <a [href]="centerSignupUrl" style="font-weight: 700" title="نموذج تسجيل المركز">تسجيل مركز جديد</a>
          </p>
        </div>

        <p class="login-footer-links">
          <a routerLink="/">العودة للرئيسية</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly centerSignupUrl = CENTER_SIGNUP_URL;
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
