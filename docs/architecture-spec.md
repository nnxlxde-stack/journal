# Спецификация архитектуры

> Документ для агента (DeepSeek V4 Flash, max effort). Описывает технологический стек, структуру модулей и подход к адаптивному дизайну приложения "Журнал посещаемости". Выполнять по разделам последовательно.

---

## 1. Стек

| Слой | Технология |
|---|---|
| База данных | Supabase (PostgreSQL), хостится отдельно от приложения |
| Бэкенд/фронтенд | Next.js `16.3.4` (App Router) |
| Деплой приложения | Vercel |
| Деплой БД | Supabase Cloud (отдельный проект, не завязан на Vercel) |

Важно: Vercel хостит только Next.js-приложение (SSR/API routes/Server Actions). Supabase — полностью отдельная инфраструктура (своя БД, Auth, Storage, Realtime), приложение обращается к ней по сети как к внешнему сервису. Это значит:
- Секреты Supabase (service role key) хранятся в Vercel Environment Variables, никогда не коммитятся в репозиторий.
- Миграции БД (`supabase/migrations`) версионируются в том же репозитории, но применяются через Supabase CLI/Dashboard, а не через билд Vercel.

---

## 2. Установка зависимостей

### 2.1 Next.js

Проект уже должен быть на `next@16.3.4`. Проверить/зафиксировать версию:

```bash
npm install next@16.3.4 react@latest react-dom@latest
```

Next.js 16.3.x приносит нативную поддержку Instant Navigations и `cacheComponents` — держать это в уме при проектировании роутинга (раздел 4), но не обязательно включать флаг сразу, если это первая итерация проекта.

### 2.2 Supabase-клиент

Для подключения к Supabase из Next.js используется официальная связка пакетов:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- `@supabase/supabase-js` — базовый клиент (запросы к БД, Auth, Realtime, Storage).
- `@supabase/ssr` — обязателен для App Router: правильно работает с куками между Server Components, Server Actions, Route Handlers и Middleware (без него сессия пользователя будет "теряться" между серверным и клиентским рендером).

### 2.3 Переменные окружения

Создать `.env.local` (и продублировать в Vercel → Project Settings → Environment Variables):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # только сервер, никогда не NEXT_PUBLIC_
```

`SUPABASE_SERVICE_ROLE_KEY` использовать только в Server Actions/Route Handlers, где нужно обойти RLS (например, административные операции). Обычные запросы от имени пользователя всегда идут через anon key + RLS-политики, описанные в схеме БД.

### 2.4 Структура клиентов Supabase

```
lib/
  supabase/
    client.ts     -- клиент для Client Components (browser)
    server.ts     -- клиент для Server Components/Actions (cookies из next/headers)
    middleware.ts -- обновление сессии в middleware.ts
    admin.ts       -- клиент с service role (только для доверенных серверных операций)
```

Это стандартный паттерн `@supabase/ssr` — четыре отдельных клиента для четырёх контекстов выполнения, смешивать их нельзя (например, серверный клиент с cookies нельзя использовать в Client Component).

---

## 3. Деплой

### 3.1 Supabase

1. Создать проект в Supabase Dashboard (отдельно от Vercel).
2. Применить миграции из `supabase/migrations/*.sql` (схема из предыдущего документа: `semesters`, `groups`, `disciplines`, `teachers`, `students`, `lessons`, `attendance`, RLS-политики) через `supabase db push` или Dashboard SQL Editor.
3. Включить Auth-провайдеры, которые нужны (email/password, возможно magic link для студентов).
4. Зафиксировать `project-ref`, `anon key`, `service role key`.

### 3.2 Vercel

1. Подключить репозиторий к Vercel как отдельный проект.
2. Прописать переменные окружения из раздела 2.3 (Production + Preview + Development окружения отдельно, если используются разные Supabase-проекты для staging/prod).
3. Build command — стандартный (`next build`), Vercel сам определит фреймворк.
4. Рекомендуется завести отдельный Supabase-проект под Preview-деплои (или хотя бы под Development), чтобы тестовые ветки не писали в продовую БД.

### 3.3 Разделение окружений (рекомендация)

| Окружение | Vercel | Supabase |
|---|---|---|
| Production | `main` branch → Production deployment | Supabase Production project |
| Preview/Staging | Feature branches → Preview deployments | Supabase Staging project (или тот же с осторожностью) |
| Local dev | `next dev` | Supabase Local (через `supabase start`, Docker) либо тот же Staging-проект |

---

## 4. Архитектура модулей

Модули строятся вокруг сущностей БД (раздел журнала, семестры, группы, дисциплины, студенты, аналитика) и разделены по слоям: **данные → сервер → UI**.

```
app/
  (auth)/
    login/
    register/
  (dashboard)/
    layout.tsx                -- общий каркас: Sidebar (desktop) / нижняя навигация (mobile)
    journal/
      page.tsx                -- журнал посещаемости (основной модуль)
      [lessonId]/
        page.tsx               -- детальная отметка посещаемости конкретного занятия
    groups/
      page.tsx
      [groupId]/page.tsx
    disciplines/
      page.tsx
    students/
      page.tsx
      [studentId]/page.tsx     -- карточка студента + история посещаемости
    semesters/
      page.tsx
    analytics/
      page.tsx                -- графики, % посещаемости
  api/
    (используется только там, где нужен webhook/внешний вызов;
     основная логика — через Server Actions, не Route Handlers)

lib/
  supabase/                    -- клиенты (раздел 2.4)
  actions/                     -- Server Actions (mutations)
    lessons.ts                 -- createLesson, updateLesson, deleteLesson
    attendance.ts              -- markAttendance, bulkMarkAttendance
    students.ts
    groups.ts
  queries/                     -- серверные функции чтения (для Server Components)
    get-journal.ts
    get-attendance-stats.ts
  validation/                  -- zod-схемы, общие для форм и Server Actions
    lesson.schema.ts
    attendance.schema.ts
  types/
    database.types.ts          -- автогенерируется через `supabase gen types typescript`

components/
  ui/                          -- shadcn-компоненты (из предыдущего документа)
  journal/
    journal-table.tsx          -- десктоп-версия таблицы
    journal-cards.tsx          -- мобильная версия (список карточек вместо таблицы)
    attendance-toggle.tsx      -- сегментированный контрол статуса
    status-badge.tsx
  layout/
    sidebar.tsx                -- desktop-навигация
    bottom-nav.tsx              -- mobile-навигация
    top-bar.tsx
  shared/
    ...
```

### 4.1 Принципы

- **Server Components по умолчанию.** Чтение данных (журнал, списки, статистика) — в Server Components через функции из `lib/queries`. `"use client"` только там, где реально нужна интерактивность (формы, toggle-группы, диалоги).
- **Server Actions для записи.** Отметка посещаемости, создание занятия/студента — через `lib/actions`, не через отдельные API Route Handlers. Route Handlers (`app/api/*`) оставить только под вебхуки (например, Supabase Auth callbacks) или интеграции, которым нужен классический HTTP endpoint.
- **Общие zod-схемы.** Одна схема валидации используется и на клиенте (`react-hook-form` + `zodResolver`), и на сервере (повторная валидация в Server Action) — не дублировать правила.
- **Типы из БД — не вручную.** `database.types.ts` генерируется командой:
  ```bash
  npx supabase gen types typescript --project-id <project-ref> > lib/types/database.types.ts
  ```
  Перегенерировать после каждой миграции схемы.

---

## 5. Адаптивный дизайн: раздельные версии Mobile / Desktop

Требование — не просто "резиновая" адаптивность через `flex-wrap`/`grid`, а **осознанно разные UI-паттерны** для мобилки и десктопа там, где это оправдано (таблица журнала на телефоне превращается в список карточек, сайдбар — в нижнюю навигацию и т.д.), а не просто уменьшение одного и того же макета.

### 5.1 Технический подход к определению устройства

Использовать **сочетание** двух механизмов, не полагаться на один:

1. **CSS-first (основной механизм)** — Tailwind breakpoints (`sm`, `md`, `lg`) через `hidden md:block` / `block md:hidden`. Это работает без JS, нет "мигания" при гидратации, корректно для SSR.
2. **Серверное определение User-Agent (вспомогательный, для оптимизации, не для критичного UI)** — в `middleware.ts` парсить `User-Agent` и прокидывать хедер/куку с грубым определением `device=mobile|desktop`, чтобы Server Component мог сразу не запрашивать/не рендерить тяжёлые desktop-only данные (например, не тянуть данные для расширенной таблицы на мобильном при первом SSR-рендере). Это оптимизация, а не единственный источник истины — финальное решение о видимости всегда остаётся за CSS, чтобы избежать рассинхрона при ресайзе окна/повороте экрана.

**Не использовать** `window.innerWidth` + `useEffect` как основной способ переключения версий — это даёт "прыжок" контента после гидратации (сначала рендерится один вариант, потом JS переключает на другой). Такой подход допустим только для мелких точечных случаев (например, разное поведение одного и того же компонента), но не для переключения между целыми разными деревьями компонентов.

### 5.2 Паттерн "две версии компонента"

Для модулей, где мобильная и десктопная версии структурно различаются (не просто другие отступы, а другой набор компонентов), заводить пару файлов и общий контейнер:

```
components/journal/
  journal-view.tsx        -- контейнер, рендерит оба варианта с CSS-переключением
  journal-table.tsx        -- desktop: Table с сортировкой/фильтрами
  journal-cards.tsx        -- mobile: список Card с ToggleGroup внутри каждой
```

```tsx
// journal-view.tsx
export function JournalView({ lessons }: { lessons: LessonWithAttendance[] }) {
  return (
    <>
      <div className="hidden md:block">
        <JournalTable lessons={lessons} />
      </div>
      <div className="block md:hidden">
        <JournalCards lessons={lessons} />
      </div>
    </>
  );
}
```

Оба варианта получают одни и те же данные с сервера (один запрос, один источник истины) — различается только визуальное представление. Это исключает дублирование логики загрузки данных при почти неизбежном дублировании разметки.

### 5.3 Навигация

| | Desktop (`≥ md`, 768px+) | Mobile (`< md`) |
|---|---|---|
| Основная навигация | `Sidebar` (компонент из shadcn), постоянно видимый слева | `bottom-nav` — фиксированная панель снизу с 4-5 иконками (Cupertino tab-bar стиль) + `Sheet`/`Drawer` для второстепенных разделов |
| Быстрый поиск | `Command` (⌘K), доступен из top-bar | `Command`, вызывается по иконке поиска в bottom-nav, открывается как `Drawer` снизу |
| Действие "создать занятие/отметить" | `Dialog` по центру экрана | `Drawer` снизу (`vaul`) — стандартный mobile-паттерн, не `Dialog` |

### 5.4 Ключевые модуль-специфичные решения

| Модуль | Desktop | Mobile |
|---|---|---|
| Журнал посещаемости | `Table` с колонками (студент, статус, дата, дисциплина), инлайн-редактирование статуса через `ContextMenu`/`Select` в ячейке | Список `Card` по одному студенту, статус переключается через `ToggleGroup` на всю ширину карточки (легко нажать пальцем) |
| Список групп/студентов | Таблица с сортировкой, множественный выбор строк (bulk actions) | Список карточек + `Sheet` снизу для bulk-действий |
| Аналитика | Сетка из нескольких `Card` с графиками (`recharts`) side-by-side, `grid-cols-2/3` | Графики в один столбец, `Tabs` для переключения между метриками вместо одновременного показа всех |
| Форма создания занятия | `Dialog` с многоколоночной формой (дисциплина/группа/дата в одну строку) | `Drawer` с формой в одну колонку, крупные поля (`h-12`+) под тач |

### 5.5 Общие правила адаптива (для обеих версий)

- Тач-таргеты на мобильной версии — не меньше 44×44px (стандарт Apple HIG, согласуется с выбранным Cupertino-стилем).
- Безопасные зоны — `pb-[env(safe-area-inset-bottom)]` для нижней навигации на iOS-устройствах с "чёлкой"/жестовой полосой.
- Скругления и `glass`-эффекты (из документа по стилям) применяются одинаково в обеих версиях — стиль не меняется, меняется только структура компоновки.
- Все интерактивные списки (Server Components с данными) должны поддерживать skeleton-состояние загрузки в обеих версиях (`journal-table-skeleton.tsx` и `journal-cards-skeleton.tsx` отдельно, так как форма скелетона тоже разная).

---

## 6. Чек-лист для агента

- [ ] `next@16.3.4` зафиксирован в `package.json`
- [ ] `@supabase/supabase-js` и `@supabase/ssr` установлены
- [ ] `.env.local` заполнен, переменные продублированы в Vercel Dashboard
- [ ] Четыре Supabase-клиента (`client.ts`, `server.ts`, `middleware.ts`, `admin.ts`) созданы согласно паттерну `@supabase/ssr`
- [ ] `middleware.ts` обновляет сессию Supabase на каждый запрос
- [ ] Миграции применены к Supabase-проекту, `database.types.ts` сгенерирован
- [ ] Структура `app/`, `lib/`, `components/` создана согласно разделу 4
- [ ] Чтение данных — через Server Components + `lib/queries`, запись — через Server Actions в `lib/actions`
- [ ] Для журнала посещаемости, списка групп/студентов и аналитики созданы раздельные mobile/desktop компоненты, переключаемые через Tailwind-брейкпоинты (не через `useEffect`/`window.innerWidth`)
- [ ] Нижняя навигация на мобильной версии учитывает `safe-area-inset-bottom`
- [ ] Проект задеплоен на Vercel, переменные окружения проверены на Production и Preview
- [ ] Supabase-проект для Preview/Staging отделён от Production (либо осознанно принято решение использовать один проект)

---

## 7. Не делать

- Не хранить `SUPABASE_SERVICE_ROLE_KEY` в клиентском коде или с префиксом `NEXT_PUBLIC_`.
- Не переключать mobile/desktop версии только через JS-детект ширины окна без CSS-фолбэка — вызывает мигание контента при гидратации.
- Не размещать бизнес-логику записи в Route Handlers, если её можно оформить как Server Action — это усложняет типизацию и требует ручного фетча вместо нативной интеграции с формами.
- Не смешивать серверный и клиентский Supabase-клиенты между контекстами (например, не импортировать `lib/supabase/server.ts` в `"use client"` компонент).
