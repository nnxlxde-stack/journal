-- =========================================================
-- EXTENSIONS
-- =========================================================
create extension if not exists pgcrypto; -- для gen_random_uuid()

-- =========================================================
-- ENUMS
-- =========================================================
create type attendance_status as enum (
  'present',        -- присутствовал
  'absent_unknown', -- отсутствовал по неизвестной причине
  'late',           -- опоздал
  'sick'            -- болен
);

create type lesson_type as enum (
  'lecture',    -- лекция
  'practice',   -- практика/семинар
  'lab',        -- лабораторная
  'exam',       -- экзамен
  'credit'      -- зачёт
);

-- =========================================================
-- Семестры
-- =========================================================
create table semesters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,               -- например, "Осень 2026"
  year        smallint not null,           -- 2026
  term        smallint not null check (term in (1, 2)), -- 1 — осенний, 2 — весенний
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now(),

  unique (year, term),
  check (end_date > start_date)
);

create index idx_semesters_dates on semesters(start_date, end_date);

-- =========================================================
-- Группы
-- =========================================================
create table groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,        -- например, "ФИТЭУ-21-1"
  created_at  timestamptz not null default now()
);

-- =========================================================
-- Дисциплины
-- =========================================================
create table disciplines (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- =========================================================
-- Преподаватели
-- =========================================================
create table teachers (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  user_id     uuid references auth.users(id) on delete set null, -- связь с Supabase Auth
  created_at  timestamptz not null default now()
);

-- =========================================================
-- Студенты
-- =========================================================
create table students (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  group_id    uuid not null references groups(id) on delete restrict,
  user_id     uuid references auth.users(id) on delete set null, -- если студенты сами логинятся
  created_at  timestamptz not null default now()
);

create index idx_students_group_id on students(group_id);

-- =========================================================
-- Занятия (конкретная пара: семестр + дисциплина + группа + дата + № пары)
-- =========================================================
create table lessons (
  id             uuid primary key default gen_random_uuid(),
  semester_id    uuid not null references semesters(id) on delete restrict,
  discipline_id  uuid not null references disciplines(id) on delete restrict,
  group_id       uuid not null references groups(id) on delete restrict,
  teacher_id     uuid references teachers(id) on delete set null,
  lesson_date    date not null,
  pair_number    smallint not null check (pair_number between 1 and 8), -- № пары в расписании
  lesson_type    lesson_type not null default 'lecture',
  created_at     timestamptz not null default now(),

  unique (discipline_id, group_id, lesson_date, pair_number)
);

create index idx_lessons_group_date on lessons(group_id, lesson_date);
create index idx_lessons_discipline on lessons(discipline_id);
create index idx_lessons_semester on lessons(semester_id);

-- Проверка: дата занятия должна попадать в границы его семестра
create or replace function check_lesson_date_within_semester()
returns trigger as $$
begin
  if not exists (
    select 1 from semesters sem
    where sem.id = new.semester_id
      and new.lesson_date between sem.start_date and sem.end_date
  ) then
    raise exception 'Дата занятия % не входит в границы семестра %', new.lesson_date, new.semester_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_check_lesson_semester
before insert or update on lessons
for each row execute function check_lesson_date_within_semester();

-- =========================================================
-- Посещаемость (студент × занятие)
-- =========================================================
create table attendance (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references lessons(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  status      attendance_status not null default 'absent_unknown',
  marked_by   uuid references auth.users(id) on delete set null, -- кто отметил
  marked_at   timestamptz not null default now(),

  unique (lesson_id, student_id) -- один студент — одна отметка на занятие
);

create index idx_attendance_student on attendance(student_id);
create index idx_attendance_lesson on attendance(lesson_id);

-- Триггер: студент должен принадлежать той же группе, что и занятие
create or replace function check_student_group_matches_lesson()
returns trigger as $$
begin
  if not exists (
    select 1
    from students s
    join lessons l on l.id = new.lesson_id
    where s.id = new.student_id
      and s.group_id = l.group_id
  ) then
    raise exception 'Студент % не состоит в группе, для которой создано занятие %', new.student_id, new.lesson_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_check_student_group
before insert or update on attendance
for each row execute function check_student_group_matches_lesson();

-- =========================================================
-- Представление для журнала (плоская таблица)
-- =========================================================
drop view if exists attendance_journal;

create view attendance_journal as
select
  a.id            as attendance_id,
  sem.name        as semester,
  l.lesson_date,
  l.pair_number,
  l.lesson_type,
  d.name          as discipline,
  g.name          as group_name,
  s.full_name     as student_name,
  a.status,
  t.full_name     as teacher_name,
  a.marked_at
from attendance a
join lessons l       on l.id = a.lesson_id
join semesters sem   on sem.id = l.semester_id
join disciplines d   on d.id = l.discipline_id
join groups g        on g.id = l.group_id
join students s      on s.id = a.student_id
left join teachers t on t.id = l.teacher_id;

-- =========================================================
-- RLS (Row Level Security)
-- =========================================================
alter table groups enable row level security;
alter table disciplines enable row level security;
alter table teachers enable row level security;
alter table students enable row level security;
alter table semesters enable row level security;
alter table lessons enable row level security;
alter table attendance enable row level security;

-- Справочники читают все авторизованные
create policy "read all for authenticated" on groups
  for select using (auth.role() = 'authenticated');

create policy "read all for authenticated" on disciplines
  for select using (auth.role() = 'authenticated');

create policy "read all for authenticated" on semesters
  for select using (auth.role() = 'authenticated');

create policy "read all for authenticated" on lessons
  for select using (auth.role() = 'authenticated');

-- Преподаватель управляет посещаемостью только на своих занятиях
create policy "teacher manages own lesson attendance" on attendance
  for all
  using (
    exists (
      select 1 from lessons l
      join teachers t on t.id = l.teacher_id
      where l.id = attendance.lesson_id
        and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from lessons l
      join teachers t on t.id = l.teacher_id
      where l.id = attendance.lesson_id
        and t.user_id = auth.uid()
    )
  );

-- Студент видит только свои отметки
create policy "student reads own attendance" on attendance
  for select
  using (
    exists (
      select 1 from students s
      where s.id = attendance.student_id
        and s.user_id = auth.uid()
    )
  );s