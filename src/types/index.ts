import type { Database, TodoStatus, TodoPriority, AttachmentType, ChainRole } from './database';

export type { Database, TodoStatus, TodoPriority, AttachmentType, ChainRole };

type T = Database['public']['Tables'];

export type UserRow = T['users']['Row'];
export type ChainRow = T['chains']['Row'];
export type ChainMemberRow = T['chain_members']['Row'];
export type ProjectRow = T['projects']['Row'];
export type TodoRow = T['todos']['Row'];
export type IdeaRow = T['ideas']['Row'];
export type IdeaVoteRow = T['idea_votes']['Row'];
export type AttachmentRow = T['attachments']['Row'];
export type PushSubscriptionRow = T['push_subscriptions']['Row'];

export type Theme = 'dark' | 'light';

/** A chain member's public profile plus their role in that chain. */
export interface ChainMemberProfile extends UserRow {
  role: ChainRole;
}

export type DeviceKind = 'mobile' | 'desktop';

export interface PresenceMember {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  online_at: string;
  device?: DeviceKind;
}

export interface ChainSummary extends ChainRow {
  member_count: number;
  last_activity: string | null;
}

export interface ProjectSummary extends ProjectRow {
  total_todos: number;
  completed_todos: number;
  member_avatars: Array<{ id: string; display_name: string; avatar_url: string | null }>;
}

export interface IdeaWithVotes extends IdeaRow {
  score: number;
  user_vote: 1 | -1 | 0;
  author: { id: string; display_name: string; username: string; avatar_url: string | null } | null;
}
