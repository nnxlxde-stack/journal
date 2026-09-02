"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  LogOut,
  Users,
} from "lucide-react";

import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export const navItems = [
  { href: "/journal", label: "Журнал", icon: BookOpen },
  { href: "/groups", label: "Группы", icon: Users },
  { href: "/disciplines", label: "Дисциплины", icon: BookMarked },
  { href: "/students", label: "Студенты", icon: GraduationCap },
  { href: "/semesters", label: "Семестры", icon: CalendarDays },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/reports", label: "Отчёты", icon: FileText },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop-навигация (≥ md). Активный пункт — bg-primary/10, text-primary, border-l glow-sm. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border/50 bg-card/40 backdrop-blur-xl md:flex">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15">
          <BookOpen className="size-5 text-primary" />
        </span>
        <span className="font-heading text-lg font-semibold tracking-tight">
          Журнал
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary glow-sm"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/50 p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4 shrink-0" />
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}
