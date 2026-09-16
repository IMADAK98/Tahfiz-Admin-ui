import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="public-shell">
      <header class="public-header">
        <div class="sidebar-brand-text">
          <strong>ثفيز</strong>
          <span>نظام التحفيظ</span>
        </div>
        <nav class="flex items-center gap-4">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="btn btn-ghost">الرئيسية</a>
          <a routerLink="/login" routerLinkActive="active" class="btn btn-primary">دخول</a>
        </nav>
      </header>
      <main class="public-main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PublicShellComponent {}
