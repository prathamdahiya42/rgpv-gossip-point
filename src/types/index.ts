export * from './database';

// ============================================================
// App-level utility types & constants
// ============================================================

export interface ServerActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedPosts {
  items: import('./database').PostView[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const REACTION_EMOJIS = ['🔥', '😂', '💀'] as const;

export const POST_SECTIONS = [
  { id: 'crushes', label: 'Crushes 💘', shortLabel: 'Crushes' },
  { id: 'gossip', label: 'Gossip 🗣️', shortLabel: 'Gossip' },
  { id: 'campus', label: 'Campus 🏫', shortLabel: 'Campus' },
  { id: 'garba', label: 'Garba 🪩', shortLabel: 'Garba' },
] as const;

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'sexual',
  'personal info',
  'other',
] as const;

export const HOT_THRESHOLD = 10;
export const AUTO_HIDE_REPORT_THRESHOLD = 3;
export const BLIND_DATE_DURATION_SECONDS = 300; // 5 minutes
