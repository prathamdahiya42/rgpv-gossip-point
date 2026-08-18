// ============================================================
// Database Types — mirrors schema.sql exactly
// ============================================================

export type UserTier = 'chat' | 'verified';

export type CommunityMode = 'open' | 'approved_posters';
export type CommunityStatus = 'pending' | 'approved' | 'rejected';

export type ContentStatus = 'visible' | 'auto_hidden' | 'removed';

export type ReactionTargetType = 'post' | 'comment';
export type ReactionEmoji = '👍' | '🔥' | '😂' | '💀';

export type ReportTargetType = 'post' | 'comment';

// ============================================================
// Table Row Types
// ============================================================

export interface User {
  id: string;
  auth_id: string;
  pseudonym: string;
  tier: UserTier;
  phone_hash: string | null;
  device_fingerprint: string | null;
  is_banned: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  description: string | null;
  mode: CommunityMode;
  status: CommunityStatus;
  created_by: string;
  created_at: string;
}

export interface CommunityPoster {
  id: string;
  community_id: string;
  user_id: string;
  created_at: string;
}

export interface Post {
  id: string;
  community_id: string;
  user_id: string;
  pseudonym_shown: string;
  content: string;
  status: ContentStatus;
  report_count: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  pseudonym_shown: string;
  content: string;
  status: ContentStatus;
  report_count: number;
  created_at: string;
}

export interface Reaction {
  id: string;
  target_type: ReactionTargetType;
  target_id: string;
  user_id: string;
  type: ReactionEmoji;
  created_at: string;
}

export interface Report {
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  reporter_id: string;
  reason: string;
  resolved: boolean;
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  blocked_device_fingerprint: string | null;
  blocked_phone_hash: string | null;
  created_at: string;
}

export interface Dm {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
}

export interface DmMessage {
  id: string;
  dm_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface PlaylistTrack {
  title: string;
  url: string;
  platform: 'spotify' | 'youtube' | 'other';
  approved: boolean;
}

export interface Playlist {
  id: string;
  community_id: string | null;
  title: string;
  tracks: PlaylistTrack[];
  created_at: string;
}

// ============================================================
// Enriched types (with joins) used by the UI
// ============================================================

export interface PostWithCommunity extends Post {
  community: Pick<Community, 'id' | 'name'>;
  reaction_counts: Record<ReactionEmoji, number>;
  comment_count: number;
  user_reacted: ReactionEmoji[];
}

export interface CommentWithReactions extends Comment {
  reaction_counts: Record<ReactionEmoji, number>;
  user_reacted: ReactionEmoji[];
}

export interface DmThread extends Dm {
  other_user: Pick<User, 'id' | 'pseudonym' | 'tier'>;
  last_message: Pick<DmMessage, 'content' | 'created_at'> | null;
}
