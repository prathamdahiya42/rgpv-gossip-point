// Fun campus-themed icebreakers for RGPV Blind Date
import type { BlindDateMode } from '@/types';

export const GENERAL_ICEBREAKERS = [
  "What's your branch and sem (no names allowed)?",
  "Best spot for chai near campus: Tapri, Canteen, or MP Nagar?",
  "Have you ever slept through a morning viva or exam?",
  "What is the single worst food item in your college hostel/mess?",
  "If you could cancel one subject from your syllabus forever, which one?",
  "What's the funniest proxy attendance fail you've witnessed?",
  "Day scholar life or hostel life: which one has it worse?",
  "Are you team samosa or team kachori with chai?",
  "What's the most chaotic thing that happened in your college fest?",
  "If you had 10 minutes to finish a 50-page assignment, what's your strategy?",
  "Night owl study session or 5 AM miracle revision?",
  "What was your first impression of UIT RGPV campus?",
  "Have you ever had an awkward eye-contact moment in the library?",
  "What's your go-to excuse when you're 30 minutes late to class?",
  "Who is the strictest professor in your department?",
  "What's the most useless engineering fact you remember by heart?",
  "Maggi with cheese or spicy plain Maggi at 2 AM?",
  "What's the best cafe or hangout place in Bhopal?",
  "If you could swap branches for a week, where would you go?",
  "Ever got caught using phone in a boring lecture?",
  "What's on your playlist right now?",
  "Have you ever had a secret crush on someone in another department?",
  "What's the weirdest rumor you heard on campus?",
  "What's your plan right after graduation: Job, Masters, or Goa trip?",
  "Would you rather attend an 8 AM lab or a 4 PM extra lecture on Saturday?",
  "What's one thing you love and one thing you hate about Bhopal weather?",
  "Rate your college mess food from 1 to 10 (10 being edible).",
  "Ever participated in a college competition just for free snacks?",
  "What superpower would be most useful during semester exams?",
  "Tell me a controversial opinion you have about engineering college."
] as const;

export const GARBA_ICEBREAKERS = [
  "Can you actually do 3-taali / Dodhiya steps, or are you just circling around pretending? 💃",
  "Which day of Garba are you going, and what color outfit are you wearing? 🪩",
  "Are you looking for a dance partner or just someone to go with so you don't feel awkward?",
  "What's the best Garba venue in Bhopal: RGPV ground, BHEL, or Bittan Market?",
  "If we end up going to Garba, who's responsible for bringing the Dandiya sticks? 🥢",
  "Do you prefer pure traditional Garba beats or Bollywood remixes at the end?",
  "What's your post-Garba food plan: Jalebi-Fafda, midnight Maggi, or shawarma at 10 Number?",
  "Rate your Garba stamina: 1 round and dead, or dancing non-stop till 1 AM? ⚡",
  "Ever had your Dandiya stick fly out of your hand and hit a stranger in the circle? 😅",
  "Would you rather pair up with a total dance pro, or a fun noob who trips with you?",
  "Sneakers under Kurta/Lehenga for comfort, or strictly traditional juttis?",
  "What branch/sem are you in, and is your department planning a whole group outing?"
] as const;

export const MUSIC_ICEBREAKERS = [
  "What's the #1 song you listen to on repeat when traveling in the UIT bus? 🎧",
  "Seedhe Maut or DIVINE: pick your Desi Hip-Hop GOAT 🐐",
  "Do you listen to Bollywood 90s hits guilt-free or secretly in private? 🌶️",
  "What is your current 2 AM late-night study session track?",
  "Diljit Dosanjh concert or Anuv Jain acoustic live: which ticket are you fighting for? 🎫",
  "Who is an artist you love that you think nobody else on our campus knows about?",
  "Can you judge someone based on their Spotify Wrapped? Be honest! 😂",
  "Drop one song that immediately changes your mood from 0 to 100 🚀",
  "Do you prefer listening with bass boosted in headphones, or sharing earphones?",
  "If our engineering campus life was an album, what would the title track be?",
  "What's a trending song everyone is hyping right now that you secretly can't stand?",
  "Paste the link or title of the last song you played on YouTube or Spotify! 🎵"
] as const;

export const ICEBREAKERS = [...GENERAL_ICEBREAKERS, ...GARBA_ICEBREAKERS, ...MUSIC_ICEBREAKERS];

export function getRandomIcebreaker(mode: BlindDateMode = 'general'): string {
  if (mode === 'garba') {
    return GARBA_ICEBREAKERS[Math.floor(Math.random() * GARBA_ICEBREAKERS.length)];
  }
  if (mode === 'music') {
    return MUSIC_ICEBREAKERS[Math.floor(Math.random() * MUSIC_ICEBREAKERS.length)];
  }
  return GENERAL_ICEBREAKERS[Math.floor(Math.random() * GENERAL_ICEBREAKERS.length)];
}
