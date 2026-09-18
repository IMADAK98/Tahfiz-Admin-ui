import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Password } from 'primeng/password';
import { createFieldErrorBag, nestSubmitBanner } from '../../core/api/field-error-state';
import { AuthService } from '../../core/auth/auth.service';
import { FieldErrorComponent } from '../../core/ui/field-error';
import { TOAST_I18N } from '../../core/ui/toast-messages';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink, Password, Button, FieldErrorComponent],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  protected readonly form = {
    newPassword: '',
    confirmPassword: '',
  };
  protected readonly token = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
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

  ngOnInit(): void {
    const token =
      this.route.snapshot.queryParamMap.get('token') ??
      this.route.snapshot.queryParamMap.get('resetToken') ??
      '';
    this.token.set(token.trim() || null);
    if (!this.token()) {
      this.errorMessage.set('رابط الاستعادة غير صالح أو منتهي الصلاحية.');
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.submitting()) {
      return;
    }

    const token = this.token();
    if (!token) {
      this.errorMessage.set('رابط الاستعادة غير صالح أو منتهي الصلاحية.');
      return;
    }

    this.fields.clearAll();
    const password = this.form.newPassword;
    const confirm = this.form.confirmPassword;
    if (!password || password.length < 6) {
      this.errorMessage.set('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (password !== confirm) {
      this.errorMessage.set('كلمتا المرور غير متطابقتين.');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.auth.resetPassword(token, password).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigate(['/login'], { queryParams: { reset: 'success' } });
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        const banner = nestSubmitBanner(
          error,
          this.fields,
          this.translate.instant(TOAST_I18N.errors.fieldErrorsBanner),
          'تعذّر تغيير كلمة المرور. قد يكون الرابط منتهي الصلاحية.',
        );
        if (this.fields.get('token') && !this.fields.get('newPassword')) {
          this.errorMessage.set(this.fields.get('token') ?? banner);
          return;
        }
        this.errorMessage.set(banner);
      },
    });
  }
}
