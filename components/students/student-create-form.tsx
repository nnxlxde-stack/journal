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
import {
  createStudentSchema,
  type CreateStudentInput,
} from "@/lib/validation/reference.schema";

export function StudentCreateForm({
  groups,
  action,
}: {
  groups: { id: string; name: string }[];
  action: (
    input: CreateStudentInput,
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
  } = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema),
  });

  const onSubmit = (values: CreateStudentInput) => {
    startTransition(async () => {
      const result = await action(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Студент добавлен");
      closeOverlay?.();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">ФИО</Label>
        <Input
          id="fullName"
          placeholder="Иванов Иван Иванович"
          className="h-11 rounded-xl"
          {...register("fullName")}
        />
        {errors.fullName ? (
          <p className="text-xs text-destructive">{errors.fullName.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Группа</Label>
        <Select
          aria-label="Группа"
          selectedKey={watch("groupId")}
          onSelectionChange={(key) =>
            setValue("groupId", key ? String(key) : "", { shouldValidate: true })
          }
        >
          <SelectTrigger className="h-11 w-full rounded-xl">
            <SelectValue>
              {(state) => state.selectedText || "Выберите группу"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} id={group.id} textValue={group.name}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.groupId ? (
          <p className="text-xs text-destructive">{errors.groupId.message}</p>
        ) : null}
      </div>

      <Button type="submit" isDisabled={isPending} className="h-11 rounded-xl">
        {isPending ? "Добавление…" : "Добавить студента"}
      </Button>
    </form>
  );
}
