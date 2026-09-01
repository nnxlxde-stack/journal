# Журнал посещаемости

Приложение для учёта посещаемости занятий: семестры, группы, дисциплины, студенты, занятия и отметки посещаемости с аналитикой.

Технологический стек (см. `docs/architecture-spec.md` и `docs/style_specs.md`):

- **Next.js 16** (App Router, Server Components, Server Actions, Proxy)
- **Supabase** (PostgreSQL + Auth, RLS) — отдельная инфраструктура
- **Tailwind CSS v4** + **shadcn/ui** (Base UI / React Aria)
- Тема **Neon Cupertino Dark** (dark-only, Inter)

## Начало работы

```bash
bun install
cp .env.example .env.local   # заполнить реальными значениями
bun run dev
```

Открыть http://localhost:3000

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase-проекта |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Публичный publishable key (защищён RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — только сервер, никогда `NEXT_PUBLIC_` |

Секреты не коммитятся (`.env*` в `.gitignore`). Для продакшена переменные прописываются в Vercel → Project → Settings → Environment Variables (Production + Preview отдельно).

## База данных

Миграции версионируются в `supabase/migrations/` (схема: семестры, группы, дисциплины, преподаватели, студенты, занятия, посещаемость, RLS).

Применение — через Supabase CLI или Dashboard SQL Editor, **не** через билд Vercel:

```bash
npx supabase db push --project-id <project-ref>
```

После миграций перегенерировать типы:

```bash
npx supabase gen types typescript --project-id <project-ref> > lib/types/database.types.ts
```

## Структура

```
app/
  (auth)/login, (auth)/register      — вход/регистрация
  (dashboard)/                       — каркас приложения (Sidebar/BottomNav/TopBar)
    journal/                         — журнал посещаемости (+ [lessonId] — детали занятия)
    groups/ disciplines/ students/   — справочники (+ детальные страницы)
    semesters/                       — семестры
    analytics/                       — графики и % посещаемости
lib/
  supabase/    — client.ts (browser), server.ts (RSC), middleware.ts (proxy), admin.ts (service role)
  actions/     — Server Actions (lessons, attendance, students, groups, ...)
  queries/     — серверное чтение (get-journal, get-attendance-stats, ...)
  validation/  — общие zod-схемы (клиент + сервер)
  types/       — database.types.ts
components/
  ui/          — shadcn-компоненты
  layout/      — sidebar, bottom-nav, top-bar
  journal/     — таблица (desktop) / карточки (mobile) + toggle статуса
```

## Ключевые решения

- **Чтение** — Server Components через `lib/queries`; **запись** — Server Actions через `lib/actions` (не Route Handlers).
- **Адаптив** — раздельные mobile/desktop-версии (`journal-table` / `journal-cards`), переключение CSS-брейкпоинтами; в `proxy.ts` дополнительно выставляется хедер `x-device` для SSR-оптимизации.
- **Next.js 16** — middleware переименован в **Proxy** (`proxy.ts`): обновление сессии Supabase + защита маршрутов.
- **Безопасность** — service role key используется только в серверных доверенных операциях; обычные запросы — через publishable key + RLS.

## Деплой

1. **Supabase** — создать проект, применить миграции, включить Auth-провайдеры (email/password).
2. **Vercel** — подключить репозиторий, прописать переменные окружения.
3. Рекомендуется отдельный Supabase-проект для Preview/Staging, чтобы тестовые ветки не писали в прод.
