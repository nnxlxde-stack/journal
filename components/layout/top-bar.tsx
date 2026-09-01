"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookMarked,
  GraduationCap,
  LogOut,
  Search,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { logout } from "@/lib/actions/auth";

export type SearchData = {
  groups: { id: string; name: string }[];
  disciplines: { id: string; name: string }[];
  students: { id: string; full_name: string }[];
};

const titles: { prefix: string; title: string }[] = [
  { prefix: "/journal", title: "Журнал посещаемости" },
  { prefix: "/groups", title: "Группы" },
  { prefix: "/disciplines", title: "Дисциплины" },
  { prefix: "/students", title: "Студенты" },
  { prefix: "/semesters", title: "Семестры" },
  { prefix: "/analytics", title: "Аналитика" },
];

/** Верхняя панель: заголовок раздела, быстрый поиск (⌘K), выход. */
export function TopBar({ searchData }: { searchData: SearchData }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const title =
    titles.find((t) => pathname.startsWith(t.prefix))?.title ?? "Журнал";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) {
      return {
        groups: searchData.groups,
        disciplines: searchData.disciplines,
        students: searchData.students,
      };
    }
    return {
      groups: searchData.groups.filter((item) =>
        item.name.toLowerCase().includes(q),
      ),
      disciplines: searchData.disciplines.filter((item) =>
        item.name.toLowerCase().includes(q),
      ),
      students: searchData.students.filter((item) =>
        item.full_name.toLowerCase().includes(q),
      ),
    };
  }, [q, searchData]);

  const isEmpty =
    results.groups.length === 0 &&
    results.disciplines.length === 0 &&
    results.students.length === 0;

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/50 bg-background/60 px-4 backdrop-blur-xl md:px-8">
      <h1 className="font-heading text-lg font-semibold tracking-tight">
        {title}
      </h1>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto flex h-10 items-center gap-2 rounded-xl border border-border bg-input/20 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60"
        aria-label="Поиск"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Поиск…</span>
        <kbd className="hidden rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>

      <form action={logout} className="hidden md:block">
        <button
          type="submit"
          className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Выйти"
        >
          <LogOut className="size-4" />
        </button>
      </form>

      <Dialog
        isOpen={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
        className="glass-strong rounded-2xl sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Поиск</DialogTitle>
          <DialogDescription>
            Группы, дисциплины и студенты — нажмите, чтобы перейти
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Группа, дисциплина, студент…"
            className="h-11 rounded-xl"
          />

          <div className="no-scrollbar max-h-72 overflow-y-auto">
            {isEmpty ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Ничего не найдено
              </p>
            ) : (
              <>
                {results.groups.length > 0 ? (
                  <div className="flex flex-col gap-0.5 py-1">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Группы
                    </p>
                    {results.groups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => go(`/groups/${group.id}`)}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <Users className="size-4 shrink-0 text-muted-foreground" />
                        {group.name}
                      </button>
                    ))}
                  </div>
                ) : null}

                {results.disciplines.length > 0 ? (
                  <div className="flex flex-col gap-0.5 py-1">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Дисциплины
                    </p>
                    {results.disciplines.map((discipline) => (
                      <button
                        key={discipline.id}
                        type="button"
                        onClick={() => go(`/disciplines/${discipline.id}`)}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <BookMarked className="size-4 shrink-0 text-muted-foreground" />
                        {discipline.name}
                      </button>
                    ))}
                  </div>
                ) : null}

                {results.students.length > 0 ? (
                  <div className="flex flex-col gap-0.5 py-1">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Студенты
                    </p>
                    {results.students.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => go(`/students/${student.id}`)}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
                        {student.full_name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </Dialog>
    </header>
  );
}
