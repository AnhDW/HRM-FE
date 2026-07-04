# HRM Portal — Project Context (for AI assist)

## Identity
Angular 19 HRM app (Vietnamese), employee + admin dashboards for attendance, leave, payroll, org, calendar, profile, AI chat.

## Tech Stack
| Area | Choice |
|---|---|
| Framework | Angular 19.2 (standalone, signals, `@let`, new control flow) |
| Styling | Tailwind CSS 3.4 + `tailwindcss-animate` |
| Icons | Lucide Angular (registered at `app.config.ts:78` via `LucideAngularModule.pick(...)`) |
| Routing | Lazy-loaded, `withComponentInputBinding`, `onSameUrlNavigation: 'reload'` |
| HTTP | `provideHttpClient` + `tokenInterceptor` |
| API | Auto-generated from OpenAPI via `ng-openapi-gen` (output: `src/app/services/api-services/`) |
| Auth | JWT Bearer in localStorage, key `hrm_auth_user`. AuthService + `authGuard` / `adminGuard` |
| Build | `npm run build` (ng build), budget warning at 500 kB (pre-existing) |

## Directory structure
```
src/app/
├── app.component.ts          # Root: <router-outlet> + <app-tutorial-overlay>
├── app.routes.ts             # Routes: auth | employee | admin
├── app.config.ts             # Http, router, Lucide icons registration
├── core/
│   ├── guards/               # auth.guard.ts, admin.guard.ts
│   ├── interceptors/         # token.interceptor.ts
│   ├── layout/               # EmployeeLayout, AdminLayout, AuthLayout (+ Sidebar, Header)
│   └── services/             # AuthService, ThemeService, MockDataService
├── features/                 # 15 feature dirs (see Routes below)
│   ├── auth/                 # LoginComponent
│   ├── dashboard/            # Employee dashboard
│   ├── attendance/           # Employee attendance
│   ├── leave-requests/       # Employee leave
│   ├── payroll/              # Employee payroll
│   ├── calendar/             # Employee calendar
│   ├── organization/         # Employee org chart
│   ├── profile/              # Employee profile
│   ├── settings/             # Theme/notifications/help
│   ├── ai-chat/              # Floating AI chat (AiChatComponent + AiChatService + RagService)
│   ├── admin-attendance/
│   ├── admin-leave/
│   ├── admin-organization/
│   ├── admin-employee/       # + admin-employee-detail
│   └── admin-payslip/
├── shared/
│   ├── components/           # chat-bubble/
│   ├── employee-picker/      # Reusable multi-select employee search modal
│   └── tutorial/             # TutorialButton, TutorialOverlay, TutorialService, types
└── services/api-services/    # Auto-generated OpenAPI client (fn/, models/, api.ts, etc.)
```

## Routes
| Path | Layout | Guard | Features |
|---|---|---|---|
| `/auth/login` | `AuthLayout` | none | Login form + test credentials |
| `/` (→ `/dashboard`) | `EmployeeLayout` | `authGuard` | Dashboard, Attendance, Leave Requests, Payroll, Calendar, Organization, Profile, Settings |
| `/admin` (→ `/admin/attendance`) | `AdminLayout` | `authGuard` + `adminGuard` | Admin Attendance, Admin Leave, Admin Org, Admin Employees (+ detail), Admin Payslip |

## Route loader pattern (in `app.routes.ts`)
```typescript
loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
```

## Architecture patterns
- **Standalone components only** — no NgModules
- **Signals** for state: `signal()`, `computed()`, `effect()` — no ZoneJS reliance for local state
- **`inject()`** instead of constructor DI
- **Inline templates** — all templates are inline (`` template: `...` ``)
- **Tailwind classes** exclusively — no scoped CSS files (component-level styles are rare)
- **Data-tutorial attributes** (`[data-tutorial="..."]`) on key sections for tutorial overlay targeting
- **`<app-tutorial-button tutorialId="...">`** in page headers for the guide button
- **`<lucide-icon name="..." class="...">`** for icons (must be registered in `app.config.ts`)
- **Emit types**: API functions are imported individually (e.g., `import { apiAttendancesTimekeepingPut$Json } from '...'`)
- **Auth**: `AuthService` reads `hrm_auth_user` from localStorage; guards redirect to `/auth/login`; admin role check via `roles.includes('Admin')`

## Theme system (`ThemeService`)
- 6 modes: `'light' | 'dark' | 'system' | 'forest' | 'ocean' | 'rose'`
- Applied via CSS class on `<html>` (`<html class="dark">`, `<html class="forest">`, etc.)
- Persisted in localStorage key `hrm_theme`
- Theme CSS in `styles.css` (`.dark`, `.forest`, `.ocean`, `.rose` blocks overriding Tailwind utility colors)
- Settings page preview cards use inline `[style.background]` with theme‑specific hex values

## Tutorial system
- 11 tutorials defined in `shared/tutorial/tutorial.types.ts` as `TUTORIALS` array
- Each has `tutorialId`, `role` ('employee' | 'admin'), `route`, `steps[]`
- Steps have `title`, `content`, `targetSelector` (CSS selector for `[data-tutorial="..."]`), `placement`
- Tutorial state (completed steps, dismissed) persisted in localStorage key `hrm_tutorials`
- `TutorialService` manages state; `TutorialOverlayComponent` renders overlay; `TutorialButtonComponent` triggers

## Key Commands
| Command | Purpose |
|---|---|
| `npm start` | `ng serve --proxy-config proxy.conf.json` (dev server) |
| `npm run build` | Production build (ignore budget warning) |
| `npm test` | Karma + Jasmine unit tests |
| `npm run openapi` | Regenerate API client from OpenAPI spec |
| `npm run generate-rag` | Rebuild RAG index for AI chat |

## Coding conventions checklist
- [ ] Standalone component with `imports: [CommonModule, LucideAngularModule, ...]`
- [ ] Inline template (backtick string in `@Component`)
- [ ] `inject()` for DI (not constructor parameter)
- [ ] Tailwind classes, no style files
- [ ] Register any new Lucide icon in both `import {...}` and `LucideAngularModule.pick({...})` in `app.config.ts`
- [ ] Vietnamese labels/text
- [ ] `data-tutorial` attributes + `<app-tutorial-button>` for new feature pages
- [ ] API functions imported individually from `services/api-services/fn/`
- [ ] For theme‑dependent inline styles, add a ternary branch for `'rose'` alongside `'dark'/'forest'/'ocean'`
