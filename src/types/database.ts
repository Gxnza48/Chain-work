// ChainWork — Supabase schema types. Generated from supabase/migrations/0001_schema.sql.

export type TodoStatus = 'pending' | 'in_progress' | 'done';
export type TodoPriority = 'low' | 'medium' | 'high' | 'critical';
export type AttachmentType = 'repo' | 'image' | 'video' | 'link' | 'pdf' | 'html';
export type ChainRole = 'owner' | 'member';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string | null;
          website: string | null;
          avatar_url: string | null;
          last_seen: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          bio?: string | null;
          website?: string | null;
          avatar_url?: string | null;
          last_seen?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          bio?: string | null;
          website?: string | null;
          avatar_url?: string | null;
          last_seen?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chains: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      chain_members: {
        Row: {
          id: string;
          chain_id: string;
          user_id: string;
          role: ChainRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          chain_id: string;
          user_id: string;
          role?: ChainRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          chain_id?: string;
          user_id?: string;
          role?: ChainRole;
          joined_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          chain_id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chain_id: string;
          name: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chain_id?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      todos: {
        Row: {
          id: string;
          chain_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          status: TodoStatus;
          priority: TodoPriority;
          assigned_to: string | null;
          due_date: string | null;
          completed_at: string | null;
          completed_by: string | null;
          order_index: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chain_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          status?: TodoStatus;
          priority?: TodoPriority;
          assigned_to?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          order_index?: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chain_id?: string;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          status?: TodoStatus;
          priority?: TodoPriority;
          assigned_to?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          order_index?: number;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      ideas: {
        Row: {
          id: string;
          chain_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chain_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chain_id?: string;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      idea_votes: {
        Row: {
          id: string;
          idea_id: string;
          user_id: string;
          vote: number;
        };
        Insert: {
          id?: string;
          idea_id: string;
          user_id: string;
          vote: number;
        };
        Update: {
          id?: string;
          idea_id?: string;
          user_id?: string;
          vote?: number;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          project_id: string;
          type: AttachmentType;
          url: string;
          title: string | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          type: AttachmentType;
          url: string;
          title?: string | null;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          type?: AttachmentType;
          url?: string;
          title?: string | null;
          uploaded_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      todo_reminders_sent: {
        Row: {
          todo_id: string;
          remind_date: string;
          kind: string;
          created_at: string;
        };
        Insert: {
          todo_id: string;
          remind_date: string;
          kind?: string;
          created_at?: string;
        };
        Update: {
          todo_id?: string;
          remind_date?: string;
          kind?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      join_chain_by_code: {
        Args: { p_code: string };
        Returns: string;
      };
      is_chain_member: {
        Args: { target_chain: string };
        Returns: boolean;
      };
      is_chain_owner: {
        Args: { target_chain: string };
        Returns: boolean;
      };
      create_chain: {
        Args: { p_name: string };
        Returns: {
          chain_id: string;
          chain_name: string;
          chain_code: string;
        }[];
      };
    };
    Enums: {
      todo_status: TodoStatus;
      todo_priority: TodoPriority;
      attachment_type: AttachmentType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
