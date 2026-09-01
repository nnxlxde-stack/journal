# Спецификация: установка и стилизация UI (Neon Cupertino Dark)

> Документ для агента (DeepSeek V4 Flash, max effort). Задача — настроить shadcn/ui в существующем Next.js/React-проекте и применить тему "неоновый голубой + тёмная Cupertino-эстетика" ко всем компонентам журнала посещаемости. Следуй шагам по порядку, не пропускай проверки.

---

## 0. Предпосылки

- Проект на **Next.js (App Router)** + **TypeScript** + **Tailwind CSS**.
- Если Tailwind ещё не настроен — сначала инициализировать его, прежде чем переходить к shadcn.
- Пакетный менеджер: использовать тот, что уже в проекте (`package-lock.json` → npm, `pnpm-lock.yaml` → pnpm, `bun.lockb` → bun). Если проект новый — предпочесть `bun` или `pnpm`.

---

## 1. Установка зависимостей

### 1.1 Инициализация shadcn/ui

```bash
npx shadcn@latest init
```

При вопросах CLI отвечать:
- **Style**: `New York` (у него более нейтральная база — под неё легче кастомизировать Cupertino-скругления и блюр, чем под `Default`)
- **Base color**: `Slate` (нейтральный тёмный, не Zinc — Slate чуть холоднее, лучше сочетается с голубым неоном)
- **CSS variables**: `Yes` — обязательно, без CSS-переменных тему не собрать
- **Tailwind config**: подтвердить путь к `tailwind.config.ts`
- **Import alias**: `@/components`, `@/lib/utils` (или существующие алиасы проекта)

### 1.2 Компоненты shadcn (устанавливать через CLI, не копировать вручную)

```bash
npx shadcn@latest add button card badge table tabs dialog alert-dialog \
  sheet drawer sidebar separator scroll-area popover calendar \
  select command context-menu radio-group toggle-group switch \
  form input label textarea tooltip skeleton avatar progress sonner
```

Если CLI не находит какой-то компонент (например, `sidebar` в старых версиях shadcn) — установить их по одному и свериться с `npx shadcn@latest add --help`.

### 1.3 Доп. библиотеки

```bash
npm install @tanstack/react-table react-hook-form zod @hookform/resolvers recharts lucide-react
```

- `@tanstack/react-table` — сортировка/фильтрация таблицы журнала
- `react-hook-form` + `zod` + `@hookform/resolvers` — формы (создание занятия, студента)
- `recharts` — графики посещаемости (обёртка `chart.tsx` ставится через `npx shadcn@latest add chart`)
- `lucide-react` — иконки (обычно тянется автоматически при `shadcn init`, проверить наличие)

`sonner` и `vaul` (для `drawer`) устанавливаются автоматически как зависимости соответствующих shadcn-компонентов — отдельно ставить не нужно, но проверить `package.json` после `add`.

### 1.4 Шрифт

Использовать **Inter** как основной (фолбэк под SF Pro для Cupertino-ощущения на всех ОС, не только macOS).

```bash
npm install @next/font
```

Либо, если проект на `next/font` (встроенный, начиная с Next 13+), ничего дополнительно ставить не нужно — просто импортировать `Inter` из `next/font/google` в `app/layout.tsx`.

---

## 2. Конфигурация темы

### 2.1 `app/layout.tsx` — подключение шрифта и принудительная тёмная тема

```tsx
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`dark ${inter.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

> Тёмная тема — единственная в приложении (не нужен `next-themes` toggle, если явно не попросят светлую тему).

### 2.2 `globals.css` — токены цвета

Заменить/дополнить блок `:root` и `.dark`, сгенерированный shadcn:

```css
@layer base {
  :root {
    --radius: 1rem;
  }

  .dark {
    --background: 222 47% 6%;
    --foreground: 210 40% 98%;

    --card: 222 40% 9%;
    --card-foreground: 210 40% 98%;

    --popover: 222 44% 8%;
    --popover-foreground: 210 40% 98%;

    --primary: 199 89% 55%;        /* неоновый голубой */
    --primary-foreground: 222 47% 6%;

    --secondary: 222 30% 14%;
    --secondary-foreground: 210 40% 98%;

    --muted: 222 30% 14%;
    --muted-foreground: 215 20% 65%;

    --accent: 199 89% 55%;
    --accent-foreground: 222 47% 6%;

    --destructive: 340 82% 60%;    /* неоново-розовый вместо стандартного красного */
    --destructive-foreground: 210 40% 98%;

    --border: 222 30% 18%;
    --input: 222 30% 18%;
    --ring: 199 89% 55%;
  }
}
```

### 2.3 Утилитарные классы для неон/стекло-эффектов

Добавить в конец `globals.css`:

```css
@layer utilities {
  .glow {
    box-shadow:
      0 0 10px hsl(var(--primary) / 0.55),
      0 0 22px hsl(var(--primary) / 0.25);
  }

  .glow-sm {
    box-shadow: 0 0 8px hsl(var(--primary) / 0.4);
  }

  .glass {
    background: hsl(var(--card) / 0.6);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid hsl(var(--primary) / 0.12);
  }

  .glass-strong {
    background: hsl(var(--popover) / 0.75);
    backdrop-filter: blur(24px) saturate(200%);
    -webkit-backdrop-filter: blur(24px) saturate(200%);
    border: 1px solid hsl(var(--primary) / 0.15);
  }
}
```

### 2.4 `tailwind.config.ts` — скругления и шрифт

Убедиться, что в `theme.extend`:

```ts
extend: {
  fontFamily: {
    sans: ["var(--font-inter)", "sans-serif"],
  },
  borderRadius: {
    lg: "var(--radius)",
    xl: "calc(var(--radius) + 4px)",
    "2xl": "calc(var(--radius) + 8px)",
  },
}
```

---

## 3. Правила применения стиля по компонентам

Не применять `.glow` ко всем элементам подряд — только к точкам внимания пользователя. Правило: **один активный акцент на экран максимум в 2-3 местах одновременно**.

| Компонент | Что делать |
|---|---|
| `Sidebar` | Активный пункт меню — фон `bg-primary/10`, текст `text-primary`, левая полоса `border-l-2 border-primary glow-sm` |
| `Card` (карточки метрик, диалоги) | Класс `glass`, `rounded-2xl`, без резких теней — только мягкая `shadow-lg shadow-black/40` |
| `Dialog` / `Sheet` / `Drawer` | Оверлей затемнённый (`bg-black/60 backdrop-blur-sm`), сама панель — `glass-strong rounded-2xl` (или `rounded-t-3xl` для `Drawer` снизу) |
| Primary `Button` | Фон `bg-primary`, при hover добавить `.glow`, `rounded-xl` |
| `Badge` (статус посещения) | `present` → зелёный неон (`emerald-400`, лёгкий glow); `late` → янтарный (`amber-400`); `sick` → серо-голубой приглушённый (`slate-400`, без свечения); `absent_unknown` → неоново-розовый (`rose-500`, glow) — свечение только на "проблемных" статусах, чтобы глаз сразу цеплялся за них |
| `Input` / `Select` / `Command` | При фокусе — `ring-2 ring-primary/60`, без постоянного свечения в состоянии покоя |
| `Table` | Тёмные строки без границ между ячейками (`divide-y divide-border/50`), hover-строка — `bg-primary/5` |
| `ToggleGroup` (быстрая отметка статуса) | Стилизовать как сегментированный контрол iOS: `bg-secondary rounded-xl p-1`, активный сегмент — `bg-primary text-primary-foreground rounded-lg glow-sm` |
| `Tooltip` / `Popover` | `glass`, `rounded-lg`, мелкий текст, без свечения |
| `Progress` (% посещаемости) | Заполненная часть — градиент `from-primary to-cyan-300`, лёгкий `glow-sm` только если процент ниже порога (например < 75%) |
| `Sonner` (тосты) | Тема `richColors`, фон `glass-strong`, успех — зелёный акцент, ошибка — неоново-розовый |
| `Avatar` | Кольцо `ring-2 ring-primary/40` вокруг активного/текущего пользователя |

---

## 4. Чек-лист для агента (выполнять последовательно и отмечать)

- [ ] `shadcn init` выполнен, `components.json` создан с `style: new-york`, `baseColor: slate`, `cssVariables: true`
- [ ] Все компоненты из п. 1.2 установлены, папка `components/ui` заполнена
- [ ] `@tanstack/react-table`, `react-hook-form`, `zod`, `recharts`, `lucide-react` в `package.json`
- [ ] Шрифт Inter подключён в `app/layout.tsx`, класс `dark` жёстко прописан на `<html>`
- [ ] `globals.css` содержит обновлённые токены `.dark` и блок `@layer utilities` с `.glow`, `.glass`, `.glass-strong`
- [ ] `tailwind.config.ts` содержит `fontFamily.sans` и расширенные `borderRadius`
- [ ] Собран билд (`npm run build` / `bun run build`) без ошибок Tailwind/TypeScript
- [ ] Визуально проверено: свечение применено точечно (не более 2-3 акцентов на экран), карточки/диалоги используют `glass`, badge-статусы имеют правильные цвета согласно таблице в разделе 3

---

## 5. Не делать

- Не заливать весь фон неоновым цветом — только текстовые/бордюрные акценты и точечные `glow`.
- Не использовать резкие прямые углы (`rounded-none`) — противоречит Cupertino-эстетике.
- Не добавлять светлую тему, если явно не запрошено — приложение задумано как dark-only.
- Не заменять `Sonner` на классический shadcn `Toast` — анимация `Sonner` лучше сочетается с общим "нативным" ощущением интерфейса.