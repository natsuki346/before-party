import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("invite_code")
    .order("event_date", { ascending: false })
    .limit(1)
    .single();

  if (event) {
    redirect(`/e/${event.invite_code}/members`);
  }

  redirect("/admin");
}
