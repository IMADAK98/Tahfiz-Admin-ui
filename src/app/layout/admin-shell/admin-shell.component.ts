import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <aside class="sidebar" aria-label="القائمة الجانبية">
        <div class="sidebar-brand">
          <div class="sidebar-logo" aria-hidden="true">ث</div>
          <div class="sidebar-brand-text">
            <strong>ثفيز</strong>
            <span>لوحة الإدارة</span>
          </div>
        </div>

        <div class="nav-section">الرئيسية</div>
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
          <span class="nav-icon" aria-hidden="true">⌂</span>
          <span>لوحة التحكم</span>
        </a>

        <div class="nav-section">الإدارة</div>
        <span class="nav-link opacity-50 cursor-not-allowed" aria-disabled="true">
          <span class="nav-icon" aria-hidden="true">◫</span>
          <span>الحلقات</span>
        </span>
        <span class="nav-link opacity-50 cursor-not-allowed" aria-disabled="true">
          <span class="nav-icon" aria-hidden="true">👤</span>
          <span>المعلمون</span>
        </span>
        <span class="nav-link opacity-50 cursor-not-allowed" aria-disabled="true">
          <span class="nav-icon" aria-hidden="true">🎓</span>
          <span>الطلاب</span>
        </span>

        <div class="sidebar-footer">
          <button type="button" class="nav-link w-full border-0 bg-transparent cursor-pointer" (click)="logout()" [disabled]="loggingOut()">
            <span class="nav-icon" aria-hidden="true">⎋</span>
            <span>{{ loggingOut() ? 'جاري الخروج…' : 'تسجيل الخروج' }}</span>
          </button>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <h1 class="topbar-title">لوحة التحكم</h1>
          <div class="topbar-actions">
            <div class="user-chip">
              <span>{{ displayName() }}</span>
              <span class="user-avatar" aria-hidden="true">{{ avatarInitial() }}</span>
            </div>
          </div>
        </header>
        <div class="content">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);
  protected readonly displayName = signal('مدير المركز');
  protected readonly avatarInitial = signal('م');

  constructor() {
    const claims = this.auth.getClaims();
    if (claims?.role) {
      this.displayName.set(claims.role === 'SYSTEM_ADMIN' ? 'مدير النظام' : 'مدير المركز');
      this.avatarInitial.set(claims.role === 'SYSTEM_ADMIN' ? 'ن' : 'م');
    }
  }

  logout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      complete: () => {
        this.loggingOut.set(false);
        void this.router.navigate(['/login']);
      },
    });
  }
}
