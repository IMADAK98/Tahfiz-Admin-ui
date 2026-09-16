# Tahfiz Admin (ثفيز)

Center-admin web app for Thafiz (نظام التحفيظ). PR1 scaffold — empty shell, routing, theming, and auth stub.

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
    core/                # auth stub, API config
    layout/              # public-shell, admin-shell
    features/            # landing, login, dashboard
```

## Scripts

```bash
npm start          # ng serve
npm run build      # production build
npm run watch      # dev build with watch
```

## Out of scope (PR1)

Feature screens (ḥalaqāt, teachers, plans), Nest guard, Figma, Flutter, re-enrollment routes, Angular Material.

## Next PRs

2. Core API client + envelope helpers  
3. Auth (login, interceptor, refresh, adminGuard)  
4. Shell + dashboard wired to live data  
