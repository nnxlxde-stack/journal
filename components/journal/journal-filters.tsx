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
    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
      <Select
        aria-label="Группа"
        className="w-full sm:w-fit"
        selectedKey={group}
        onSelectionChange={(key) => setParam("group", key ? String(key) : "")}
      >
        <SelectTrigger className="h-11! w-full rounded-xl sm:w-44">
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
        className="w-full sm:w-fit"
        selectedKey={discipline}
        onSelectionChange={(key) =>
          setParam("discipline", key ? String(key) : "")
        }
      >
        <SelectTrigger className="h-11! w-full rounded-xl sm:w-44">
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
        className="w-full sm:w-fit"
        selectedKey={semester}
        onSelectionChange={(key) =>
          setParam("semester", key ? String(key) : "")
        }
      >
        <SelectTrigger className="h-11! w-full rounded-xl sm:w-44">
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
