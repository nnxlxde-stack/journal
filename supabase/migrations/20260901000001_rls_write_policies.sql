-- =========================================================
-- RLS: write-политики для авторизованных пользователей
-- Журнал ведёт староста/преподаватель — полный CRUD справочников
-- и занятий. Применять после базовой миграции (20260901000000).
-- =========================================================

-- Группы
create policy "manage groups for authenticated" on groups
  for all to authenticated
  using (true)
  with check (true);

-- Дисциплины
create policy "manage disciplines for authenticated" on disciplines
  for all to authenticated
  using (true)
  with check (true);

-- Семестры
create policy "manage semesters for authenticated" on semesters
  for all to authenticated
  using (true)
  with check (true);

-- Преподаватели
create policy "manage teachers for authenticated" on teachers
  for all to authenticated
  using (true)
  with check (true);

-- Студенты
create policy "manage students for authenticated" on students
  for all to authenticated
  using (true)
  with check (true);

-- Занятия (создание/редактирование/удаление)
create policy "manage lessons for authenticated" on lessons
  for all to authenticated
  using (true)
  with check (true);

-- Посещаемость: авторизованный пользователь может отмечать.
-- Дополняет существующую политику «teacher manages own lesson attendance».
create policy "manage attendance for authenticated" on attendance
  for all to authenticated
  using (true)
  with check (true);
