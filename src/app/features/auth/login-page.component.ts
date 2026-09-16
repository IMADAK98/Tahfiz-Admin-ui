import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink],
  template: `
    <section class="card max-w-md w-full p-8 flex flex-col gap-6">
      <header class="text-center">
        <h1 class="text-xl font-bold mb-2">تسجيل الدخول</h1>
        <p style="color: var(--color-muted)">ادخل بريدك وكلمة المرور للوصول إلى لوحة الإدارة.</p>
      </header>

      <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
        <div class="input-group">
          <label for="email">البريد الإلكتروني</label>
          <input id="email" type="email" class="input" placeholder="admin@center.example" autocomplete="username" />
        </div>
        <div class="input-group">
          <label for="password">كلمة المرور</label>
          <input id="password" type="password" class="input" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-lg">دخول</button>
      </form>

      <p class="text-center text-sm" style="color: var(--color-muted)">
        واجهة تسجيل الدخول الكاملة — PR3. حالياً:
        <a routerLink="/admin" class="font-semibold">معاينة لوحة الإدارة</a>
      </p>
    </section>
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);

  onSubmit(event: Event): void {
    event.preventDefault();
    this.auth.login('', '').subscribe();
  }
}
