"use client";

import { useState } from "react";
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
  MoreHorizontal,
  Users,
} from "lucide-react";

import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { isActive } from "@/components/layout/sidebar";

const primaryNav = [
  { href: "/journal", label: "Журнал", icon: BookOpen },
  { href: "/groups", label: "Группы", icon: Users },
  { href: "/students", label: "Студенты", icon: GraduationCap },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
];

const secondaryNav = [
  { href: "/disciplines", label: "Дисциплины", icon: BookMarked },
  { href: "/semesters", label: "Семестры", icon: CalendarDays },
  { href: "/reports", label: "Отчёты", icon: FileText },
];

/** Mobile-навигация (< md): нижний таб-бар (Cupertino) + Sheet для второстепенных разделов. */
export function BottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <nav className="glass-strong fixed inset-x-0 bottom-0 z-50 flex h-16 items-stretch justify-around rounded-t-3xl px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
      {primaryNav.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors",
          secondaryNav.some((item) => isActive(pathname, item.href))
            ? "text-primary"
            : "text-muted-foreground",
        )}
      >
        <MoreHorizontal className="size-5" />
        Ещё
      </button>
      <Sheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        side="bottom"
        className="rounded-t-3xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle>Разделы</SheetTitle>
          <SheetDescription>Остальные разделы журнала</SheetDescription>
        </SheetHeader>
          <div className="grid grid-cols-2 gap-2 pt-4">
            {secondaryNav.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-medium",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        <form action={logout} className="pt-4">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-4 text-sm font-medium text-destructive"
          >
            <LogOut className="size-4" />
            Выйти
          </button>
        </form>
      </Sheet>
    </nav>
  );
}
