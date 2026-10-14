'use server';

import { createBotClient } from '@/lib/supabase/server';
import {
  CAMPUS_STORIES,
  generateContextualComment,
  generateMetaGossipStory,
} from '@/lib/campus-stories';
import { generateRandomBotHandle } from '@/lib/handles';
import type { ServerActionResponse, PostSection } from '@/types';

// Seeds initial authentic stories under distinct disguise handles if the board is empty
export async function seedCampusStoriesIfEmpty(): Promise<ServerActionResponse<{ seeded: number }>> {
  try {
    const botClient = createBotClient();

    // Check count of non-hidden posts
    const { count, error: countErr } = await botClient
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (countErr) {
      console.warn('Count check warning in seed:', countErr.message);
    }

    if (count !== null && count >= 4) {
      return { success: true, data: { seeded: 0 } };
    }

    let seededCount = 0;
    const sections: PostSection[] = ['crushes', 'gossip', 'campus', 'garba'];

    for (const sec of sections) {
      const candidates = CAMPUS_STORIES.filter(s => s.section === sec);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      if (!chosen) continue;

      // Create a standalone anonymous session for each post so each gets a distinct handle
      const botClientSingle = createBotClient();
      const { data: authData } = await botClientSingle.auth.signInAnonymously();
      const user = authData?.user;
      if (!user) continue;

      const botHandle = generateRandomBotHandle();
      await botClientSingle
        .from('profiles')
        .upsert({ id: user.id, handle: botHandle }, { onConflict: 'id' });

      const { error: insertErr } = await botClientSingle.from('posts').insert({
        author_id: user.id,
        section: chosen.section,
        body: chosen.body,
      });

      if (!insertErr) {
        seededCount++;
      }
    }

    return { success: true, data: { seeded: seededCount } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to seed campus stories';
    return { success: false, error: message };
  }
}

// Seeds a single post under a randomized student disguise
export async function seedSingleCampusStory(section?: PostSection): Promise<ServerActionResponse<{ id: string; handle: string }>> {
  try {
    const botClient = createBotClient();
    const { data: authData, error: authErr } = await botClient.auth.signInAnonymously();
    const user = authData?.user;
    if (authErr || !user) {
      return { success: false, error: 'Could not obtain bot session' };
    }

    const botHandle = generateRandomBotHandle();
    await botClient.from('profiles').upsert({ id: user.id, handle: botHandle }, { onConflict: 'id' });

    const filtered = section ? CAMPUS_STORIES.filter(s => s.section === section) : CAMPUS_STORIES;
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];

    const { data: post, error: insertErr } = await botClient
      .from('posts')
      .insert({
        author_id: user.id,
        section: chosen.section,
        body: chosen.body,
      })
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    return { success: true, data: { id: post.id, handle: botHandle } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to seed story';
    return { success: false, error: message };
  }
}

// 30-Minute Scheduled Bot Engine
// Inspects what's currently on the board, gossips about active discussions or posts fresh stories
export async function runScheduledCampusBot(force = false): Promise<ServerActionResponse<{ action: string; handle: string; details?: string }>> {
  try {
    const botClient = createBotClient();

    // Fetch latest 6 non-hidden posts to analyze campus context
    const { data: recentPosts } = await botClient
      .from('posts')
      .select('id, section, body, created_at')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(6);

    // If not forced, verify that at least 20 minutes have passed since the last post/activity
    if (!force && recentPosts && recentPosts.length > 0) {
      const latestPostTime = new Date(recentPosts[0].created_at).getTime();
      const minutesSinceLastPost = (Date.now() - latestPostTime) / (1000 * 60);

      // If a real student posted in the last 20 minutes, don't spam unless commenting
      if (minutesSinceLastPost < 20 && Math.random() < 0.6) {
        return {
          success: true,
          data: { action: 'skipped', handle: 'none', details: `Recent activity detected (${Math.round(minutesSinceLastPost)}m ago)` },
        };
      }
    }

    // Authenticate a fresh unique bot user
    const { data: authData, error: authErr } = await botClient.auth.signInAnonymously();
    const user = authData?.user;
    if (authErr || !user) {
      return { success: false, error: 'Bot authentication failed' };
    }

    const botHandle = generateRandomBotHandle();
    await botClient.from('profiles').upsert({ id: user.id, handle: botHandle }, { onConflict: 'id' });

    // DECISION: 40% chance to comment on an existing post, 60% chance to create a new post
    const shouldComment = recentPosts && recentPosts.length > 0 && Math.random() < 0.4;

    if (shouldComment && recentPosts.length > 0) {
      // Pick one recent post to reply to
      const targetPost = recentPosts[Math.floor(Math.random() * recentPosts.length)];
      const commentText = generateContextualComment(targetPost.body);

      const { data: comment, error: commentErr } = await botClient
        .from('comments')
        .insert({
          post_id: targetPost.id,
          author_id: user.id,
          body: commentText,
        })
        .select('id')
        .single();

      if (commentErr) throw commentErr;

      return {
        success: true,
        data: {
          action: 'commented',
          handle: botHandle,
          details: `Commented on post ${targetPost.id}: "${commentText}"`,
        },
      };
    }

    // Otherwise, create a new post (either meta-gossip or authentic campus story)
    let postBody = '';
    let postSection: PostSection = 'gossip';

    // Extract keywords from recent posts to inform meta-gossip
    const allRecentText = (recentPosts || []).map(p => p.body.toLowerCase()).join(' ');
    const detectedKeywords: string[] = [];
    if (allRecentText.includes('attendance') || allRecentText.includes('75%')) detectedKeywords.push('attendance');
    if (allRecentText.includes('crush') || allRecentText.includes('love')) detectedKeywords.push('crushes');
    if (allRecentText.includes('canteen') || allRecentText.includes('samosa')) detectedKeywords.push('canteen');
    if (allRecentText.includes('garba') || allRecentText.includes('dandiya')) detectedKeywords.push('garba');

    // 50% chance to create a meta-gossip reaction to current page topics
    if (detectedKeywords.length > 0 && Math.random() < 0.5) {
      postBody = generateMetaGossipStory(detectedKeywords);
      postSection = 'gossip';
    } else {
      // Random authentic story from our curated UIT RGPV pool
      const randomStory = CAMPUS_STORIES[Math.floor(Math.random() * CAMPUS_STORIES.length)];
      postBody = randomStory.body;
      postSection = randomStory.section;
    }

    const { data: newPost, error: postErr } = await botClient
      .from('posts')
      .insert({
        author_id: user.id,
        section: postSection,
        body: postBody,
      })
      .select('id')
      .single();

    if (postErr) throw postErr;

    return {
      success: true,
      data: {
        action: 'posted',
        handle: botHandle,
        details: `[${postSection}] ${postBody.slice(0, 60)}...`,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bot scheduler error';
    return { success: false, error: message };
  }
}
