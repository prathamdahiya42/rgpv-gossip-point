// Campus and food flavored clean adjectives and nouns for RGPV anonymous handles

export const ADJECTIVES = [
  'Sleepy', 'Sneaky', 'Brave', 'Chilly', 'Crispy', 'Desi', 'Spicy', 'Jugaadi',
  'Speedy', 'Clever', 'Hungry', 'Quiet', 'Moody', 'Lazy', 'Electric', 'Turbo',
  'Happy', 'Crazy', 'Nerdy', 'Royal', 'Chill', 'Savage', 'Caffeinated', 'Lost',
  'Silent', 'Mystic', 'Golden', 'Bubbly', 'Sunny', 'Groovy', 'Cosmic', 'Dapper',
  'Zen', 'Wobbly', 'Fluffy', 'Peppy', 'Nimble', 'Hyper', 'Glitched', 'Vintage',
] as const;

export const NOUNS = [
  'Chai', 'Samosa', 'Maggi', 'Poha', 'Kachori', 'Jalebi', 'Hosteller', 'Backbencher',
  'Engineer', 'Topper', 'Coder', 'Scooter', 'Rickshaw', 'Library', 'Canteen', 'Chaiwala',
  'Professor', 'Semester', 'Viva', 'Assignment', 'Proxy', 'Panda', 'Tiger', 'Falcon',
  'Otter', 'Cheetah', 'Badger', 'Badmash', 'Yari', 'Bhopali', 'Shikanji', 'Biryani',
  'BunMaska', 'GulabJamun', 'Paratha', 'Momos', 'Thali', 'Lassi', 'Biscuit', 'Dosa',
] as const;

export function generateRandomHandle(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90) + 10; // 10-99
  return `${adj} ${noun} ${num}`;
}
