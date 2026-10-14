// Campus stories, confessions, and live gossip whispers tailored for UIT RGPV Bhopal

export interface CampusStory {
  section: 'crushes' | 'gossip' | 'campus' | 'garba';
  body: string;
  suggestedHandleAdjective: string;
  suggestedHandleNoun: string;
}

export const CAMPUS_STORIES: CampusStory[] = [
  // Crushes
  {
    section: 'crushes',
    body: 'To the girl in 2nd year CS who always sits near the window in the library basement reading thriller novels: your smile made my entire exam week bearable. Still haven\'t gathered the courage to say hi.',
    suggestedHandleAdjective: 'Silent',
    suggestedHandleNoun: 'Chai',
  },
  {
    section: 'crushes',
    body: 'That EE 3rd year guy who helped me unjam the lathe machine in the mechanical workshop last Tuesday — you dropped your pen drive. If you recognize this, say hi next time at the canteen.',
    suggestedHandleAdjective: 'Blushing',
    suggestedHandleNoun: 'Samosa',
  },
  {
    section: 'crushes',
    body: 'To the boy at Gandhi Nagar bus stop wearing the oversized olive jacket who shared his umbrella during yesterday\'s sudden Bhopal rain: true gentleman behavior 🌧️💘',
    suggestedHandleAdjective: 'Hopeful',
    suggestedHandleNoun: 'Kachori',
  },
  {
    section: 'crushes',
    body: 'The girl who answered all the DSP questions in yesterday\'s lecture while the rest of us were literally praying to pass — brainy is the new attractive fr.',
    suggestedHandleAdjective: 'Sleepy',
    suggestedHandleNoun: 'Maggi',
  },
  {
    section: 'crushes',
    body: 'To the guy wearing the silver chain in the civil corridor who always holds the canteen door open: just know several of us have noticed and talk about you respectfully.',
    suggestedHandleAdjective: 'Secret',
    suggestedHandleNoun: 'Admirer',
  },
  {
    section: 'crushes',
    body: 'The 1st year girl with the pastel blue tote bag who was sketching near the lotus pond lawn yesterday evening — your art is genuinely gorgeous.',
    suggestedHandleAdjective: 'Quiet',
    suggestedHandleNoun: 'Sketcher',
  },

  // Gossip
  {
    section: 'gossip',
    body: 'Word is 3rd year Mech and EC had a full diplomatic standoff over who gets the corner sofa table in the canteen. Canteen bhaiya had to step in as chief peacekeeper 😂',
    suggestedHandleAdjective: 'Sneaky',
    suggestedHandleNoun: 'Chutney',
  },
  {
    section: 'gossip',
    body: 'Someone in 4th year literally submitted a lab assignment with "As an AI language model, I cannot provide circuit diagrams" printed right on page 4. HOD was NOT amused.',
    suggestedHandleAdjective: 'Chaotic',
    suggestedHandleNoun: 'Paratha',
  },
  {
    section: 'gossip',
    body: 'Apparently the library Wi-Fi password was changed because someone was streaming a 4K cricket match on the main lab projector during lunch break 💀',
    suggestedHandleAdjective: 'Witty',
    suggestedHandleNoun: 'Jalebi',
  },
  {
    section: 'gossip',
    body: 'Rumor says the upcoming fest budget got doubled, and they might actually bring an artist we\'ve heard of this time instead of someone\'s cousin who plays synthesizer.',
    suggestedHandleAdjective: 'Dramatic',
    suggestedHandleNoun: 'Biryani',
  },
  {
    section: 'gossip',
    body: 'Faculty meeting yesterday was spicy. Rumor has it they\'re putting biometric attendance on the hostel gates because people have been doing night sprints to Gandhi Nagar.',
    suggestedHandleAdjective: 'Night',
    suggestedHandleNoun: 'Runner',
  },
  {
    section: 'gossip',
    body: 'Notice how whenever the attendance portal updates, the entire college server crashes for 4 hours straight? It\'s not a bug, it\'s divine intervention 🫡',
    suggestedHandleAdjective: 'Proxy',
    suggestedHandleNoun: 'King',
  },

  // Campus
  {
    section: 'campus',
    body: 'UIT bus #4 driver bhaiya drove from Lalghati to campus in 18 minutes today. I swear I saw my past life flash before my eyes on that bypass turn 🏎️',
    suggestedHandleAdjective: 'Terrified',
    suggestedHandleNoun: 'Poha',
  },
  {
    section: 'campus',
    body: 'Attendance portal just sent a critical alert: "You are below 75%". Bro, I am currently sitting at 34%, that alert is about 3 months late to the party.',
    suggestedHandleAdjective: 'Backlog',
    suggestedHandleNoun: 'Samosa',
  },
  {
    section: 'campus',
    body: 'Nothing unites all four years of engineering faster than someone shouting "Prof is taking attendance on a paper slip" across the corridor.',
    suggestedHandleAdjective: 'Brave',
    suggestedHandleNoun: 'Momos',
  },
  {
    section: 'campus',
    body: 'Mid-sem timetable released on Friday evening right as we were leaving campus. Faculty really woke up and chose psychological warfare.',
    suggestedHandleAdjective: 'Exhausted',
    suggestedHandleNoun: 'Lassi',
  },
  {
    section: 'campus',
    body: 'Nescafe corner at 5:15 PM when everyone walks out of 8-period lectures feels like a zombie apocalypse searching for caffeine.',
    suggestedHandleAdjective: 'Caffeinated',
    suggestedHandleNoun: 'Zombie',
  },

  // Garba
  {
    section: 'garba',
    body: 'Need a Garba partner who knows proper 3-taali and won\'t step on my traditional jutti every 5 seconds. I have passes for the weekend ground event!',
    suggestedHandleAdjective: 'Festive',
    suggestedHandleNoun: 'Jalebi',
  },
  {
    section: 'garba',
    body: 'Spotted: two 1st years practicing Dodhiya steps behind the administrative lawn using phone flashlights at 7 PM. The dedication is unmatched 🪩',
    suggestedHandleAdjective: 'Dancing',
    suggestedHandleNoun: 'Samosa',
  },
  {
    section: 'garba',
    body: 'Wearing an all-black Kurta with mirror work for the college Garba night. If anyone is looking for a partner or group to enter with, let me know here!',
    suggestedHandleAdjective: 'Radiant',
    suggestedHandleNoun: 'Laddu',
  },
  {
    section: 'garba',
    body: 'Who else bought traditional dandiya sticks 3 weeks in advance only to realize they still haven\'t finalized who they\'re going with? Relatable pain 😭',
    suggestedHandleAdjective: 'Clueless',
    suggestedHandleNoun: 'Kachori',
  },
  {
    section: 'garba',
    body: 'Bhopal Garba night passes are being scalped for ₹500 behind Gandhi Nagar stop... seniors please have mercy on our canteen pocket money.',
    suggestedHandleAdjective: 'Broke',
    suggestedHandleNoun: 'Hosteller',
  },
];

// Contextual comment bank based on live keywords found on the feed
export function generateContextualComment(postText: string): string {
  const lower = postText.toLowerCase();

  if (lower.includes('attendance') || lower.includes('75%') || lower.includes('debar') || lower.includes('sms')) {
    const options = [
      'Medical certificate banwane ka time aa gaya bhai 😭',
      '34% attendance gang assemble 🫡 we ride together',
      'Profs be acting like 75% attendance gets you direct entry into heaven fr',
      'Is it just me or does attendance matter less than passing internal viva anyway?',
      'Pro tip: Sit on the first bench for exactly 3 days before midsem, prof forgets everything 😂'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  if (lower.includes('canteen') || lower.includes('samosa') || lower.includes('chai') || lower.includes('maggi') || lower.includes('poha')) {
    const options = [
      'Canteen bhaiya\'s red chutney is literally holding this college together fr',
      'Real ones know the samosa at 4 PM right after 7th period hits different',
      'Nescafe cold coffee prices went up again btw, college economy in shambles 💀',
      'The corner sofa table debate has reached legendary status across campus lmao'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  if (lower.includes('crush') || lower.includes('girl') || lower.includes('boy') || lower.includes('smile') || lower.includes('love')) {
    const options = [
      'Bro shoot your shot before the semester ends!! Relatable pain 😭',
      'Wait why do I feel like I know exactly who this is about 👀',
      'Library basement romance is peak RGPV cinema honestly',
      'Someone give branch hints at least, we need to do detective work! 😂'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  if (lower.includes('garba') || lower.includes('dandiya') || lower.includes('taali') || lower.includes('dodhiya')) {
    const options = [
      'Bro passes are already getting sold out, hurry up or we will be outside eating chaat',
      'Can we please get a crash course on Dodhiya steps behind the admin lawn 💀',
      'Anyone else going 100% just for the food stalls and vibe?'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  if (lower.includes('bus') || lower.includes('lalghati') || lower.includes('bypass') || lower.includes('driver')) {
    const options = [
      'Bus #4 driver is basically Max Verstappen with a government license 🏎️',
      'The sudden brake near Gandhi Nagar stop tests your core strength every morning fr',
      'Lalghati to campus in under 20 mins is an Olympic sport'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  // General campus witty replies
  const fallbacks = [
    'Who let you cook with this confession 😂 peak accuracy',
    'Bro woke up and chose to spill entire college secrets 💀',
    'Finally someone said it out loud! 💯',
    'This is painfully accurate lmao, UIT moments',
    'Wait till faculty sees this board 😭 keep handles anonymous!',
    'Lmao so true, couldn\'t have said it better'
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Meta stories referencing current discussions on the page
export function generateMetaGossipStory(recentKeywords: string[]): string {
  if (recentKeywords.includes('attendance')) {
    return 'The sheer amount of people crying about attendance on here today... look outside, Bhopal weather is way too nice to be stressing over 75% in a dark lecture hall anyway 🌧️';
  }
  if (recentKeywords.includes('crushes')) {
    return 'Seeing all these anonymous crush confessions on the board... meanwhile 3rd year Mech is still searching for a female classmate 💀 Don\'t lose hope kings.';
  }
  if (recentKeywords.includes('canteen')) {
    return 'Y\'all are wild with these canteen gossip posts... canteen bhaiya is definitely gonna start charging 5 rupees extra for chai if we keep exposing the sofa battles 😂';
  }
  if (recentKeywords.includes('garba')) {
    return 'Garba night is literally around the corner and half the college still has no passes, no partner, and only 2 Dodhiya steps memorized. The collective panic is unmatched 🪩';
  }

  return 'Midsem preparation is officially in full swing: library basement is at 100% capacity, canteen chai consumption is up 400%, and sleep schedules are officially non-existent ☕';
}

// Live Gossip Whispers specifically designed to trigger juicy conversation during 5-minute Blind Date chats
export const LIVE_GOSSIP_WHISPERS = [
  '👀 Campus Whisper: Someone proposed with a canteen samosa yesterday. Would you accept or block?',
  '👀 Campus Tea: Rumor says 3rd year Mech and EC had a beef over the canteen sofa today. Whose side are you on?',
  '👀 Hot Take: 8:30 AM lectures on Monday mornings should be declared a violation of human rights. Agree or disagree?',
  '👀 Confession: Someone saw two students practicing Garba steps behind the admin lawn last night. Can you dance or do you do the awkward two-step?',
  '👀 Campus Dilemma: What\'s worse — getting caught bunking by your HOD or getting a 32% attendance warning SMS to your parents?',
  '👀 Vibe Check: Canteen Chai vs. Nescafe Maggi at 5 PM — which one is keeping you alive this semester?',
  '👀 Festive Whisper: What color outfit are you wearing to Garba night this year? Need color coordination inspo!',
  '👀 Quick Question: If you had to describe your college love life in one UIT RGPV location, what would it be?',
  '👀 Blind Date Truth: What was your honest first impression of this college when you joined in 1st year?',
  '👀 Confession #88: To the person in front of me right now — what\'s one campus rumor you secretly believe is true?'
];

export function getRandomCampusStory(section?: CampusStory['section']): CampusStory {
  const filtered = section ? CAMPUS_STORIES.filter(s => s.section === section) : CAMPUS_STORIES;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getRandomGossipWhisper(): string {
  return LIVE_GOSSIP_WHISPERS[Math.floor(Math.random() * LIVE_GOSSIP_WHISPERS.length)];
}
