import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Database } from "@/lib/supabase/types";
import JoinFlow from "./JoinFlow";

async function getEvent(invite_code: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data } = await supabase
    .from("events")
    .select()
    .eq("invite_code", invite_code)
    .single();
  return data;
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ invite_code: string }>;
}) {
  const { invite_code } = await params;
  const event = await getEvent(invite_code);
  if (!event) notFound();

  return <JoinFlow event={event} />;
}
