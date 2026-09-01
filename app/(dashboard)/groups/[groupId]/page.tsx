import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", groupId)
    .single();
  if (!group) notFound();

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("group_id", groupId)
    .order("full_name");

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/groups"
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        К группам
      </Link>

      <Card className="glass rounded-2xl shadow-lg shadow-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            {group.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {students?.length ? (
            students.map((student) => (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                className="rounded-xl border border-border/50 px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                {student.full_name}
              </Link>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              В группе нет студентов.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
