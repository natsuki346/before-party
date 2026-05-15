import DoorCarousel from "./DoorCarousel";

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ invite_code: string }>;
}) {
  const { invite_code } = await params;
  return <DoorCarousel currentInviteCode={invite_code} />;
}
