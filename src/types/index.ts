export * from './database';

// ============================================================
// App-level utility types
// ============================================================

export interface ServerActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const REACTION_EMOJIS = ['👍', '🔥', '😂', '💀'] as const;

export const REPORT_REASONS = [
  'Harassment or bullying',
  'Spam or scam',
  'Hate speech',
  'Personal information shared',
  'Inappropriate content',
  'Other',
] as const;

export const GENERAL_PLAYLISTS = ['Morning Vibes', 'Bathroom Bangers', 'Night Mode'] as const;

export const HOT_THRESHOLD = 15; // reactions needed for coral tape
export const REPORT_AUTO_HIDE_THRESHOLD = 3;
