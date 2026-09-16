import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'user/signup',
    loadComponent: () =>
      import('./features/center-signup/center-signup').then((m) => m.CenterSignupComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/public-shell/public-shell').then((m) => m.PublicShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/landing/landing').then((m) => m.LandingComponent),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./layout/admin-shell/admin-shell').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
      {
        path: 'terms',
        loadComponent: () => import('./features/terms/terms').then((m) => m.TermsComponent),
      },
      {
        path: 'halaqat',
        loadComponent: () => import('./features/halaqat/halaqat').then((m) => m.HalaqatComponent),
      },
      {
        path: 'halaqat/:id',
        loadComponent: () =>
          import('./features/halaqa-detail/halaqa-detail').then((m) => m.HalaqaDetailComponent),
      },
      {
        path: 'teachers',
        loadComponent: () => import('./features/teachers/teachers').then((m) => m.TeachersComponent),
      },
      {
        path: 'teacher-requests',
        loadComponent: () =>
          import('./features/teacher-requests/teacher-requests').then((m) => m.TeacherRequestsComponent),
      },
      {
        path: 'students',
        loadComponent: () => import('./features/students/students').then((m) => m.StudentsComponent),
      },
      {
        path: 'student-requests',
        loadComponent: () =>
          import('./features/student-requests/student-requests').then((m) => m.StudentRequestsComponent),
      },
      {
        path: 're-enrollment',
        loadComponent: () =>
          import('./features/re-enrollment/re-enrollment').then((m) => m.ReEnrollmentComponent),
      },
      {
        path: 'reports/attendance',
        loadComponent: () =>
          import('./features/reports-attendance/reports-attendance').then(
            (m) => m.ReportsAttendanceComponent,
          ),
      },
      {
        path: 'reports/progress',
        loadComponent: () =>
          import('./features/reports-progress/reports-progress').then((m) => m.ReportsProgressComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
