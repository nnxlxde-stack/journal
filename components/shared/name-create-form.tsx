"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { useCreateOverlay } from "@/components/shared/create-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Простая форма создания сущности с одним текстовым полем (группа, дисциплина). */
export function NameCreateForm({
  action,
  label,
  placeholder,
}: {
  action: (input: { name: string }) => Promise<{ error?: string; success?: boolean }>;
  label: string;
  placeholder: string;
}) {
  const closeOverlay = useCreateOverlay();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await action({ name });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Создано");
      setName("");
      closeOverlay?.();
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>{label}</Label>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={placeholder}
          required
          className="h-11 rounded-xl"
        />
      </div>
      <Button
        type="submit"
        isDisabled={isPending || name.trim().length === 0}
        className="h-11 rounded-xl"
      >
        {isPending ? "Создание…" : "Создать"}
      </Button>
    </form>
  );
}
