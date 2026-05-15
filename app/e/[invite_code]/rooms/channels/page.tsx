import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database, Event, Room } from "@/lib/supabase/types";
import ChannelList from "./ChannelList";

const DUMMY_EVENT: Event = {
  id: "dummy-event-id",
  title: "テストイベント",
  description: null,
  event_date: "2026-06-01T18:00:00+09:00",
  invite_code: "test-event",
};

async function getData(invite_code: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: event } = await supabase
      .from("events")
      .select()
      .eq("invite_code", invite_code)
      .single();

    if (!event) {
      return { event: DUMMY_EVENT, userRooms: [] as Room[], isDummy: true };
    }

    const { data: rooms } = await supabase
      .from("rooms")
      .select()
      .eq("event_id", event.id)
      .order("created_at");

    return { event, userRooms: (rooms ?? []) as Room[], isDummy: false };
  } catch {
    return { event: DUMMY_EVENT, userRooms: [] as Room[], isDummy: true };
  }
}

export default async function ChannelsPage({
  params,
}: {
  params: Promise<{ invite_code: string }>;
}) {
  const { invite_code } = await params;
  const { event, userRooms, isDummy } = await getData(invite_code);

  return (
    <ChannelList
      event={event}
      userRooms={userRooms}
      inviteCode={invite_code}
      isDummy={isDummy}
    />
  );
}
