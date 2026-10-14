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

export const MUSIC_VIBES = [
  { id: 'rap', label: 'Desi Hip-Hop & Rap', icon: '🔥', description: 'Seedhe Maut, DIVINE, KR$NA, Talwiinder' },
  { id: 'chatpata', label: 'Bollywood Chatpata', icon: '🌶️', description: '90s party hits, masala dance bangers' },
  { id: 'punjabi', label: 'Punjabi Pop & Bass', icon: '🪕', description: 'Diljit Dosanjh, Karan Aujla, Shubh' },
  { id: 'indie', label: 'Hindi Indie & Acoustic', icon: '☕', description: 'Anuv Jain, The Local Train, Prateek Kuhad' },
  { id: 'lofi', label: 'Midnight Lofi Chill', icon: '🌙', description: 'Late night study, chill beats' },
  { id: 'garba', label: 'Festive & Garba Remix', icon: '🪩', description: 'Dhol tasha, modern EDM Garba mixes' },
] as const;
