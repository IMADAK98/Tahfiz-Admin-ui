import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CENTER_SIGNUP_URL } from '../../core/config/public-links';

@Component({
  selector: 'app-public-shell',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="public-shell">
      <header class="site-header">
        <a class="brand" routerLink="/">
          <span class="brand-mark" aria-hidden="true">ت</span>
          تحفيظ
        </a>
        <nav class="header-nav" aria-label="التنقل الرئيسي">
          <a class="nav-text" routerLink="/" fragment="features">المميزات</a>
          <a class="nav-text" routerLink="/login">تسجيل الدخول</a>
          <a class="btn btn-primary" [href]="centerSignupUrl" title="نموذج تسجيل المركز">تسجيل مركز جديد</a>
        </nav>
      </header>
      <main class="public-main landing-main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PublicShellComponent {
  protected readonly centerSignupUrl = CENTER_SIGNUP_URL;
}
