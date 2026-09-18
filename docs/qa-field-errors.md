# QA: Nest field-level 400 `errors[]` (PR #25)

Date: 2026-09-18  
Targets: [tahfiz-admin-ui.vercel.app](https://tahfiz-admin-ui.vercel.app) + live Nest `https://tahfiz.onrender.com` (`Accept-Language: ar`)  
Code: `main` @ `095cec3` (app-wide field errors) plus the forgot-password duplicate-email fix in this PR.

Locked Nest body:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [{ "fieldName": "…", "message": "…" }]
}
```

Pass criteria: Nest `message` under the matching input; no toast wall when `errors[]` is present; editing a field clears that line; client empty-checks still run first.

Screenshots: [`docs/qa-field-errors/screenshots/`](./qa-field-errors/screenshots/).

## Credentials

No admin / SYSTEM_ADMIN passwords in this repo, README, env examples, or Nest seed (roles only). **Do not invent passwords.** Admin pages below are static-wired + curl (401 before DTO validation). A maintainer login is needed to replay Nest 400s on those modals live.

---

## Results

| # | Page | How tested | Result |
|---|---|---|---|
| 1 | Center signup `/user/signup` | Live browser + curl | **PASS** |
| 2 | Login `/login` | Live browser + curl | **PASS** |
| 3 | Forgot password (login panel) | Live browser + curl | **FAIL → fixed** (duplicate `email` under login + reset inputs). Re-check after this PR. |
| 4 | Reset password `/reset-password` | Live browser + curl | **PASS** (UI wiring). Dummy token cannot hit Nest `newPassword` (client min 6 matches Nest). Invalid token is generic 400, no `errors[]`. |
| 5 | Student public signup `/signup/student` | Live (no token) + static + curl | **PASS wiring**. Form blocked without invite token. Curl confirms DTO `errors[]`. |
| 6 | Identify `/identify` | Live (no token) + static + curl | **PASS wiring**. Form blocked without invite token. Lookup keys `identification` / `passportNumber` match OpenAPI. |
| 7 | Create دورة | Static vs `CreateTermDto` | **PASS wiring**. Live Nest 401 without JWT. |
| 8 | Create ḥalaqa | Static vs `CreateHalqaDto` | **PASS wiring**. `studentsIds` (Nest spelling) bound. `termId` is session/active-term, not an input. |
| 9 | Teacher add/edit | Static vs create/update DTOs | **PASS wiring**. Add `teacherName` / edit `name`. |
| 10 | Student manual create | Static vs `CreatePendingStudentRequestFromAdminDto` | **PASS wiring**. UI `fullName` → Nest `name`. |
| 11 | Teacher / student / center reject | Static vs `{ rejectionReason }` | **PASS wiring**. Client empty-check first. `SKIP_GLOBAL_ERROR_TOAST` on writes. |
| 12 | Re-enrollment reject | Static vs `{ rejectionReason }` | **PASS wiring**. |
| 13 | Edit ḥalaqa | Static vs `UpdateHalqaDto` | **PASS wiring**. `name` is not an input (sent from existing detail). |
| 14 | Create/edit plan + item | Static vs study-plan DTOs | **PASS wiring**. Nested `studyPlanItems.N.*` and bracket form; edit item uses `fromSurahNumber`/`fromSurah`. |
| 15 | Enroll / assign students | Static vs `studentsIds` / `studentIds` | **PASS wiring**. |

Teacher public signup is not in this repo. Flutter teacher app out of scope.

---

## Public live detail

### 1. Center signup — PASS

- Empty submit: client banner `اسم المدير مطلوب` (Nest not called).  
  Screenshot: `09-center-signup-empty.png`
- Fill-all + invalid email `a@b.c` + national id `1`: HTTP 400, banner `راجع الحقول أدناه وصحّح الأخطاء.`, under-id `حقل adminIdentificationNumber أقصر من المسموح`, under-email `يجب أن يكون adminEmail بريداً إلكترونياً صالحاً`. No toast.  
  Screenshot: `10-center-signup-nest.png`
- Client empty-checks do not validate email format, so Nest still runs.

### 2. Login — PASS

- `a@b.c` + `x`: under-email `يجب أن يكون email بريداً إلكترونياً صالحاً`, under-password `حقل password أقصر من المسموح`, banner `راجع الحقول أدناه…`. No toast.  
  Screenshot: `01-login-nest-errors.png`
- Edit email: that line clears; password line stays.  
  Screenshot: `02-login-clear-on-edit.png`
- Well-formed unknown user: banner `المستخدم غير موجود` (not `errors[]`).  
  Screenshot: `03-login-401.png`

### 3. Forgot password — FAIL (fixed here)

Nest `fieldName: email` was bound on **both** the still-visible login email input and the reset-email input, so the same Arabic line appeared twice.  
Screenshot of the bug: `04-forgot-nest-email.png`

Fix: hide login-form `email`/`password` under-field messages while the forgot panel is open. Reset-email keeps `fieldError('email')`. Verified on the local production build: a single Nest email line under استعادة كلمة المرور (`11-forgot-after-fix.png`).

Curl: `POST /auth/request-password-reset` `{ email: "not-an-email" }` → `errors[{ fieldName: "email", message: "يجب أن يكون email بريداً إلكترونياً صالحاً" }]`.

### 4. Reset password — PASS (wiring)

- No `?token=`: banner `رابط الاستعادة غير صالح أو منتهي الصلاحية.`, form disabled. `05-reset-no-token.png`
- `?token=abc` + matching 6-char password: generic 400 `الرمز غير صالح أو منتهٍ` (no `errors[]`). `06-reset-dummy-token.png`
- Client min length 6 runs before Nest; live Nest min is ≤ 6 (`"1"` → `newPassword` too short; `"abcdef"` skips field errors and fails the token). Token errors stay on the banner (same as PR #25).

### 5. Student signup — PASS wiring / blocked live

No token: missing-link copy, form not submitted. `07-student-signup-no-token.png`  
Invalid `?token=deadbeef` also stays on the invalid-link path (GET validate fails before the form).

Curl `POST /pending-student-request` with a bad body returns the locked `errors[]` (`name`, `email`, `educationStage`, `surahFrom`, …, `token`). Template binds those DTO keys (UI `parentName` is not POSTed). Step-1 Nest keys switch the wizard back to step 1.

Need a real center registration link to live-submit Nest 400s through the UI.

### 6. Identify — PASS wiring / blocked live

No token: `رابط الدعوة ناقص…`. `08-identify-no-token.png`  
Lookup query names match OpenAPI `identification` / `passportNumber`. Activate `{ token, studentId }` has no inputs; those Nest keys would land on the banner (same pattern as reset `token`).

---

## Admin forms (static + curl)

All of `POST /term`, `/halqa`, `/pending-teacher-request/manual-create`, `/admin/student-requests/manual-create`, reject URLs, `/study-plan` return **401 Unauthorized** with no `errors[]` when unauthenticated (auth guard before ValidationPipe).

| Surface | Bound Nest keys | Client empty-check |
|---|---|---|
| Create دورة | `name`, `startDate`, `endDate`, `registerationStartDate`, `registerationEndDate`, `holidayDates` (`centerId` from JWT) | `validateForm` |
| Create ḥalaqa | `name`, `category`, `periods`, `studentLimit`, `teacherId`, `studentsIds` | `validateForm` |
| Teacher add | `teacherName`, `email`, `phone`, `nationality`, `address`, `birthDate`, `qualification`, `hasCertificate`, `numberOfMemorizedJuz`, `hasSanadInHifz`, `hasIjazahInHifz`, `tajweedLevel`, `teachingAgeGroup`, `availableWorkPeriod` (`password` generated, `centerId` from JWT) | `validate(..., 'add')` |
| Teacher edit | `name` (not `teacherName`), plus profile keys above that exist on `UpdateTeacherProfileDto` | `validate(..., 'edit')` |
| Student manual | `name` (UI fullName), `email`, `phone`, `parentPhone`, `identificationNumber`, `passportNumber`, `address`, `birthDate`, `educationStage`, `isHafiz`, `hifzQuality`, `surahFrom`, `surahTo` | `validateStudentForm` |
| Reject dialogs | `rejectionReason` | trim required |
| Edit ḥalaqa | `category`, `periods`, `teacherId`, `studentLimit` | `validateEditForm` |
| Create plan | `name`, `studentIds`, `studyPlanItems.{i}.{type,direction,fromSurah,fromAyah,amountType,amountValue}` | plan name + item validate |
| Edit plan name | `name` | trim |
| Edit plan item | `type`, `direction`, `fromSurahNumber`/`fromSurah`, `fromAyah`, `amountType`, `amountValue` | `validatePlanItemForm` |
| Enroll | `studentsIds` | pick at least one |
| Assign plan students | `studentIds` | pick at least one |

Shared plumbing (already on `main`):

- `FieldErrorBag` + `nestSubmitBanner` + `<app-field-error>`
- `errorToastInterceptor` skips toast when `hasNestFieldErrors`
- `httpErrorToApiInterceptor` outermost so auth still sees `HttpErrorResponse`
- Writes that already used `SKIP_GLOBAL_ERROR_TOAST` keep inline handling

Nested Nest field names are `parent.child` / `items.0.x` (Tahfiz#3). Create-plan looks up both dotted and bracket paths.

---

## Curl contract samples (`Accept-Language: ar`)

```text
POST /auth/login { "email": "not-an-email", "password": "x" }
  email + password errors[]

POST /auth/request-password-reset { "email": "not-an-email" }
  email error

POST /auth/reset-password { "token": "abc", "newPassword": "1" }
  newPassword too short

POST /auth/reset-password { "token": "abc", "newPassword": "abcdef" }
  { "statusCode": 400, "message": "الرمز غير صالح أو منتهٍ" }  // no errors[]

POST /pending-center-request (XOR national id only, short id + bad email)
  adminIdentificationNumber + adminEmail
```

---

## Bugs

1. **Forgot password duplicate `email` line** — login input and reset-email both bound `fieldError('email')` while the login form stayed visible. **Fixed** in this PR (`login.html`: hide login under-fields when `showForgotPanel()`).
2. No admin credentials in-repo — live Nest 400s on admin modals not exercised in the browser. Static bindings cover every submitted DTO key listed above.

No toast + under-field wall on public `errors[]` paths.

---

## Follow-up for Imad

Please paste a throwaway **center ADMIN** (and optionally SYSTEM_ADMIN) login so the create-دورة / ḥalaqa / teacher / student / reject / plan / enroll paths can be replayed against live Nest the same way as login + center signup. Invite tokens are also needed for student signup + identify Nest 400s in the UI.
