'use server';

import { createClient } from '@/lib/supabase/server';
import { CAMPUS_STORIES } from '@/lib/campus-stories';
import { generateRandomHandle } from '@/lib/handles';
import type { ServerActionResponse, PostSection } from '@/types';

export async function seedCampusStoriesIfEmpty(): Promise<ServerActionResponse<{ seeded: number }>> {
  try {
    const supabase = await createClient();

    // Check existing count of non-hidden posts
    const { count, error: countErr } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (countErr) {
      console.warn('Count check error in seed:', countErr.message);
    }

    // Only seed if fewer than 4 posts exist in the entire database
    if (count !== null && count >= 4) {
      return { success: true, data: { seeded: 0 } };
    }

    // Sign in anonymously to get an author account
    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { data: anonData } = await supabase.auth.signInAnonymously();
      user = anonData?.user || null;
    }

    if (!user) {
      return { success: false, error: 'Could not obtain anonymous session for seeding' };
    }

    // Ensure profile exists
    const handle = generateRandomHandle();
    await supabase
      .from('profiles')
      .upsert({ id: user.id, handle }, { onConflict: 'id' });

    let seededCount = 0;
    // Seed one story from each section
    const sections: PostSection[] = ['crushes', 'gossip', 'campus', 'garba'];
    for (const sec of sections) {
      const storyCandidates = CAMPUS_STORIES.filter(s => s.section === sec);
      const chosen = storyCandidates[Math.floor(Math.random() * storyCandidates.length)];

      if (chosen) {
        const { error: insertErr } = await supabase.from('posts').insert({
          author_id: user.id,
          section: chosen.section,
          body: chosen.body,
        });

        if (!insertErr) {
          seededCount++;
        }
      }
    }

    return { success: true, data: { seeded: seededCount } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to seed campus stories';
    return { success: false, error: message };
  }
}

export async function seedSingleCampusStory(section?: PostSection): Promise<ServerActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();

    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { data: anonData } = await supabase.auth.signInAnonymously();
      user = anonData?.user || null;
    }

    if (!user) {
      return { success: false, error: 'Could not obtain anonymous session' };
    }

    const handle = generateRandomHandle();
    await supabase.from('profiles').upsert({ id: user.id, handle }, { onConflict: 'id' });

    const filtered = section ? CAMPUS_STORIES.filter(s => s.section === section) : CAMPUS_STORIES;
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];

    const { data: post, error: insertErr } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        section: chosen.section,
        body: chosen.body,
      })
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    return { success: true, data: { id: post.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to seed single story';
    return { success: false, error: message };
  }
}
