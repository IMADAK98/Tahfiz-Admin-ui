import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Password } from 'primeng/password';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink, Password, Button],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly form = {
    newPassword: '',
    confirmPassword: '',
  };
  protected readonly token = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

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
        this.errorMessage.set(
          error instanceof ApiError
            ? error.message
            : 'تعذّر تغيير كلمة المرور. قد يكون الرابط منتهي الصلاحية.',
        );
      },
    });
  }
}
