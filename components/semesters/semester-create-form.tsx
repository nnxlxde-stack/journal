"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useCreateOverlay } from "@/components/shared/create-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

import {
  createSemesterSchema,
  type CreateSemesterInput,
} from "@/lib/validation/reference.schema";

export function SemesterCreateForm({
  action,
}: {
  action: (
    input: CreateSemesterInput,
  ) => Promise<{ error?: string; success?: boolean }>;
}) {
  const closeOverlay = useCreateOverlay();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<
    z.input<typeof createSemesterSchema>,
    unknown,
    CreateSemesterInput
  >({
    resolver: zodResolver(createSemesterSchema),
    defaultValues: { term: 1, year: new Date().getFullYear() },
  });

  const onSubmit = (values: CreateSemesterInput) => {
    startTransition(async () => {
      const result = await action(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Семестр создан");
      closeOverlay?.();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Название</Label>
        <Input
          id="name"
          placeholder="Осень 2026"
          className="h-11 rounded-xl"
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="year">Год</Label>
          <Input
            id="year"
            type="number"
            className="h-11 rounded-xl"
            {...register("year")}
          />
          {errors.year ? (
            <p className="text-xs text-destructive">{errors.year.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Семестр</Label>
          <Select
            aria-label="Семестр"
            className="w-full"
            selectedKey={watch("term")}
            onSelectionChange={(key) =>
              setValue("term", key === 2 ? 2 : 1)
            }
          >
            <SelectTrigger className="h-11! w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem id={1} textValue="Осенний (1)">
                Осенний (1)
              </SelectItem>
              <SelectItem id={2} textValue="Весенний (2)">
                Весенний (2)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">Начало</Label>
          <Input
            id="startDate"
            type="date"
            className="h-11 rounded-xl"
            {...register("startDate")}
          />
          {errors.startDate ? (
            <p className="text-xs text-destructive">
              {errors.startDate.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">Конец</Label>
          <Input
            id="endDate"
            type="date"
            className="h-11 rounded-xl"
            {...register("endDate")}
          />
          {errors.endDate ? (
            <p className="text-xs text-destructive">{errors.endDate.message}</p>
          ) : null}
        </div>
      </div>

      <Button type="submit" isDisabled={isPending} className="h-11 rounded-xl">
        {isPending ? "Создание…" : "Создать семестр"}
      </Button>
    </form>
  );
}
