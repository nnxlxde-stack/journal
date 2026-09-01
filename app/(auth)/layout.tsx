import { BookOpen } from "lucide-react";

/** Каркас auth-страниц: центрированная стеклянная карточка. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15">
          <BookOpen className="size-6 text-primary" />
        </span>
        <div>
          <p className="font-heading text-xl font-semibold tracking-tight">
            Журнал посещаемости
          </p>
          <p className="text-sm text-muted-foreground">
            Отмечай занятия и следи за посещаемостью
          </p>
        </div>
      </div>
      <div className="glass w-full max-w-sm rounded-3xl p-6 shadow-lg shadow-black/40">
        {children}
      </div>
    </div>
  );
}
