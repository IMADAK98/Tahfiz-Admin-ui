# Feature folder map (Imad lock)

Angular 22 folder-per-feature layout. Each screen lives in its own folder with split `*.ts` / `*.html` (+ optional `*.scss` / `*.service.ts`).

## Public (no admin shell)

| Folder | Route | Status |
|---|---|---|
| `landing/` | `/` | Implemented |
| `login/` | `/login` | Implemented |
| `center-signup/` | `/user/signup` | Implemented |

## System admin (`/system-admin/...`, `systemAdminGuard`)

| Folder | Route | Mock | Status |
|---|---|---|---|
| `center-requests/` | `/system-admin/center-requests` | `21` | Implemented |

Slim SYSTEM_ADMIN shell (not center-admin sidebar): طلبات المراكز + muted لوحة المؤشرات. Center `ADMIN` → redirected to `/admin`. No Students/Terms/Ḥalaqāt KPI counts.

## Admin (`/admin/...`, `adminGuard`)

| Folder | Route | Mock | Status |
|---|---|---|---|
| `dashboard/` | `/admin`, `/admin/dashboard` | `03` | Implemented |
| `terms/` | `/admin/terms` | `04` | Placeholder |
| `halaqat/` | `/admin/halaqat` | `05` | Implemented |
| `halaqa-detail/` | `/admin/halaqat/:id` | `18` (detail+Plans) | Implemented |
| `teachers/` | `/admin/teachers` | `07` | Implemented |
| `teacher-detail/` | `/admin/teachers/:id` | `19` | Implemented |
| `teacher-requests/` | `/admin/teacher-requests` | `08` | Implemented |
| `students/` | `/admin/students` | `10` | Implemented |
| `student-requests/` | `/admin/student-requests` | `11` | Implemented |
| `re-enrollment/` | `/admin/re-enrollment` | `15` | Implemented |
| `reports-attendance/` | `/admin/reports/attendance` | `13` | Placeholder |
| `reports-progress/` | `/admin/reports/progress` | `14` | Placeholder |

## Teachers set — live API notes

Verified against live `https://tahfiz.onrender.com` OpenAPI (`GET /api-json`) rather than the mock's assumed shapes:

- List: `GET /center/{centerId}/active-teachers`. Add: `POST /pending-teacher-request/manual-create`. Edit: `PATCH /teacher-profile/{profileId}` (profile id ≠ user id — fetched via `GET /users/teachers/by-id/{id}`). Requests: `GET /admin/teacher-requests`, `POST .../{id}/approve`, `POST .../{id}/reject` `{ rejectionReason }`.
- `manual-create` requires `nationality` / `address` / `birthDate` / `password` — none are in the mock's Add dialog. Added the first three as required fields; the password is a random placeholder (teacher activates via the emailed link), never shown in the UI.
- Live qualification/tajweed/age-group/work-period are fixed backend enums, not the mock's free-text options — selects use the verified enum values with best-fit Arabic labels (see `teachers/enums/`). Dropped the mock's `رقم الهوية` field (not accepted by either the create or update DTO).
- Mock's single "السند" field maps to two backend booleans (`hasSanadInHifz`, `hasIjazahInHifz`) — split into two selects.
- Ids may be returned as JSON strings; all mappers coerce via `coerceTeacherId`. Approve/create responses may have `data: null` — callers always re-list after success.
- `GET /halqa/by-teacher-id/{id}` is locked self-only for the `TEACHER` role (IDOR) — matches the existing `halqa-api.service.ts`/`halaqat.service.ts` "never by-teacher-id" convention. Teacher detail's "الحلقات المعيَّنة" section instead loads the center-scoped `GET /halqa?centerId=` list (same endpoint `halaqat.service.ts` already uses as its fallback) and filters client-side by teacher id.
- `numberOfMemorizedJuz` minimum differs by DTO: `CreatePendingTeacherRequestDto` requires ≥1 (add form), `UpdateTeacherProfileDto` allows 0 (edit form) — validated per mode.

## Students set — live API notes

Verified against live `https://tahfiz.onrender.com` OpenAPI (`GET /api-json`):

- List: `GET /center/{centerId}/active-students?page&limit&search`. Manual add: `POST /admin/student-requests/manual-create` (no `centerId`; JWT-scoped). Then re-list active-students — manual users do **not** appear in the requests queue.
- Requests: `GET /admin/student-requests`, `GET …/{id}`, `POST …/{id}/approve` empty body, `POST …/{id}/reject` `{ rejectionReason }` required. Cards collapsed by default with عرض/إخفاء التفاصيل. Approve reuses `app-assign-halqa-modal` («تعيين إلى حلقة؟») — same chrome as post-manual-create.
- `educationStage` enum values include spaces (`ELEMENTARY SCHOOL`). List rows may use snake_case `surah_from`/`surah_to`.
- No `GET /users/students/by-id/{id}` and `UpdateStudentProfileDto` is empty — list «التفاصيل» is read-only from the active-students row. Dropped mock «التقدّم» (no student progress route).
- Registration link: `POST /center/{centerId}/generate-registration-link` + copy modal. Public signup page (mock 12) is out of scope.
- Ids may be JSON strings; approve/manual-create often return `data: null` — callers always re-list after success.

## SYSTEM_ADMIN center requests — live API notes

Verified against live `https://tahfiz.onrender.com` OpenAPI (`GET /api-json`) + locked mock `21-system-admin-centers.html`:

- Role: `SYSTEM_ADMIN` only (`GET /system-admin/center-requests`, `POST …/{id}/approve` empty, `POST …/{id}/reject` `{ rejectionReason }` required). Center `ADMIN` → Nest 403.
- Nest `findAll()` returns **all** statuses — UI shows the mix (PENDING accept/reject, APPROVED/REJECTED chips only). No `studentsCount` / `termsCount` / `halaqatCount`.
- Card fields: `centerName`, `centerAddress`, `adminName`, `adminEmail`, `adminPhone`, `adminIdentificationNumber`, `adminPassportNumber`, `adminBirthDate`, `adminNationality`, `adminAddress`, `status`, `rejectionReason`, `centerId` (after approve; also reads nested `center.id`).
- Ids may be JSON strings; approve/reject often return `data: null` — callers always re-list after success. Reject form uses `SKIP_GLOBAL_ERROR_TOAST` for inline `سبب الرفض`.

## Future public (not routed yet)

| Folder (planned) | Route | Mock |
|---|---|---|
| `identify/` | `/identify` | `16` |
| `teacher-signup/` | `/signup/teacher` | `09` |
| `student-signup/` | `/signup/student` | `12` |

## PARK (v1)

- Teacher mobile unbound plan — Flutter only

## Layout

| Folder | Use |
|---|---|
| `layout/public-shell/` | Landing + public chrome |
| `layout/admin-shell/` | Admin sidebar + topbar |
| `layout/system-admin-shell/` | Slim SYSTEM_ADMIN rail (center requests) |

## DTO / enum convention (per feature)

Each feature folder owns its request/response DTOs and enums under `dto/` and `enums/` (not a global dump). Example: `center-signup/dto/center-signup-form.model.ts`, `login/dto/login-form.model.ts`. MVP stubs include empty `dto/index.ts` + `enums/index.ts` placeholders.

## Core (shared infra only)

`core/` — auth, interceptors, guards, envelope helpers, shared HTTP clients (`SignupApiService`, `AuthApiService`, etc.). Feature services (e.g. `center-signup/center-signup.service.ts`, `login/login.service.ts`) are thin UI orchestration only — they map feature DTOs and call core API services, not HttpClient directly.
