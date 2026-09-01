"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLesson } from "@/lib/actions/lessons";
import {
  createLessonSchema,
  type CreateLessonInput,
} from "@/lib/validation/lesson.schema";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

function FormSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select
        aria-label={label}
        selectedKey={value ?? undefined}
        onSelectionChange={(key) => onChange(key ? String(key) : "")}
      >
        <SelectTrigger className="h-11 w-full rounded-xl">
          <SelectValue>
            {(state) => state.selectedText || placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} id={option.id} textValue={option.name}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LessonForm({
  groups,
  disciplines,
  semesters,
  teachers,
  onSuccess,
}: {
  groups: Option[];
  disciplines: Option[];
  semesters: Option[];
  teachers: Option[];
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof createLessonSchema>, unknown, CreateLessonInput>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      lessonType: "lecture",
      pairNumber: 1,
      teacherId: null,
    },
  });

  const onSubmit = (values: CreateLessonInput) => {
    startTransition(async () => {
      const result = await createLesson(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Занятие создано");
      reset();
      onSuccess();
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelect
          label="Дисциплина"
          placeholder="Выберите дисциплину"
          options={disciplines}
          value={watch("disciplineId")}
          onChange={(v) => setValue("disciplineId", v, { shouldValidate: true })}
        />
        {errors.disciplineId ? (
          <p className="text-xs text-destructive">{errors.disciplineId.message}</p>
        ) : null}

        <FormSelect
          label="Группа"
          placeholder="Выберите группу"
          options={groups}
          value={watch("groupId")}
          onChange={(v) => setValue("groupId", v, { shouldValidate: true })}
        />
        {errors.groupId ? (
          <p className="text-xs text-destructive">{errors.groupId.message}</p>
        ) : null}

        <FormSelect
          label="Семестр"
          placeholder="Выберите семестр"
          options={semesters}
          value={watch("semesterId")}
          onChange={(v) => setValue("semesterId", v, { shouldValidate: true })}
        />
        {errors.semesterId ? (
          <p className="text-xs text-destructive">{errors.semesterId.message}</p>
        ) : null}

        <FormSelect
          label="Преподаватель (необязательно)"
          placeholder="Не выбран"
          options={[
            { id: "none", name: "Без преподавателя" },
            ...teachers,
          ]}
          value={watch("teacherId") ?? "none"}
          onChange={(v) => setValue("teacherId", v === "none" ? null : v)}
        />
        {errors.teacherId ? (
          <p className="text-xs text-destructive">{errors.teacherId.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lessonDate">Дата</Label>
          <Input
            id="lessonDate"
            type="date"
            className="h-11 rounded-xl"
            {...register("lessonDate")}
          />
          {errors.lessonDate ? (
            <p className="text-xs text-destructive">
              {errors.lessonDate.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pairNumber">Пара</Label>
          <Input
            id="pairNumber"
            type="number"
            min={1}
            max={8}
            className="h-11 rounded-xl"
            {...register("pairNumber")}
          />
          {errors.pairNumber ? (
            <p className="text-xs text-destructive">
              {errors.pairNumber.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Тип занятия</Label>
          <Select
            aria-label="Тип занятия"
            selectedKey={watch("lessonType")}
            onSelectionChange={(key) =>
              setValue(
                "lessonType",
                (key as CreateLessonInput["lessonType"]) ?? "lecture",
              )
            }
          >
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem id="lecture" textValue="Лекция">
                Лекция
              </SelectItem>
              <SelectItem id="practice" textValue="Практика">
                Практика
              </SelectItem>
              <SelectItem id="lab" textValue="Лабораторная">
                Лабораторная
              </SelectItem>
              <SelectItem id="exam" textValue="Экзамен">
                Экзамен
              </SelectItem>
              <SelectItem id="credit" textValue="Зачёт">
                Зачёт
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        isDisabled={isPending}
        className="h-11 rounded-xl"
      >
        {isPending ? "Создание…" : "Создать занятие"}
      </Button>
    </form>
  );
}

/**
 * Создание занятия: desktop — Dialog по центру, mobile — Drawer снизу.
 * Переключение чисто CSS (hidden md:block / block md:hidden).
 */
export function CreateLessonDialog({
  groups,
  disciplines,
  semesters,
  teachers,
}: {
  groups: Option[];
  disciplines: Option[];
  semesters: Option[];
  teachers: Option[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeBoth = () => {
    setDialogOpen(false);
    setDrawerOpen(false);
  };

  const sharedProps = { groups, disciplines, semesters, teachers };

  return (
    <>
      {/* Desktop: Dialog по центру */}
      <div className="hidden md:block">
        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="h-10 rounded-xl"
        >
          <Plus className="size-4" />
          Создать занятие
        </Button>
        <Dialog
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          className="glass-strong rounded-2xl sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle>Новое занятие</DialogTitle>
            <DialogDescription>
              Дисциплина, группа, дата и пара — занятие появится в журнале.
            </DialogDescription>
          </DialogHeader>
          <LessonForm {...sharedProps} onSuccess={closeBoth} />
          <DialogClose className="mt-2" variant="ghost">
            Отмена
          </DialogClose>
        </Dialog>
      </div>

      {/* Mobile: Drawer снизу */}
      <div className="block md:hidden">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger
            render={
              <Button className="h-12 w-full rounded-xl">
                <Plus className="size-4" />
                Создать занятие
              </Button>
            }
          />
          <DrawerContent className={cn("rounded-t-3xl p-5")}>
            <DrawerHeader className="text-left">
              <DrawerTitle>Новое занятие</DrawerTitle>
              <DrawerDescription>
                Дисциплина, группа, дата и пара.
              </DrawerDescription>
            </DrawerHeader>
            <LessonForm {...sharedProps} onSuccess={closeBoth} />
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
