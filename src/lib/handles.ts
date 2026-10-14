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

// 40+ authentic disguise handles for bot automated activity so nobody suspects a single bot
export const BOT_DISGUISE_HANDLES = [
  'canteen_detective',
  'mech_backbencher',
  'hostel_b_ghost',
  'cs_lab_sleeper',
  'bhopal_monsoon_lover',
  'lalghati_commuter',
  'ec_junction_spy',
  'garba_queen_uit',
  'samosa_chutney_critic',
  'exam_cell_whisperer',
  'rgpv_tea_spiller',
  'library_top_floor',
  'chai_sutta_philosopher',
  'maggi_nescafe_regular',
  '34_percent_attendance',
  'civil_block_roamer',
  'dsp_exam_victim',
  'first_bench_topper',
  'night_canteen_crawler',
  'bhopali_engineer',
  'admin_block_pigeon',
  'midsem_survivor',
  'bunk_expert_uit',
  'gandhinagar_stop_waiter',
  'proxy_king_uit',
  'turnstile_jumper',
  'hostel_mess_rebel',
  'bhopal_lake_vibes',
  'bunking_dsp_class',
  'poha_jalebi_lover',
  'shikanji_counter_fan',
  'uit_bhopal_vibes',
  'polytechnic_bypass_rider',
  'corner_table_regular',
  'notes_collector_4th_year',
] as const;

export function generateRandomBotHandle(): string {
  // 60% of the time, pick a hyper-realistic UIT student disguise
  // 40% of the time, use normal adjective-noun handle
  if (Math.random() < 0.6) {
    const base = BOT_DISGUISE_HANDLES[Math.floor(Math.random() * BOT_DISGUISE_HANDLES.length)];
    const suffix = Math.random() < 0.4 ? `_${Math.floor(Math.random() * 90) + 10}` : '';
    return `${base}${suffix}`;
  }
  return generateRandomHandle();
}
