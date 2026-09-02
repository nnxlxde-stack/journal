# Архитектура модуля аналитических форм журнала посещаемости (КамчатГТУ)

> Документ-ответ на ТЗ `docs/analytics-forms.md`. Проектируется поверх существующего учёта посещаемости (Next.js 16 + Supabase, см. `docs/architecture-spec.md`).
> Реальный стек проекта — Next.js (App Router) + Supabase (Vercel), а не Bun/Electron, поэтому модуль проектируется под этот стек; слои и интерфейсы от ТЗ сохраняются без изменений.

---

## 0. Границы ответственности

**Что уже существует и переиспользуется (не проектируется заново):**

- Учёт посещаемости: схема БД (`semesters`, `groups`, `disciplines`, `teachers`, `students`, `lessons`, `attendance`), RLS, Supabase Auth.
- Данные о занятиях/группах/студентах/преподавателях/дисциплинах — единый источник истины.
- Слой чтения `lib/queries`, клиенты `lib/supabase/*`, Server Actions.
- UI-каркас `(dashboard)` (sidebar/bottom-nav), страница «Аналитика» (базовая статистика — остаётся как экспресс-слой).

**Что проектируется заново (модуль отчётности):**

- Каноническая модель данных отчёта (независимая от формата и БД).
- Три независимых слоя: **агрегация → рендер → доставка**.
- Мастер заказа отчёта (7 шагов), очередь/история заказов, шаблоны регулярной отчётности.
- Хранилище заказов/файлов/доставок в Supabase (миграция), Supabase Storage для файлов.
- Экспорт в PDF / XLSX / DOCX, предпросмотр на экране.

---

## 1. Каноническая схема данных отчётности (финализированная)

### 1.1 Соответствие сущностей ТЗ и реальной схемы

| ТЗ (концепт) | Реальная схема | Комментарий |
|---|---|---|
| `Institute` | — | Отсутствует. Вводится как справочник/расширение (см. §1.6), сейчас подразумевается константой «КамчатГТУ» |
| `Department` | — | Отсутствует. Расширение: кафедра как атрибут преподавателя и группы |
| `Group` | `groups(id, name)` | Нет курса и формы обучения → расширение полей |
| `Student` | `students(id, full_name, group_id, user_id)` | Нет номера зачётки → расширение |
| `Teacher` | `teachers(id, full_name, user_id)` | Нет кафедры и списка дисциплин → расширение (дисциплины выводятся из `lessons`) |
| `Subject` | `disciplines(id, name)` | Соответствует |
| `Lesson` | `lessons(id, semester_id, discipline_id, group_id, teacher_id, lesson_date, pair_number, lesson_type)` | Нет времени и аудитории → расширение |
| `AttendanceRecord` | `attendance(id, lesson_id, student_id, status, marked_by, marked_at)` | Статусы частично покрывают ТЗ; **нет «причины отсутствия»** → расширение (см. §1.2) |

### 1.2 Маппинг статусов посещаемости

Реальная схема: `attendance_status = present | absent_unknown | late | sick`.

| ТЗ | Реальный статус | Причина отсутствия |
|---|---|---|
| присутствовал | `present` | — |
| опоздал | `late` | — |
| отсутствовал (уважительная) | `sick` (болел) | `respected` (известна как болезнь) |
| отсутствовал (причина не указана) | `absent_unknown` | `unknown` |
| отсутствовал (неуважительная) | — | **требует нового поля** `absence_reason text` на `attendance` (значения: `respected|unrespected|unknown`) |

Канонический статус в модуле: `present | absent | late` + `absenceReason: respected | unrespected | unknown`.

### 1.3 `ReportDataSource` — абстрактный источник данных

Единый read-интерфейс, отвязанный от конкретной БД. Агрегаторы работают только с ним. Реальная реализация — `SupabaseReportDataSource` поверх `lib/supabase/server.ts` (учёт RLS) или `admin.ts` (для отчётов уровня института, где нужен обход scope-политик текущего пользователя — только в доверенных серверных сценариях).

```ts
interface ReportDataSource {
  listSemesters(): Promise<SemesterRef[]>;
  listGroups(filter?: { departmentId?: string }): Promise<GroupRef[]>;
  listStudents(filter?: { groupId?: string; departmentId?: string }): Promise<StudentRef[]>;
  listTeachers(filter?: { departmentId?: string }): Promise<TeacherRef[]>;
  listDisciplines(filter?: { departmentId?: string }): Promise<DisciplineRef[]>;
  listLessons(filter: {
    groupIds?: string[]; disciplineId?: string; teacherId?: string;
    from: string; to: string;
  }): Promise<LessonRef[]>;
  listAttendance(filter: {
    groupIds?: string[]; studentIds?: string[]; lessonIds?: string[];
    disciplineId?: string; teacherId?: string;
    from: string; to: string;
  }): Promise<AttendanceFact[]>;
}
```

Полный код интерфейсов — в `lib/reports/types.ts`.

### 1.4 `ReportType` — перечень форм и категории

Каждая форма: назначение, заказчик, фильтры, формат по умолчанию.

| Код | Форма | Уровень | Типовой заказчик | Основной формат |
|---|---|---|---|---|
| `group_attendance_sheet` | Ведомость посещаемости группы за период | группа | староста/куратор | XLSX/PDF |
| `group_absence_summary` | Сводка пропусков по группе | группа | куратор | XLSX |
| `student_attendance_card` | Персональная карточка (по дисциплинам/типам занятий) | студент | студент/куратор | PDF |
| `student_attendance_certificate` | Справка о посещаемости (официальная) | студент | деканат | DOCX/PDF |
| `teacher_filling_control` | Контроль заполнения журнала преподавателем | преподаватель | зав. кафедрой | XLSX |
| `discipline_attendance` | Посещаемость по дисциплине (по группам) | преподаватель/дисциплина | преподаватель | XLSX/PDF |
| `department_institute_summary` | Сводный отчёт по кафедре/институту (средний %, тренд) | управление | декан | XLSX/PDF |
| `group_attendance_rating` | Рейтинг групп/курсов (топ и антитоп) | управление | декан | XLSX |
| `absence_reasons_report` | Отчёт по причинам отсутствия | управление | декан | XLSX |
| `express_report` | Экспресс-отчёт «сегодня/неделя» | оперативный | староста/куратор | экран/PDF |
| `chronic_absentees_report` | Хронические прогульщики (< порога %) | оперативный | куратор/деканат | XLSX |

Заказчик «декан/зав. кафедрой» — будущие роли; в текущей версии приложения все авторизованные равны, scope-проверки вводятся вместе с ролями (см. §5, открытый вопрос №1).

### 1.5 Единицы измерения

- **Проценты посещаемости** — `present + late` считаются «присутствовал»; формула: `100 × (present + late) / total_marks`. При отсутствии отметок по студенту строка не участвует (или помечается «нет данных»).
- Период задаётся датами `[from, to]` (по `lesson_date`), пресеты: сегодня/неделя/месяц/семестр/произвольный.
- «Не отмеченные пары» (для `teacher_filling_control`) — пары преподавателя/группы в периоде без записей в `attendance`.

### 1.6 Расширения схемы (принимаемые решения для полноты отчётности)

1. `institutes(id, name)` и `departments(id, name, institute_id)` — справочники управления.
2. `groups.department_id`, `groups.course smallint`, `groups.study_form` — привязка к кафедре/курсу/форме.
3. `students.record_book text` — номер зачётки.
4. `teachers.department_id` — кафедра преподавателя.
5. `lessons.start_time time`, `lessons.room text` — время/аудитория пары.
6. `attendance.absence_reason text` (`respected|unrespected|unknown`) — причина отсутствия.

Все расширения — отдельные миграции; модуль отчётности читает их опционально (`?`), чтобы работал и на старой схеме.

---

## 2. Архитектура модуля: три независимых слоя

```
                 ┌─────────────────────────────────────────────┐
  ReportOrder ──►│  ReportsService (оркестратор + очередь)      │
                 │  validate params → aggregate → render →      │
                 │  deliver (0..* способов)                     │
                 └───────┬───────────┬────────────┬─────────────┘
                         │           │            │
              ┌──────────▼───┐ ┌─────▼─────┐ ┌────▼───────────┐
              │ 1. Агрегация │ │2. Рендер  │ │3. Доставка     │
              │  aggregators │ │ renderers │ │ delivery       │
              │  (чистые     │ │ (один     │ │ (screen/email/ │
              │   функции)   │ │  шаблон)  │ │  internal/     │
              └──────▲───────┘ └─────┬─────┘ │  download)     │
                     │               │       └────────────────┘
              ReportDataSource       │
              (SupabaseAdapter)      │
                     │               ▼
              Supabase/БД      GeneratedReport (файлы+метаданные)
```

### 2.1 Слой 1 — Агрегация (`lib/reports/aggregators`)

- Чистые функции: `(params: ReportParams, ds: ReportDataSource) => Promise<AggregatedReport>`.
- Один агрегатор на `ReportType`; общие примитивы (проценты, матрица «студент × дата», тренд по неделям) вынесены в `lib/reports/aggregators/shared`.
- Выход — **каноническая модель** `AggregatedReport` (колонки + строки + итоги), не зависящая от формата вывода. Никакой логики форматирования файлов в этом слое.

### 2.2 Слой 2 — Рендер (`lib/reports/renderers`)

- Единый **шаблонизатор** `ReportTemplate`: шапка КамчатГТУ (институт/кафедра/название формы/период/дата формирования), кириллический шрифт, колонтитулы, пагинация, блок подписи/печати на официальных формах.
- Один `AggregatedReport` → рендер в разные форматы разными рендерерами без повторной агрегации:
  - **PDF** — `pdf-lib`/`react-pdf` (сервер), фиксированный макет, пагинация;
  - **XLSX** — `exceljs`: лист на группу/период при больших выборках, автоширина, заморозка шапки, условная подсветка (низкая посещаемость), сводные листы для управленческих форм;
  - **DOCX** — `docx`: шаблон (letterhead), текст + таблица, готовность к печати/подписи.
- Рендереры выполняются на сервере (Route Handler / Server Action), т.к. тянут зависимости для работы с файлами.

### 2.3 Слой 3 — Доставка (`lib/reports/delivery`)

Один и тот же `GeneratedReport` доставляется несколькими способами без повторной генерации. Интерфейс:

```ts
interface ReportDeliveryMethod {
  kind: "screen" | "email" | "internal" | "download";
  deliver(report: GeneratedReport, target: DeliveryTarget): Promise<DeliveryResult>;
}
```

Реализации:
- **`ScreenDelivery`** — возвращает данные `AggregatedReport` + файлы в UI (предпросмотр, интерактивная сортировка поверх готовых данных, кнопка «Экспорт» без повторного запроса параметров).
- **`EmailDelivery`** — письмо с вложением(ями): адрес получателя (в т.ч. внешний), шаблон темы/текста/подписи. Очередь отправки, статусы `queued/sending/sent/error`, повтор при сбое, лог (`report_deliveries`). Провайдер — см. открытый вопрос №3.
- **`InternalTransferDelivery`** — внутреннее уведомление пользователю с файлом/ссылкой; проверка scope получателя (своя ли группа/кафедра); badge/inbox + комментарий; история у обоих участников.
- **`DownloadDelivery`** — выдача одноразовой/срок-ограниченной ссылки (или защищённой правами) на файл из Storage + история скачиваний; повторное скачивание без пересчёта, если `dataHash` не изменился.

### 2.4 Оркестрация и очередь (`lib/reports/service`)

- `ReportsService.order(params)` — валидация, оценка «веса» (лёгкий/тяжёлый), создание `ReportOrder`.
- **Лёгкие** (одна группа/студент, короткий период): синхронно: агрегация → рендер → доставка; результат сразу.
- **Тяжёлые** (институт/семестр, несколько форматов): постановка в очередь, статусы `queued → aggregating → rendering → ready | error`, уведомление по готовности. В Next.js очередь реализуется таблицей `report_orders` + обработкой по запросу (страница «Мои заказы» опрашивает статус) либо cron/background-функцией Vercel — см. открытый вопрос №4.
- Персистентность: `report_orders`, `report_files`, `report_deliveries`, `internal_messages`, `report_templates` (миграция, §4.3).

---

## 3. UI: мастер заказа отчёта

### 3.1 Состояния мастера (state machine)

```
[1 Выбор формы] ──► [2 Область действия] ──► [3 Период] ──► [4 Доп. фильтры]
       ▲                    │                    │               │
       └──── back ◄─────────┴──── back ◄─────────┴──── back ◄────┘
                                                                  ▼
        [5 Форматы] ──► [6 Способ подачи] ──► [7 Подтверждение] ──► RUN
              ▲              ▲                      │
              └──back────────┴──back────────────────┘      ▼
                                             ┌── лёгкий: ready (screen/file)
                                             └── тяжёлый: queued ─► job states
```

- Состояние мастера хранится локально (`useState`/редьюсер); допустимые переходы: `next`, `back`, `reset`. Шаг 2 и шаги 5–7 могут «пропускаться» до значений по умолчанию (кнопка «Далее» активна всегда; шаг с необязательными фильтрами помечен).
- Права определяют доступные значения шага 2 (каскад институт → кафедра → группа/преподаватель/дисциплина): староста видит свою группу, декан — весь институт. Без введённых ролей шаг 2 ограничивается доступными пользователю данными.

### 3.2 Wireframe шагов (каркас)

1. **Форма** — список из §1.4, сгруппирован по категориям (группа/студент/преподаватель·дисциплина/управление/оперативные), у каждого пункта описание.
2. **Область** — каскадные select'ы (справочники из `ReportDataSource`, фильтр по правам).
3. **Период** — сегментированный контрол пресетов (сегодня/неделя/месяц/семестр) + календарь произвольного диапазона (уже есть `Calendar` в `components/ui`).
4. **Доп. фильтры** — динамически по типу формы (порог % для `chronic_absentees`, причина отсутствия, тип занятия и т.п.).
5. **Форматы** — чекбоксы PDF/Excel/Word (по умолчанию из метаданных формы).
6. **Способ подачи** — мультивыбор: экран / email (поле адреса + шаблон письма) / передача пользователю (поиск + комментарий) / скачивание.
7. **Подтверждение** — сводка параметров, кнопка «Сформировать» (легкая) или «Поставить в очередь» (тяжёлая).

### 3.3 «Мои заказы» / история

- Список заказов пользователя: дата, тип формы, параметры, статус, действия (скачать, переотправить, повторить заказ с теми же параметрами за новый период).
- Для админов/деканата — расширенный вид (аудит заказов по зоне ответственности).

### 3.4 Шаблоны регулярной отчётности

- Сохранение «форма + фильтры + формат + подача» как именованного шаблона; запуск вручную или по расписанию (`report_templates` с cron-полем; планировщик — открытый вопрос №4).

---

## 4. Интеграция с существующим приложением (Next.js + Supabase)

### 4.1 Роутинг

```
app/(dashboard)/
  reports/
    page.tsx            — «Мои заказы» + кнопка «Новый отчёт»
    new/                — мастер заказа (7 шагов)
    orders/[orderId]/   — детали заказа/предпросмотр
    templates/          — шаблоны регулярной отчётности
```

Пункт «Отчёты» добавляется в `components/layout/sidebar.tsx` и `bottom-nav.tsx`.

### 4.2 Исполнение

- Лёгкая генерация — Server Action `lib/actions/reports.ts` (`createReportOrder`), потоковый ответ или redirect на детали заказа.
- Тяжёлая генерация и экспорт — Route Handler `app/api/reports/[orderId]/file/route.ts` (скачивание), `app/api/reports/.../deliver/route.ts`.
- Файлы — Supabase Storage (bucket `report-files`, приватный), ссылки с TTL для скачивания.

### 4.3 Миграция БД (добавляется к существующим)

```sql
create table report_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  params jsonb not null,
  status text not null default 'queued',
  error text,
  report_id uuid,
  data_hash text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create table report_files (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references report_orders(id) on delete cascade,
  format text not null,
  storage_path text not null,
  size_bytes bigint,
  mime_type text
);
create table report_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references report_orders(id) on delete cascade,
  method text not null,
  target jsonb,
  status text not null default 'queued',
  error text,
  sent_at timestamptz
);
create table report_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  params jsonb not null,
  cron text
);
-- RLS: владелец видит свои заказы; админ/декан — по своей зоне (после введения ролей)
alter table report_orders enable row level security;
-- ... (policy: owner), и т.д. для остальных таблиц
```

### 4.4 Размещение кода

```
lib/reports/
  types.ts                 — финализированная схема (этот документ)
  data-source.ts           — интерфейс ReportDataSource
  data-source/supabase.ts  — адаптер поверх lib/supabase
  aggregators/             — чистые функции по ReportType
    shared.ts              — проценты, матрица, тренды
    group-attendance.ts
    group-absences.ts
    student-card.ts
    ...
  renderers/
    template.ts            — шапка КамчатГТУ, шрифты, пагинация
    pdf.ts
    xlsx.ts
    docx.ts
  delivery/
    screen.ts
    email.ts
    internal.ts
    download.ts
  service.ts               — ReportsService (оркестратор)
  registry.ts              — ReportTypeMeta и реестр агрегаторов/рендереров/методов
components/reports/
  report-wizard.tsx        — мастер (7 шагов)
  orders-list.tsx
  ...
app/(dashboard)/reports/... (см. §4.1)
```

---

## 5. Открытые вопросы и принимаемые предположения

1. **Роли и права.** Сейчас все авторизованные равны (RLS: read-all, manage-all). Для scope «староста видит свою группу / декан — институт» нужны роли (`app_roles` или поля `groups.curator_user_id`, `teachers.user_id`). **Предположение:** на первой итерации область действия ограничивается данными, доступными пользователю через существующие RLS; роли вводятся отдельной задачей.
2. **Institute/Department и др. расширения схемы** (§1.6) — не существуют в текущей схеме. **Предположение:** отчёты «по кафедре/институту» на старте работают как «по всем данным»; справочники добавляются отдельной миграцией по мере готовности.
3. **Почтовый провайдер** не указан. **Предложение:** Resend/SMTP (переменная окружения); до подключения `EmailDelivery` помечается «недоступен».
4. **Фоновая очередь** для тяжёлых отчётов: Vercel-окружение без постоянного worker. **Предложение:** очередь в БД + страница статуса с опросом; при необходимости — Vercel Cron для генерации готовых отчётов.
5. **Формат «неуважительная причина»** требует поля `attendance.absence_reason`; до его добавления все `absent_unknown` трактуются как «причина не указана», а `sick` — как «уважительная (болезнь)».
6. **Библиотеки рендера** (pdf-lib/exceljs/docx) — добавить в `package.json` и запускать только на сервере; таймауты Vercel учитываются для тяжёлых отчётов.
7. **Институт в шапке** — «КамчатГТУ» как константа шаблона до появления сущности `institutes`.
