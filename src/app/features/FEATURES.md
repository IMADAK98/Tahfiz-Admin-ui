# Feature folder map (Imad lock)

Angular 22 folder-per-feature layout. Each screen lives in its own folder with split `*.ts` / `*.html` (+ optional `*.scss` / `*.service.ts`).

## Public (no admin shell)

| Folder | Route | Status |
|---|---|---|
| `landing/` | `/` | Implemented |
| `login/` | `/login` | Implemented |
| `center-signup/` | `/user/signup` | Implemented |

## Admin (`/admin/...`, `adminGuard`)

| Folder | Route | Mock | Status |
|---|---|---|---|
| `dashboard/` | `/admin`, `/admin/dashboard` | `03` | Stub KPIs |
| `terms/` | `/admin/terms` | `04` | Placeholder |
| `halaqat/` | `/admin/halaqat` | `05` | Placeholder |
| `halaqa-detail/` | `/admin/halaqat/:id` | `18` (detail+Plans) | Placeholder |
| `teachers/` | `/admin/teachers` | `07` | Placeholder |
| `teacher-requests/` | `/admin/teacher-requests` | `08` | Placeholder |
| `students/` | `/admin/students` | `10` | Placeholder |
| `student-requests/` | `/admin/student-requests` | `11` | Placeholder |
| `reports-attendance/` | `/admin/reports/attendance` | `13` | Placeholder |
| `reports-progress/` | `/admin/reports/progress` | `14` | Placeholder |

## Future public (not routed yet)

| Folder (planned) | Route | Mock |
|---|---|---|
| `identify/` | `/identify` | `16` |
| `teacher-signup/` | `/signup/teacher` | `09` |
| `student-signup/` | `/signup/student` | `12` |

## PARK (v1)

- Re-enrollment (`15`) — no folder
- Teacher mobile unbound plan — Flutter only

## Layout

| Folder | Use |
|---|---|
| `layout/public-shell/` | Landing + public chrome |
| `layout/admin-shell/` | Admin sidebar + topbar |

## Core (shared infra only)

`core/` — auth, interceptors, guards, envelope helpers, shared API models. Feature-specific services live next to their feature (e.g. `center-signup/center-signup.service.ts`).
