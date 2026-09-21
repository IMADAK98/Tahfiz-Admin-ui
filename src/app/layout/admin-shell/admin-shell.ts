import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';

const ADMIN_PAGE_TITLES: Record<string, string> = {
  '/admin': 'لوحة التحكم',
  '/admin/dashboard': 'لوحة التحكم',
  '/admin/terms': 'الدورات',
  '/admin/halaqat': 'الحلقات',
  '/admin/teachers': 'المعلمون',
  '/admin/teacher-requests': 'طلبات المعلمين',
  '/admin/students': 'الطلاب النشطون',
  '/admin/student-requests': 'طلبات الطلاب',
  '/admin/re-enrollment': 'طلبات إعادة التسجيل',
  '/admin/re-enrollment-requests': 'طلبات إعادة التسجيل',
  '/admin/reports/attendance': 'تقرير الحضور',
  '/admin/reports/progress': 'تقرير التقدّم',
  '/admin/profile': 'الملف الشخصي',
};

const ADMIN_PAGE_SUBTITLES: Record<string, string> = {
  '/admin/re-enrollment': 'طلاب يطلبون الالتحاق بدورة / حلقة جديدة بعد انتهاء فترة سابقة',
  '/admin/re-enrollment-requests': 'طلاب يطلبون الالتحاق بدورة / حلقة جديدة بعد انتهاء فترة سابقة',
};

const SIDEBAR_COLLAPSED_KEY = 'tahfiz.admin.sidebarCollapsed';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Menu],
  templateUrl: './admin-shell.html',
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);
  protected readonly displayName = signal('مشرف');
  protected readonly avatarInitial = signal('م');
  protected readonly pageTitle = signal('لوحة التحكم');
  protected readonly pageSubtitle = signal<string | null>(null);
  protected readonly isDashboard = signal(false);
  protected readonly sidebarCollapsed = signal(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');

  protected userMenuItems(): MenuItem[] {
    return [
      {
        label: 'الملف الشخصي',
        icon: 'pi pi-user',
        command: () => void this.router.navigate(['/admin/profile']),
      },
      { separator: true },
      {
        label: this.loggingOut() ? 'جاري الخروج…' : 'تسجيل الخروج',
        icon: 'pi pi-sign-out',
        disabled: this.loggingOut(),
        command: () => this.logout(),
      },
    ];
  }

  constructor() {
    const claims = this.auth.getClaims();
    if (claims?.role) {
      this.displayName.set(claims.role === 'SYSTEM_ADMIN' ? 'مدير النظام' : 'مشرف');
      this.avatarInitial.set(claims.role === 'SYSTEM_ADMIN' ? 'ن' : 'م');
    }

    this.syncPageTitle(this.router.url);
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.syncPageTitle((event as NavigationEnd).urlAfterRedirects);
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => {
      const next = !collapsed;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
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

  private syncPageTitle(url: string): void {
    const path = url.split('?')[0];
    this.isDashboard.set(
      path === '/admin' ||
        path === '/admin/dashboard' ||
        path === '/admin/halaqat' ||
        path === '/admin/teachers' ||
        path === '/admin/teacher-requests' ||
        path === '/admin/students' ||
        path === '/admin/student-requests',
    );
    if (path.startsWith('/admin/halaqat/') && path !== '/admin/halaqat') {
      this.pageTitle.set('تفاصيل الحلقة');
      this.pageSubtitle.set(null);
      return;
    }
    if (path.startsWith('/admin/teachers/') && path !== '/admin/teachers') {
      this.pageTitle.set('تفاصيل المعلّم');
      this.pageSubtitle.set(null);
      return;
    }
    this.pageTitle.set(ADMIN_PAGE_TITLES[path] ?? 'لوحة التحكم');
    this.pageSubtitle.set(ADMIN_PAGE_SUBTITLES[path] ?? null);
  }
}
