import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'user/signup',
    loadComponent: () =>
      import('./features/auth/center-signup-page.component').then((m) => m.CenterSignupPageComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/public-shell/public-shell.component').then((m) => m.PublicShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/landing/landing-page.component').then((m) => m.LandingPageComponent),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./layout/admin-shell/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
      },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
