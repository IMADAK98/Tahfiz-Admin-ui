# Tahfiz Admin (ثفيز)

Center-admin web app for Thafiz (نظام التحفيظ). Angular 22 + PrimeNG 22 RTL admin shell.

## Locked stack (2026-09-16)

| Layer | Choice |
|---|---|
| Framework | Angular **22.x** (standalone, feature folders) |
| UI kit | PrimeNG **22.x** + `@primeuix/themes` (Aura preset → Damascus Paradise) |
| Styles | Tailwind CSS **v4** + SCSS partials + `tokens.css` |
| Font / direction | **Cairo**, `lang="ar"` `dir="rtl"`, Western digits |
| API base (default) | `https://tahfiz.onrender.com` |

**Note:** PrimeNG 22 uses `@primeuix/themes` (not legacy `@primeng/themes`). The brief’s “@primeng/themes” maps to this package in the current toolchain.

## Requirements

- **Node.js** `^22.22.3` (or `^24.15.0` / `>=26.0.0` per Angular 22 CLI). See `.nvmrc`.
- npm `>=10`

```bash
nvm use          # reads .nvmrc → 22.22.3
npm install
npm start
```

Dev server: `http://localhost:4200` (use `--port` to override).

## Routes (PR1)

| Path | Shell | Purpose |
|---|---|---|
| `/` | Public | Landing placeholder |
| `/login` | Public | Login placeholder (full auth in PR3) |
| `/admin` | Admin | RTL sidebar (visual right) + empty dashboard |

## Project layout

```text
src/
  styles/
    tokens.css           # Damascus Paradise design tokens
    primeng-theme.ts     # Aura preset overrides
    tailwind.css         # Tailwind v4 + token bridge
    _shell.scss          # Admin/public shell
    _components.scss     # .btn, .card, .input, …
    styles.scss          # Global entry
  app/
    core/
      api/               # envelope helpers, AuthApiService, CenterApiService
      auth/              # AuthService, JWT decode, sessionStorage tokens
    layout/              # public-shell, admin-shell
    features/            # landing, login, dashboard
```

## Scripts

```bash
npm start          # ng serve
npm run build      # production build
npm run watch      # dev build with watch
```

## Core API (PR2)

Nest returns HTTP **201** with `{ statusCode: 200, data: … }` on many auth routes. Use `envelope.helpers.ts` to unwrap safely.

| Service | Methods |
|---|---|
| `AuthApiService` | `login`, `refresh`, `logout` |
| `CenterApiService` | `getActiveTerm(centerId)`, `getActiveTeachers(centerId, query?)` |
| `AuthService` | stores tokens in **sessionStorage**, `decodeJwtClaims` → `role`, `userId`, `centerId` |

```bash
npm run check:envelope   # assert-based envelope self-check
```

Bearer attached via `authInterceptor` (PR3).

## Auth (PR3)

- `authInterceptor` — Bearer header; 401 → single-flight refresh queue → retry or `/login?redirect=`
- `adminGuard` — `ADMIN` / `SYSTEM_ADMIN` only; `TEACHER` bounced to login
- Login page wired to `AuthService.login` → `/admin`

## Next PRs

4. Shell + dashboard wired to live data  
