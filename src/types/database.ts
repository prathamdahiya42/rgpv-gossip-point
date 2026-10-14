// ============================================================
// Database Types — Clean 8-table Streamlined Schema with Garba mode
// ============================================================

export type PostSection = 'crushes' | 'gossip' | 'campus' | 'garba';
export type ReactionEmoji = '🔥' | '😂' | '💀';
export type ReportTargetType = 'post' | 'comment' | 'message' | 'user';
export type MatchQueueStatus = 'waiting' | 'matched' | 'cancelled';
export type BlindDateMode = 'general' | 'garba' | 'music';
export type MusicVibe = 'rap' | 'chatpata' | 'punjabi' | 'indie' | 'lofi' | 'garba';

export interface SharedTrack {
  youtubeId: string;
  title: string;
  sharedBy?: string;
  timestamp?: number;
}

export interface Profile {
  id: string; // auth.uid
  handle: string;
  is_banned: boolean;
  blind_date_banned_until: string | null;
  handle_changed_at: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  section: PostSection;
  body: string;
  is_hidden: boolean;
  report_count: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id?: string | null;
  body: string;
  is_hidden: boolean;
  report_count: number;
  created_at: string;
}

export interface Reaction {
  post_id: string;
  user_id: string;
  emoji: ReactionEmoji;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  created_at: string;
}

export interface MatchQueue {
  user_id: string;
  status: MatchQueueStatus;
  mode: BlindDateMode;
  created_at: string;
}

export interface Match {
  id: string;
  user_a: string;
  user_b: string;
  mode: BlindDateMode;
  started_at: string;
  ends_at: string;
}

export interface MatchMessage {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

// ============================================================
// Public-safe Views / Enriched Types (author_id replaced by handle)
// ============================================================

export interface PostView {
  id: string;
  section: PostSection;
  body: string;
  created_at: string;
  handle: string;
  reaction_counts: Record<ReactionEmoji, number>;
  comment_count: number;
  user_reaction?: ReactionEmoji | null;
}

export interface CommentView {
  id: string;
  post_id: string;
  parent_id?: string | null;
  body: string;
  created_at: string;
  handle: string;
  replies?: CommentView[];
  likes_count?: number;
  user_liked?: boolean;
}
