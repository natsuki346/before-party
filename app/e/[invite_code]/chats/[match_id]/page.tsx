import { notFound } from "next/navigation";
import ChatRoom from "./ChatRoom";

type Message = { id: string; sender: "me" | "other"; content: string; time: string };

type ChatData = {
  match_id: string;
  name: string;
  initial: string;
  color: string;
  messages: Message[];
};

const DUMMY_CHATS: ChatData[] = [
  {
    match_id: "match-1",
    name: "田中 太郎",
    initial: "田",
    color: "#4A90D9",
    messages: [
      { id: "1", sender: "other", content: "はじめまして！プロフィール見ました", time: "14:20" },
      { id: "2", sender: "me",    content: "こんにちは！よろしくです😊",         time: "14:23" },
      { id: "3", sender: "other", content: "エンジニアさんなんですね。どんな技術使ってますか？", time: "14:25" },
      { id: "4", sender: "me",    content: "最近はNext.jsとSupabaseをよく使ってます",           time: "14:27" },
      { id: "5", sender: "other", content: "ぜひ話しましょう！",                               time: "14:30" },
    ],
  },
  {
    match_id: "match-2",
    name: "佐藤 花子",
    initial: "佐",
    color: "#7B61FF",
    messages: [
      { id: "1", sender: "other", content: "マッチありがとうございます！",         time: "昨日 18:00" },
      { id: "2", sender: "me",    content: "こちらこそ！よろしくお願いします",     time: "昨日 18:05" },
      { id: "3", sender: "other", content: "よろしくお願いします",                 time: "昨日 18:06" },
    ],
  },
  {
    match_id: "match-3",
    name: "鈴木 一郎",
    initial: "鈴",
    color: "#E05C5C",
    messages: [
      { id: "1", sender: "me",    content: "起業について話しましょう！",           time: "月曜 10:00" },
      { id: "2", sender: "other", content: "いいですね！どんなフェーズですか？",   time: "月曜 10:30" },
      { id: "3", sender: "me",    content: "シードです。資金調達中で",             time: "月曜 11:00" },
      { id: "4", sender: "other", content: "また今度！",                           time: "月曜 11:05" },
    ],
  },
];

export default async function ChatPage({
  params,
}: {
  params: Promise<{ invite_code: string; match_id: string }>;
}) {
  const { invite_code, match_id } = await params;
  const chat = DUMMY_CHATS.find((c) => c.match_id === match_id);
  if (!chat) notFound();

  return (
    <ChatRoom
      name={chat.name}
      initial={chat.initial}
      color={chat.color}
      initialMessages={chat.messages}
      inviteCode={invite_code}
    />
  );
}
