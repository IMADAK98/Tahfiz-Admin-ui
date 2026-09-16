import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';

const ADMIN_PAGE_TITLES: Record<string, string> = {
  '/admin': 'لوحة التحكم',
  '/admin/dashboard': 'لوحة التحكم',
  '/admin/terms': 'الدورات',
  '/admin/halaqat': 'الحلقات',
  '/admin/teachers': 'المعلمون',
  '/admin/teacher-requests': 'طلبات المعلمين',
  '/admin/students': 'الطلاب',
  '/admin/student-requests': 'طلبات الطلاب',
  '/admin/reports/attendance': 'تقرير الحضور',
  '/admin/reports/progress': 'تقرير التقدّم',
};

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);
  protected readonly displayName = signal('مدير المركز');
  protected readonly avatarInitial = signal('م');
  protected readonly pageTitle = signal('لوحة التحكم');
  protected readonly isDashboard = signal(false);

  constructor() {
    const claims = this.auth.getClaims();
    if (claims?.role) {
      this.displayName.set(claims.role === 'SYSTEM_ADMIN' ? 'مدير النظام' : 'مدير المركز');
      this.avatarInitial.set(claims.role === 'SYSTEM_ADMIN' ? 'ن' : 'م');
    }

    this.syncPageTitle(this.router.url);
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.syncPageTitle((event as NavigationEnd).urlAfterRedirects);
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
    this.isDashboard.set(path === '/admin' || path === '/admin/dashboard');
    if (path.startsWith('/admin/halaqat/') && path !== '/admin/halaqat') {
      this.pageTitle.set('تفاصيل الحلقة');
      return;
    }
    this.pageTitle.set(ADMIN_PAGE_TITLES[path] ?? 'لوحة التحكم');
  }
}
