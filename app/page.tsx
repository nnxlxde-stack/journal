import { redirect } from "next/navigation";

/** Корень приложения перенаправляет в журнал (дальше решает proxy). */
export default function Home() {
  redirect("/journal");
}
