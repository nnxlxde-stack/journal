import Link from "next/link";
import { Trash2, Users } from "lucide-react";

import { CreateOverlay } from "@/components/shared/create-overlay";
import { NameCreateForm } from "@/components/shared/name-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { deleteGroup } from "@/lib/actions/groups";
import { createGroup } from "@/lib/actions/groups";
import { getGroups } from "@/lib/queries/directory";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const groups = await getGroups();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateOverlay
          title="Новая группа"
          description="Группа появится в журнале и в списке студентов."
          buttonLabel="Добавить группу"
        >
          <NameCreateForm
            label="Название группы"
            placeholder="ФИТЭУ-21-1"
            action={createGroup}
          />
        </CreateOverlay>
      </div>

      {groups.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-16 text-center shadow-lg shadow-black/40">
          <Users className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Групп пока нет.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="glass rounded-2xl shadow-lg shadow-black/40"
            >
              <CardContent className="flex items-center justify-between p-4">
                <Link
                  href={`/groups/${group.id}`}
                  className="min-w-0 text-sm font-medium transition-colors hover:text-primary"
                >
                  {group.name}
                </Link>
                <form action={deleteGroup.bind(null, group.id)}>
                  <button
                    type="submit"
                    aria-label="Удалить группу"
                    className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
