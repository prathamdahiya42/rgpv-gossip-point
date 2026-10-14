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
];

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
