import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
          <span class="nav-icon" aria-hidden="true">◻</span>
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
          <a routerLink="/" class="nav-link">
            <span class="nav-icon" aria-hidden="true">↩</span>
            <span>العودة للموقع</span>
          </a>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <h1 class="topbar-title">لوحة التحكم</h1>
          <div class="topbar-actions">
            <div class="user-chip">
              <span>مدير المركز</span>
              <span class="user-avatar" aria-hidden="true">م</span>
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
export class AdminShellComponent {}
