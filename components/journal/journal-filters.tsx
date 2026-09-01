"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; name: string };

function FiltersInner({
  groups,
  disciplines,
  semesters,
}: {
  groups: Option[];
  disciplines: Option[];
  semesters: Option[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/journal?${qs}` : "/journal");
  };

  const group = searchParams.get("group") ?? undefined;
  const discipline = searchParams.get("discipline") ?? undefined;
  const semester = searchParams.get("semester") ?? undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Группа"
        selectedKey={group}
        onSelectionChange={(key) => setParam("group", key ? String(key) : "")}
      >
        <SelectTrigger className="h-10 w-44 rounded-xl">
          <SelectValue>
            {(state) => state.selectedText || "Все группы"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {groups.map((option) => (
            <SelectItem key={option.id} id={option.id} textValue={option.name}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        aria-label="Дисциплина"
        selectedKey={discipline}
        onSelectionChange={(key) =>
          setParam("discipline", key ? String(key) : "")
        }
      >
        <SelectTrigger className="h-10 w-44 rounded-xl">
          <SelectValue>
            {(state) => state.selectedText || "Все дисциплины"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {disciplines.map((option) => (
            <SelectItem key={option.id} id={option.id} textValue={option.name}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        aria-label="Семестр"
        selectedKey={semester}
        onSelectionChange={(key) =>
          setParam("semester", key ? String(key) : "")
        }
      >
        <SelectTrigger className="h-10 w-44 rounded-xl">
          <SelectValue>
            {(state) => state.selectedText || "Все семестры"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {semesters.map((option) => (
            <SelectItem key={option.id} id={option.id} textValue={option.name}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Фильтры журнала (группа/дисциплина/семестр) через URL-параметры. */
export function JournalFilters(props: {
  groups: Option[];
  disciplines: Option[];
  semesters: Option[];
}) {
  return (
    <Suspense>
      <FiltersInner {...props} />
    </Suspense>
  );
}
