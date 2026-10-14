import { NextResponse, type NextRequest } from 'next/server';
import {
  seedCampusStoriesIfEmpty,
  seedSingleCampusStory,
  runScheduledCampusBot,
} from '@/actions/seed';
import type { PostSection } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const section = searchParams.get('section') as PostSection | null;

    // 1. Cron schedule trigger: runs every 30 minutes
    if (action === 'schedule' || action === 'cron') {
      const res = await runScheduledCampusBot(true);
      return NextResponse.json(res);
    }

    // 2. Single custom post trigger
    if (action === 'single') {
      const res = await seedSingleCampusStory(section || undefined);
      return NextResponse.json(res);
    }

    // 3. Default: seed initial stories if empty, otherwise run scheduled activity
    const seedRes = await seedCampusStoriesIfEmpty();
    if (seedRes.success && seedRes.data && seedRes.data.seeded > 0) {
      return NextResponse.json(seedRes);
    }

    const scheduledRes = await runScheduledCampusBot(false);
    return NextResponse.json(scheduledRes);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bot seeder error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
