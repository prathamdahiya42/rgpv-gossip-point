# RGPV Gossip Point — Supabase Database Setup

Follow these exact steps in your [Supabase Dashboard](https://supabase.com/dashboard) to set up the database for RGPV Gossip Point.

---

### Step 1: Enable Anonymous Sign-Ins in Supabase Auth
1. Go to your Supabase project dashboard.
2. Navigate to **Authentication** → **Sign In / Up Providers** (or **Configuration** → **Auth Providers**).
3. Under **Anonymous Sign-Ins**, toggle **Enable Anonymous sign-ins** to **ON**.
4. Click **Save**.

*(This allows every student to instantly get a unique session without providing email, phone number, or passwords.)*

---

### Step 2: Run SQL Scripts in Order
Open the **SQL Editor** in your Supabase dashboard and run the following three files in order:

1. **`schema.sql`**
   - Creates the 8 streamlined tables (`profiles`, `posts`, `comments`, `reactions`, `reports`, `match_queue`, `matches`, `match_messages`).
   - Sets up performance indexes.
   - Creates privacy-safe views (`posts_view`, `comments_view`) that hide user IDs and expose handles.
   - Adds tables to the `supabase_realtime` publication.

2. **`functions.sql`**
   - Installs the report trigger (auto-hides posts/comments at 3 unique reports, applies 24h blind date suspension for repeated user reports).
   - Installs the 3-minute chat cutoff trigger on `match_messages`.
   - Creates the automated matching bot RPCs (`join_blind_date`, `cancel_blind_date`, `leave_blind_date`).

3. **`rls_policies.sql`**
   - Enables Row-Level Security (RLS) on all 8 tables.
   - Restricts read/write access so anonymous users can only act as themselves, participants only see their blind date chats, and banned accounts are blocked from writes.

---

### Step 3: Verify Realtime Replication
1. In your dashboard, go to **Database** → **Replication** (or check `supabase_realtime` publication).
2. Confirm that the following two tables have Realtime enabled:
   - `public.matches`
   - `public.match_messages`

---

### Step 4: Environment Variables
Ensure your `rgpv-gossip-point/.env.local` contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

That's it! Your database is ready for anonymous campus feeds and 3-minute Blind Date live chat.
