export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          invite_code: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          invite_code: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          invite_code?: string;
        };
        Relationships: [];
      };
      participants: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "participants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          participant_id: string;
          life_stage: string | null;
          work_context: string | null;
          worries: string[] | null;
          values: string[] | null;
        };
        Insert: {
          id?: string;
          participant_id: string;
          life_stage?: string | null;
          work_context?: string | null;
          worries?: string[] | null;
          values?: string[] | null;
        };
        Update: {
          id?: string;
          participant_id?: string;
          life_stage?: string | null;
          work_context?: string | null;
          worries?: string[] | null;
          values?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: true;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          }
        ];
      };
      match_requests: {
        Row: {
          id: string;
          from_participant_id: string;
          to_participant_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_participant_id: string;
          to_participant_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_participant_id?: string;
          to_participant_id?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_requests_from_participant_id_fkey";
            columns: ["from_participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_requests_to_participant_id_fkey";
            columns: ["to_participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "match_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          }
        ];
      };
      rooms: {
        Row: {
          id: string;
          event_id: string | null;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string | null;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      room_messages: {
        Row: {
          id: string;
          room_id: string;
          sender_name: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender_name: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          sender_name?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Participant = Database["public"]["Tables"]["participants"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type MatchRequest = Database["public"]["Tables"]["match_requests"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type RoomMessage = Database["public"]["Tables"]["room_messages"]["Row"];
export type ParticipantWithProfile = Participant & { profiles: Profile | null };
