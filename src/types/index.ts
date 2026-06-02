import type { Database, TodoStatus, TodoPriority, AttachmentType, ChainRole, MilestoneStatus } from './database';

export type { Database, TodoStatus, TodoPriority, AttachmentType, ChainRole, MilestoneStatus };

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

// ---- Labels ----
export type LabelRow = T['labels']['Row'];
export type TodoLabelRow = T['todo_labels']['Row'];

/** One of the 8 brutalist palette tokens a label can use. */
export type LabelColor =
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'slate'
  | 'cyan'
  | 'orange';

// ---- Subtasks ----
export type SubtaskRow = T['subtasks']['Row'];

// ---- Comments ----
export type CommentRow = T['comments']['Row'];

/** A comment joined with its author profile, as rendered in the thread. */
export interface CommentWithAuthor extends CommentRow {
  author: { id: string; display_name: string; username: string; avatar_url: string | null } | null;
}

// ---- Milestones ----
export type MilestoneRow = T['milestones']['Row'];

/** A milestone plus its derived progress (done / total linked todos). */
export interface MilestoneWithProgress extends MilestoneRow {
  total_todos: number;
  done_todos: number;
}

// ---- Notifications ----
export type NotificationRow = T['notifications']['Row'];

/** Known notification kinds emitted by the DB triggers. `string` keeps it open. */
export type NotificationType = 'comment' | 'todo_done' | 'member_join' | (string & {});

/** A notification joined with its actor's public profile (for avatar + name). */
export interface NotificationWithActor extends NotificationRow {
  actor: Pick<UserRow, 'id' | 'display_name' | 'username' | 'avatar_url'> | null;
}

// ---- Chat ----
export type ChatMessageRow = T['chat_messages']['Row'];

/** A chat message joined with its author profile, as rendered in the panel. */
export interface ChatMessageWithAuthor extends ChatMessageRow {
  author: { id: string; display_name: string; username: string; avatar_url: string | null } | null;
}

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
  overdue_todos: number;
  member_avatars: Array<{ id: string; display_name: string; avatar_url: string | null }>;
}

export interface IdeaWithVotes extends IdeaRow {
  score: number;
  user_vote: 1 | -1 | 0;
  author: { id: string; display_name: string; username: string; avatar_url: string | null } | null;
}
