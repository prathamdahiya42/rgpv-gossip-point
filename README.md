# 📌 RGPV Gossip Point

> **Pin it. Don't sign it.**  
> A simple, anonymous, zero-login campus app built for students of **UIT RGPV, Bhopal**.

---

## ✨ Features

### 1. 🗣️ Topic Feeds
Three focused sections for college life:
- **Crushes 💘**: Anonymous confessions with an optional *"To:"* line.
- **Gossip 🗣️**: Real-time campus tea, canteen stories, and hostel drama.
- **Campus 🏫**: Exam discussions, department news, and college life.
- **Sorting**: Instant toggle between **New** and **Hot 🔥** (calculated directly in Postgres based on engagement weighted by recency).
- **Reactions**: 3 core campus reactions (**🔥, 😂, 💀**) with single-reaction toggle/switch behavior.
- **Comments**: Flat, oldest-first anonymous comment threads on `/post/[id]`.

### 2. 💘 Blind Date (5-Minute Anonymous Live Chat)
- **100% Anonymous**: Matched with a random stranger across campus. No names, no pictures, no profiles.
- **5-Minute Countdown**: Server-authoritative timer locks the chat at `0:00` and self-destructs the session.
- **Automated Postgres Matchmaker**: Matched in seconds via `join_blind_date()` RPC (`FOR UPDATE SKIP LOCKED`) with zero external AI/LLM cost.
- **Conversation Starters**: One-click campus icebreaker chips to break the silence.
- **Early Exit & Safety**: Real-time detection if the partner leaves early, with instant reporting tools.

### 3. 🎭 Zero-Friction Anonymous Identity
- **No signup, no login, no phone, no email**: Every visitor automatically gets a fun campus handle (e.g., *"Sneaky Samosa 42"*, *"Sleepy Chai 17"*).
- **Hourly Re-roll**: A `🎲` button in the top bar allows re-rolling a handle once per hour.
- **Strict Privacy**: A user's `auth.uid` is **never** exposed to other clients or in network responses.

### 4. 🛡️ Built-in Moderation
- **Contact-Info Filter**: Automatically rejects posts and comments containing 10-digit phone numbers, emails, or `@social` handles.
- **Auto-Hide Trigger**: Any post or comment reported by 3 unique users is automatically hidden from public feeds.
- **Anti-Spam Limits**: Enforced per-user rate limits (5 posts/hour, 20 comments/hour, ~1 chat msg/second).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (Strict)
- **Styling**: Tailwind CSS + Custom Corkboard & Sticky Note Theme
- **Backend**: Supabase (Postgres, Realtime Websockets, Anonymous Auth, Row-Level Security)
- **Validation**: Zod (server-side input validation)

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/your-username/rgpv-gossip-point.git
cd rgpv-gossip-point
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Supabase Database
1. Go to your **Supabase Dashboard** → **Authentication** → **Auth Providers** → **Anonymous Sign-Ins** and enable it.
2. In the **SQL Editor**, execute the scripts in the `supabase/` folder in order:
   - `schema.sql` (Creates the 8 tables, public views, and indexes)
   - `functions.sql` (Installs the report auto-hide trigger, matchmaker RPC, and 5-min chat cutoff)
   - `rls_policies.sql` (Enables Row-Level Security across all tables)
3. Ensure Realtime is enabled for `public.matches` and `public.match_messages`.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your browser.

---

## 📱 Mobile-First Design

Optimized specifically for mobile screens (360px – 430px) with sticky top bar, thumb-friendly bottom navigation, and zero horizontal scrolling.
