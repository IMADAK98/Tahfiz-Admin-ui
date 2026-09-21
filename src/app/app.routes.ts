import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { systemAdminGuard } from './core/auth/system-admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/reset-password/reset-password').then((m) => m.ResetPasswordComponent),
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
    path: 'signup/student',
    loadComponent: () =>
      import('./features/student-signup/student-signup').then((m) => m.StudentSignupComponent),
  },
  { path: 'user/student/signup', redirectTo: 'signup/student', pathMatch: 'full' },
  {
    path: 'identify',
    loadComponent: () => import('./features/identify/identify').then((m) => m.IdentifyComponent),
  },
  { path: 'user/student/identification', redirectTo: 'identify', pathMatch: 'full' },
  { path: 'join/identify', redirectTo: 'identify', pathMatch: 'full' },
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
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then((m) => m.ProfileComponent),
      },
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
        path: 'teachers/:id',
        loadComponent: () =>
          import('./features/teacher-detail/teacher-detail').then((m) => m.TeacherDetailComponent),
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
        path: 're-enrollment-requests',
        redirectTo: 're-enrollment',
        pathMatch: 'full',
      },
      {
        path: 're-enrollment',
        loadComponent: () =>
          import('./features/re-enrollment/re-enrollment').then((m) => m.ReEnrollmentComponent),
      },
      {
        path: 'reports/attendance',
        loadComponent: () =>
          import('./features/attendance-report/attendance-report').then(
            (m) => m.AttendanceReportComponent,
          ),
      },
      {
        path: 'reports/progress',
        loadComponent: () =>
          import('./features/progress-report/progress-report').then((m) => m.ProgressReportComponent),
      },
      { path: 'attendance-report', redirectTo: 'reports/attendance', pathMatch: 'full' },
    ],
  },
  {
    path: 'system-admin',
    canActivate: [systemAdminGuard],
    loadComponent: () =>
      import('./layout/system-admin-shell/system-admin-shell').then(
        (m) => m.SystemAdminShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'center-requests', pathMatch: 'full' },
      {
        path: 'center-requests',
        loadComponent: () =>
          import('./features/center-requests/center-requests').then(
            (m) => m.CenterRequestsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
