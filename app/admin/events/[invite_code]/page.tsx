import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// 作成完了ページ（invite_code を表示）
export default async function EventCreatedPage({
  params,
}: {
  params: Promise<{ invite_code: string }>;
}) {
  const { invite_code } = await params;
  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/e/${invite_code}`;

  return (
    <main className="max-w-lg mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">イベントを作成しました</h1>
      <div className="border rounded-lg p-4 bg-gray-50">
        <p className="text-sm text-gray-500 mb-1">招待コード</p>
        <p className="text-3xl font-mono font-bold tracking-widest">{invite_code}</p>
      </div>
      <div className="border rounded-lg p-4 bg-gray-50">
        <p className="text-sm text-gray-500 mb-1">参加用リンク</p>
        <p className="font-mono text-sm break-all">/e/{invite_code}</p>
      </div>
      <p className="text-gray-600 text-sm">
        このリンクを参加者に共有してください。参加者はプロフィールを登録できます。
      </p>
      <Link
        href={`/e/${invite_code}/members`}
        className="px-4 py-2 border rounded-lg text-center hover:bg-gray-50 transition-colors"
      >
        参加者一覧を見る
      </Link>
    </main>
  );
}
